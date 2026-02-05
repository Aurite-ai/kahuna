#!/usr/bin/env python3
"""
LangGraph Agent Entry Point

This script demonstrates how to run the LangGraph agent with example queries.
It shows both interactive conversation and programmatic usage patterns.

Usage:
    # Run with default examples
    python main.py

    # Import and use programmatically
    from src.agent import run_agent
    result = run_agent("What is 10 + 5?")
"""

import sys

from langchain_core.messages import HumanMessage


def main():
    """Run the agent with example queries."""
    # Import here to catch any configuration errors early
    try:
        from src.agent import create_agent, run_agent
    except ValueError as e:
        print(f"Configuration error: {e}")
        print("\nPlease set your API key:")
        print("  export ANTHROPIC_API_KEY='your-key-here'")
        print("  # or")
        print("  export OPENAI_API_KEY='your-key-here'")
        sys.exit(1)

    print("=" * 50)
    print("LangGraph Agent Demo")
    print("=" * 50)

    # Example queries that demonstrate tool usage
    example_queries = [
        "What is 15 + 27?",
        "Calculate 8 * 12",
        "What is 100 divided by 4?",
    ]

    print("\nRunning example queries...\n")

    for query in example_queries:
        print(f"User: {query}")
        try:
            response = run_agent(query)
            print(f"Agent: {response}\n")
        except Exception as e:
            print(f"Error: {e}\n")

    # Demonstrate more detailed usage with state inspection
    print("-" * 50)
    print("Detailed execution example:")
    print("-" * 50)

    agent = create_agent()

    # Run with full state tracking
    initial_state = {
        "messages": [HumanMessage(content="What is 25 multiplied by 4?")],
        "tool_call_count": 0,
    }

    print(f"\nInitial query: {initial_state['messages'][0].content}")

    # Execute the agent
    final_state = agent.invoke(initial_state)

    # Show the conversation flow
    print("\nConversation flow:")
    for i, msg in enumerate(final_state["messages"]):
        msg_type = type(msg).__name__
        # Handle content that may be a string or list (e.g., tool call blocks)
        raw_content = msg.content
        if isinstance(raw_content, list):
            content = (
                str(raw_content)[:100] + "..."
                if len(str(raw_content)) > 100
                else str(raw_content)
            )
        else:
            content = (
                raw_content[:100] + "..." if len(raw_content) > 100 else raw_content
            )
        print(f"  {i + 1}. [{msg_type}] {content}")

    print(f"\nTotal tool calls: {final_state['tool_call_count']}")
    print(f"Final answer: {final_state['messages'][-1].content}")


if __name__ == "__main__":
    main()
