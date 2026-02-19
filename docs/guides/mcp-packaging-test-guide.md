# MCP Packaging & Distribution - Test Guide

This guide helps reviewers verify the MCP server packaging changes before merging.

## Quick Summary

This PR sets up the MCP server (`apps/mcp`) for distribution as:
1. **npm package** - Self-contained bundle with templates
2. **Docker container** - Alpine-based image

Templates were changed from embedded strings to file-based for easier maintenance.

---

## Prerequisites

```bash
# Ensure dependencies are installed
pnpm install
```

---

## Test 1: Run Unit Tests

All existing tests should pass:

```bash
pnpm --filter @kahuna/mcp test
```

Expected: **159 tests passing**

---

## Test 2: Build the Bundle

```bash
pnpm --filter @kahuna/mcp bundle
```

Expected output:
- `dist/kahuna-mcp.cjs` (~1.1 MB)
- `dist/kahuna-mcp.cjs.map` (~3.6 MB)
- `dist/templates/` directory with copilot configs, frameworks, knowledge-base

Verify templates were copied:
```bash
ls -la apps/mcp/dist/templates/
```

---

## Test 3: Test the Bundled Server

Start the bundled server and call `kahuna_initialize`:

```bash
# Create a test directory
mkdir -p /tmp/kahuna-test

# Call the initialize tool via JSON-RPC
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"kahuna_initialize","arguments":{"targetPath":"/tmp/kahuna-test"}},"id":1}' | node apps/mcp/dist/kahuna-mcp.cjs
```

Expected: JSON response showing files copied to `/tmp/kahuna-test/.claude/`

Verify files exist:
```bash
ls -la /tmp/kahuna-test/.claude/
# Should show: CLAUDE.md, settings.json, agents/, skills/, context/, plans/

cat /tmp/kahuna-test/.claude/CLAUDE.md | head -10
# Should show the Agent Orchestrator content
```

---

## Test 4: Test health_check Tool

```bash
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"health_check","arguments":{}},"id":1}' | node apps/mcp/dist/kahuna-mcp.cjs 2>/dev/null
```

Expected: JSON response with health check results

---

## Test 5: Build Docker Image (Optional)

If Docker is available:

```bash
cd apps/mcp
docker build -t kahuna/mcp-test .
```

Expected: Image builds successfully (~195 MB)

Test the Docker image:
```bash
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"health_check","arguments":{}},"id":1}' | docker run -i kahuna/mcp-test
```

---

## Test 6: Verify Package.json Changes

Check the package.json is configured correctly:

```bash
cat apps/mcp/package.json | grep -A 10 '"files"'
```

Expected:
```json
"files": [
  "dist/kahuna-mcp.cjs",
  "dist/kahuna-mcp.cjs.map",
  "dist/templates",
  "README.md"
],
```

Verify `@kahuna/vck-templates` dependency is removed:
```bash
cat apps/mcp/package.json | grep vck-templates
# Should return nothing
```

---

## Key Files Changed

| File | Change |
|------|--------|
| `apps/mcp/src/templates/index.ts` | **NEW** - File-based template access |
| `apps/mcp/templates/` | **NEW** - Copied from `packages/vck-templates/templates/` |
| `apps/mcp/scripts/bundle.ts` | Added template copying |
| `apps/mcp/package.json` | Removed vck-templates dep, added npm config |
| `apps/mcp/Dockerfile` | Simplified, uses local templates |
| `apps/mcp/src/tools/initialize.ts` | Uses local templates module |
| `apps/mcp/src/knowledge/surfacing/framework-copier.ts` | Uses local templates module |

---

## Potential Issues to Watch For

1. **Template path resolution** - The templates module uses `process.argv[1]` in bundled CJS mode. If templates aren't found, check the `KAHUNA_TEMPLATES_DIR` env var fallback.

2. **ESbuild warning** - You'll see a warning about `import.meta` not being available in CJS format. This is expected and handled by the code.

3. **Async template functions** - The template getters are now async. Any code that consumes them must use `await`.

---

## Cleanup

```bash
rm -rf /tmp/kahuna-test
docker rmi kahuna/mcp-test  # if Docker test was run
```

---

## Publishing to npm

### Prerequisites

1. **npm account** with access to the `@kahuna` organization
2. **Login to npm**:
   ```bash
   npm login
   ```

### Publish Steps

1. **Ensure you're on the correct branch** (typically `main` after PR merge)

2. **Build the bundle** (this is also run by `prepublishOnly`):
   ```bash
   cd apps/mcp
   pnpm build && pnpm bundle
   ```

3. **Verify the package contents**:
   ```bash
   npm pack --dry-run
   ```
   This shows what files will be included. Should list:
   - `dist/kahuna-mcp.cjs`
   - `dist/kahuna-mcp.cjs.map`
   - `dist/templates/` (and contents)
   - `README.md`
   - `package.json`

4. **Publish to npm**:
   ```bash
   npm publish --access public
   ```

   For scoped packages (`@kahuna/mcp`), `--access public` makes it publicly accessible.
   Omit this flag if you want a private package (requires npm paid org).

### Version Bumping

Before publishing a new version:

```bash
# Patch version (0.1.0 -> 0.1.1)
npm version patch

# Minor version (0.1.0 -> 0.2.0)
npm version minor

# Major version (0.1.0 -> 1.0.0)
npm version major
```

This updates `package.json` and creates a git tag.

### Verify Publication

After publishing:

```bash
# Check the package exists
npm view @kahuna/mcp

# Test installation
npx @kahuna/mcp --help
# Or
npm install -g @kahuna/mcp && kahuna-mcp --help
```

### Publishing to Docker Hub (Optional)

```bash
cd apps/mcp

# Build with proper tag
docker build -t kahuna/mcp:0.1.0 -t kahuna/mcp:latest .

# Login to Docker Hub
docker login

# Push
docker push kahuna/mcp:0.1.0
docker push kahuna/mcp:latest
```
