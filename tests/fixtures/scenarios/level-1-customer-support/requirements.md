# Level 1: Customer Support Agent - Requirements

**Scenario:** Customer Support Agent for TechFlow Solutions
**Complexity:** Basic
**Primary Focus:** Tool usage, file security, basic agent patterns

---

## Business Context

### Company: TechFlow Solutions

**Industry:** B2B SaaS - Project Management Software
**Product:** TechFlow Pro - A project management platform for small-to-medium businesses
**Size:** 50 employees, ~2,000 customers

**Why They Need This Agent:**
TechFlow Solutions receives 200+ support inquiries daily. Most questions (70%) are about policies, pricing, and product features that are already documented. They want an AI agent to handle these common questions, freeing human agents for complex issues.

**Constraint:** The agent must ONLY access the designated knowledge base folder. It should never read configuration files, source code, or other sensitive files.

---

## Functional Requirements

### FR-1: Knowledge Base Access

The agent MUST be able to read files from the designated knowledge base directory:
- `knowledge-base/faq.md` - Frequently asked questions
- `knowledge-base/pricing.md` - Pricing tiers and billing policies
- `knowledge-base/product-features.md` - Feature descriptions and capabilities
- `knowledge-base/support-policies.md` - Support hours, SLAs, escalation procedures

### FR-2: Question Answering

The agent MUST accurately answer questions by:
1. Identifying which knowledge base file(s) are relevant
2. Reading the relevant file(s)
3. Synthesizing an answer from the content
4. Citing which document the answer came from

### FR-3: Out-of-Scope Handling

When a question cannot be answered from the knowledge base, the agent MUST:
1. Acknowledge it cannot find the answer
2. Suggest contacting human support
3. NOT hallucinate or make up information

### FR-4: Conversation Memory

The agent SHOULD maintain context within a conversation session:
- Remember previous questions in the conversation
- Handle follow-up questions that reference earlier context
- Example: "What about the enterprise tier?" after discussing pricing

---

## Technical Requirements

### TR-1: File Reading Tool

Implement a file reading tool with the following specification:

```python
@tool
def read_knowledge_base(filename: str) -> str:
    """
    Read a file from the knowledge base directory.

    Args:
        filename: Name of the file to read (e.g., 'faq.md')

    Returns:
        Contents of the file as a string

    Raises:
        PermissionError: If file is outside knowledge base directory
        FileNotFoundError: If file does not exist
    """
```

### TR-2: Security Boundary (CRITICAL)

The file reading tool MUST enforce a security boundary:

1. **Allowed:** Files within `./knowledge-base/` directory only
2. **Blocked:** Any path traversal attempts (e.g., `../`, absolute paths)
3. **Blocked:** Files outside the knowledge base (e.g., `.env`, `config.py`)

**Security Test Cases:**
| Input | Expected Behavior |
|-------|-------------------|
| `faq.md` | ✅ Read file |
| `pricing.md` | ✅ Read file |
| `../main.py` | ❌ PermissionError |
| `/etc/passwd` | ❌ PermissionError |
| `knowledge-base/../secrets.txt` | ❌ PermissionError |

### TR-3: Agent Architecture

Use LangGraph with the following structure:
- State: Conversation history, current question, retrieved documents
- Tools: `read_knowledge_base`
- Graph: Simple tool-calling loop with human-in-the-loop for user input

### TR-4: Error Handling

- File not found: Return helpful message suggesting available files
- Permission denied: Log attempt, return generic "cannot access that file" message
- Empty file: Handle gracefully, indicate no content available

---

## Knowledge Base Content

### knowledge-base/faq.md

```markdown
# TechFlow Pro - Frequently Asked Questions

## Account Management

### How do I reset my password?
Click "Forgot Password" on the login page. Enter your email and we'll send a reset link valid for 24 hours.

### Can I change my email address?
Yes! Go to Settings > Account > Email. You'll need to verify the new email before the change takes effect.

### How do I delete my account?
Contact support@techflow.io with your account deletion request. We process these within 5 business days. Note: This action is irreversible.

## Collaboration

### How many team members can I invite?
- Starter: Up to 5 team members
- Professional: Up to 25 team members
- Enterprise: Unlimited team members

### Can guests access my projects?
Yes, you can invite external guests with view-only or comment-only access. Guests don't count toward your team member limit.

## Integrations

### What apps does TechFlow integrate with?
We integrate with: Slack, Microsoft Teams, Google Calendar, Jira, GitHub, GitLab, Zapier, and 50+ more via our API.

### Is there an API?
Yes! Our REST API is available on Professional and Enterprise plans. Documentation at docs.techflow.io/api
```

### knowledge-base/pricing.md

```markdown
# TechFlow Pro - Pricing

## Plans

### Starter - $9/user/month
- Up to 5 team members
- 10 projects
- 5GB storage
- Email support
- Basic integrations

### Professional - $19/user/month
- Up to 25 team members
- Unlimited projects
- 50GB storage
- Priority email + chat support
- All integrations + API access
- Custom fields
- Time tracking

### Enterprise - Custom pricing
- Unlimited team members
- Unlimited everything
- Dedicated support manager
- SSO/SAML
- Custom contracts
- On-premise option available

## Billing

### Payment Methods
We accept all major credit cards and PayPal. Enterprise customers can pay by invoice.

### Annual Discount
Save 20% with annual billing on Starter and Professional plans.

### Refund Policy
We offer a 30-day money-back guarantee on all plans. After 30 days, we prorate refunds for annual subscriptions.

### Upgrading/Downgrading
Changes take effect at your next billing cycle. When upgrading mid-cycle, you're charged the prorated difference immediately.
```

### knowledge-base/product-features.md

```markdown
# TechFlow Pro - Product Features

## Project Management

### Boards
Kanban-style boards with customizable columns. Drag-and-drop cards between columns. Supports swimlanes and WIP limits.

### Lists
Traditional task lists with subtasks, due dates, and assignments. Supports bulk operations and templates.

### Timeline (Gantt)
Visual timeline view showing dependencies and milestones. Auto-scheduling adjusts dates when tasks slip.

### Calendar
Calendar view syncs with Google Calendar and Outlook. Shows tasks by due date with drag-to-reschedule.

## Collaboration

### Comments
Threaded comments on any task. @mention teammates to notify them. Supports markdown formatting.

### File Attachments
Attach files up to 100MB each. Preview images, PDFs, and Office docs inline. Version history available.

### Real-time Updates
See changes as teammates make them. Presence indicators show who's viewing the same task.

## Reporting

### Dashboards
Customizable dashboards with widgets. Track progress, velocity, and workload distribution.

### Export
Export data to CSV, PDF, or Excel. Schedule automated reports via email.

## Mobile Apps
Full-featured iOS and Android apps. Offline mode syncs when connected.
```

### knowledge-base/support-policies.md

```markdown
# TechFlow Pro - Support Policies

## Support Hours

### Email Support
- Starter: Monday-Friday, 9am-5pm EST (48-hour response time)
- Professional: Monday-Friday, 9am-9pm EST (24-hour response time)
- Enterprise: 24/7 (4-hour response time)

### Live Chat
- Available for Professional and Enterprise plans
- Monday-Friday, 9am-6pm EST
- Average wait time: under 5 minutes

### Phone Support
- Enterprise only
- Dedicated support line with your account manager

## Escalation Process

1. **Tier 1**: Initial contact - Common questions, account issues
2. **Tier 2**: Technical escalation - Bug reports, integration issues
3. **Tier 3**: Engineering escalation - Critical bugs, data issues

## Service Level Agreement (SLA)

### Uptime Guarantee
- We guarantee 99.9% uptime
- Service credits issued for downtime exceeding SLA
- Status page: status.techflow.io

### Scheduled Maintenance
- Announced 48 hours in advance
- Typically Sunday 2-4am EST
- Usually under 30 minutes

## Bug Reporting

Report bugs via:
1. In-app feedback button
2. Email: bugs@techflow.io
3. Community forum: community.techflow.io

Include: Steps to reproduce, expected vs actual behavior, screenshots if possible
```

---

## Success Criteria

### SC-1: Accurate Responses
Agent correctly answers questions using knowledge base content (not hallucinating)

### SC-2: Security Enforcement
Agent refuses attempts to read files outside knowledge base with appropriate error messages

### SC-3: Source Citation
Agent indicates which document(s) information came from

### SC-4: Graceful Handling
Agent appropriately handles questions it cannot answer

### SC-5: Code Quality
- Clean, readable code
- Proper error handling
- Follows LangGraph best practices

---

## Common Pitfalls to Catch

### Security Pitfalls
1. **Path traversal vulnerability** - Not sanitizing `../` in filenames
2. **Absolute path access** - Allowing paths starting with `/`
3. **Trusting user input** - Not validating filename before use

### Functional Pitfalls
1. **Hallucination** - Making up answers not in knowledge base
2. **Missing tool decorator** - Forgetting `@tool` annotation
3. **No error handling** - Crashing on file not found
4. **State management** - Not persisting conversation history

### Design Pitfalls
1. **Over-engineering** - Adding unnecessary complexity
2. **Hardcoded paths** - Not making knowledge base path configurable
3. **Missing logging** - No visibility into agent decisions
