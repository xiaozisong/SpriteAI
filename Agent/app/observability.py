"""可观测性初始化：Sentry + LangSmith + 结构化日志。

生产级三层可观测：
1. 日志（loguru）：开发调试 + 问题定位
2. Sentry：异常聚合 + 告警（未处理异常自动上报）
3. LangSmith：Agent 链路追踪（每步 LLM/tool 调用）

面试可说：
"我做了三层可观测——loguru 结构化日志做开发调试，
Sentry 聚合异常并告警，LangSmith 追踪 Agent 链路（token/延迟/工具调用）。
三者互补：日志看细节，Sentry 看异常，LangSmith 看 Agent 行为。"
"""
import os

from app.core.config import settings
from app.core.logging import setup_logging, logger


def init() -> None:
    """初始化所有可观测组件。在 app lifespan 里调用一次。"""
    # 1. 结构化日志（最先，后续组件也用它）
    setup_logging()
    logger.info("初始化可观测组件", env=settings.ENV)

    # 2. LangSmith 追踪（env 变量驱动，langchain 自动采集）
    if settings.LANGSMITH_API_KEY and settings.LANGSMITH_TRACING:
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_PROJECT"] = settings.LANGSMITH_PROJECT
        logger.info("LangSmith 追踪已启用", project=settings.LANGSMITH_PROJECT)

    # 3. Sentry 异常聚合
    if settings.SENTRY_DSN:
        import sentry_sdk
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
            environment=settings.ENV,
        )
        logger.info("Sentry 已启用", dsn=settings.SENTRY_DSN[:20] + "...")
    else:
        logger.warning("SENTRY_DSN 未配置，异常不会上报")
