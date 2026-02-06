/**
 * Debug test to check API key and available models
 */

import { resolve } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { config } from 'dotenv';

// Load .env from project root
config({ path: resolve(process.cwd(), '../../.env') });

async function debugTest() {
  console.log('🔍 Debug Test - Checking Anthropic API Setup\n');

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not found in environment');
    process.exit(1);
  }

  console.log('✅ API Key found (length:', apiKey.length, ')');
  console.log('First 10 chars:', apiKey.substring(0, 10) + '...\n');

  const anthropic = new Anthropic({ apiKey });

  console.log('Testing with different models...\n');

  const modelsToTry = [
    'claude-3-5-sonnet-latest',
    'claude-3-5-sonnet-20241022',
    'claude-3-opus-latest',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
  ];

  for (const model of modelsToTry) {
    try {
      console.log(`Trying model: ${model}...`);

      const response = await anthropic.messages.create({
        model,
        max_tokens: 100,
        messages: [{ role: 'user', content: 'Hello! Just testing the API.' }],
      });

      console.log(`  ✅ Success with ${model}`);
      console.log(`  Response type: ${response.content[0].type}\n`);
      break; // Found a working model
    } catch (error) {
      if (error instanceof Error) {
        console.log(`  ❌ Failed: ${error.message}\n`);
      }
    }
  }
}

debugTest().catch(console.error);
