"""通用 Agent 状态类型 + 状态合并器。

LangGraph StateGraph 的默认累加策略需要显式指定 annotator；
这里提供 `messages` 字段的"尾部追加"合并策略作为公共基类。
"""
from typing import Annotated

from typing_extensions import TypedDict


def _append_messages(left: list, right: list) -> list:
    """LangGraph 状态合并器：追加到消息末尾"""
    return list(left) + list(right)


class AgentState(TypedDict):
    """最简单的对话状态：累加消息列表。

    后续 novel_assistant 等会在这个基类上
    扩展字段（例如 `outline`, `chapter`）。
    """
    messages: Annotated[list, _append_messages]
