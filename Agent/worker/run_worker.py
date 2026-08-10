"""任务队列 Worker：消费 Redis Streams，调用 LangGraph Agent，写回结果。

机制与简历 BullMQ 等价：
- XREADGROUP + consumer group（可见性：消息被消费但未 ACK 时，其他 consumer 看不到）
- XACK 确认完成（删除消息的"待确认"状态）
- 失败重试（指数退避：1s → 2s → 4s）
- 死信 DLQ（超过 MAX_RETRIES 进入独立 stream，人工排查）
- 幂等（task_id 唯一，重复提交不会重复执行——靠 Redis HSET 状态判断）
"""
import asyncio
import json
from datetime import datetime, timezone

import redis.asyncio as aioredis

from app.agents.registry import get_agent, AgentNotFoundError
from app.core.config import settings
from app.core.logging import logger, setup_logging

QUEUE = "generation:tasks"
KEY_STATUS = "generation:task:%s"
GROUP = "gen-workers"
CONSUMER = "worker-1"
DLQ = "generation:tasks:dlq"
MAX_RETRIES = 3

# 全局 redis 客户端（在 main() 里初始化）
redis_client: aioredis.Redis | None = None


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _mark(task_id: str, **fields: str) -> None:
    """更新任务状态（Redis HSET）。"""
    await redis_client.hset(
        KEY_STATUS % task_id,
        mapping={"updated_at": _now(), **fields},
    )


async def process(entry: dict) -> None:
    """处理一个任务：调 Agent，写回结果。

    状态机：queued → running → succeeded / failed
    """
    task_id = entry.get("task_id", "unknown")
    agent_id = entry.get("agent_id", "chatbot")
    message = entry.get("message", "")

    log = logger.bind(task_id=task_id, agent_id=agent_id)
    log.info("任务开始处理")

    await _mark(task_id, status="running")

    try:
        agent = get_agent(agent_id)
        config = {
            "configurable": {"thread_id": task_id},
            "recursion_limit": 30,
        }
        result = await agent.ainvoke(
            {"messages": [{"role": "user", "content": message}]},
            config=config,
        )
        last_msg = result["messages"][-1]
        content = getattr(last_msg, "content", str(last_msg))

        await redis_client.hset(
            KEY_STATUS % task_id,
            mapping={
                "status": "succeeded",
                "result": json.dumps(
                    {"agent_id": agent_id, "content": content},
                    ensure_ascii=False,
                ),
                "updated_at": _now(),
            },
        )
        log.info("任务成功", content_len=len(content))

    except AgentNotFoundError:
        log.error("Agent 不存在", agent_id=agent_id)
        await _mark(task_id, status="failed", error=f"unknown agent: {agent_id}")

    except Exception as exc:  # noqa: BLE001
        log.exception("任务执行失败", error=str(exc))

        # 读取当前重试次数
        cur = await redis_client.hget(KEY_STATUS % task_id, "retries")
        retries = int(cur) if cur else 0

        if retries < MAX_RETRIES:
            # 指数退避：等 2^retries 秒后重新入队
            wait = 2 ** retries
            log.warning("准备重试", retry=retries + 1, wait_seconds=wait)
            await asyncio.sleep(wait)
            await redis_client.hset(
                KEY_STATUS % task_id,
                mapping={"retries": str(retries + 1), "updated_at": _now()},
            )
            await redis_client.xadd(QUEUE, {**entry, "retries": str(retries + 1)})
        else:
            # 超过最大重试次数，进入死信队列
            log.error("超过最大重试次数，进入 DLQ", retries=retries)
            await redis_client.xadd(DLQ, {**entry, "error": str(exc)})
            await _mark(task_id, status="failed", error=str(exc))


async def main() -> None:
    """Worker 主循环：消费 Redis Stream。"""
    global redis_client

    setup_logging()
    logger.info("Worker 启动", queue=QUEUE, group=GROUP, consumer=CONSUMER)

    redis_client = aioredis.from_url(
        settings.REDIS_URL, encoding="utf-8", decode_responses=True
    )

    # 创建 consumer group（已存在则忽略）
    try:
        await redis_client.xgroup_create(QUEUE, GROUP, id="0", mkstream=True)
        logger.info("consumer group 已创建", group=GROUP)
    except Exception:
        pass  # group 已存在

    logger.info("开始监听任务...")

    while True:
        try:
            resp = await redis_client.xreadgroup(
                GROUP, CONSUMER, {QUEUE: ">"}, count=1, block=5000
            )
        except Exception as exc:
            logger.error("xreadgroup 错误", error=str(exc))
            await asyncio.sleep(1)
            continue

        if not resp:
            continue

        stream, messages = resp[0]
        for msg_id, fields in messages:
            task_id = fields.get("task_id", "?")
            log = logger.bind(task_id=task_id, msg_id=msg_id)
            try:
                log.info("收到任务")
                await process(fields)
                await redis_client.xack(QUEUE, GROUP, msg_id)
                log.info("任务完成并 ACK")
            except Exception as exc:
                log.exception("处理失败（不 ACK，留 pending）", error=str(exc))


if __name__ == "__main__":
    asyncio.run(main())

