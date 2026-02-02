/**
 * Database seed script for development and testing.
 *
 * Creates test users and sample data for local development.
 * Run with: pnpm --filter @kahuna/api prisma db seed
 *
 * Note: All IDs use CUID format for consistency with Prisma schema
 * and tRPC validation. Use these IDs with the X-Test-User-Id header.
 */

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';

// Create Prisma client with adapter (Prisma 7+ requirement)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Fixed CUIDs for reproducible test data
// These are valid CUIDs that can be used with X-Test-User-Id header
const TEST_USER_1_ID = 'cm6mwpnw80000qz1ktest0001';
const TEST_USER_2_ID = 'cm6mwpnw80001qz1ktest0002';
const SAMPLE_PROJECT_ID = 'cm6mwpnw80002qz1ktest0003';
const SAMPLE_CONTEXT_ID = 'cm6mwpnw80003qz1ktest0004';

async function main() {
  console.log('🌱 Seeding database...');
  console.log('');
  console.log('Test User IDs (use with X-Test-User-Id header):');
  console.log(`  User 1: ${TEST_USER_1_ID}`);
  console.log(`  User 2: ${TEST_USER_2_ID}`);
  console.log('');

  // Create test user with known CUID for X-Test-User-Id header
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      id: TEST_USER_1_ID,
      email: 'test@example.com',
      password: await bcrypt.hash('testpassword123', 10),
    },
  });
  console.log(`✅ Test user created: ${testUser.email} (id: ${testUser.id})`);

  // Create a second test user for multi-user scenarios
  const testUser2 = await prisma.user.upsert({
    where: { email: 'test2@example.com' },
    update: {},
    create: {
      id: TEST_USER_2_ID,
      email: 'test2@example.com',
      password: await bcrypt.hash('testpassword123', 10),
    },
  });
  console.log(`✅ Test user 2 created: ${testUser2.email} (id: ${testUser2.id})`);

  // Create a sample project for the first test user
  const sampleProject = await prisma.project.upsert({
    where: { id: SAMPLE_PROJECT_ID },
    update: {},
    create: {
      id: SAMPLE_PROJECT_ID,
      userId: testUser.id,
      name: 'Sample Project',
    },
  });
  console.log(`✅ Sample project created: ${sampleProject.name} (id: ${sampleProject.id})`);

  // Create a sample context file
  const sampleContext = await prisma.contextFile.upsert({
    where: { id: SAMPLE_CONTEXT_ID },
    update: {},
    create: {
      id: SAMPLE_CONTEXT_ID,
      projectId: sampleProject.id,
      filename: 'business-context.md',
      content: `# Sample Business Context

## Overview
This is a sample context file for testing purposes.

## Goals
- Test the API endpoints
- Verify context file management
- Demonstrate the feedback loop structure
`,
    },
  });
  console.log(`✅ Sample context file created: ${sampleContext.filename}`);

  console.log('');
  console.log('🌱 Seeding complete!');
  console.log('');
  console.log('Quick test commands:');
  console.log(
    `  curl http://localhost:3000/api/trpc/project.list -H "X-Test-User-Id: ${TEST_USER_1_ID}"`
  );
  console.log(
    `  curl -X POST http://localhost:3000/api/trpc/vck.generate -H "Content-Type: application/json" -H "X-Test-User-Id: ${TEST_USER_1_ID}" -d '{"json":{"projectId":"${SAMPLE_PROJECT_ID}"}}'`
  );
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
