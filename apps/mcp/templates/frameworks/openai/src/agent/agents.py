"""
Agent Definitions and Runner

This module defines the agents and provides convenience functions for running them.

The OpenAI Agents SDK uses:
- Agent: Defines an agent with name, instructions, tools, and handoffs
- Runner: Executes agents with the agent loop (LLM calls, tool execution, handoffs)

Agent Patterns:
1. Single Agent: One agent with tools
2. Handoffs: Specialist agents that take over the conversation
3. Agents as Tools: Orchestrator calls specialists as tools (not shown here)
"""

import os

from agents import Agent, Runner

from .tools import add, divide, multiply, subtract


def _check_api_key():
    """Verify that the OpenAI API key is set."""
    if not os.getenv("OPENAI_API_KEY"):
        raise ValueError(
            "OPENAI_API_KEY environment variable is not set. "
            "Please set it with: export OPENAI_API_KEY='your-key-here'"
        )


# Define specialist agents for multi-agent routing
# These agents handle specific types of requests

math_agent = Agent(
    name="Math Agent",
    handoff_description="Specialist agent for mathematical calculations and problems",
    instructions=(
        "You are a math expert. Solve mathematical problems step by step. "
        "Use the available tools to perform calculations. "
        "Explain your reasoning clearly."
    ),
    tools=[add, subtract, multiply, divide],
)

general_agent = Agent(
    name="General Agent",
    handoff_description="General purpose agent for non-mathematical questions",
    instructions=(
        "You are a helpful general assistant. "
        "Answer questions clearly and concisely. "
        "If a question requires mathematical calculation, "
        "explain that you've been handed off from the triage agent."
    ),
)

# Define the main triage agent that routes to specialists
# This demonstrates the handoff pattern

triage_agent = Agent(
    name="Triage Agent",
    instructions=(
        "You are a routing agent. Analyze each user request and hand off to the "
        "appropriate specialist agent:\n"
        "- Math Agent: For calculations, equations, and mathematical problems\n"
        "- General Agent: For all other questions\n\n"
        "Always hand off to a specialist - do not answer directly."
    ),
    handoffs=[math_agent, general_agent],
)


def create_agent() -> Agent:
    """Create and return the main agent.

    This is a convenience function that checks configuration and returns
    the triage agent. Modify this to return a different agent if needed.

    Returns:
        The configured agent ready to run

    Raises:
        ValueError: If OPENAI_API_KEY is not set
    """
    _check_api_key()
    return triage_agent


async def run_agent(user_input: str | list[dict]) -> str:
    """Run the agent with the given input and return the final output.

    This is a convenience function for simple agent execution. For more control,
    use Runner.run() directly with the agent.

    Args:
        user_input: Either a string message or a list of message dicts
                   (for multi-turn conversations)

    Returns:
        The agent's final output as a string

    Raises:
        ValueError: If OPENAI_API_KEY is not set
        Exception: If the agent execution fails
    """
    agent = create_agent()
    result = await Runner.run(agent, user_input)
    return result.final_output


# Example: Creating a simple single-agent setup (alternative to triage)
# Uncomment and modify create_agent() to use this instead

# simple_agent = Agent(
#     name="Calculator Agent",
#     instructions=(
#         "You are a helpful calculator assistant. "
#         "Use the available tools to perform calculations. "
#         "Show your work step by step."
#     ),
#     tools=[add, subtract, multiply, divide],
# )
