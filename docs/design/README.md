# Kahuna Design Documentation

This directory contains **permanent design documentation** for Kahuna — the cognitive hardware platform that completes LLM-based copilots.

> **Working documents** live in [`docs/internal/`](../internal/). Documents are promoted here when stable and validated.

---

## Structure

| Directory | Level | Purpose |
|-----------|-------|---------|
| [`01-product/`](01-product/) | Product | **Why** Kahuna exists, **what value** it creates, **who** it's for |
| [`02-architecture/`](02-architecture/) | Architecture | **What** components exist, **how** they connect |
| [`03-subsystem/`](03-subsystem/) | Subsystem | **How** individual parts work internally |
| [`04-foundations/`](04-foundations/) | Foundations | **Theoretical models** that inform the design |

**Reading order:** Start at Product, progress through Architecture, then Subsystem. Foundations can be read anytime for deeper understanding.

---

## Document Index

### Product Level

| Document | Description | Status |
|----------|-------------|--------|
| [`kahuna-product-model.md`](01-product/kahuna-product-model.md) | Core value proposition, layered product model (Core + Specializations), capabilities, key scenarios | ✅ Complete |

### Architecture Level

| Document | Description | Status |
|----------|-------------|--------|
| [`abstract-architecture.md`](02-architecture/abstract-architecture.md) | Subsystems, components, integration contracts | ✅ Stable |
| [`static-dynamic-integration.md`](02-architecture/static-dynamic-integration.md) | How static structure enables dynamic computation | ✅ Stable |

### Subsystem Level

| Document | Description | Status |
|----------|-------------|--------|
| — | Individual subsystem designs (Encoding, Storage, Retrieval, etc.) | 📋 Planned |

### Foundations

| Document | Description | Status |
|----------|-------------|--------|
| [`llm-agent-model.md`](04-foundations/llm-agent-model.md) | LLM as Bayesian inference engine, agent design patterns | ✅ Complete |
| [`theoretical-foundations.md`](04-foundations/theoretical-foundations.md) | Consolidated theoretical insights (Bayes, FEP, Multiple→One) | ✅ Complete |

---

## Conceptual Coverage Matrix

The matrix below shows coverage across **abstraction levels** (rows) and **scopes** (columns). Use this to identify gaps and understand document coverage.

| Level | Kahuna Core | Specialization Framework | Kahuna Code (Instance) |
|-------|-------------|--------------------------|------------------------|
| **Product** | ✅ [Product Model](01-product/kahuna-product-model.md) | ✅ *(within Product Model)* | ✅ *(within Product Model)* |
| **Architecture** | ✅ [Abstract Architecture](02-architecture/abstract-architecture.md), [Static-Dynamic](02-architecture/static-dynamic-integration.md) | ✅ *(within arch docs)* | ⏳ Future |
| **Subsystem** | 📋 Pending | 📋 Pending | ⏳ Future |
| **Foundations** | ✅ [LLM Agent Model](04-foundations/llm-agent-model.md), [Theoretical](04-foundations/theoretical-foundations.md) | — | — |

**Legend:**
- ✅ Complete — Document exists and is stable
- 📋 Planned/Pending — Content exists in working docs or is planned
- ⏳ Future — Will be documented when upstream content stabilizes
- — Not applicable

---

## How to Use This Documentation

**For understanding Kahuna's value:**
→ Start with [`01-product/kahuna-product-model.md`](01-product/kahuna-product-model.md)

**For understanding system structure:**
→ Read [`02-architecture/abstract-architecture.md`](02-architecture/abstract-architecture.md) for subsystems and components
→ Read [`02-architecture/static-dynamic-integration.md`](02-architecture/static-dynamic-integration.md) for how structure enables computation

**For implementing a subsystem:**
→ Check Subsystem designs (when available), with Architecture for context

**For theoretical grounding:**
→ Foundations documents explain the cognitive science and LLM theory behind design decisions

---

## Contributing

Documents are promoted from [`docs/internal/`](../internal/) when:
1. Content is stable (not actively being revised)
2. Document has clear scope and purpose
3. No major gaps or TODOs remaining
4. Has been reviewed/validated

When moving documents:
- Update cross-references to use new paths
- Remove internal working notes
- Ensure the document works standalone
