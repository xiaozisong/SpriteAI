"""Alembic 环境配置（异步版，配合 asyncpg）。

关键点：
- 用 create_async_engine 而非 create_engine（同步连 asyncpg 会报错）
- run_sync 包一层，把异步函数同步调用
- 导入所有 models，确保 target_metadata 能看到全部表
"""
import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# 导入配置
from app.core.config import settings

# 导入所有模型，让元数据收集到全部表
from app.core.db import Base
import app.modules.studio.models  # noqa: F401
import app.modules.generation.models  # noqa: F401
import app.rag.models  # noqa: F401 — knowledge_bases / knowledge_chunks

# 这一行必须在上面 import 之后：alembic 需要知道 alembic.ini
config = context.config

# 用 settings.DATABASE_URL 覆盖 alembic.ini 里的 sqlalchemy.url
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL.replace("%", "%%"))

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """离线模式：只生成 SQL，不连库。"""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """在线模式：真正执行迁移。"""
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """异步引擎执行迁移。"""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    """在线模式入口：驱动异步执行。"""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
