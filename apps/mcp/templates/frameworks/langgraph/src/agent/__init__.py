"""
LangGraph Agent Package

This package provides a minimal but functional LangGraph agent that demonstrates
core patterns including state management, tool calling, and conditional routing.

Example usage:
    from agent import run_agent, create_agent

    # Quick run with a message
    result = run_agent("What is 15 + 27?")
    print(result)

    # Or get the compiled graph for more control
    agent = create_agent()
    result = agent.invoke({"messages": [HumanMessage(content="Hello")]})
"""

from .graph import create_agent, run_agent
from .state import AgentState
from .tools import add, divide, multiply, tools

__all__ = [
    "create_agent",
    "run_agent",
    "AgentState",
    "tools",
    "add",
    "multiply",
    "divide",
]
