"""M2 建表脚本：直接用 SQLAlchemy create_all 建 works/sessions/messages 表。

绕开 alembic（生产级迁移工具），先用最简单方式把表建出来跑通 M2。
"""
import asyncio

from app.core.db import engine, Base
from app.modules.studio import models  # noqa: F401 — 导入以注册模型


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("✅ 表已创建：", sorted(Base.metadata.tables.keys()))


if __name__ == "__main__":
    asyncio.run(init_db())
