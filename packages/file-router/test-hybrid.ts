/**
 * Test hybrid file classification
 * Run with: npx tsx test-hybrid.ts
 */

import { categorizeWithHybridSupport, getCategorizeStats } from './src/index.js';

// Test content: A hybrid document with both business and technical sections
const hybridContent = `# Product Requirements Document: Payment System

## Business Overview

Our goal is to implement a seamless payment processing system that improves customer conversion rates by 25%. The system should support multiple payment methods including credit cards, PayPal, and Apple Pay.

### Key Business Objectives
- Reduce cart abandonment rate from 40% to 25%
- Support international transactions in 30+ countries
- Enable subscription billing for premium users
- Maintain PCI compliance level 1 certification

### Target Metrics
- Transaction success rate: > 99.5%
- Average checkout time: < 2 minutes
- Customer satisfaction: > 4.5/5 stars

## Technical Implementation

### API Integration

We will integrate with Stripe API v2023-10-16 for payment processing. The integration requires the following endpoints:

\`\`\`
POST /v1/payment_intents
POST /v1/customers
GET /v1/payment_methods
\`\`\`

### Database Schema

\`\`\`sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  amount DECIMAL(10,2),
  currency VARCHAR(3),
  stripe_payment_intent_id VARCHAR(255),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
\`\`\`

### Architecture

The payment system will use an event-driven architecture with the following components:

1. **Payment Service**: Node.js/Express API handling payment requests
2. **Webhook Handler**: Processes Stripe webhooks for async status updates
3. **Queue System**: Redis-based queue for retry logic
4. **Monitoring**: DataDog integration for transaction tracking

### Security Requirements

- All payment data encrypted at rest using AES-256
- TLS 1.3 for data in transit
- Token-based authentication using JWT
- Rate limiting: 100 requests per minute per IP
`;

// Test content: Pure business document
const businessContent = `# Marketing Strategy 2024

## Executive Summary

Our marketing strategy for 2024 focuses on expanding our presence in the enterprise market while maintaining strong growth in the SMB segment.

## Key Objectives

1. Increase enterprise deals by 40%
2. Improve brand recognition in Fortune 500 companies
3. Launch new partner program with channel incentives

## Budget Allocation

- Digital Marketing: $2M
- Events & Conferences: $1M
- Content Marketing: $500K
- Partner Programs: $500K

## Success Metrics

- Pipeline growth: 60% YoY
- Win rate improvement: 30% to 40%
- Average deal size: $100K to $150K
`;

// Test content: Pure technical document
const technicalContent = `# API Documentation

## Authentication

All API requests require authentication using Bearer tokens:

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Endpoints

### GET /api/v1/users

Returns a list of users.

**Parameters:**
- \`limit\`: Number of results (default: 10, max: 100)
- \`offset\`: Pagination offset (default: 0)

**Response:**

\`\`\`json
{
  "users": [
    {
      "id": "usr_123",
      "email": "user@example.com",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 150,
  "has_more": true
}
\`\`\`

### POST /api/v1/users

Creates a new user.

**Request Body:**

\`\`\`json
{
  "email": "user@example.com",
  "name": "John Doe",
  "role": "admin"
}
\`\`\`
`;

async function runTests() {
  console.log('='.repeat(80));
  console.log('HYBRID FILE CLASSIFICATION TESTS');
  console.log('='.repeat(80));

  try {
    // Test 1: Hybrid document
    console.log('\n📄 TEST 1: Hybrid Document (Business + Technical)');
    console.log('-'.repeat(80));
    const hybridResult = await categorizeWithHybridSupport('payment-prd.md', hybridContent);

    console.log(`Result Type: ${hybridResult.type}`);

    if (hybridResult.type === 'split') {
      console.log(`\n✅ Successfully detected and split hybrid file!`);
      console.log(`\nSplit into ${hybridResult.result.splits.length} sections:\n`);

      for (const split of hybridResult.result.splits) {
        console.log(`  ${split.sectionIndex}. ${split.sectionTitle || 'Untitled Section'}`);
        console.log(`     Category: ${split.category}`);
        console.log(`     Confidence: ${(split.confidence * 100).toFixed(1)}%`);
        console.log(`     Size: ${split.content.length} chars`);
        console.log(`     Lines: ${split.startLine}-${split.endLine}`);
        console.log(`     Reasoning: ${split.reasoning}`);
        console.log('');
      }

      // Show warnings if any
      if (hybridResult.result.warnings) {
        console.log('\n⚠️  Warnings:');
        for (const warning of hybridResult.result.warnings) {
          console.log(`  - ${warning.code}: ${warning.message}`);
        }
      }

      // Show stats
      const stats = getCategorizeStats(hybridResult);
      console.log('\n📊 Statistics:');
      console.log(`  - Total sections: ${stats.totalSections}`);
      console.log(`  - Average confidence: ${(stats.averageConfidence * 100).toFixed(1)}%`);
      console.log('  - Category breakdown:');
      for (const [category, count] of Object.entries(stats.categories)) {
        console.log(`    * ${category}: ${count} section(s)`);
      }
    } else {
      console.log('\n❌ File was not detected as hybrid');
      console.log(`Category: ${hybridResult.result.category}`);
      console.log(`Confidence: ${(hybridResult.result.confidence * 100).toFixed(1)}%`);
    }

    // Test 2: Pure business document
    console.log('\n\n📄 TEST 2: Pure Business Document');
    console.log('-'.repeat(80));
    const businessResult = await categorizeWithHybridSupport(
      'marketing-strategy.md',
      businessContent
    );

    console.log(`Result Type: ${businessResult.type}`);
    if (businessResult.type === 'single') {
      console.log(`Category: ${businessResult.result.category}`);
      console.log(`Confidence: ${(businessResult.result.confidence * 100).toFixed(1)}%`);
      console.log(`Reasoning: ${businessResult.result.reasoning}`);
      console.log(`\n✅ Correctly classified as ${businessResult.result.category}`);
    }

    // Test 3: Pure technical document
    console.log('\n\n📄 TEST 3: Pure Technical Document');
    console.log('-'.repeat(80));
    const technicalResult = await categorizeWithHybridSupport('api-docs.md', technicalContent);

    console.log(`Result Type: ${technicalResult.type}`);
    if (technicalResult.type === 'single') {
      console.log(`Category: ${technicalResult.result.category}`);
      console.log(`Confidence: ${(technicalResult.result.confidence * 100).toFixed(1)}%`);
      console.log(`Reasoning: ${technicalResult.result.reasoning}`);
      console.log(`\n✅ Correctly classified as ${technicalResult.result.category}`);
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY');
    console.log(`${'='.repeat(80)}\n`);
  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();
