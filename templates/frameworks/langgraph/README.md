# LangGraph Agent Framework

A minimal but functional LangGraph Python project demonstrating core agent patterns.

## Overview

This scaffold provides a working LangGraph agent with:
- State management using TypedDict
- Tool calling with the ReAct pattern
- Conditional routing based on tool calls
- Well-commented code for learning

## Requirements

- Python 3.11+
- `uv` (recommended) or `pip`

## Setup

### Using uv (Recommended)

```bash
# Create and activate virtual environment
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
uv pip install -e .
```

### Using pip

```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -e .
```

## Configuration

Set your API key as an environment variable:

```bash
# For Anthropic (default)
export ANTHROPIC_API_KEY="your-key-here"

# Or for OpenAI
export OPENAI_API_KEY="your-key-here"
```

## Running the Agent

```bash
# Run with default example
python main.py

# Or import and use programmatically
python -c "from src.agent import run_agent; print(run_agent('Your prompt here'))"
```

## Project Structure

```
langgraph/
├── README.md              # This file
├── pyproject.toml         # Project configuration
├── main.py                # Entry point
└── src/
    └── agent/
        ├── __init__.py    # Package exports
        ├── state.py       # State TypedDict definition
        ├── tools.py       # Tool definitions (implement your scenario tools here)
        └── graph.py       # Main StateGraph definition
```

## Extending the Agent

### Adding New Tools

1. Define your tool in `src/agent/tools.py`:

```python
@tool
def my_new_tool(param: str) -> str:
    """Description of what the tool does.

    Args:
        param: Description of the parameter
    """
    return "result"
```

2. Add it to the `tools` list in the same file.

### Modifying State

Edit `src/agent/state.py` to add new state fields:

```python
class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]
    my_new_field: str  # Add new fields here
```

### Changing the Graph Structure

Edit `src/agent/graph.py` to:
- Add new nodes with `builder.add_node()`
- Add new edges with `builder.add_edge()` or `builder.add_conditional_edges()`

## Learning Resources

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [LangChain Tools Guide](https://python.langchain.com/docs/modules/tools/)
- See `.claude/rules/langgraph.md` for patterns and best practices
