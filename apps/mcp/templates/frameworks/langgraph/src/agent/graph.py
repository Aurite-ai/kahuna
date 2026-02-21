"""
LangGraph Agent Definition

This module defines the main StateGraph for the agent. It implements a standard
ReAct-style (Reasoning + Acting) agent pattern where the LLM can decide to
either respond directly or call tools to gather information.

Key Concepts:
- StateGraph: The container for nodes and edges
- Nodes: Functions that perform work (LLM calls, tool execution)
- Edges: Connections that determine flow between nodes
- Conditional edges: Dynamic routing based on state

Graph Structure:
    START → call_model → [should_continue] → execute_tools → call_model
                      ↘                                   ↗
                        → END (if no tool calls)
"""

import os
from typing import Literal

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langgraph.graph import END, START, StateGraph

from .state import AgentState
from .tools import tools, tools_by_name


def get_model():
    """
    Initialize the LLM with tool binding.

    This function creates the chat model and binds the available tools to it.
    The model will include tool definitions in its context, allowing it to
    decide when and how to call tools.

    Returns:
        A chat model instance with tools bound.

    Note:
        Set ANTHROPIC_API_KEY or OPENAI_API_KEY environment variable.
        Defaults to Anthropic if ANTHROPIC_API_KEY is set.
    """
    # Try Anthropic first (preferred), then fall back to OpenAI
    if os.environ.get("ANTHROPIC_API_KEY"):
        from langchain_anthropic import ChatAnthropic

        model = ChatAnthropic(model="claude-sonnet-4-5-20250929", temperature=0)
    elif os.environ.get("OPENAI_API_KEY"):
        from langchain_openai import ChatOpenAI

        model = ChatOpenAI(model="gpt-4o", temperature=0)
    else:
        raise ValueError(
            "No API key found. Set ANTHROPIC_API_KEY or OPENAI_API_KEY environment variable."
        )

    # Bind tools to the model so it knows what tools are available
    return model.bind_tools(tools)


# System prompt that instructs the agent on its behavior
SYSTEM_PROMPT = """You are a helpful assistant that can perform arithmetic operations.

When asked to do math, use the available tools (add, multiply, divide) to compute the answer.
Always show your work by using the appropriate tool calls.

Be concise in your responses."""


def call_model(state: AgentState) -> dict:
    """
    Node that calls the LLM to generate a response.

    This node takes the current conversation state, prepends a system message,
    and asks the LLM to generate a response. The LLM may decide to:
    1. Respond directly to the user
    2. Call one or more tools to gather information

    Args:
        state: Current agent state containing messages and metadata

    Returns:
        State update dict with the new AI message appended to messages

    Note:
        The return value is a partial state update. Since messages uses
        operator.add as its reducer, the new message will be appended
        to the existing list, not replace it.
    """
    model = get_model()

    # Prepend system message to guide the model's behavior
    messages_with_system = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]

    # Invoke the model and get response
    response = model.invoke(messages_with_system)

    # Return state update - the reducer will append this to existing messages
    return {"messages": [response]}


def execute_tools(state: AgentState) -> dict:
    """
    Node that executes tool calls from the LLM's response.

    When the LLM decides to call tools, this node:
    1. Extracts tool calls from the last AI message
    2. Executes each tool with the provided arguments
    3. Returns ToolMessage results for each call

    Args:
        state: Current agent state (last message should have tool_calls)

    Returns:
        State update dict with ToolMessages for each tool call result,
        and incremented tool_call_count

    Note:
        ToolMessage includes tool_call_id to match results with calls.
        This is important for the LLM to understand which result
        corresponds to which tool call.
    """
    # Get the last message which contains the tool calls
    last_message: AIMessage = state["messages"][-1]

    # Execute each tool call and collect results
    tool_results = []
    for tool_call in last_message.tool_calls:
        # Look up the tool by name
        tool = tools_by_name[tool_call["name"]]

        # Execute the tool with provided arguments
        result = tool.invoke(tool_call["args"])

        # Create a ToolMessage with the result
        # tool_call_id links this result back to the specific call
        tool_results.append(
            ToolMessage(
                content=str(result),
                tool_call_id=tool_call["id"],
            )
        )

    # Return state update with tool results and incremented count
    current_count = state.get("tool_call_count", 0)
    return {
        "messages": tool_results,
        "tool_call_count": current_count + len(tool_results),
    }


def should_continue(state: AgentState) -> Literal["execute_tools", "__end__"]:
    """
    Conditional edge function to determine next step.

    This function examines the last message to decide whether to:
    - Execute tools (if the LLM made tool calls)
    - End the conversation (if the LLM gave a final response)

    Args:
        state: Current agent state

    Returns:
        "execute_tools" if there are tool calls to process,
        END if the conversation should terminate

    Note:
        This is a routing function used by add_conditional_edges().
        It doesn't modify state, just returns the next node name.
    """
    last_message = state["messages"][-1]

    # Check if the model made any tool calls
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "execute_tools"

    # No tool calls means the model is done - end the conversation
    return END


def create_agent() -> StateGraph:
    """
    Build and compile the agent graph.

    This function constructs the StateGraph by:
    1. Creating a new StateGraph with our state schema
    2. Adding nodes for each processing step
    3. Connecting nodes with edges (both direct and conditional)
    4. Compiling the graph for execution

    Returns:
        A compiled StateGraph ready for invocation

    Graph structure:
        START → call_model → [should_continue] → execute_tools → call_model
                          ↘                                   ↗
                            → END (if no tool calls)
    """
    # Step 1: Create the graph builder with our state schema
    builder = StateGraph(AgentState)

    # Step 2: Add nodes
    # Each node is a function that takes state and returns state updates
    builder.add_node("call_model", call_model)
    builder.add_node("execute_tools", execute_tools)

    # Step 3: Add edges
    # START → call_model: Entry point
    builder.add_edge(START, "call_model")

    # call_model → [conditional]: Check if we need to execute tools
    builder.add_conditional_edges(
        "call_model",
        should_continue,
        # Map of return values to destination nodes
        # The function returns either "execute_tools" or END
        ["execute_tools", END],
    )

    # execute_tools → call_model: After executing tools, go back to the model
    builder.add_edge("execute_tools", "call_model")

    # Step 4: Compile the graph
    # IMPORTANT: Must compile before the graph can be invoked
    return builder.compile()


def run_agent(user_message: str) -> str:
    """
    Convenience function to run the agent with a single message.

    Args:
        user_message: The user's input message

    Returns:
        The agent's final response as a string

    Example:
        >>> result = run_agent("What is 25 * 4?")
        >>> print(result)
        "25 * 4 = 100"
    """
    agent = create_agent()

    # Create initial state with the user's message
    initial_state = {
        "messages": [HumanMessage(content=user_message)],
        "tool_call_count": 0,
    }

    # Run the agent to completion
    final_state = agent.invoke(initial_state)

    # Return the last message content (the agent's response)
    return final_state["messages"][-1].content
