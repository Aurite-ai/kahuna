# Research: Frontend Routing, State & UI

**Date:** 2025-01-30
**Status:** Complete

## Summary

Research on React frontend architecture for Kahuna rebuild. All three areas converge on a clear, modern stack that pairs exceptionally well with tRPC.

---

## 1. Routing: TanStack Router vs React Router

### Options Considered

| Feature | TanStack Router | React Router |
|---------|----------------|--------------|
| **Type Safety** | Full, auto-generated | Manual/partial |
| **File-Based Routing** | Native, automatic | No |
| **Performance** | Auto code-splitting, structural sharing | Manual optimization needed |
| **Ecosystem** | Growing (TanStack-integrated) | Mature, established |
| **Bundle Size** | ~12 KB | Lightweight |

### Key Findings

- **TanStack Router** provides full TypeScript integration with auto-generated types for routes, parameters, search queries, and navigation
- Built-in loaders, caching, and type-safe data fetching align naturally with tRPC without external libraries
- File-based routing reduces boilerplate and generates route trees automatically
- React Router requires manual type definitions and manual coordination with data fetching

### Recommendation: **TanStack Router**

For a greenfield TypeScript project with tRPC, TanStack Router's type safety and native data loading integration make it the clear choice. The TanStack ecosystem (Router + Query) provides a cohesive developer experience.

---

## 2. State Management with tRPC

### Options Considered

| State Type | Solution | Use Case |
|------------|----------|----------|
| **Server State** | tRPC + TanStack Query | All data from API |
| **Client State** | Zustand/Jotai (if needed) | Local UI state only |

### Key Findings

- **tRPC + TanStack Query** fully handles server state: fetching, caching, mutations, invalidations, optimistic updates
- Additional state management (Zustand, Jotai) only needed for **pure client state**: UI toggles, form drafts, local preferences
- "State of React 2024" survey confirms TanStack Query + tRPC as industry standard for data fetching
- Rule of thumb: If data comes from server → tRPC handles it. If purely local → consider Zustand

### Recommendation: **tRPC + TanStack Query only (initially)**

Start without additional state management. Add Zustand only if complex local UI state emerges (modals, multi-step forms, local filtering). Most apps (95%+) don't need it.

---

## 3. UI Components & Styling

### Options Considered

| Library | Approach | Styling | Best For |
|---------|----------|---------|----------|
| **shadcn/ui** | Copy-paste ownership | Tailwind native | Tailwind projects, custom design |
| **MUI** | npm package | Emotion/JSS | Material Design enterprise apps |
| **Chakra UI** | npm package | Emotion | Rapid prototyping with theming |
| **Radix UI** | Unstyled primitives | BYO styling | Building custom component libraries |

### Key Findings

- **shadcn/ui** is #3 in JS Rising Stars 2025, 90K+ GitHub stars, explosive growth
- Copy-paste model provides full code ownership, no vendor lock-in, zero runtime overhead
- Built on Radix UI primitives (accessibility) + Tailwind CSS (styling)
- Ideal for Tailwind projects, MVPs, and custom design systems
- Ecosystem includes specialized kits: FormCN (forms), TanCN (tables), AI tools

### Tailwind CSS Best Practices

- Group utility classes logically: layout → spacing → typography → colors → states
- Extract reusable patterns into components, use `@apply` sparingly
- Configure content paths for production purging
- Use mobile-first breakpoints (`sm:`, `md:`, `lg:`)
- Leverage CSS variables for theming

### Recommendation: **shadcn/ui + Tailwind CSS**

Native Tailwind integration, full customization control, excellent accessibility via Radix primitives. The copy-paste model aligns with our principle of simplicity and ownership.

---

## Final Recommendation: The Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Routing** | TanStack Router | Type-safe, file-based, tRPC-native data loading |
| **Server State** | tRPC + TanStack Query | Built-in, type-safe, industry standard |
| **Client State** | None initially (Zustand if needed) | Keep simple, add complexity only when required |
| **UI Components** | shadcn/ui | Ownership model, Tailwind-native, accessible |
| **Styling** | Tailwind CSS | Industry standard, utility-first, excellent DX |

### Why This Stack Works Together

1. **TanStack ecosystem cohesion**: Router + Query share philosophy and patterns
2. **Type safety end-to-end**: tRPC → TanStack Query → TanStack Router
3. **Tailwind alignment**: shadcn/ui is built for Tailwind, zero friction
4. **Simplicity**: Minimal dependencies, maximum control
5. **Modern standard**: This exact stack is the 2024-2025 consensus for new React projects

---

## Sources

- [BetterStack: TanStack Router vs React Router](https://betterstack.com/community/guides/scaling-nodejs/tanstack-router-vs-react-router/)
- [tRPC: TanStack Query Integration](https://trpc.io/docs/client/tanstack-react-query/usage)
- [State of React 2024](https://2024.stateofreact.com/en-US/libraries/data-loading/)
- [JS Rising Stars 2025](https://risingstars.js.org/2025/en)
- [shadcn/ui Ecosystem Guide](https://www.devkit.best/blog/mdx/shadcn-ui-ecosystem-complete-guide-2025)
