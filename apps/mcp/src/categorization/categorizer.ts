/**
 * File categorization using Anthropic Claude
 */

import Anthropic from '@anthropic-ai/sdk';
import { buildCategorizationPrompt } from './prompts.js';
import {
	type CategorizationOptions,
	type CategorizationResult,
	CategorizationResultSchema,
} from './types.js';
import { validateFileSize } from './utils.js';

/**
 * Categorize a file using Claude LLM
 *
 * @param filename - Name of the file (helps with context)
 * @param content - File content to analyze
 * @param options - Optional configuration
 * @returns Categorization result with category, confidence, and reasoning
 * @throws {FileSizeError} If file exceeds size limit
 * @throws {Error} If API call fails or response is invalid
 *
 * @example
 * ```typescript
 * const result = await categorizeFile('README.md', fileContent);
 * console.log(result.category); // 'technical-info'
 * console.log(result.confidence); // 0.95
 * ```
 */
export async function categorizeFile(
	filename: string,
	content: string,
	options: CategorizationOptions = {}
): Promise<CategorizationResult> {
	// Validate file size
	validateFileSize(content, options.maxFileSize);

	// Initialize Anthropic client
	const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
	if (!apiKey) {
		throw new Error('ANTHROPIC_API_KEY environment variable is required');
	}

	const anthropic = new Anthropic({ apiKey });

	// Build the categorization prompt
	const prompt = buildCategorizationPrompt(filename, content);

	// Call Claude with tool-based structured output
	const response = await anthropic.messages.create({
		model: 'claude-3-haiku-20240307',
		max_tokens: 2048,
		messages: [
			{
				role: 'user',
				content: prompt,
			},
		],
		tools: [
			{
				name: 'categorize_with_metadata',
				description: 'Categorize the file and extract rich metadata',
				input_schema: {
					type: 'object',
					properties: {
						category: {
							type: 'string',
							enum: ['business-info', 'technical-info', 'code', 'hybrid'],
							description:
								'The category that best fits this file. Use hybrid only if content is 30-70% split between business and technical.',
						},
						confidence: {
							type: 'number',
							minimum: 0,
							maximum: 1,
							description: 'Confidence score between 0 and 1',
						},
						reasoning: {
							type: 'string',
							description: 'One sentence explaining why this category was chosen',
						},
						metadata: {
							type: 'object',
							description: 'Rich metadata extracted from the file',
							properties: {
								entities: {
									type: 'object',
									description: 'Detected entities in the file',
									properties: {
										technologies: {
											type: 'array',
											items: { type: 'string' },
											description: 'Technologies mentioned (e.g., React, PostgreSQL)',
										},
										frameworks: {
											type: 'array',
											items: { type: 'string' },
											description: 'Frameworks mentioned (e.g., Next.js, Express)',
										},
										languages: {
											type: 'array',
											items: { type: 'string' },
											description: 'Programming languages (e.g., TypeScript, Python)',
										},
										apis: {
											type: 'array',
											items: { type: 'string' },
											description: 'APIs mentioned (e.g., Stripe API, Twilio)',
										},
										databases: {
											type: 'array',
											items: { type: 'string' },
											description: 'Databases mentioned (e.g., PostgreSQL, Redis)',
										},
										libraries: {
											type: 'array',
											items: { type: 'string' },
											description: 'Libraries mentioned (e.g., axios, lodash)',
										},
									},
								},
								tags: {
									type: 'array',
									items: { type: 'string' },
									maxItems: 10,
									description: 'Descriptive tags (5-10 keywords, lowercase-hyphenated)',
								},
								topics: {
									type: 'array',
									items: { type: 'string' },
									maxItems: 5,
									description: 'Key topics/concepts (3-5 main subjects)',
								},
								summary: {
									type: 'string',
									description: 'Brief 2-4 sentence summary of the file content',
								},
								codeElements: {
									type: 'object',
									description: 'For code files: key programming elements',
									properties: {
										functions: {
											type: 'array',
											items: { type: 'string' },
											description: 'Main function names',
										},
										classes: {
											type: 'array',
											items: { type: 'string' },
											description: 'Main class names',
										},
										imports: {
											type: 'array',
											items: { type: 'string' },
											description: 'Key imports/dependencies',
										},
										exports: {
											type: 'array',
											items: { type: 'string' },
											description: 'Main exports',
										},
									},
								},
								sections: {
									type: 'array',
									items: { type: 'string' },
									description: 'For documentation: main section headings',
								},
							},
						},
					},
					required: ['category', 'confidence', 'reasoning'],
				},
			},
		],
		tool_choice: {
			type: 'tool',
			name: 'categorize_with_metadata',
		},
	});

	// Extract tool use from response
	const toolUse = response.content.find((block) => block.type === 'tool_use');
	if (!toolUse || toolUse.type !== 'tool_use') {
		throw new Error('No tool use found in Claude response');
	}

	// Validate and parse the result with Zod
	const result = CategorizationResultSchema.parse(toolUse.input);

	return result;
}
