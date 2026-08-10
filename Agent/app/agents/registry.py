"""多 Agent 注册表：统一按 agent_key 路由到 CompiledStateGraph。

TODO(你来实现，M1)：实现 inspiration_assistant / canvas_assistant 后加入 AGENTS。
"""
from langgraph.graph.state import CompiledStateGraph

from app.agents.chatbot import build_chatbot
from app.agents.novel_assistant import build_novel_assistant

# AGENTS: agent_key -> CompiledStateGraph
# 这正是 agent-service-toolkit 的做法，也是"多 Agent 编排"的可讲点。
AGENTS: dict[str, CompiledStateGraph] = {
    "chatbot": build_chatbot(),
    "novel_assistant": build_novel_assistant(),
    # "inspiration_assistant": inspiration_assistant,
    # "canvas_assistant": canvas_assistant,
}


class AgentNotFoundError(KeyError):
    pass


def get_agent(agent_id: str) -> CompiledStateGraph:
    agent = AGENTS.get(agent_id)
    if agent is None:
        raise AgentNotFoundError(agent_id)
    return agent
