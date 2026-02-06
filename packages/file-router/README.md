# @kahuna/file-router

AI-powered file categorization with **rich metadata extraction** for the Kahuna platform. This package uses Claude (Anthropic) to automatically categorize files and extract structured context.

## 🎯 Features

- **LLM-based categorization**: Uses Claude 3.5 Sonnet for intelligent file analysis
- **Three top-level categories**:
  - `business-info`: Business context, policies, rules, domain knowledge
  - `technical-info`: Technical docs, API specs, integrations, architecture
  - `code`: Source code files in any programming language
- **Rich Metadata Extraction** ⭐ NEW:
  - Auto-detects technologies, frameworks, languages, APIs, databases
  - Generates descriptive tags (5-10 keywords)
  - Identifies key topics/concepts (3-5 main subjects)
  - Creates concise summaries (2-4 sentences)
  - Extracts code elements (functions, classes, imports/exports)
  - Captures document structure (section headings)
- **Confidence scoring**: Returns confidence level (0-1) for each categorization
- **Reasoning provided**: Explains why each category was chosen
- **File size validation**: Rejects files over 400KB (~100k tokens)

## Installation

```bash
pnpm add @kahuna/file-router
```

## Usage

### Enhanced Categorization with Metadata

```typescript
import { categorizeFile } from '@kahuna/file-router';

// Categorize a file - now returns rich metadata!
const result = await categorizeFile('auth-service.ts', fileContent);

console.log(result);
// {
//   category: 'code',
//   confidence: 0.98,
//   reasoning: 'TypeScript service implementing authentication logic',
//   
//   metadata: {
//     entities: {
//       technologies: ['JWT', 'bcrypt'],
//       frameworks: [],
//       languages: ['TypeScript'],
//       libraries: ['jsonwebtoken', 'bcrypt']
//     },
//     tags: ['authentication', 'security', 'user-management', 'jwt', 'password-hashing'],
//     topics: ['User Authentication', 'Token Management', 'Password Security'],
//     summary: 'Authentication service handling user login, registration, and JWT token management. Implements secure password hashing with bcrypt and token-based authentication.',
//     codeElements: {
//       functions: ['login', 'register', 'verifyToken', 'hashPassword'],
//       classes: ['AuthService'],
//       imports: ['@prisma/client', 'jsonwebtoken', 'bcrypt'],
//       exports: ['AuthService', 'login', 'register']
//     }
//   }
// }
```

### Documentation File Example

```typescript
const result = await categorizeFile('api-documentation.md', fileContent);

console.log(result.metadata);
// {
//   entities: {
//     technologies: ['REST', 'OAuth2.0'],
//     apis: ['Stripe API', 'Twilio API'],
//     databases: ['PostgreSQL']
//   },
//   tags: ['api-documentation', 'rest-api', 'authentication', 'payments'],
//   topics: ['API Endpoints', 'Authentication Flow', 'Payment Integration'],
//   summary: 'Comprehensive API documentation covering authentication, user management, and payment processing endpoints. Includes request/response examples and error codes.',
//   sections: [
//     'Introduction',
//     'Authentication',
//     'User Endpoints',
//     'Payment Endpoints',
//     'Error Codes'
//   ]
// }
```

### Error Handling

```typescript
import { categorizeFile, FileSizeError } from '@kahuna/file-router';

try {
  const result = await categorizeFile('huge-file.md', content);
} catch (error) {
  if (error instanceof FileSizeError) {
    console.error(`File too large: ${error.fileSize} bytes (limit: ${error.limit})`);
  } else {
    console.error('Categorization failed:', error.message);
  }
}
```

## API Reference

### `categorizeFile(filename, content, options?)`

Categorize a file and extract rich metadata using Claude LLM.

**Parameters:**
- `filename` (string): Name of the file (helps with context)
- `content` (string): File content to analyze
- `options` (CategorizationOptions, optional):
  - `maxFileSize` (number): Maximum file size in characters (default: 400,000)
  - `apiKey` (string): Anthropic API key (defaults to `ANTHROPIC_API_KEY` env var)

**Returns:** `Promise<CategorizationResult>`
```typescript
{
  category: 'business-info' | 'technical-info' | 'code';
  confidence: number; // 0-1
  reasoning: string;
  metadata?: {
    entities?: {
      technologies?: string[];
      frameworks?: string[];
      languages?: string[];
      apis?: string[];
      databases?: string[];
      libraries?: string[];
    };
    tags?: string[]; // max 10
    topics?: string[]; // max 5
    summary?: string;
    codeElements?: {
      functions?: string[];
      classes?: string[];
      imports?: string[];
      exports?: string[];
    };
    sections?: string[];
  };
}
```

**Throws:**
- `FileSizeError`: If file exceeds size limit
- `Error`: If API key is missing or API call fails

## Metadata Fields Explained

### Entities
Auto-detected technologies, frameworks, languages, APIs, databases, and libraries mentioned in the file.

**Example:** `['React', 'Next.js', 'PostgreSQL', 'Stripe API']`

### Tags
5-10 descriptive keywords in lowercase-hyphenated format for easy searching and filtering.

**Example:** `['authentication', 'api-integration', 'user-management', 'security']`

### Topics
3-5 key concepts or subjects covered in the file.

**Example:** `['JWT Authentication', 'Password Hashing', 'Session Management']`

### Summary
A concise 2-4 sentence overview of what the file contains or does.

**Example:** *"Authentication service handling user login and registration. Implements JWT-based authentication with secure password hashing using bcrypt. Provides token generation, verification, and refresh functionality."*

### Code Elements (for code files)
Key functions, classes, imports, and exports to understand the file's structure.

### Sections (for documentation)
Main section headings to understand document structure.

## Environment Setup

The categorizer requires an Anthropic API key:

```bash
export ANTHROPIC_API_KEY=your-api-key-here
```

Or provide it programmatically:

```typescript
const result = await categorizeFile('file.txt', content, {
  apiKey: process.env.MY_ANTHROPIC_KEY,
});
```

## Cost Estimation

Using Claude 3.5 Sonnet with metadata extraction (~1.5-2k tokens per file):

- **Input**: ~$3 per 1M tokens = ~$0.004-0.006 per file
- **Output**: ~$15 per 1M tokens = ~$0.001-0.002 per file (metadata response)
- **Total**: ~$0.005-0.008 per file

For 1000 files: ~$5-8

**Still significantly cheaper than manual categorization and metadata creation!**

## Use Cases

### 1. Intelligent VCK Generation
Provide copilots with structured context instead of raw files:
```typescript
// Instead of: "Here's a TypeScript file"
// Copilot gets: "Authentication service implementing JWT-based authentication,
// using bcrypt for password hashing, with functions: login(), register(),
// verifyToken(). Uses jsonwebtoken and Prisma libraries."
```

### 2. Smart Search & Discovery
Enable powerful search across your project context:
```typescript
// Find all files tagged with "authentication"
// Find all files using "Stripe API"
// Find all code files with a "login" function
```

### 3. Context Gap Detection (Future)
Identify missing documentation or related files based on extracted metadata.

### 4. Auto-Generated Project Briefs
Synthesize all file metadata into comprehensive project overviews.

## Integration with Kahuna

This package is used by:
- **API**: tRPC `context.create` endpoint stores category + metadata
- **MCP Server**: `categorize_file` tool (future)
- **Web UI**: Display rich metadata, search/filter by tags (future)
- **VCK Generation**: Include structured metadata in copilot context

## Development

```bash
# Build
pnpm build

# Watch mode
pnpm dev

# Type check
pnpm typecheck

# Clean build artifacts
pnpm clean
```

## Roadmap

### Phase 2 (Current)
- ✅ Rich metadata extraction
- ✅ Entity detection
- ✅ Auto-tagging
- ✅ Summary generation

### Phase 3 (Future)
- [ ] Embedding-based similarity search for 10-100x faster categorization
- [ ] Intelligent file chunking for large documents
- [ ] Context gap detection (suggest missing files)
- [ ] Relationship mapping (detect file dependencies)
- [ ] Batch processing (analyze multiple files together)
- [ ] Stage 2 categorization (deeper sub-categories)

## License

MIT
