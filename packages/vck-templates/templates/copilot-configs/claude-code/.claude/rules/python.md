# Python Development Essentials

## Project Setup

### Virtual Environments

Always use virtual environments to isolate dependencies:

```bash
# Create with venv (built-in)
python -m venv .venv

# Activate
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows

# Deactivate when done
deactivate
```

**Using uv (faster alternative):**

```bash
# Create environment
uv venv

# Activate (same as venv)
source .venv/bin/activate

# Install packages
uv pip install package-name
uv pip install -r requirements.txt
```

### Package Management

```bash
# Install packages
pip install package-name
pip install -r requirements.txt

# Save dependencies
pip freeze > requirements.txt
```

---

## Debugging

### Print Debugging

Quick and effective for tracing execution:

```python
# Simple value inspection
print(f"DEBUG: query = {query!r}")

# Structured output for complex objects
import json
print(f"DEBUG: result = {json.dumps(result, indent=2, default=str)}")
```

### Logging

For more permanent debugging infrastructure:

```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

logger.debug(f"Processing query: {query}")
logger.info(f"Found {len(results)} results")
logger.error(f"Failed to process: {error}")
```

### Interactive Debugging

```python
# Drop into debugger at specific point
breakpoint()  # Python 3.7+

# Or the older way
import pdb; pdb.set_trace()
```

### Common Issues

**Import errors:**

```bash
# Check if package is installed
pip show package-name

# Reinstall if needed
pip uninstall package-name && pip install package-name
```

**Async issues:**

```python
# Run async code in sync context
import asyncio
result = asyncio.run(async_function())
```

---

## Testing with pytest

### Basic Tests

```python
# tests/test_tools.py
import pytest
from agent.tools import search_documents

def test_search_returns_results():
    """Test that search returns matching documents."""
    results = search_documents("python")
    assert len(results) > 0

def test_search_empty_query():
    """Test that empty query raises error."""
    with pytest.raises(ValueError):
        search_documents("")
```

### Running Tests

```bash
# Run all tests
pytest

# Run specific file
pytest tests/test_tools.py

# Run with verbose output
pytest -v

# Run with print output visible
pytest -s

# Stop on first failure
pytest -x

# Run tests matching a pattern
pytest -k "search"
```

---

## Code Style

### Formatting

```bash
# Black (opinionated, zero config)
black src/ tests/

# Ruff (fast, configurable)
ruff format src/ tests/
```

### Linting

```bash
# Ruff (fast, comprehensive)
ruff check src/

# Fix auto-fixable issues
ruff check --fix src/
```

### Import Organization

```python
# Standard library
import os
import json

# Third-party
import pytest
from langchain.tools import tool

# Local
from agent.state import AgentState
from agent.tools import search_documents
```

---

## Quick Reference

### Common Commands

```bash
# Virtual environment
python -m venv .venv && source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run tests
pytest -v

# Format code
black src/ tests/

# Lint code
ruff check src/
```

### Environment Variables

```python
import os
from dotenv import load_dotenv

load_dotenv()  # Load from .env file

api_key = os.getenv("API_KEY")
if not api_key:
    raise ValueError("API_KEY environment variable required")
```

### Running Scripts

```bash
# Run a script
python main.py

# Run a module
python -m agent.graph

# Set environment variables inline
API_KEY=xxx python main.py
```
