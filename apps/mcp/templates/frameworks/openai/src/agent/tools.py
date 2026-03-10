"""
Tool Definitions

This module defines the tools available to the agent. Tools are Python functions
decorated with @function_tool that the agent can call to perform actions.

The OpenAI Agents SDK automatically:
- Converts function signatures to tool schemas
- Handles tool calling and result passing
- Validates inputs using type hints and Pydantic models

To add a new tool:
1. Define a function with clear type hints
2. Add a descriptive docstring (becomes tool description)
3. Decorate with @function_tool
4. Add to the agent's tools list in agents.py
"""

from typing import Annotated

from agents import function_tool


# Example: Simple function tool with primitive return type
@function_tool
def add(
    a: Annotated[float, "The first number"],
    b: Annotated[float, "The second number"],
) -> float:
    """Add two numbers together.

    Args:
        a: The first number to add
        b: The second number to add

    Returns:
        The sum of a and b
    """
    return a + b


@function_tool
def subtract(
    a: Annotated[float, "The first number"],
    b: Annotated[float, "The second number"],
) -> float:
    """Subtract the second number from the first.

    Args:
        a: The number to subtract from
        b: The number to subtract

    Returns:
        The difference (a - b)
    """
    return a - b


@function_tool
def multiply(
    a: Annotated[float, "The first number"],
    b: Annotated[float, "The second number"],
) -> float:
    """Multiply two numbers together.

    Args:
        a: The first number to multiply
        b: The second number to multiply

    Returns:
        The product of a and b
    """
    return a * b


@function_tool
def divide(
    a: Annotated[float, "The numerator"],
    b: Annotated[float, "The denominator"],
) -> float:
    """Divide the first number by the second.

    Args:
        a: The number to divide (numerator)
        b: The number to divide by (denominator)

    Returns:
        The quotient (a / b)

    Raises:
        ValueError: If b is zero
    """
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b


# List of all tools to export
# Add new tools here to make them available for import
tools = [add, subtract, multiply, divide]
