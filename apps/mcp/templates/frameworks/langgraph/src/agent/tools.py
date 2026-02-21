"""
Tool Definitions

Tools are functions the LLM can call. Use the @tool decorator.
See pattern below - implement your scenario-specific tools here.
"""

from langchain_core.tools import tool

# Example tool pattern (implement your own for your scenario):
#
# @tool
# def my_tool(param: str) -> str:
#     """Brief description for the LLM.
#
#     Args:
#         param: Description of the parameter
#
#     Returns:
#         Description of what is returned
#     """
#     # Implementation
#     return result


# Add your tools to this list
tools = []

# Dictionary for quick tool lookup by name
tools_by_name = {tool.name: tool for tool in tools}
