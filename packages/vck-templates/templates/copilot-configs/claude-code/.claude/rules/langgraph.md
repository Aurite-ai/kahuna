# LangGraph Development Patterns

## Core Concepts

LangGraph models agent workflows as graphs with three key components:

### State

A shared data structure representing the current snapshot of your application:

```python
from typing import Annotated
from typing_extensions import TypedDict
import operator

class AgentState(TypedDict):
    """Define state using TypedDict or Pydantic BaseModel."""
    messages: Annotated[list, operator.add]  # Reducer appends to list
    current_step: str                         # Default reducer overwrites
    context: dict
```

**State Best Practices:**
- Use `TypedDict` or Pydantic `BaseModel` for schema definition
- Define reducers via `Annotated` to specify how updates are applied
- Default reducer overwrites values; use `operator.add` for lists
- For message-based workflows, use `MessagesState` or `add_messages` reducer

### Nodes

Functions that encode logic and perform computation:

```python
def process_input(state: AgentState) -> dict:
    """Nodes accept state and return state updates."""
    result = do_work(state["messages"])
    return {"current_step": "processed", "context": result}

# Add to graph
builder.add_node("process_input", process_input)
```

**Node Best Practices:**
- Accept state as input, perform work, return state updates (partial dict)
- Can be synchronous or asynchronous Python functions
- Nodes do the work—they contain LLM calls or regular code
- Keep nodes focused on single responsibilities

### Edges

Functions that determine which node executes next:

```python
from langgraph.graph import StateGraph, START, END

# Direct transitions
builder.add_edge(START, "first_node")
builder.add_edge("first_node", "second_node")

# Conditional routing
def router(state: AgentState) -> str:
    if state["current_step"] == "done":
        return END
    return "next_node"

builder.add_conditional_edges("decision_node", router)
```

**Edge Best Practices:**
- Use `START` constant for entry points, `END` for terminal nodes
- Normal edges: Direct transitions with `add_edge()`
- Conditional edges: Dynamic routing with `add_conditional_edges()`
- Multiple outgoing edges execute destination nodes in parallel

## Graph Construction Pattern

Follow this standard construction sequence:

```python
from langgraph.graph import StateGraph, START, END

# 1. Define State schema
class MyState(TypedDict):
    messages: Annotated[list, operator.add]
    result: str

# 2. Create StateGraph
builder = StateGraph(MyState)

# 3. Add nodes
builder.add_node("step_one", step_one_function)
builder.add_node("step_two", step_two_function)

# 4. Add edges
builder.add_edge(START, "step_one")
builder.add_edge("step_one", "step_two")
builder.add_edge("step_two", END)

# 5. Compile (REQUIRED!)
graph = builder.compile()
```

**Critical:** Always call `builder.compile()` before using the graph.

## Tool Creation Pattern

Use the `@tool` decorator from LangChain:

```python
from langchain.tools import tool

@tool
def search_documents(query: str, limit: int = 10) -> list[dict]:
    """Search documents by keyword query.

    Args:
        query: The search query string
        limit: Maximum number of results to return
    """
    # Implementation here
    return results

# Bind tools to model
tools = [search_documents, other_tool]
model_with_tools = model.bind_tools(tools)
```

**Tool Best Practices:**
- Write clear docstrings—they become the tool description
- Document all arguments with types in the docstring
- Keep tools focused on single operations
- Tools should be idempotent when possible

## Structured Output with LLMs

Always use structured output for predictable results:

```python
from langchain_anthropic import ChatAnthropic
from pydantic import BaseModel, Field

class ExtractedData(BaseModel):
    """Pydantic model for structured output."""
    summary: str = Field(..., description="Brief summary of the content")
    key_points: list[str] = Field(..., description="Main points extracted")
    confidence: float = Field(..., description="Confidence score 0-1")

model = ChatAnthropic(model="claude-sonnet-4-5-20250929")
model_with_structure = model.with_structured_output(
    ExtractedData,
    method="json_schema"
)

response = model_with_structure.invoke("Analyze this document...")
# response is an ExtractedData instance
```

**Structured Output Best Practices:**
- Always specify `method="json_schema"` for reliable parsing
- Use Pydantic models with Field descriptions
- Keep models focused—one model per extraction task

## Tool-Calling Agent Pattern

The standard ReAct-style agent pattern:

```python
from typing import Literal
from langgraph.graph import StateGraph, START, END
from langchain.messages import ToolMessage

class AgentState(TypedDict):
    messages: Annotated[list, operator.add]

def call_model(state: AgentState) -> dict:
    """LLM decides whether to call a tool."""
    response = model_with_tools.invoke(state["messages"])
    return {"messages": [response]}

def execute_tools(state: AgentState) -> dict:
    """Execute any tool calls from the model."""
    last_message = state["messages"][-1]
    results = []
    for tool_call in last_message.tool_calls:
        tool = tools_by_name[tool_call["name"]]
        result = tool.invoke(tool_call["args"])
        results.append(ToolMessage(
            content=str(result),
            tool_call_id=tool_call["id"]
        ))
    return {"messages": results}

def should_continue(state: AgentState) -> Literal["execute_tools", "__end__"]:
    """Route based on whether model made tool calls."""
    last_message = state["messages"][-1]
    if last_message.tool_calls:
        return "execute_tools"
    return END

# Build the graph
builder = StateGraph(AgentState)
builder.add_node("call_model", call_model)
builder.add_node("execute_tools", execute_tools)
builder.add_edge(START, "call_model")
builder.add_conditional_edges("call_model", should_continue)
builder.add_edge("execute_tools", "call_model")
agent = builder.compile()
```

## Advanced Patterns

### Command Pattern

Combine state updates and routing in a single return:

```python
from langgraph.types import Command
from typing import Literal

def smart_node(state: AgentState) -> Command[Literal["next_a", "next_b"]]:
    """Use Command when you need both state updates AND routing."""
    result = process(state)
    next_node = "next_a" if result["success"] else "next_b"
    return Command(
        update={"result": result},
        goto=next_node
    )
```

### Multiple State Schemas

Use different schemas for input, output, and internal state:

```python
class InputState(TypedDict):
    query: str

class OutputState(TypedDict):
    answer: str
    sources: list[str]

class InternalState(InputState, OutputState):
    intermediate_results: list  # Not exposed to caller

builder = StateGraph(InternalState, input=InputState, output=OutputState)
```

## Anti-Patterns to Avoid

### Forgetting to Compile

```python
# Bad: Graph not compiled
builder = StateGraph(MyState)
builder.add_node("step", step_fn)
result = builder.invoke({"input": "test"})  # Error!

# Good: Always compile
graph = builder.compile()
result = graph.invoke({"input": "test"})
```

### Modifying State Directly

```python
# Bad: Mutating state
def bad_node(state: AgentState) -> dict:
    state["messages"].append(new_message)  # Don't mutate!
    return state

# Good: Return updates
def good_node(state: AgentState) -> dict:
    return {"messages": [new_message]}  # Reducer handles append
```

### Assuming Message Content is a String

`AIMessage.content` can be a **list** (containing tool call blocks) or a **string**:

```python
# Bad: Assumes content is always a string
def display_message(msg):
    truncated = msg.content[:100]  # TypeError if content is a list!

# Good: Handle both types
def display_message(msg):
    content = msg.content
    if isinstance(content, list):
        # Tool call blocks - convert to string for display
        display = str(content)[:100]
    else:
        display = content[:100] if len(content) > 100 else content
    return display
```

### Unclear Routing Logic

```python
# Bad: Complex routing in one function
def router(state):
    if state["a"] and not state["b"] or state["c"] == "x":
        return "node_1"
    # ... many more conditions

# Good: Named, testable conditions
def needs_review(state) -> bool:
    return state["confidence"] < 0.8

def router(state) -> Literal["review", "approve"]:
    return "review" if needs_review(state) else "approve"
```

## Required Imports

```python
# Core LangGraph
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages

# For commands and parallel execution
from langgraph.types import Command, Send

# State definitions
from typing import Annotated, Literal
from typing_extensions import TypedDict
import operator

# LangChain integration
from langchain.tools import tool
from langchain.messages import HumanMessage, AIMessage, ToolMessage, SystemMessage
from langchain_anthropic import ChatAnthropic  # Or other providers
```

## Execution Model

Understanding how LangGraph executes:

- Graph uses message passing with discrete "super-steps"
- Nodes in parallel are part of same super-step
- Sequential nodes belong to separate super-steps
- Execution terminates when all nodes are inactive and no messages in transit
- State updates from parallel nodes are merged using reducers
