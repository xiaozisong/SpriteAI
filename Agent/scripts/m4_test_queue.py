"""M4 一键验证脚本：入队 → 轮询状态（worker 需另开终端跑）。

跑法：
    cd Agent
    source .venv/bin/activate
    PYTHONPATH=. python3 scripts/m4_test_queue.py

注意：这个脚本只负责"入队 + 轮询"。
worker 要另开一个终端跑：
    PYTHONPATH=. python3 -m worker.run_worker
"""
import asyncio
import time

import httpx

API_BASE = "http://localhost:8000"


async def main():
    async with httpx.AsyncClient(base_url=API_BASE, timeout=30) as client:
        # 1. 入队
        print("=== 第 1 步：入队 ===")
        resp = await client.post(
            "/api/tasks",
            json={
                "agent_id": "chatbot",
                "params": {"message": "用一句话解释什么是 Agent"},
            },
        )
        task_id = resp.json()["task_id"]
        print(f"✅ 入队成功: {task_id}")

        # 2. 轮询状态
        print("\n=== 第 2 步：轮询状态 ===")
        for i in range(30):  # 最多等 30 秒
            resp = await client.get(f"/api/tasks/{task_id}/status")
            status = resp.json()
            print(f"  [{i}] status={status['status']}")

            if status["status"] in ("succeeded", "failed"):
                print(f"\n✅ 任务结束: {status['status']}")
                if status.get("result"):
                    print(f"   结果: {status['result']}")
                if status.get("error"):
                    print(f"   错误: {status['error']}")
                return

            await asyncio.sleep(1)

        print("⚠️  30 秒内未完成（worker 可能没启动）")


if __name__ == "__main__":
    asyncio.run(main())
