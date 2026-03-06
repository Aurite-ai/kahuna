# OpenAI Agents Framework

A minimal but functional OpenAI Agents SDK project demonstrating core agent patterns.

## Overview

This scaffold provides a working OpenAI agent with:
- Basic agent setup with instructions
- Tool calling with function decorators
- Multi-agent handoffs for routing
- Conversation management patterns
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

Set your OpenAI API key as an environment variable:

```bash
export OPENAI_API_KEY="your-key-here"
```

## Running the Agent

```bash
# Run with default example
python main.py

# Or import and use programmatically
python -c "from src.agent import run_agent; import asyncio; asyncio.run(run_agent('Your prompt here'))"
```

## Project Structure

```
openai/
├── README.md              # This file
├── pyproject.toml         # Project configuration
├── main.py                # Entry point
└── src/
    └── agent/
        ├── __init__.py    # Package exports
        ├── tools.py       # Tool definitions (implement your scenario tools here)
        └── agents.py      # Agent definitions and runner
```

## Extending the Agent

### Adding New Tools

1. Define your tool in `src/agent/tools.py`:

```python
from typing import Annotated
from pydantic import BaseModel, Field
from agents import function_tool

class MyResult(BaseModel):
    value: str = Field(description="The result value")

@function_tool
def my_new_tool(param: Annotated[str, "Description of the parameter"]) -> MyResult:
    """Description of what the tool does."""
    return MyResult(value="result")
```

2. Add it to the agent's `tools` list in `src/agent/agents.py`.

### Adding New Agents

Edit `src/agent/agents.py` to add specialist agents:

```python
specialist_agent = Agent(
    name="Specialist Agent",
    handoff_description="Handles specific domain tasks",
    instructions="You are an expert in...",
    tools=[my_tool],
)

# Add to triage agent's handoffs
triage_agent = Agent(
    name="Triage Agent",
    instructions="Route requests to specialists.",
    handoffs=[specialist_agent],
)
```

### Conversation Management

The example uses manual history management with `result.to_input_list()`. For persistent conversations, consider:

- **SQLiteSession**: Local session storage
- **conversation_id**: Server-managed conversations
- **previous_response_id**: Lightweight continuation

See the OpenAI Agents documentation for details.

## Learning Resources

- [OpenAI Agents SDK Documentation](https://github.com/openai/openai-agents-python)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- See `.claude/rules/openai-agents.md` for patterns and best practices
