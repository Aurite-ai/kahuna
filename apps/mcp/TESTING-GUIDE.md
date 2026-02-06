# Kahuna MCP Testing Guide - Quick Reference 🚀

## Quick Start (4 Steps)

### Step 1: Start API Server

```bash
# Terminal 1 - Start the Kahuna API
cd /Users/nidhi/Aurite/kahuna
pnpm --filter @kahuna/api dev
```

Wait until you see: `Server listening on http://localhost:3000`

### Step 2: Build MCP Server

```bash
# Terminal 2 - Build MCP
cd /Users/nidhi/Aurite/kahuna
pnpm --filter @kahuna/mcp build
```

### Step 3: Get Your Session Token 🔑

**What is KAHUNA_SESSION_TOKEN?**

The session token is a unique ID that authenticates you with the Kahuna API. It's created when you register or login to Kahuna.

**Option A: Use Helper Script (Recommended)**

```bash
cd /Users/nidhi/Aurite/kahuna
./apps/mcp/scripts/get-session-token.sh
```

This will:
1. Ask if you want to register or login
2. Prompt for email and password
3. Print your session token
4. Show you the complete Claude Desktop config

**Option B: Manual Method via curl**

```bash
# Register new account (if needed)
curl -s -i -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpassword123"}' \
  | grep -i "set-cookie:"

# OR Login to existing account
curl -s -i -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpassword123"}' \
  | grep -i "set-cookie:"
```

Look for the `kahuna.sid=` value in the response. Example:
```
Set-Cookie: kahuna.sid=clxxxxxxxxxx; Path=/; ...
```

Copy the value after `kahuna.sid=` (e.g., `clxxxxxxxxxx`) - that's your session token!

**Option C: Get from Database (Advanced)**

```bash
# After registering, check the Session table
cd /Users/nidhi/Aurite/kahuna/apps/api
sqlite3 dev.db "SELECT id FROM Session ORDER BY createdAt DESC LIMIT 1;"
```

### Step 4: Configure Claude Desktop

Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "kahuna": {
      "command": "node",
      "args": ["/Users/nidhi/Aurite/kahuna/apps/mcp/dist/index.js"],
      "env": {
        "KAHUNA_API_URL": "http://localhost:3000",
        "KAHUNA_SESSION_TOKEN": "YOUR_SESSION_TOKEN_HERE",
        "ANTHROPIC_API_KEY": "YOUR_ANTHROPIC_KEY_HERE"
      }
    }
  }
}
```

**Replace:**
- `YOUR_SESSION_TOKEN_HERE` → Token from Step 3
- `YOUR_ANTHROPIC_KEY_HERE` → Your Anthropic API key (from console.anthropic.com)

**Restart Claude Desktop** after saving the config.

### 3. Run Tests in Claude

Copy these commands to Claude Desktop one by one:

---

## Test Commands

### Test 1: Health Check
```
Use the health_check tool with action "ping"
```

### Test 2: Create Project
```
Use manage_projects to create a new project called "MCP Test Project"
```
💡 **Copy the project ID returned!**

### Test 3: Learn Single File
```
Use kahuna_learn to add a file to project [YOUR-PROJECT-ID]:

Filename: api-docs.md
Content: # API Documentation
REST API for user management with JWT authentication.
```

### Test 4: Learn Multiple Files
```
Use kahuna_learn to add these files to project [YOUR-PROJECT-ID]:

File 1 - auth.ts:
import jwt from 'jsonwebtoken';
export class AuthService {
  login() { /* ... */ }
}

File 2 - policy.md:
# Password Policy
- Minimum 8 characters
- Must contain uppercase
```

### Test 5: Prepare Context
```
Use kahuna_prepare_context for project [YOUR-PROJECT-ID] with task "implement authentication"
```

### Test 6: List Files
```
Use manage_context_files with action "list" for project [YOUR-PROJECT-ID]
```

---

## Expected Results

✅ **Health Check:** Server info + tool list
✅ **Create Project:** Project ID returned
✅ **Learn Single:** File categorized (technical-info)
✅ **Learn Multiple:** Both files categorized (code + business-info)
✅ **Prepare Context:** Relevant files selected with reasoning
✅ **List Files:** All uploaded files shown

---

## Data Storage

All context is stored in:
- **Database:** `/Users/nidhi/Aurite/kahuna/apps/api/dev.db` (SQLite)
- **Table:** `ContextFile`
- **Fields:** 
  - `content` - Full file content
  - `category` - AI categorization
  - `metadata` - Rich metadata (JSON)

View via MCP tools only - no database access needed!

---

## Tools Available

1. **`health_check`** - Verify server status
2. **`manage_projects`** - CRUD projects
3. **`kahuna_learn`** ⭐ - Intelligent file ingestion
4. **`kahuna_prepare_context`** ⭐ - Smart context retrieval
5. **`manage_context_files`** - Manual file operations

---

## Troubleshooting

**"Cannot reach API"**
→ Check API running: `curl http://localhost:3000/health`

**"AI categorization unavailable"**
→ Add `ANTHROPIC_API_KEY` to Claude config, restart

**"Project not found"**
→ List projects: `manage_projects` with action "list"

---

## Quick Verification (30 seconds)

1. ✅ Health check → ping
2. ✅ Create project
3. ✅ Learn 1 file
4. ✅ Prepare context
5. ✅ List files

**All pass? Tools working!** 🎉

---

For detailed testing, see: `apps/mcp/NEW-TOOLS.md`
