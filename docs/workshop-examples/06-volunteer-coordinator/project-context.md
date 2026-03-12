# Business Context

**Organization:** Helping Hands Food Bank
**Type:** Nonprofit community food bank
**Purpose:** Coordinate volunteer scheduling, shift matching, and attendance tracking

## Pre-Workshop Setup

**⚠️ Required Before Workshop:** You'll need a free Notion integration token to complete this project.

### Getting Your Notion Integration Token (10 minutes)

1. Create a free Notion account at [notion.so](https://notion.so) if you don't have one
2. Go to [Notion Integrations](https://www.notion.so/my-integrations)
3. Click "New integration"
4. Name it "Volunteer Coordinator Workshop"
5. Select your workspace and click "Submit"
6. Copy your "Internal Integration Secret" (starts with `secret_`)

### Setting Up Your Notion Workspace

After getting your token, create the required databases:

1. **Create a new page** called "Food Bank Volunteers"
2. **Create three databases** on this page (see schema below)
3. **Connect your integration:**
   - Click "..." menu on each database
   - Click "Connections" → "Connect to" → Select your integration

**Free Tier:** Notion's API is free for personal/team workspaces with no call limits (just a 3 req/sec rate limit).

## Background

Helping Hands Food Bank serves 500+ families weekly with a volunteer workforce of 150+ active volunteers. Managing shift coverage, matching volunteers to appropriate roles, and handling last-minute schedule changes currently requires significant staff time. We need an AI agent to automate routine scheduling tasks and ensure adequate coverage.

## Why This Project?

**For Data Analytics Students:** Matching volunteers to shifts based on skills, availability, and past reliability is an optimization problem. You'll apply constraint satisfaction in a context that mirrors resource allocation problems in operations research—exactly the kind of problem you've studied in optimization courses.

| Learning Focus | Data Analytics Connection |
|----------------|--------------------------|
| Constraint Satisfaction | Linear programming, assignment problems |
| Matching Algorithms | Bipartite matching, Hungarian algorithm concepts |
| Database Operations | SQL-like queries with multiple joins and filters |
| Reliability Scoring | Statistical measures, weighted averages |

**Capstone Complexity:** This is the most complex project in the workshop, combining everything you've learned: API integration, database operations, multi-step logic, and constraint handling.

## Pain Points

| Pain Point | Organization Impact |
|------------|---------------------|
| Manual matching of volunteer skills to shift requirements | Staff spend hours weekly on scheduling instead of program work |
| Last-minute cancellations leave shifts understaffed | Food distribution delays, volunteer burnout from overwork |
| No automated reminders for upcoming shifts | 15-20% no-show rate, scrambling to find replacements |
| Difficulty tracking volunteer hours and attendance patterns | Cannot identify reliability issues or recognize top contributors |
| Communication scattered across email, phone, and texts | Messages missed, inconsistent information shared |

## Goals

- Volunteers are automatically matched to shifts based on skills and availability
- Shift reminders sent 48 hours and 2 hours before scheduled time
- Quick identification and outreach for replacement volunteers when cancellations occur
- Accurate attendance tracking for reporting and recognition
- Consistent, professional communication with all volunteers

## Allowed Services

This agent MAY use:

- **Notion API**: Query and update volunteer scheduling databases
  - Documentation: https://developers.notion.com/docs
  - Authentication: Internal Integration Token (Bearer token)
  - Rate limits: 3 requests/second per integration

- **Notion Databases**:
  - `Volunteers` - Name, email, skills, availability, status
  - `Shifts` - Date, time, role, volunteers needed, assigned volunteers
  - `Assignments` - Volunteer-shift relations, status, attendance notes

- **File Reading**: Read files from the `knowledge-base/` directory
  - `volunteer-policies.md` - Scheduling rules and requirements
  - `role-requirements.md` - Skills/certifications for each role
  - `escalation-contacts.md` - Emergency coverage contacts
  - `communication-templates.md` - Standard message templates

This agent may NOT:
- Send actual emails or SMS (outputs messages for staff to send)
- Access volunteer personal information beyond scheduling needs
- Modify volunteer records without staff confirmation
- Override scheduling policies defined in knowledge base

## Technical Stack

- **Framework:** LangGraph - Python
- **LLM:** Claude via Anthropic API
- **External API:** Notion REST API
- See `.claude/rules/langgraph.md` for development patterns

## Notion Database Schema

### Volunteers Database

| Property | Type | Description |
|----------|------|-------------|
| Name | Title | Volunteer full name |
| Email | Email | Contact email |
| Phone | Phone | Contact phone |
| Skills | Multi-select | food_handling, forklift, driver, bilingual_spanish, bilingual_vietnamese |
| Availability | Multi-select | mon_am, mon_pm, tue_am, tue_pm, wed_am, wed_pm, thu_am, thu_pm, fri_am, fri_pm, sat_am, sat_pm |
| Status | Select | active, inactive, on_hold |
| Total Hours | Number | Cumulative volunteer hours |
| Reliability Score | Number | 0-100 based on attendance history |

### Shifts Database

| Property | Type | Description |
|----------|------|-------------|
| Date | Date | Shift date |
| Time Slot | Select | morning (8am-12pm), afternoon (1pm-5pm) |
| Role | Select | sorter, packer, driver, greeter, warehouse |
| Volunteers Needed | Number | Required headcount |
| Assigned Volunteers | Relation | Links to Volunteers database |
| Status | Select | open, filled, understaffed, completed |

### Assignments Database

| Property | Type | Description |
|----------|------|-------------|
| Volunteer | Relation | Link to Volunteers |
| Shift | Relation | Link to Shifts |
| Status | Select | scheduled, confirmed, completed, no_show, cancelled |
| Check-in Time | Date | Actual arrival time |
| Check-out Time | Date | Actual departure time |
| Notes | Text | Any relevant notes |

## API Quick Reference

### Notion REST API

| Endpoint | Purpose | Method |
|----------|---------|--------|
| `/databases/{id}/query` | Query database with filters | POST |
| `/pages` | Create a new page (record) | POST |
| `/pages/{id}` | Update page properties | PATCH |
| `/blocks/{id}/children` | Get/add content blocks | GET/PATCH |

### Authentication

```python
headers = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Content-Type": "application/json",
    "Notion-Version": "2022-06-28"
}
```

### Example: Query Volunteers by Skill

```python
response = requests.post(
    f"https://api.notion.com/v1/databases/{VOLUNTEERS_DB_ID}/query",
    headers=headers,
    json={
        "filter": {
            "and": [
                {"property": "Skills", "multi_select": {"contains": "food_handling"}},
                {"property": "Status", "select": {"equals": "active"}}
            ]
        }
    }
)
```

## Sample Interaction

```
User: "We need to fill the packer shifts for Saturday morning.
Who's available and qualified?"

Agent:
1. Queries Shifts database for Saturday morning packer shifts
2. Identifies 6 volunteers needed, 2 currently assigned
3. Queries Volunteers database for:
   - Skills: food_handling (required for packers)
   - Availability: sat_am
   - Status: active
   - Not already assigned Saturday
4. Ranks candidates by reliability score
5. Returns recommendation (see below)
```

## Sample Output

When finding volunteers for a shift, the agent produces structured recommendations:

### Shift Coverage Report

```markdown
# Shift Coverage: Saturday March 15, Morning (8am-12pm)

## Shift Details
- **Role:** Packer
- **Location:** Main Warehouse
- **Volunteers Needed:** 6
- **Currently Assigned:** 2 (Maria Santos, Tom Chen)
- **Gap:** 4 volunteers needed

## Recommended Volunteers

### Top Candidates (High Reliability, 85+)

| Rank | Name | Reliability | Skills | Hours (MTD) | Last Shift |
|------|------|-------------|--------|-------------|------------|
| 1 | Jennifer Walsh | 95 | food_handling, bilingual_spanish | 8 | Mar 8 |
| 2 | David Kim | 92 | food_handling, forklift | 12 | Mar 10 |
| 3 | Amanda Foster | 90 | food_handling | 4 | Mar 1 |

### Additional Candidates (Reliability 70-84)

| Rank | Name | Reliability | Skills | Hours (MTD) | Last Shift |
|------|------|-------------|--------|-------------|------------|
| 4 | Mike Rodriguez | 82 | food_handling | 16 | Mar 12 |
| 5 | Sarah Lee | 78 | food_handling, bilingual_vietnamese | 8 | Mar 5 |
| 6 | Chris Johnson | 75 | food_handling | 0 | Feb 28 |

### Notes
- Mike Rodriguez already has 16 hours this month (approaching 20-hour guideline)
- Chris Johnson hasn't volunteered recently - good candidate for re-engagement
- 2 additional candidates available but reliability < 70 (see full list if needed)

## Recommended Actions

1. **Contact Top 4 candidates** in order to fill remaining slots
2. **Consider Chris Johnson** for shift to re-engage inactive volunteer
3. **Draft messages ready** (see communication templates)

## Draft Outreach Messages

### For Jennifer Walsh:
> Hi Jennifer! We have a packer shift available this Saturday morning
> (8am-12pm) at the main warehouse. Would you be able to help?
> Let us know by Thursday if you can make it. Thanks!

### For David Kim:
> Hi David! We need packers this Saturday morning (8am-12pm).
> Your forklift certification is a bonus if we need warehouse help too.
> Can you join us? Please confirm by Thursday.
```

### Assignment Confirmation

When assignments are made:

```json
{
  "shift_id": "sat_2026-03-15_am_packer",
  "assignments_made": [
    {
      "volunteer": "Jennifer Walsh",
      "notion_page_id": "abc123",
      "status": "scheduled",
      "confirmation_needed_by": "2026-03-13"
    },
    {
      "volunteer": "David Kim",
      "notion_page_id": "def456",
      "status": "scheduled",
      "confirmation_needed_by": "2026-03-13"
    }
  ],
  "shift_status": "understaffed",
  "remaining_gap": 2,
  "next_actions": [
    "Continue outreach to Amanda Foster, Mike Rodriguez",
    "Send confirmation request to Jennifer, David",
    "Check back Thursday PM for unconfirmed assignments"
  ]
}
```

## Example Code

```python
import os
import requests
from anthropic import Anthropic
from dataclasses import dataclass
from typing import Optional


@dataclass
class Volunteer:
    """Volunteer record from Notion database."""
    page_id: str
    name: str
    email: str
    skills: list[str]
    availability: list[str]
    status: str
    reliability_score: int
    total_hours: float


@dataclass
class Shift:
    """Shift record from Notion database."""
    page_id: str
    date: str
    time_slot: str  # morning or afternoon
    role: str
    volunteers_needed: int
    assigned_volunteers: list[str]
    status: str


class NotionClient:
    """Simple Notion API client for volunteer database operations."""

    def __init__(self, token: str):
        self.token = token
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28",
        }
        self.base_url = "https://api.notion.com/v1"

    def query_database(
        self, database_id: str, filter_obj: Optional[dict] = None
    ) -> list[dict]:
        """Query a Notion database with optional filter."""
        url = f"{self.base_url}/databases/{database_id}/query"
        body = {}
        if filter_obj:
            body["filter"] = filter_obj

        response = requests.post(url, headers=self.headers, json=body)
        response.raise_for_status()
        return response.json()["results"]

    def create_page(self, database_id: str, properties: dict) -> dict:
        """Create a new page (record) in a database."""
        url = f"{self.base_url}/pages"
        body = {"parent": {"database_id": database_id}, "properties": properties}

        response = requests.post(url, headers=self.headers, json=body)
        response.raise_for_status()
        return response.json()

    def update_page(self, page_id: str, properties: dict) -> dict:
        """Update properties of an existing page."""
        url = f"{self.base_url}/pages/{page_id}"

        response = requests.patch(url, headers=self.headers, json={"properties": properties})
        response.raise_for_status()
        return response.json()


def parse_volunteer(page: dict) -> Volunteer:
    """Parse a Notion page into a Volunteer object."""
    props = page["properties"]
    return Volunteer(
        page_id=page["id"],
        name=props["Name"]["title"][0]["plain_text"],
        email=props["Email"]["email"] or "",
        skills=[s["name"] for s in props["Skills"]["multi_select"]],
        availability=[a["name"] for a in props["Availability"]["multi_select"]],
        status=props["Status"]["select"]["name"],
        reliability_score=props["Reliability Score"]["number"] or 75,
        total_hours=props["Total Hours"]["number"] or 0,
    )


def find_available_volunteers(
    notion: NotionClient,
    volunteers_db_id: str,
    required_skill: str,
    time_slot: str,  # e.g., "sat_am"
    exclude_ids: list[str] = None,
) -> list[Volunteer]:
    """Find volunteers available for a specific shift with required skills."""
    exclude_ids = exclude_ids or []

    # Query for active volunteers with the required skill and availability
    filter_obj = {
        "and": [
            {"property": "Status", "select": {"equals": "active"}},
            {"property": "Skills", "multi_select": {"contains": required_skill}},
            {"property": "Availability", "multi_select": {"contains": time_slot}},
        ]
    }

    results = notion.query_database(volunteers_db_id, filter_obj)
    volunteers = [parse_volunteer(page) for page in results]

    # Exclude already assigned volunteers
    volunteers = [v for v in volunteers if v.page_id not in exclude_ids]

    # Sort by reliability score (highest first)
    volunteers.sort(key=lambda v: v.reliability_score, reverse=True)

    return volunteers


def create_assignment(
    notion: NotionClient,
    assignments_db_id: str,
    volunteer_id: str,
    shift_id: str,
) -> dict:
    """Create a new assignment linking volunteer to shift."""
    properties = {
        "Volunteer": {"relation": [{"id": volunteer_id}]},
        "Shift": {"relation": [{"id": shift_id}]},
        "Status": {"select": {"name": "scheduled"}},
    }

    return notion.create_page(assignments_db_id, properties)


def load_knowledge_base(kb_path: str = "knowledge-base") -> dict[str, str]:
    """Load all knowledge base files into a dictionary."""
    from pathlib import Path

    kb_files = {}
    kb_dir = Path(kb_path)

    for md_file in kb_dir.glob("*.md"):
        with open(md_file, "r") as f:
            kb_files[md_file.stem] = f.read()

    return kb_files


def generate_coverage_recommendation(
    shift: Shift,
    candidates: list[Volunteer],
    knowledge_base: dict[str, str],
) -> str:
    """Use Claude to generate a coverage recommendation report."""
    client = Anthropic()

    system_prompt = f"""You are a volunteer coordinator assistant for Helping Hands Food Bank.
Generate a shift coverage report recommending volunteers for an understaffed shift.

Volunteer Policies:
{knowledge_base.get('volunteer-policies', 'No policies loaded')}

Role Requirements:
{knowledge_base.get('role-requirements', 'No requirements loaded')}

Communication Templates:
{knowledge_base.get('communication-templates', 'No templates loaded')}

Format your response as a markdown report with:
1. Shift details
2. Ranked volunteer recommendations
3. Draft outreach messages"""

    user_message = f"""Generate a coverage report for this shift:

Shift: {shift.role} on {shift.date} ({shift.time_slot})
Volunteers Needed: {shift.volunteers_needed}
Currently Assigned: {len(shift.assigned_volunteers)}
Gap: {shift.volunteers_needed - len(shift.assigned_volunteers)}

Available Candidates:
{chr(10).join(f"- {v.name}: Reliability {v.reliability_score}, Skills: {v.skills}, Hours MTD: {v.total_hours}" for v in candidates[:10])}
"""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}],
    )

    return response.content[0].text


# Example usage
def main():
    # Initialize clients
    notion = NotionClient(os.environ["NOTION_TOKEN"])
    kb = load_knowledge_base()

    # Database IDs (from your Notion setup)
    VOLUNTEERS_DB = os.environ["VOLUNTEERS_DATABASE_ID"]
    SHIFTS_DB = os.environ["SHIFTS_DATABASE_ID"]
    ASSIGNMENTS_DB = os.environ["ASSIGNMENTS_DATABASE_ID"]

    # Example: Find volunteers for Saturday morning packer shift
    candidates = find_available_volunteers(
        notion,
        VOLUNTEERS_DB,
        required_skill="food_handling",
        time_slot="sat_am",
    )

    print(f"Found {len(candidates)} available volunteers")
    for v in candidates[:5]:
        print(f"  - {v.name}: Reliability {v.reliability_score}")

    # Generate recommendation report
    example_shift = Shift(
        page_id="shift123",
        date="2026-03-15",
        time_slot="morning",
        role="packer",
        volunteers_needed=6,
        assigned_volunteers=["Maria Santos", "Tom Chen"],
        status="understaffed",
    )

    report = generate_coverage_recommendation(example_shift, candidates, kb)
    print("\n" + report)


if __name__ == "__main__":
    main()
```
