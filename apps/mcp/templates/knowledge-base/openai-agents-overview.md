# OpenAI Agents SDK - Development Overview

A comprehensive guide to building AI agents with the OpenAI Agents SDK.

---

## Quick Start

### Setup

```bash
# Create project and virtual environment
mkdir my_project && cd my_project
python -m venv .venv
source .venv/bin/activate

# Install SDK
pip install openai-agents

# Set API key
export OPENAI_API_KEY=sk-...
```

### Basic Agent

Agents are defined with a name, instructions, and optional configuration:

```python
import asyncio
from agents import Agent, Runner

agent = Agent(
    name="History Tutor",
    instructions="You answer history questions clearly and concisely.",
)

async def main():
    result = await Runner.run(agent, "When did the Roman Empire fall?")
    print(result.final_output)

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Core Concepts

### The Agent Loop

When you call `Runner.run()`, the SDK executes a loop:

1. Call the LLM for the current agent with current input
2. Process the LLM output:
   - **Final output** → Loop ends, return result
   - **Handoff** → Update agent and input, continue loop
   - **Tool calls** → Execute tools, append results, continue loop
3. If `max_turns` exceeded → Raise `MaxTurnsExceeded` exception

### Runner Methods

Three ways to run agents:

| Method | Type | Returns | Use Case |
|--------|------|---------|----------|
| `Runner.run()` | Async | `RunResult` | Standard async execution |
| `Runner.run_sync()` | Sync | `RunResult` | Synchronous wrapper |
| `Runner.run_streamed()` | Async | `RunResultStreaming` | Streaming LLM events |

---

## Tools

### Function Tools

Use the `@function_tool` decorator to give agents capabilities:

```python
from typing import Annotated
from pydantic import BaseModel, Field
from agents import Agent, Runner, function_tool

class Weather(BaseModel):
    city: str = Field(description="The city name")
    temperature_range: str = Field(description="The temperature range in Celsius")
    conditions: str = Field(description="The weather conditions")

@function_tool
def get_weather(city: Annotated[str, "The city to get the weather for"]) -> Weather:
    """Get the current weather information for a specified city."""
    return Weather(
        city=city,
        temperature_range="14-20C",
        conditions="Sunny with wind."
    )

agent = Agent(
    name="Weather Assistant",
    instructions="You are a helpful agent.",
    tools=[get_weather],
)

async def main():
    result = await Runner.run(agent, "What's the weather in Tokyo?")
    print(result.final_output)
```

**Key Points:**
- Use type hints and Pydantic models for structured outputs
- Docstrings become tool descriptions for the LLM
- Tools are automatically called when the agent needs them

---

## Multi-Agent Patterns

### Pattern 1: Handoffs (Specialist Takes Over)

Specialists take over the conversation for their domain:

```python
from agents import Agent

# Define specialist agents
history_tutor = Agent(
    name="History Tutor",
    handoff_description="Specialist agent for historical questions",
    instructions="You answer history questions clearly and concisely.",
)

math_tutor = Agent(
    name="Math Tutor",
    handoff_description="Specialist agent for math questions",
    instructions="You explain math step by step and include worked examples.",
)

# Define routing agent
triage_agent = Agent(
    name="Triage Agent",
    instructions="Route each homework question to the right specialist.",
    handoffs=[history_tutor, math_tutor],
)

async def main():
    result = await Runner.run(
        triage_agent,
        "Who was the first president of the United States?",
    )
    print(result.final_output)
    print(f"Answered by: {result.last_agent.name}")
```

**When to use:** The specialist should own the final answer for that part of the conversation.

### Pattern 2: Agents as Tools (Orchestrator Controls)

An orchestrator stays in control and calls specialists as tools. See the SDK documentation for details on this manager-style pattern.

**When to use:** You want centralized control with the orchestrator owning the final answer.

---

## Conversation Management

### Strategy Comparison

| Strategy | State Location | Best For | Next Turn Input |
|----------|---------------|----------|-----------------|
| `result.to_input_list()` | Your app memory | Manual control, any provider | Previous list + new message |
| `session` | Your storage + SDK | Persistent chat, resumable runs | Same session instance |
| `conversation_id` | OpenAI server | Named server-side conversation | Same ID + new message only |
| `previous_response_id` | OpenAI server | Lightweight continuation | Last response ID + new message |

### Manual History Management

```python
async def main():
    agent = Agent(name="Assistant", instructions="Reply very concisely.")
    
    # First turn
    result = await Runner.run(agent, "What city is the Golden Gate Bridge in?")
    print(result.final_output)  # San Francisco
    
    # Second turn - manually manage history
    new_input = result.to_input_list() + [
        {"role": "user", "content": "What state is it in?"}
    ]
    result = await Runner.run(agent, new_input)
    print(result.final_output)  # California
```

### Automatic Session Management

```python
from agents import Agent, Runner, SQLiteSession

async def main():
    agent = Agent(name="Assistant", instructions="Reply very concisely.")
    session = SQLiteSession("conversation_123")
    
    # First turn
    result = await Runner.run(
        agent,
        "What city is the Golden Gate Bridge in?",
        session=session
    )
    print(result.final_output)  # San Francisco
    
    # Second turn - session automatically handles history
    result = await Runner.run(
        agent,
        "What state is it in?",
        session=session
    )
    print(result.final_output)  # California
```

### Server-Managed Conversations

**Using conversation_id:**
```python
from agents import Agent, Runner
from openai import AsyncOpenAI

client = AsyncOpenAI()

async def main():
    agent = Agent(name="Assistant", instructions="Reply very concisely.")
    
    # Create server-managed conversation
    conversation = await client.conversations.create()
    conv_id = conversation.id
    
    while True:
        user_input = input("You: ")
        result = await Runner.run(agent, user_input, conversation_id=conv_id)
        print(f"Assistant: {result.final_output}")
```

**Using previous_response_id:**
```python
async def main():
    agent = Agent(name="Assistant", instructions="Reply very concisely.")
    previous_response_id = None
    
    while True:
        user_input = input("You: ")
        result = await Runner.run(
            agent,
            user_input,
            previous_response_id=previous_response_id,
            auto_previous_response_id=True,
        )
        previous_response_id = result.last_response_id
        print(f"Assistant: {result.final_output}")
```

---

## Streaming

Stream LLM events as they arrive:

```python
from openai.types.responses import ResponseTextDeltaEvent, ResponseContentPartDoneEvent
from agents import Agent, Runner, RawResponsesStreamEvent

async def main():
    agent = Agent(name="Assistant", instructions="Be helpful.")
    
    result = Runner.run_streamed(agent, "Tell me about Python.")
    
    async for event in result.stream_events():
        if not isinstance(event, RawResponsesStreamEvent):
            continue
        data = event.data
        if isinstance(data, ResponseTextDeltaEvent):
            print(data.delta, end="", flush=True)
        elif isinstance(data, ResponseContentPartDoneEvent):
            print("\n")
```

---

## Configuration

### RunConfig

Configure global settings for a run:

```python
from agents import Agent, Runner, RunConfig

agent = Agent(name="Assistant", instructions="Be concise.")

result = await Runner.run(
    agent,
    "Explain quantum computing",
    run_config=RunConfig(
        model="gpt-4",                    # Override model
        max_turns=10,                     # Limit turns
        tracing_disabled=False,           # Enable tracing
        workflow_name="QA Bot",           # Name for traces
    )
)
```

**Key Configuration Options:**

- **Model settings:** `model`, `model_provider`, `model_settings`
- **Guardrails:** `input_guardrails`, `output_guardrails`
- **Handoff control:** `handoff_input_filter`, `nest_handoff_history`
- **Tracing:** `tracing`, `workflow_name`, `trace_id`, `trace_metadata`
- **Hooks:** `call_model_input_filter`, `session_input_callback`

### Input Filtering

Edit model input before the LLM call:

```python
from agents import RunConfig
from agents.run import CallModelData, ModelInputData

def drop_old_messages(data: CallModelData[None]) -> ModelInputData:
    # Keep only last 5 items
    trimmed = data.model_data.input[-5:]
    return ModelInputData(
        input=trimmed,
        instructions=data.model_data.instructions
    )

result = await Runner.run(
    agent,
    "Explain quines",
    run_config=RunConfig(call_model_input_filter=drop_old_messages),
)
```

---

## Error Handling

### Common Exceptions

- `AgentsException`: Base class for all SDK exceptions
- `MaxTurnsExceeded`: Agent exceeded turn limit
- `ModelBehaviorError`: LLM produced unexpected output (malformed JSON, unexpected tool failures)
- `ToolTimeoutError`: Tool call exceeded timeout
- `UserError`: Incorrect SDK usage
- `InputGuardrailTripwireTriggered`, `OutputGuardrailTripwireTriggered`: Guardrail conditions met

### Error Handlers

Handle errors gracefully instead of raising exceptions:

```python
from agents import (
    Agent,
    RunErrorHandlerInput,
    RunErrorHandlerResult,
    Runner,
)

def on_max_turns(_data: RunErrorHandlerInput[None]) -> RunErrorHandlerResult:
    return RunErrorHandlerResult(
        final_output="I couldn't finish within the turn limit. Please narrow the request.",
        include_in_history=False,
    )

result = Runner.run_sync(
    agent,
    "Analyze this long transcript",
    max_turns=3,
    error_handlers={"max_turns": on_max_turns},
)
```

---

## Advanced Features

### WebSocket Transport

Use WebSocket for better performance with the Responses API:

```python
from agents import Agent, responses_websocket_session

async def main():
    agent = Agent(name="Assistant", instructions="Be concise.")
    
    async with responses_websocket_session() as ws:
        first = ws.run_streamed(agent, "Say hello in one short sentence.")
        async for _event in first.stream_events():
            pass
        
        second = ws.run_streamed(
            agent,
            "Now say goodbye.",
            previous_response_id=first.last_response_id,
        )
        async for _event in second.stream_events():
            pass
```

### Durable Execution

For long-running workflows with human-in-the-loop, the SDK integrates with:

- **Temporal**: Durable workflows with retries and restarts
- **Restate**: Lightweight durable agents with single-binary runtime (requires Restate runtime)
- **DBOS**: Reliable agents with SQLite/Postgres persistence (preserves progress across failures)

These integrations support tool approval pause/resume patterns, handoffs, and session management.

---

## Complete Examples

### Hello World
```python
import asyncio
from agents import Agent, Runner

async def main():
    agent = Agent(
        name="Assistant",
        instructions="You only respond in haikus.",
    )
    
    result = await Runner.run(agent, "Tell me about recursion in programming.")
    print(result.final_output)
    # Function calls itself,
    # Looping in smaller pieces,
    # Endless by design.

if __name__ == "__main__":
    asyncio.run(main())
```

### Multi-Agent Routing with Streaming
```python
import asyncio
import uuid
from openai.types.responses import ResponseTextDeltaEvent, ResponseContentPartDoneEvent
from agents import Agent, RawResponsesStreamEvent, Runner, trace

# Define language-specific agents
french_agent = Agent(
    name="french_agent",
    instructions="You only speak French",
)

spanish_agent = Agent(
    name="spanish_agent",
    instructions="You only speak Spanish",
)

english_agent = Agent(
    name="english_agent",
    instructions="You only speak English",
)

# Define routing agent
triage_agent = Agent(
    name="triage_agent",
    instructions="Handoff to the appropriate agent based on the language of the request.",
    handoffs=[french_agent, spanish_agent, english_agent],
)

async def main():
    conversation_id = str(uuid.uuid4().hex[:16])
    
    msg = "Hello, how do I say good evening in French?"
    agent = triage_agent
    inputs = [{"content": msg, "role": "user"}]
    
    while True:
        # Each turn is a single trace
        with trace("Routing example", group_id=conversation_id):
            result = Runner.run_streamed(agent, input=inputs)
            
            async for event in result.stream_events():
                if not isinstance(event, RawResponsesStreamEvent):
                    continue
                data = event.data
                if isinstance(data, ResponseTextDeltaEvent):
                    print(data.delta, end="", flush=True)
                elif isinstance(data, ResponseContentPartDoneEvent):
                    print("\n")
        
        inputs = result.to_input_list()
        user_msg = input("Enter a message: ")
        inputs.append({"content": user_msg, "role": "user"})
        agent = result.current_agent

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Best Practices

1. **Start Simple**: Begin with a single agent before adding tools or handoffs
2. **Use Type Hints**: Leverage Pydantic models for structured tool outputs
3. **Choose One Memory Strategy**: Don't mix client-managed and server-managed state
4. **Enable Tracing**: Set `workflow_name` in RunConfig for observability
5. **Handle Errors**: Use error handlers for graceful degradation
6. **Stream When Possible**: Better UX with streaming for long responses
7. **Test Tool Calls**: Verify tools work independently before integrating

---

## Quick Reference

### Essential Imports
```python
from agents import (
    Agent,                    # Define agents
    Runner,                   # Execute agents
    function_tool,            # Create tools
    RunConfig,                # Configure runs
    SQLiteSession,            # Session management
    trace,                    # Tracing context
)
```

### Common Patterns
```python
# Basic run
result = await Runner.run(agent, "user message")

# With session
result = await Runner.run(agent, "message", session=session)

# With streaming
result = Runner.run_streamed(agent, "message")
async for event in result.stream_events():
    # Process events
    pass

# Multi-turn
inputs = result.to_input_list() + [{"role": "user", "content": "next message"}]
result = await Runner.run(agent, inputs)
```

---

## Additional Notes

### Session Persistence

Sessions automatically:
- Retrieve conversation history before each run
- Store new messages after each run
- Maintain separate conversations for different session IDs

**Important**: Session persistence cannot be combined with server-managed conversation settings (`conversation_id`, `previous_response_id`, or `auto_previous_response_id`) in the same run.

### Nested Handoffs

Nested handoffs are available as an opt-in beta. Enable collapsed-transcript behavior by passing `RunConfig(nest_handoff_history=True)` or set `handoff(..., nest_handoff_history=True)` for specific handoffs. By default, the raw transcript is passed through.

### Reasoning Item ID Policy

Control how reasoning items are converted into next-turn model input:
- `None` or `"preserve"` (default): Keep reasoning item IDs
- `"omit"`: Strip reasoning item IDs from generated next-turn input

Use `"omit"` as an opt-in mitigation for Responses API 400 errors where a reasoning item is sent with an ID but without the required following item.

### Conversation Locking

The SDK automatically retries `conversation_locked` errors with backoff. In server-managed conversation runs, it rewinds the internal conversation-tracker input before retrying. In local session-based runs, it performs best-effort rollback of recently persisted input items to reduce duplicate history entries.
