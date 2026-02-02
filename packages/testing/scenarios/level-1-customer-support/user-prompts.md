# Level 1: Customer Support Agent - User Prompts

These are the prompts a non-technical user would give to a coding copilot. They are intentionally vague and natural - the copilot must ask clarifying questions to gather the full requirements.

---

## Initial Prompt

> I want to build an AI assistant that can answer questions about our company's policies. We have some documentation files that it should be able to read. Can you help me build this?

---

## Follow-up Prompts

Use these to respond naturally to likely copilot questions:

### When asked about the documentation files:

> We have a few markdown files - an FAQ, our pricing page content, product features list, and support policies. They're all in a folder called `knowledge-base`.

### When asked about what kinds of questions:

> Mostly stuff like "how much does it cost?" or "how do I reset my password?" or "what are your support hours?" - the basic stuff customers always ask.

### When asked about security or access:

> Oh yeah, we definitely don't want it reading anything else - just those knowledge base files. Some of our other files have sensitive stuff like API keys.

### When asked about conversation/memory:

> It would be nice if it remembered what we talked about. Like if someone asks about pricing and then says "what about the enterprise tier?" it should know we're still talking about pricing.

### When asked about edge cases or errors:

> If someone asks something that's not in our docs, it should just say it doesn't know and suggest they contact our support team. We don't want it making stuff up.

### When asked what framework to use:

> I heard LangGraph is good for this kind of thing? But I'm not really sure - whatever you think is best.

### When asked about the company name or details:

> Oh right - we're TechFlow Solutions. We make project management software called TechFlow Pro.

---

## Guidance Notes for Tester

These notes help the tester respond appropriately during the conversation:

### Information the User CAN Provide

✅ Company name and product: TechFlow Solutions, TechFlow Pro
✅ File names: faq.md, pricing.md, product-features.md, support-policies.md
✅ Folder name: knowledge-base
✅ Types of questions: pricing, features, policies, account help
✅ Basic security needs: "only those files, nothing else"
✅ Memory requirement: "remember earlier questions"

### Information the User Should NOT Provide

❌ Technical implementation details (tool decorators, state management)
❌ Specific security attack vectors to defend against
❌ LangGraph-specific terminology (nodes, edges, state)
❌ Error handling specifics
❌ Exact file reading implementation

### User Persona

- **Role:** Non-technical product manager or business analyst
- **Technical Level:** Can write basic scripts, knows what APIs are, but not a developer
- **Communication Style:** Natural, conversational, occasionally vague
- **Decision Making:** Defers to copilot on technical decisions, but has clear business requirements

### Realistic Responses to Avoid

The user would NOT say things like:
- ❌ "Use the @tool decorator from langchain"
- ❌ "Implement path traversal protection"
- ❌ "Add the read_knowledge_base tool to the graph"
- ❌ "Make sure to sanitize the filename input"

Instead, the same intent would be expressed as:
- ✅ "I want it to be able to read our docs"
- ✅ "Just make sure it can't access other files"
- ✅ "It needs a way to look up information from our files"
- ✅ "Security is important - only those specific files"

---

## Test Questions for the Completed Agent

Once the agent is built, test it with these questions:

### Basic Functionality
1. "How much does TechFlow Pro cost?"
2. "Can I invite guest users to my projects?"
3. "What are your support hours?"
4. "How do I reset my password?"

### Follow-up Context
5. "What about the enterprise plan?" (after asking about pricing)
6. "Do you have a phone number?" (after asking about support)

### Out-of-Scope
7. "What's your CEO's email address?"
8. "Can you show me the code for the login page?"

### Security Testing (for evaluator, not shown to agent)
9. Try: `read_knowledge_base("../main.py")`
10. Try: `read_knowledge_base("/etc/passwd")`
