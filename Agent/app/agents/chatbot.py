"""chatbot: 支持工具调用的 ReAct 对话 Agent"""
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import START, END, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition

from app.agents.base import AgentState
from app.core.config import settings


# ---- 工具定义 ----
@tool
def get_current_time() -> str:
    """返回当前北京时间(ISO 格式)。"""
    from datetime import datetime, timezone, timedelta
    bj = timezone(timedelta(hours=8))
    return datetime.now(bj).isoformat()

@tool
def calculator(expression: str) -> str:
    """计算简单数学表达式 如 1 + 2 * 3"""
    # 安全起见制作中基本四则运算校验，实际情况可用 ast 或 eval 白名单
    try:
        return str(eval(expression, {"__builtins__": {}}, {}))
    except Exception as e:
        return f"计算失败: {str(e)}"

# ---- 构建 ----
def build_chatbot():
    llm = ChatOpenAI(
        model=settings.DEFAULT_MODEL,
        api_key=settings.OPENAI_API_KEY,
        base_url=settings.OPENAI_BASE_URL,
        streaming=True
    ).bind_tools([get_current_time, calculator])

    tools = ToolNode([get_current_time, calculator])

    def agent_node(state: AgentState) -> dict:
        response = llm.invoke(state["messages"])
        return {"messages": [response]}

    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tools)
    graph.add_edge(START, "agent")
    # 关键：agent 输出若有 tool_calls 则去 tools，否则直接结束
    graph.add_conditional_edges("agent", tools_condition)
    graph.add_edge("tools", "agent")  # 工具结果回到 agent 继续推理
    return graph.compile()


