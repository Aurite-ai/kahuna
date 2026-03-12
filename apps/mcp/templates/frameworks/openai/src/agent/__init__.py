"""
OpenAI Agents SDK Package

This package provides a simple agent setup with tools and multi-agent routing.
"""

from .agents import create_agent, run_agent, triage_agent
from .tools import add, divide, multiply, subtract

__all__ = [
    "create_agent",
    "run_agent",
    "triage_agent",
    "add",
    "subtract",
    "multiply",
    "divide",
]
