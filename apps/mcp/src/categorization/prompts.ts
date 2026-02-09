/**
 * Prompts for file categorization
 *
 * Categories align with the knowledge base storage structure.
 * See: docs/design/knowledge-architecture.md
 */

/**
 * Build the enhanced categorization prompt for a file with metadata extraction
 */
export function buildCategorizationPrompt(filename: string, content: string): string {
	return `You are an expert file analyzer. Categorize this file AND extract rich metadata to help understand its purpose and content.

**Categories:**

1. **policy**: Business context, policies, rules, domain knowledge, goals, strategies, business plans, meeting notes, organizational standards
2. **requirement**: Requirements, specifications, user stories, acceptance criteria, constraints, functional/non-functional requirements
3. **reference**: Technical documentation, API specs, integration guides, architecture docs, database schemas, tool documentation, code with documentation
4. **decision**: Decision records, rationale documents, trade-off analyses, "why we chose X" explanations
5. **pattern**: Source code, scripts, implementation patterns, reusable code examples, configuration files with code logic
6. **context**: General background information, overviews, onboarding docs, or files that don't clearly fit another category

**Guidelines for choosing:**
- Choose the category that best describes the *primary purpose* of the file
- If a file has elements of multiple categories, choose the dominant one (>50% of content)
- Use **context** as a fallback when no other category clearly fits
- **requirement** vs **policy**: Requirements are things to build; policies are rules to follow
- **reference** vs **pattern**: Reference explains how things work; pattern shows code to follow
- **decision** is specifically for "why" documents, not general documentation

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
