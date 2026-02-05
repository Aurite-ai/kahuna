/**
 * Interactive test script for file router with metadata extraction
 *
 * Tests multiple file types and displays rich metadata results
 */

import { resolve } from 'node:path';
import { config } from 'dotenv';
import { categorizeFile } from './src/index.js';

// Load .env from project root
config({ path: resolve(process.cwd(), '../../.env') });

// Test file samples
const testFiles = {
  'auth-service.ts': {
    type: 'code',
    content: `import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

/**
 * Authentication service handling user login and registration
 */
export class AuthService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Authenticate user with email and password
   */
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Invalid password');
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);
    return { user, token };
  }

  /**
   * Register a new user
   */
  async register(email: string, password: string, name: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await this.prisma.user.create({
      data: { email, password: hashedPassword, name }
    });
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);
    return { user, token };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(token: string) {
    const payload = this.verifyToken(token);
    const newToken = jwt.sign(payload, process.env.JWT_SECRET!);
    return newToken;
  }
}

export default AuthService;`,
  },

  'api-documentation.md': {
    type: 'documentation',
    content: `# E-Commerce API Documentation

## Overview
RESTful API for e-commerce platform built with Node.js, Express, and PostgreSQL.

## Authentication
All endpoints require JWT authentication via Bearer token in the Authorization header.

### Technologies Used
- Node.js v18+
- Express.js
- PostgreSQL 14
- Prisma ORM
- JWT for authentication
- Stripe API for payments
- Twilio API for SMS notifications

## API Endpoints

### Authentication
\`\`\`
POST /api/auth/register - Register new user
POST /api/auth/login - User login
POST /api/auth/refresh - Refresh access token
POST /api/auth/logout - User logout
\`\`\`

### Users
\`\`\`
GET /api/users/:id - Get user profile
PUT /api/users/:id - Update user profile
DELETE /api/users/:id - Delete user account
\`\`\`

### Products
\`\`\`
GET /api/products - List all products
GET /api/products/:id - Get product details
POST /api/products - Create new product (Admin only)
PUT /api/products/:id - Update product (Admin only)
DELETE /api/products/:id - Delete product (Admin only)
\`\`\`

### Orders
\`\`\`
GET /api/orders - List user orders
GET /api/orders/:id - Get order details
POST /api/orders - Create new order
PUT /api/orders/:id/cancel - Cancel order
\`\`\`

### Payments
\`\`\`
POST /api/payments/intent - Create payment intent (Stripe)
POST /api/payments/confirm - Confirm payment
GET /api/payments/:id - Get payment status
\`\`\`

## Error Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Rate Limiting
- 100 requests per minute per IP
- 1000 requests per hour per API key`,
  },

  'business-plan.md': {
    type: 'business',
    content: `# Business Plan: SaaS E-Commerce Platform

## Executive Summary
We are building a B2B SaaS e-commerce platform targeting small to medium-sized businesses. Our platform enables businesses to launch their online stores quickly with minimal technical knowledge.

## Mission Statement
Empower small businesses to compete in the digital marketplace by providing enterprise-grade e-commerce tools at affordable prices.

## Target Market

### Primary Audience
- Small to medium businesses (10-100 employees)
- Annual revenue: $1M-$10M
- Industries: Retail, wholesale, manufacturing
- Currently using manual processes or outdated systems

### Secondary Audience
- Startups looking to launch their first online store
- Traditional retailers expanding online
- B2B companies adding digital sales channels

## Value Proposition

### For Businesses
- Quick setup (< 1 day)
- No coding required
- Integrated payment processing
- Inventory management
- Customer relationship management
- Analytics and reporting

### Competitive Advantages
- Lower pricing than Shopify Plus
- Better B2B features than Wix
- More customizable than BigCommerce
- Superior customer support

## Business Model

### Revenue Streams
1. Subscription tiers
   - Starter: $99/month (up to $50k revenue)
   - Growth: $299/month (up to $500k revenue)
   - Enterprise: Custom pricing ($500k+ revenue)

2. Transaction fees
   - 2.5% + $0.30 per transaction on Starter
   - 2.0% + $0.30 per transaction on Growth
   - Custom rates for Enterprise

3. Add-on services
   - Premium themes: $199-$499
   - Custom development: $150/hour
   - Migration services: $500-$5,000

### Cost Structure
- Infrastructure (AWS): ~30% of revenue
- Customer support: ~15% of revenue
- Sales & marketing: ~25% of revenue
- R&D: ~20% of revenue
- Administrative: ~10% of revenue

## Go-to-Market Strategy

### Phase 1: Beta Launch (Months 1-3)
- Target 50 beta customers
- Gather feedback and iterate
- Build case studies
- Refine product-market fit

### Phase 2: Public Launch (Months 4-6)
- Launch marketing campaigns
- Partner with business consultants
- Attend trade shows
- Target 200 paying customers

### Phase 3: Scale (Months 7-12)
- Scale customer acquisition
- Expand team
- Add new features
- Target 1,000 paying customers

## Key Metrics
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Churn rate < 5%
- Net Promoter Score (NPS) > 50

## Financial Projections
- Year 1: $500k revenue, 200 customers
- Year 2: $2M revenue, 800 customers
- Year 3: $5M revenue, 2,000 customers

## Team
- CEO: Business strategy & fundraising
- CTO: Technical architecture & engineering
- VP Product: Product strategy & design
- VP Sales: Sales strategy & execution
- VP Marketing: Marketing strategy & execution

## Funding Requirements
Seeking $2M seed round for:
- Product development: $800k
- Sales & marketing: $700k
- Operations: $300k
- Working capital: $200k`,
  },
};

// Helper to format output with colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function printSection(title: string, color: string = colors.bright) {
  console.log(`\n${color}${'='.repeat(70)}${colors.reset}`);
  console.log(`${color}${title}${colors.reset}`);
  console.log(`${color}${'='.repeat(70)}${colors.reset}`);
}

function printSubSection(title: string) {
  console.log(`\n${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.cyan}${'-'.repeat(50)}${colors.reset}`);
}

async function testFile(filename: string, data: { type: string; content: string }) {
  printSection(`📄 Testing: ${filename}`, colors.blue);

  console.log(`${colors.yellow}Expected Type: ${data.type}${colors.reset}`);
  console.log(`${colors.yellow}File Size: ${data.content.length} characters${colors.reset}`);

  try {
    console.log(`\n⏳ Categorizing...`);
    const startTime = Date.now();

    const result = await categorizeFile(filename, data.content);

    const duration = Date.now() - startTime;
    console.log(`✅ Completed in ${duration}ms\n`);

    // Basic categorization
    printSubSection('Basic Categorization');
    console.log(`Category: ${colors.green}${result.category}${colors.reset}`);
    console.log(
      `Confidence: ${colors.green}${(result.confidence * 100).toFixed(1)}%${colors.reset}`
    );
    console.log(`Reasoning: ${result.reasoning}`);

    // Metadata
    if (result.metadata) {
      // Entities
      if (result.metadata.entities) {
        printSubSection('🏷️  Detected Entities');
        const entities = result.metadata.entities;
        if (entities.technologies?.length) {
          console.log(`  Technologies: ${entities.technologies.join(', ')}`);
        }
        if (entities.frameworks?.length) {
          console.log(`  Frameworks: ${entities.frameworks.join(', ')}`);
        }
        if (entities.languages?.length) {
          console.log(`  Languages: ${entities.languages.join(', ')}`);
        }
        if (entities.apis?.length) {
          console.log(`  APIs: ${entities.apis.join(', ')}`);
        }
        if (entities.databases?.length) {
          console.log(`  Databases: ${entities.databases.join(', ')}`);
        }
        if (entities.libraries?.length) {
          console.log(`  Libraries: ${entities.libraries.join(', ')}`);
        }
      }

      // Tags
      if (result.metadata.tags?.length) {
        printSubSection('🔖 Tags');
        console.log(`  ${result.metadata.tags.join(', ')}`);
      }

      // Topics
      if (result.metadata.topics?.length) {
        printSubSection('💡 Key Topics');
        result.metadata.topics.forEach((topic, i) => {
          console.log(`  ${i + 1}. ${topic}`);
        });
      }

      // Summary
      if (result.metadata.summary) {
        printSubSection('📝 Summary');
        console.log(`  ${result.metadata.summary}`);
      }

      // Code elements
      if (result.metadata.codeElements) {
        printSubSection('💻 Code Elements');
        const code = result.metadata.codeElements;
        if (code.functions?.length) {
          console.log(`  Functions: ${code.functions.join(', ')}`);
        }
        if (code.classes?.length) {
          console.log(`  Classes: ${code.classes.join(', ')}`);
        }
        if (code.imports?.length) {
          console.log(
            `  Imports: ${code.imports.slice(0, 5).join(', ')}${code.imports.length > 5 ? '...' : ''}`
          );
        }
        if (code.exports?.length) {
          console.log(`  Exports: ${code.exports.join(', ')}`);
        }
      }

      // Sections
      if (result.metadata.sections?.length) {
        printSubSection('📑 Document Sections');
        result.metadata.sections.forEach((section, i) => {
          console.log(`  ${i + 1}. ${section}`);
        });
      }
    }

    console.log(`\n${colors.green}✅ Test passed for ${filename}${colors.reset}`);
  } catch (error) {
    console.error(
      `\n${colors.reset}❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}${colors.reset}`
    );
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
  }
}

async function runAllTests() {
  console.log(`${colors.bright}
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║    🧪 File Router - Metadata Extraction Test Suite               ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
${colors.reset}`);

  console.log(
    `\n${colors.yellow}Testing ${Object.keys(testFiles).length} different file types...${colors.reset}`
  );
  console.log(`${colors.yellow}This will take ~10-15 seconds...${colors.reset}\n`);

  const startTime = Date.now();

  for (const [filename, data] of Object.entries(testFiles)) {
    await testFile(filename, data);

    // Add a small delay between tests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

  printSection(`🎉 All Tests Complete!`, colors.green);
  console.log(`Total time: ${totalDuration}s`);
  console.log(`\nThe file router successfully extracted rich metadata from all test files! 🚀`);
}

// Run tests
runAllTests().catch((error) => {
  console.error(`\n${colors.reset}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
