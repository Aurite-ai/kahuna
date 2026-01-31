# Research: TypeScript & Code Quality Tooling

**Date:** 2025-01-30
**Status:** Complete

## Summary

Research into TypeScript configuration and code quality tooling for pnpm monorepos with Vite+React frontend and Node.js backend.

---

## 1. TypeScript Configuration in Monorepos

### Findings

**Simple extends pattern is preferred over project references** for modern tooling (Vite, Next.js):

- Project references create build dependencies and cause issues with HMR/hot reloading
- Extends pattern with workspace references provides "live" types without rebuilds
- Simpler mental model and fewer integration issues

### Recommended Approach

```
├── tsconfig.base.json          # Shared compiler options
├── apps/
│   ├── frontend/tsconfig.json  # Extends base, Vite-specific settings
│   └── backend/tsconfig.json   # Extends base, Node-specific settings
└── packages/
    └── */tsconfig.json         # Each extends base
```

**Base config strictness settings:**
- `strict: true` (enables strictNullChecks, noImplicitAny, etc.)
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `noUncheckedIndexedAccess: true` (optional, stricter)
- `esModuleInterop: true`

**Frontend-specific:**
- `moduleResolution: "bundler"` (for Vite)

**Backend-specific:**
- `module: "NodeNext"` or `"ESNext"`
- `moduleResolution: "NodeNext"`

---

## 2. ESLint vs Biome

### Options Considered

| Aspect | ESLint + Prettier | Biome |
|--------|-------------------|-------|
| **Speed** | Slow (30s+ on medium projects) | 10-20x faster (Rust-based) |
| **Setup** | 50+ dependencies, 3+ config files | 1 package, 1 config file |
| **TS/React** | Full via plugins | ~85% type-aware coverage |
| **Ecosystem** | Mature, thousands of plugins | Growing, covers essentials |
| **Stability** | Battle-tested | Production-ready since 1.x |

### Biome Status (2024-2025)

- **Production-ready** for TypeScript + React projects
- 427 built-in rules covering ESLint/TypeScript-ESLint essentials
- Native JSX/hooks support
- Biome 2.0 added type inference (~85% coverage)
- Used in production by many teams

### Trade-offs

**Choose Biome when:**
- Starting fresh (no legacy ESLint configs)
- Speed matters (monorepos, large codebases)
- Simplicity is valued (fewer deps, one config)

**Stick with ESLint when:**
- Need specific plugins (jsx-a11y, security, custom rules)
- Migrating large existing ESLint setup
- Require maximum rule customization

---

## 3. Formatting: Prettier vs Biome

### Findings

- Biome formatter achieves **96%+ compatibility** with Prettier
- 8-25x faster formatting
- Built-in import sorting
- Single config file (combined with linting)

Biome is effectively a drop-in replacement for most projects. Minor formatting differences exist but are negligible.

---

## Recommendation

### TypeScript Configuration

**Use simple extends pattern** with shared `tsconfig.base.json`:

1. Root `tsconfig.base.json` with strict settings
2. Each app/package extends base with environment-specific overrides
3. No project references (avoid complexity, better Vite compatibility)

### Code Quality Tooling

**Use Biome** for linting and formatting:

**Rationale:**
- Simpler setup aligns with "simple, standard choices" principle
- Single dependency, single config file
- Dramatically faster (important for pre-commit hooks, CI)
- Production-ready for TS + React
- New project = no migration burden

**Configuration approach:**
- Root `biome.json` with shared rules
- Sensible defaults, minimal customization
- VS Code extension for format-on-save

### Alternative Considered

ESLint + Prettier remains a valid choice if:
- Team has strong ESLint familiarity
- Specific plugin requirements emerge later

However, for a new project prioritizing simplicity, Biome is the better fit.

---

## Implementation Notes

### Biome Setup (Minimal)

```bash
pnpm add -D -w @biomejs/biome
pnpm biome init
```

### Key biome.json Settings

```json
{
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "organizeImports": {
    "enabled": true
  }
}
```

### Scripts

```json
{
  "scripts": {
    "lint": "biome check .",
    "lint:fix": "biome check --apply .",
    "format": "biome format --write ."
  }
}
```

---

## References

- [Biome Documentation](https://biomejs.dev)
- [TypeScript Monorepo Tips (Speakeasy)](https://www.speakeasy.com/docs/sdks/guides/typescript-monorepo-tips)
- [Live Types in TypeScript Monorepos](https://colinhacks.com/essays/live-types-typescript-monorepo)
- [Biome vs ESLint Comparison](https://betterstack.com/community/guides/scaling-nodejs/biome-eslint/)
