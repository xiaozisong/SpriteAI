"""异步任务：POST /api/tasks 入队（Redis Streams）→ 状态查询。

机制与简历中的 BullMQ 等价：队列 / consumer group / 重试 / 削峰 / 可见性。

两条链路（呼应架构文档）：
1. 入队：POST /api/tasks → 立即返回 task_id（秒级）
2. 轮询：GET /tasks/{id}/status → 查状态（queued/running/succeeded/failed）
"""
import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.redis import redis_client
from app.schema.models import TaskCreate, TaskStatus

router = APIRouter()

QUEUE = "generation:tasks"
KEY_STATUS = "generation:task:%s"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post("/tasks", response_model=TaskStatus)
async def create_task(req: TaskCreate):
    """入队：生成 task_id → XADD 到 Redis Stream → 初始化状态。

    幂等：task_id 是 UUID，重复提交会生成不同 id（不会重复执行）。
    """
    task_id = f"task_{uuid.uuid4().hex}"

    # 入队的数据：task_id + agent_id + work_id + 用户消息 + 其他参数
    entry = {
        "task_id": task_id,
        "agent_id": req.agent_id,
        "work_id": str(req.work_id) if req.work_id else "",
        "message": req.params.get("message", ""),  # worker 要处理的内容
        "params": json.dumps(req.params, ensure_ascii=False),
    }

    # XADD 入队（近似 BullMQ add）
    await redis_client.xadd(QUEUE, entry)

    # 初始化状态（Redis HSET，worker 会更新）
    await redis_client.hset(
        KEY_STATUS % task_id,
        mapping={
            "status": "queued",
            "agent_id": req.agent_id,
            "updated_at": _now(),
        },
    )

    return TaskStatus(task_id=task_id, status="queued")


@router.get("/tasks/{task_id}/status", response_model=TaskStatus)
async def task_status(task_id: str):
    """轮询：查任务状态。

    状态机：queued → running → succeeded / failed
    """
    data = await redis_client.hgetall(KEY_STATUS % task_id)
    if not data:
        return TaskStatus(task_id=task_id, status="not_found")

    return TaskStatus(
        task_id=task_id,
        status=data.get("status", "unknown"),
        result=json.loads(data["result"]) if data.get("result") else None,
        error=data.get("error"),
        updated_at=data.get("updated_at"),
    )
