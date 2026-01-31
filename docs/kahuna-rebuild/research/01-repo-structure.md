# Research: Repository Structure & Package Manager

**Date:** 2025-01-30
**Status:** Complete

## Summary

For Kahuna's small TypeScript full-stack project (one React frontend, one Node.js backend, shared code), the research supports:

- **Monorepo** over polyrepo
- **pnpm workspaces** (no additional tooling needed initially)
- **pnpm** as the package manager

---

## 1. Monorepo vs Polyrepo

### Finding

**Monorepo is the community consensus** for small full-stack TypeScript projects with shared code.

### Why Monorepo

- **Easy shared code**: Place shared TypeScript types, configs, or utilities in `packages/` - accessible to both apps without separate NPM packages
- **Unified tooling**: Single dependency management, versioning, and CI/CD pipeline
- **Faster development**: Atomic changes across frontend/backend in one PR; simpler local setup

### When Polyrepo Makes Sense (Not Kahuna)

- Separate teams needing independent releases/access controls
- Microservices with different release cycles
- Very large scale without proper tooling

**Verdict:** Monorepo fits Kahuna's small team and shared-code needs.

---

## 2. Monorepo Tooling

### Options Considered

| Tool | Setup Complexity | Best For |
|------|------------------|----------|
| **pnpm workspaces alone** | Minimal (built-in) | Small monorepos (2-5 packages) |
| **Turborepo** | Low (~15 min, ~20 lines config) | Speed-focused small-to-medium projects |
| **Nx** | High (hours, 200+ lines config) | Large/enterprise with distributed builds |

### Finding

**pnpm workspaces alone is sufficient** for Kahuna's scale. It provides:
- Workspace dependency linking via symlinks
- Selective script execution (`pnpm --filter`)
- Zero additional dependencies or configuration

**Turborepo** adds value (build caching, 3x faster builds) but is optional complexity we don't need yet. Easy to add later if builds become slow.

**Nx** is overkill for small projects.

### Minimum Viable Setup

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

That's it. pnpm handles the rest.

**Verdict:** Start with pnpm workspaces only. Add Turborepo later if needed.

---

## 3. Package Manager

### Options Considered

| Manager | Market Share | Install Speed | Disk Usage | Monorepo Support |
|---------|--------------|---------------|------------|------------------|
| **npm** | 56.6% | Moderate | Full copies | Basic |
| **Yarn Classic** | 21.5% | Parallel | Efficient | Good |
| **Yarn Berry** | Low | Fastest (PnP) | Good | Excellent |
| **pnpm** | 19.9% (growing) | Blazing fast | Best (70-80% savings) | Top tier |

### Finding

**pnpm is the consensus top pick** for monorepos:
- **Disk efficiency**: Content-addressable storage, hard links save 70-80% disk space
- **Speed**: Fastest installs, especially with cache (~0.73s)
- **Monorepo features**: Powerful filtering, catalogs, `pnpm why -r`
- **Strict dependencies**: Avoids phantom dependencies that cause production bugs
- **Industry trend**: Growing from ~20% to ~30% market share, especially in monorepo projects

**npm** remains simplest for tiny projects but lacks pnpm's monorepo features.

**Yarn Berry** has advanced features (PnP, zero-installs) but ecosystem compatibility issues make it impractical.

**Verdict:** Use pnpm.

---

## Recommendation

### Final Choice

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Structure** | Monorepo | Small team, shared code, unified tooling |
| **Tooling** | pnpm workspaces only | Simplest setup that works; add Turborepo later if needed |
| **Package Manager** | pnpm | Best performance, disk efficiency, and monorepo support |

### Proposed Structure

```
kahuna/
├── pnpm-workspace.yaml
├── package.json           # Root scripts, shared devDependencies
├── apps/
│   ├── frontend/         # Vite + React + TypeScript
│   └── server/           # Node.js + TypeScript + Prisma
└── packages/
    └── shared/           # Shared types, utilities (as needed)
```

### Migration Path

If builds become slow:
1. Add Turborepo: `pnpm add -D turbo`
2. Create `turbo.json` with build pipeline
3. Use `turbo run build` instead of `pnpm run build`

This is a 15-minute change when needed.

---

## Sources

- Community articles from dev.to, ekino.fr (2024-2025)
- pnpm official benchmarks
- Comparisons: Turborepo vs Nx vs pnpm workspaces
- Package manager market share data (2024)
