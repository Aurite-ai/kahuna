/**
 * Quick test script - test a single file quickly
 *
 * Modify the testContent variable to test different files
 */

import { resolve } from 'path';
import { config } from 'dotenv';
import { categorizeFile } from './src/index.js';

// Load .env from project root
config({ path: resolve(process.cwd(), '../../.env') });

// Change this to test different content
const testContent = `
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);
    return { user, token };
  }
  
  async register(email: string, password: string) {
    // Registration logic
  }
}
`;

const filename = 'test-file.ts';

async function quickTest() {
  console.log('🧪 Quick Test - File Router\n');
  console.log(`Testing: ${filename}`);
  console.log(`Size: ${testContent.length} characters\n`);

  try {
    console.log('⏳ Categorizing...\n');

    const result = await categorizeFile(filename, testContent);

    console.log('✅ Result:\n');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n🎉 Test complete!');
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

quickTest();
