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
from pydantic import BaseModel, Field


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


# Example: Structured output using Pydantic models
class CalculationResult(BaseModel):
    """Structured result for complex calculations."""

    result: float = Field(description="The calculated result")
    operation: str = Field(description="The operation performed")
    operands: list[float] = Field(description="The input operands")


@function_tool
def calculate_with_metadata(
    operation: Annotated[str, "The operation: add, subtract, multiply, or divide"],
    a: Annotated[float, "The first number"],
    b: Annotated[float, "The second number"],
) -> CalculationResult:
    """Perform a calculation and return structured metadata.

    This demonstrates returning a Pydantic model for structured output.

    Args:
        operation: The operation to perform
        a: The first operand
        b: The second operand

    Returns:
        A CalculationResult with the result and metadata
    """
    operations = {
        "add": lambda x, y: x + y,
        "subtract": lambda x, y: x - y,
        "multiply": lambda x, y: x * y,
        "divide": lambda x, y: x / y if y != 0 else None,
    }

    if operation not in operations:
        raise ValueError(f"Unknown operation: {operation}")

    result = operations[operation](a, b)
    if result is None:
        raise ValueError("Cannot divide by zero")

    return CalculationResult(
        result=result,
        operation=operation,
        operands=[a, b],
    )


# List of all tools to export
# Add new tools here to make them available for import
tools = [add, subtract, multiply, divide, calculate_with_metadata]
