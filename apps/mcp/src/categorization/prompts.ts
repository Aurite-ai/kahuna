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
4. **hybrid**: Files containing significant content from 2 or more categories (30-70% split)

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
