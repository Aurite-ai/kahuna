/**
 * Test Code + Documentation Hybrid Classification
 * Scenario: README with substantial code examples
 * Run with: npx tsx test-code-docs-hybrid.ts
 */

import { categorizeWithHybridSupport, getCategorizeStats } from './src/index.js';

// Realistic hybrid: Technical documentation (50%) + Code examples (50%)
const codeDocsHybridContent = `# Authentication Library

## Overview

This library provides a comprehensive authentication solution for Node.js applications. It supports JWT tokens, OAuth2 flows, and session management with Redis backing.

## Installation

\`\`\`bash
npm install @mycompany/auth
\`\`\`

## Quick Start

The library provides three main modules: JWT authentication, OAuth2 integration, and session management. Each can be used independently or together for a complete auth solution.

### Configuration

Create a configuration file with your auth settings:

\`\`\`typescript
import { AuthConfig } from '@mycompany/auth';

const config: AuthConfig = {
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '7d',
    algorithm: 'HS256',
  },
  oauth: {
    providers: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: 'http://localhost:3000/auth/google/callback',
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: 'http://localhost:3000/auth/github/callback',
      },
    },
  },
  session: {
    redis: {
      host: 'localhost',
      port: 6379,
    },
    ttl: 86400, // 24 hours
  },
};

export default config;
\`\`\`

---

## Implementation Examples

### JWT Authentication

Here's a complete implementation of JWT-based authentication:

\`\`\`typescript
import { JWTAuth } from '@mycompany/auth';
import express from 'express';

const app = express();
const auth = new JWTAuth(config.jwt);

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Verify credentials (implement your own logic)
    const user = await verifyCredentials(username, password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = await auth.generateToken({
      userId: user.id,
      email: user.email,
      roles: user.roles,
    });
    
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Protected route middleware
app.use('/api/protected', auth.middleware());

app.get('/api/protected/profile', async (req, res) => {
  // req.user is available after authentication
  const user = req.user;
  res.json({ user });
});

app.listen(3000);
\`\`\`

### OAuth2 Integration

Implement social login with OAuth2:

\`\`\`typescript
import { OAuth2 } from '@mycompany/auth';
import express from 'express';

const app = express();
const oauth = new OAuth2(config.oauth);

// Initialize OAuth routes
app.get('/auth/google', oauth.authenticate('google'));

app.get('/auth/google/callback', 
  oauth.callback('google'),
  async (req, res) => {
    const { user, accessToken } = req.oauth;
    
    // Create or update user in your database
    const dbUser = await User.findOrCreate({
      where: { email: user.email },
      defaults: {
        name: user.name,
        provider: 'google',
        providerId: user.id,
      },
    });
    
    // Generate your own JWT
    const jwt = await auth.generateToken({
      userId: dbUser.id,
      email: dbUser.email,
    });
    
    res.redirect(\`/dashboard?token=\${jwt}\`);
  }
);

// GitHub OAuth
app.get('/auth/github', oauth.authenticate('github', {
  scope: ['user:email', 'read:user'],
}));

app.get('/auth/github/callback',
  oauth.callback('github'),
  async (req, res) => {
    // Similar to Google callback
    handleOAuthCallback(req, res, 'github');
  }
);
\`\`\`

### Session Management

Use Redis-backed sessions for stateful authentication:

\`\`\`typescript
import { SessionManager } from '@mycompany/auth';
import express from 'express';

const app = express();
const sessions = new SessionManager(config.session);

// Initialize session middleware
app.use(sessions.middleware());

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await verifyCredentials(username, password);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Create session
  await req.session.create({
    userId: user.id,
    email: user.email,
    roles: user.roles,
  });
  
  res.json({ success: true, user });
});

app.post('/api/logout', async (req, res) => {
  await req.session.destroy();
  res.json({ success: true });
});

app.get('/api/session', async (req, res) => {
  const sessionData = await req.session.get();
  
  if (!sessionData) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  res.json({ session: sessionData });
});
\`\`\`

### Combining All Methods

Use JWT, OAuth, and sessions together:

\`\`\`typescript
import { AuthManager } from '@mycompany/auth';
import express from 'express';

const app = express();
const authManager = new AuthManager(config);

// Apply all auth middleware
app.use(authManager.initialize());

// Multiple auth strategies
app.get('/api/user', 
  authManager.authenticate(['jwt', 'session']),
  async (req, res) => {
    res.json({ user: req.user });
  }
);

// Refresh token endpoint
app.post('/api/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  
  try {
    const newTokens = await authManager.refresh(refreshToken);
    res.json(newTokens);
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Revoke tokens
app.post('/api/revoke', 
  authManager.authenticate(['jwt']),
  async (req, res) => {
    await authManager.revokeToken(req.user.userId);
    res.json({ success: true });
  }
);

app.listen(3000);
console.log('Auth server running on port 3000');
\`\`\`
`;

async function runCodeDocsHybridTest() {
  console.log('='.repeat(80));
  console.log('CODE + DOCS HYBRID TEST');
  console.log('Testing: Technical Documentation + Code Examples');
  console.log('='.repeat(80));

  try {
    const result = await categorizeWithHybridSupport('auth-readme.md', codeDocsHybridContent);

    console.log(`\n📋 Result Type: ${result.type.toUpperCase()}\n`);

    if (result.type === 'single') {
      console.log('File was classified as single category:');
      console.log(`Category: ${result.result.category}`);
      console.log(`Confidence: ${(result.result.confidence * 100).toFixed(1)}%`);
      console.log(`Reasoning: ${result.result.reasoning}`);

      if (result.result.category === 'hybrid') {
        console.log('\n⚠️  Note: Classified as hybrid but not split (autoSplitHybrid may be false)');
      } else {
        console.log('\n📝 Note: Not detected as hybrid - one category dominates (>70%)');
      }
    } else {
      console.log('✅ HYBRID FILE DETECTED AND SPLIT!\n');
      console.log(`Split into ${result.result.splits.length} sections:\n`);

      for (const split of result.result.splits) {
        console.log('─'.repeat(80));
        console.log(`📄 Section ${split.sectionIndex}: ${split.sectionTitle}`);
        console.log('─'.repeat(80));
        console.log(`Category:    ${split.category}`);
        console.log(`Confidence:  ${(split.confidence * 100).toFixed(1)}%`);
        console.log(`Size:        ${split.content.length} characters`);
        console.log(`Lines:       ${split.startLine}-${split.endLine}`);
        console.log(`Reasoning:   ${split.reasoning}`);

        const snippet = split.content.substring(0, 100).replace(/\n/g, ' ');
        console.log(`Preview:     ${snippet}...`);
        console.log('');
      }

      if (result.result.warnings && result.result.warnings.length > 0) {
        console.log('\n⚠️  WARNINGS:\n');
        for (const warning of result.result.warnings) {
          console.log(`  ${warning.code}: ${warning.message}`);
        }
      }

      const stats = getCategorizeStats(result);
      console.log('\n📊 STATISTICS:\n');
      console.log(`  Total Sections:      ${stats.totalSections}`);
      console.log(`  Average Confidence:  ${(stats.averageConfidence * 100).toFixed(1)}%`);
      console.log('\n  Category Breakdown:');
      for (const [category, count] of Object.entries(stats.categories)) {
        const percentage = ((count / stats.totalSections) * 100).toFixed(0);
        console.log(`    • ${category}: ${count} section(s) (${percentage}%)`);
      }
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ TEST COMPLETED');
    console.log(`${'='.repeat(80)}\n`);
  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error(error);
    process.exit(1);
  }
}

runCodeDocsHybridTest();
