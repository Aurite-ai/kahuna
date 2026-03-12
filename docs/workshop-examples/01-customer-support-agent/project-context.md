# Business Context

**Company:** TechFlow Solutions
**Product:** TechFlow Pro - B2B project management software
**Purpose:** Handle routine customer support inquiries

## Background
TechFlow Solutions receives 200+ support inquiries daily. 70% are about policies, pricing, and product features that are already documented. We want an AI agent to handle these common questions, freeing human agents for complex issues.

## Pain Points

| Pain Point | Business Impact |
|------------|-----------------|
| Support agents spend most of their time answering repetitive questions about pricing, features, and policies | High labor cost for low-complexity work; delays response to complex issues |
| Customers wait in queue even for simple questions that have documented answers | Poor customer experience and unnecessary friction |
| Inconsistent answers from different agents on policy questions | Customer confusion and trust issues |
| No after-hours support for basic inquiries | Lost leads and frustrated international customers |

## Goals

- Customers get instant, accurate answers to common questions
- Human agents focus on complex issues requiring judgment
- Consistent responses that match our documented policies
- 24/7 availability for routine inquiries

## Allowed Services

This agent MAY use:
- **File Reading**: Read files from the `knowledge-base/` directory
  - `faq.md` - Frequently asked questions
  - `pricing.md` - Pricing tiers and billing policies
  - `product-features.md` - Feature descriptions
  - `support-policies.md` - Support hours, SLAs

This agent may NOT:
- Access files outside `knowledge-base/`
- Make HTTP requests to external services
- Access environment variables or config files

## Technical Stack

- **Framework:** LangGraph - Python
- **LLM:** Claude via Anthropic API
- See `.claude/rules/langgraph.md` for development patterns
