"""
Agent State Definition

This module defines the state schema for the LangGraph agent using TypedDict.
State is the shared data structure that flows through the graph, representing
the current snapshot of your application at any point.

Key Concepts:
- TypedDict provides type hints for state keys
- Annotated types with reducers control how updates are applied
- Default reducer overwrites; operator.add appends to lists
- MessagesState is a common pattern for chat-based agents
"""

import operator
from typing import Annotated

from langchain_core.messages import AnyMessage
from typing_extensions import TypedDict


class AgentState(TypedDict):
    """
    State schema for the agent.

    This TypedDict defines all the data that flows through the graph.
    Each key can have a reducer function that determines how updates
    are merged with existing state.

    Attributes:
        messages: List of conversation messages. Uses operator.add as reducer,
                  meaning new messages are appended to the existing list rather
                  than replacing it. This is essential for maintaining conversation
                  history across multiple turns.

        tool_call_count: Tracks how many tool calls have been made. Uses default
                         reducer (overwrite), so each update replaces the previous
                         value. Useful for limiting tool call loops.

    Example state flow:
        Initial: {"messages": [HumanMessage("Hi")], "tool_call_count": 0}
        After LLM: {"messages": [HumanMessage("Hi"), AIMessage("Hello!")], "tool_call_count": 0}
        After tool: {"messages": [..., ToolMessage("result")], "tool_call_count": 1}
    """

    # Messages use operator.add as a reducer, which appends new messages
    # to the existing list rather than replacing it entirely.
    # This is critical for maintaining conversation history.
    messages: Annotated[list[AnyMessage], operator.add]

    # Tool call count uses the default reducer (overwrite).
    # Each update replaces the previous value.
    tool_call_count: int


# Alternative: You could also use the built-in MessagesState for simpler cases:
#
# from langgraph.graph import MessagesState
#
# class AgentState(MessagesState):
#     """Extends MessagesState with additional fields."""
#     tool_call_count: int
#
# MessagesState already includes 'messages' with the add_messages reducer,
# which handles message ID tracking and deduplication.
