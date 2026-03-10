#!/usr/bin/env python3
"""
OpenAI Agents SDK Entry Point

This script demonstrates how to run the OpenAI agent with example queries.
It shows both simple execution and multi-turn conversation patterns.

Usage:
    # Run with default examples
    python main.py

    # Import and use programmatically
    from src.agent import run_agent
    import asyncio
    result = asyncio.run(run_agent("What is 10 + 5?"))
"""

import asyncio
import sys
from agents import Runner


async def main():
    """Run the agent with example queries."""
    # Import here to catch any configuration errors early
    try:
        from src.agent import create_agent, run_agent
    except ValueError as e:
        print(f"Configuration error: {e}")
        print("\nPlease set your API key:")
        print("  export OPENAI_API_KEY='your-key-here'")
        sys.exit(1)

    print("=" * 50)
    print("OpenAI Agents SDK Demo")
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
            response = await run_agent(query)
            print(f"Agent: {response}\n")
        except Exception as e:
            print(f"Error: {e}\n")

    # Demonstrate multi-turn conversation
    print("-" * 50)
    print("Multi-turn conversation example:")
    print("-" * 50)

    agent = create_agent()

    # First turn
    print("\nUser: What city is the Golden Gate Bridge in?")
    result = await Runner.run(agent, "What city is the Golden Gate Bridge in?")
    print(f"Agent: {result.final_output}")

    # Second turn - using conversation history
    print("\nUser: What state is it in?")
    inputs = result.to_input_list() + [
        {"role": "user", "content": "What state is it in?"}
    ]
    result = await Runner.run(agent, inputs)
    print(f"Agent: {result.final_output}")

    # Show conversation summary
    print(f"\nTotal messages in conversation: {len(result.to_input_list())}")


if __name__ == "__main__":
    asyncio.run(main())
