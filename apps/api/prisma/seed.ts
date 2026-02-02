/**
 * Database seed script for development and testing.
 *
 * Creates test users and sample data for local development.
 * Run with: pnpm --filter @kahuna/api prisma db seed
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { Pool } from "pg";

// Create Prisma client with adapter (Prisma 7+ requirement)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create test user with known ID for X-Test-User-Id header
  const testUser = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      id: "test-user-1", // Fixed ID for test auth bypass
      email: "test@example.com",
      password: await bcrypt.hash("testpassword123", 10),
    },
  });
  console.log(`✅ Test user created: ${testUser.email} (id: ${testUser.id})`);

  // Create a second test user for multi-user scenarios
  const testUser2 = await prisma.user.upsert({
    where: { email: "test2@example.com" },
    update: {},
    create: {
      id: "test-user-2",
      email: "test2@example.com",
      password: await bcrypt.hash("testpassword123", 10),
    },
  });
  console.log(
    `✅ Test user 2 created: ${testUser2.email} (id: ${testUser2.id})`,
  );

  // Create a sample project for the first test user
  const sampleProject = await prisma.project.upsert({
    where: { id: "sample-project-1" },
    update: {},
    create: {
      id: "sample-project-1",
      userId: testUser.id,
      name: "Sample Project",
    },
  });
  console.log(
    `✅ Sample project created: ${sampleProject.name} (id: ${sampleProject.id})`,
  );

  // Create a sample context file
  const sampleContext = await prisma.contextFile.upsert({
    where: { id: "sample-context-1" },
    update: {},
    create: {
      id: "sample-context-1",
      projectId: sampleProject.id,
      filename: "business-context.md",
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

  console.log("🌱 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
