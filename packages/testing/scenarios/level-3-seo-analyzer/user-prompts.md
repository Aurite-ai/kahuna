# Level 3: SEO Analysis Reporter - User Prompts

These are the prompts a non-technical user would give to a coding copilot. They are intentionally vague and natural - the copilot must ask clarifying questions to gather the full requirements AND make design decisions.

---

## Initial Prompt

> I need to build something that creates SEO reports for my clients. Right now I spend hours every week pulling data from Google Search Console, checking keyword rankings, looking at what competitors are doing, and then writing up recommendations. I want to automate as much of this as possible. Can you help me build an AI agent for this?

---

## Follow-up Prompts

Use these to respond naturally to likely copilot questions:

### When asked about data sources:

> We use Google Search Console for traffic data - clicks, impressions, that kind of thing. For keyword rankings and competitor analysis, I've been looking at DataForSEO - they have an API that can pull SERP data. I have accounts for both.

### When asked about specific data needed:

> From Search Console, I need the top pages, search queries, CTR, and position data. For competitors, I want to see who's ranking for the same keywords as us and what SERP features they're getting - like featured snippets or those "People Also Ask" boxes.

### When asked about the report format:

> The report needs to work for non-technical clients. So an executive summary at the top that explains things in plain English, then the detailed data, and recommendations at the end. Markdown is fine - I can convert it to PDF or put it in a Google Doc.

### When asked about AI analysis:

> That's actually the part I'm most excited about! I want the AI to look at all the data and tell me what's important - like "your CTR dropped on mobile" or "you're losing rankings for this keyword cluster." And write the recommendations section - that's the part that takes me the longest.

### When asked about authentication/credentials:

> I have a Google Cloud project set up with Search Console access. For DataForSEO, I have login credentials. Just tell me how to set them up securely and I'll handle it.

### When asked about multiple clients:

> Yes, ideally I could run this for different client sites. But let's start with one and make sure it works first.

### When asked about error handling:

> If one data source fails, I still want the report to generate with whatever data it can get. Just note what's missing. Clients would rather have a partial report than no report.

### When asked about how to structure the agent:

> I'm not sure - what do you think makes sense? I just want it to work reliably and be easy to modify if I need to add more data sources later.

### When asked about Perplexity or additional AI sources:

> I've heard of Perplexity - could that help with the competitor analysis? Like researching what content strategies are working? If it makes the report better, let's include it.

### When asked about budget/API costs:

> DataForSEO is pay-per-request, so I want to be smart about not making unnecessary calls. But I have budget for this if it saves me time.

---

## Guidance Notes for Tester

These notes help the tester respond appropriately during the conversation:

### Information the User CAN Provide

✅ Data sources: Google Search Console, DataForSEO
✅ Types of data: clicks, impressions, CTR, rankings, SERP features
✅ Report audience: non-technical clients
✅ Analysis needs: AI-generated insights and recommendations
✅ Credential availability: has accounts, will configure
✅ Error handling preference: partial reports over failure
✅ Extensibility desire: may add more data sources

### Information the User Should NOT Provide

❌ Specific API endpoint formats
❌ OAuth flow implementation details
❌ Agent architecture patterns (sequential vs parallel)
❌ How to structure LLM prompts for analysis
❌ Specific tool implementation patterns
❌ Trade-offs between different approaches

### User Persona

- **Role:** SEO specialist at a marketing agency
- **Technical Level:** Uses tools like Search Console daily, understands APIs exist but doesn't write code
- **Communication Style:** Business-focused, cares about time savings and client value
- **Decision Making:** Will defer to copilot on technical architecture, but has clear business requirements

### Realistic Responses to Avoid

The user would NOT say things like:
- ❌ "Use a sequential pipeline vs parallel data gathering"
- ❌ "Create an analyze_seo_data tool that wraps an LLM call"
- ❌ "Implement OAuth refresh token flow for GSC"
- ❌ "Use exponential backoff for API retries"

Instead, the same intent would be expressed as:
- ✅ "What approach do you think makes sense?"
- ✅ "I want the AI to analyze the data and give insights"
- ✅ "I have Google Cloud set up, tell me how to configure it"
- ✅ "Don't make too many API calls and handle errors gracefully"

---

## Key Behaviors to Observe

### Design Decision Quality

Watch for whether the copilot:
1. **Presents options** for architectural decisions
2. **Explains trade-offs** between different approaches
3. **Makes a recommendation** with clear rationale
4. **Gets buy-in** before proceeding with complex decisions

### Multi-API Integration

Watch for whether the copilot:
1. Handles multiple authentication methods appropriately
2. Manages data from different sources cleanly
3. Addresses partial failure scenarios
4. Considers rate limiting across multiple APIs

### LLM Integration Quality

Watch for whether the copilot:
1. Uses LLM for appropriate tasks (analysis, summarization)
2. Doesn't over-use LLM where simple code would work
3. Structures prompts well for consistent output
4. Grounds analysis in actual data (prevents hallucination)

### Conversation Management

This scenario requires more back-and-forth. Watch for:
1. Does copilot manage the complexity incrementally?
2. Does copilot check understanding before proceeding?
3. Does copilot break the problem into manageable phases?
4. Does copilot stay focused or get lost in details?

---

## Test Scenarios for Completed Agent

Once the agent is built, test with these:

### Basic Functionality
1. "Generate an SEO report for example.com"
2. "What keywords are we ranking for?"
3. "How did our traffic change this month?"

### Multi-Source Integration
4. "Show me who's outranking us for 'project management software'"
5. "What SERP features are our competitors getting?"

### AI Analysis
6. "What opportunities should we focus on?"
7. "Write me an executive summary I can send to the client"
8. "What's causing our CTR to drop?"

### Error Handling
9. Disconnect one API and verify partial report generation
10. Use invalid credentials and check error messaging

### Edge Cases
11. New site with minimal GSC data
12. Highly competitive keyword with 100+ competitors
13. Site with no ranking keywords

---

## Design Discussion Prompts

If the copilot doesn't naturally discuss design, the tester can prompt:

> "Before we start coding, can you walk me through how this will work? I want to make sure I understand the approach."

> "Are there different ways we could structure this? What are the trade-offs?"

> "How will the AI part work? Will it analyze all the data at once or in pieces?"

> "What happens if one of the APIs is slow or returns an error?"

These should trigger the copilot to discuss architecture without telling them what architecture to use.
