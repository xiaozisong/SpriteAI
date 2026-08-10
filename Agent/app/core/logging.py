"""生产级日志：基于 loguru 的结构化日志。

生产级 vs demo 级的区别：
- demo: print("任务失败")  → 只知道失败了，不知道上下文
- 生产: logger.bind(task_id=...).error("任务失败", error=...)  → 带上下文，能搜索过滤

loguru 优势：
- 默认带时间、级别、模块、行号
- 支持 bind 上下文（task_id、user_id 等）
- 支持结构化输出（JSON，方便 ELK 采集）
- 异步安全，多进程友好
"""
import sys
from loguru import logger

from app.core.config import settings


def setup_logging() -> None:
    """初始化日志配置。在 app lifespan 里调用一次。"""
    # 移除默认 handler
    logger.remove()

    # 控制台输出（开发环境，带颜色）
    logger.add(
        sys.stderr,
        level="DEBUG" if settings.ENV != "production" else "INFO",
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
            "<level>{message}</level>"
        ),
        colorize=True,
    )

    # 文件输出（生产级，按天滚动，保留 7 天）
    logger.add(
        "logs/app_{time:YYYY-MM-DD}.log",
        level="INFO",
        rotation="00:00",      # 每天午夜滚动
        retention="7 days",   # 保留 7 天
        compression="gz",      # 旧日志压缩
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} | {message}",
        serialize=False,       # 生产可改 True 输出 JSON
    )


__all__ = ["logger", "setup_logging"]
