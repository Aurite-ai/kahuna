/**
 * Prompts for file categorization
 */

/**
 * Build the enhanced categorization prompt for a file with metadata extraction
 */
export function buildCategorizationPrompt(filename: string, content: string): string {
  return `You are an expert file analyzer. Categorize this file AND extract rich metadata to help understand its purpose and content.

**Categories:**

1. **business-info**: Business context, policies, rules, domain knowledge, goals, strategies, requirements, user research, meeting notes, business plans
2. **technical-info**: Technical documentation, API specs, integration guides, architecture docs, deployment configs, database schemas, tool documentation
3. **code**: Source code files in any language, scripts, configuration files with code logic
4. **integration-spec**: Workflow descriptions, integration requirements, external system connections. Describes WHAT systems/tools/APIs an agent needs to connect to, including triggers (what starts the workflow), data sources (where data comes from), outputs (where results go), and AI tasks (what the AI needs to do). Examples: "When order is ready, look up customer in database and send email via Gmail", "Pull data from HubSpot, analyze sentiment, post to Slack"
5. **hybrid**: Files containing significant content from 2 or more categories (30-70% split)

**When to use 'hybrid':**
- File contains distinct sections from different categories
- No single category dominates (i.e., no category is >70% of the content)
- Multiple aspects are substantial (each 30%+) and cannot be ignored
- Examples:
  * Product requirements (business) + API documentation (technical)
  * README (technical docs) + code examples (code)
  * Implementation guide (business process) + source code (code)
  * Jupyter notebook with explanations (technical) + code blocks (code)

**When NOT to use 'hybrid':**
- One category clearly dominates (>70%) - use that primary category
- Minor mentions of other categories (<30%) - use the primary category
- Well-commented code - still classify as 'code' unless comments are 30%+ and provide substantial documentation
- Documentation with brief code snippets (<30% code) - classify as 'business-info' or 'technical-info'

**Your Task:**

1. **Categorize** the file into the most appropriate category
2. **Extract metadata** to enrich the file's context:
   - **Entities**: Technologies, frameworks, languages, APIs, databases, libraries mentioned
   - **Tags**: 5-10 descriptive keywords, MAXIMUM 10 (e.g., "authentication", "payment-processing", "user-management")
   - **Topics**: 3-5 key concepts or subjects covered, MAXIMUM 5 (e.g., "JWT Authentication", "Database Migration")
   - **Summary**: 2-4 sentence overview of what this file contains/does
   - **Code elements** (for code files): Key functions, classes, imports, exports
   - **Sections** (for documentation): Main section headings
   - **Integrations** (extract from ANY file where external systems are mentioned):
     * **Triggers**: What starts the process (webhook, schedule, manual input, event, api-call, file-upload, database-trigger)
     * **Data Sources**: Where data comes from (database, api, file, crm, spreadsheet, email, cloud-storage, other)
     * **Outputs**: Where results/actions go (email, notification, api-call, file, database-write, webhook, message, other)
     * **AI Tasks**: What AI/LLM tasks are needed (e.g., "generate-email", "analyze-sentiment", "classify-ticket")
     * **Authentication**: How to connect to each system (oauth2, api-key, basic-auth, jwt, none, other)
     * **Connected Services**: List ALL external services/tools/APIs mentioned anywhere in the file (e.g., ["Gmail", "HubSpot", "PostgreSQL", "Slack", "Twilio"])
     * Extract integrations regardless of the file's primary category - if a business-info file mentions "send email via Gmail", capture Gmail as a connected service

**Guidelines:**
- Be specific and accurate with entity extraction
- Use lowercase, hyphenated tags (e.g., "api-integration", not "API Integration")
- Keep summaries concise but informative
- For code: focus on the most important 5-10 functions/classes
- For docs: list main section titles

**File to analyze:**
Filename: ${filename}

Content:
\`\`\`
${content}
\`\`\`

Use the 'categorize_with_metadata' tool to provide your complete analysis.`;
}
