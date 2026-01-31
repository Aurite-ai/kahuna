# Frontend Architecture Patterns

**Date:** 2026-01-30
**Source:** `apps/frontend/` analysis with Agent Library page as reference

---

## 1. Routing Structure

### TanStack Router (File-Based)

- **Plugin:** `@tanstack/router-vite-plugin` auto-generates route tree
- **Config:** [`apps/frontend/vite.config.ts`](../../../apps/frontend/vite.config.ts) - routes in `./src/routes/`, generates `routeTree.gen.ts`
- **Code splitting:** Automatic via `autoCodeSplitting: true`

### Route Definition Pattern

```typescript
// File: apps/frontend/src/routes/agent-lib/index.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/agent-lib/")({
  component: AgentLibraryPage,
});
```

### Layout Structure

- **Root route:** [`apps/frontend/src/routes/__root.tsx`](../../../apps/frontend/src/routes/__root.tsx)
- **Auth check:** Uses Clerk's `useAuth()` to conditionally render
- **Layout logic:**
  - Public pages (`/welcome`, `/sign-in`, `/sign-up`) → No layout
  - Onboarding pages → No sidebar, but authenticated
  - All other pages → `DashboardLayout` wrapper with `<Outlet />`

### Navigation

```typescript
import { useNavigate } from "@tanstack/react-router";
const navigate = useNavigate();
navigate({ to: "/agent-runtime" });
```

---

## 2. Data Fetching

### tRPC Client Configuration

- **Client file:** [`apps/frontend/src/utils/trpc.ts`](../../../apps/frontend/src/utils/trpc.ts) - 4 lines, creates typed React Query hooks
- **Type import:** `AppRouter` from `@repo/server/trpc` (workspace reference)

```typescript
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@repo/server/trpc";
export const trpc = createTRPCReact<AppRouter>();
```

### Provider Setup ([`main.tsx`](../../../apps/frontend/src/main.tsx))

- **TRPCProvider** wraps app with:
  - `trpc.Provider` + `QueryClientProvider`
  - `httpBatchLink` with Clerk auth token injection
  - URL from `VITE_TRPC_URL` env var

### Query Hook Patterns

```typescript
// Queries - automatic caching via React Query
const { data, isLoading } = trpc.agentWorkflows.listTemplates.useQuery();
const { data: userCredentials = [] } = trpc.n8nCredentials.getCredentialTypes.useQuery();

// Mutations with callbacks
const createAgent = trpc.agentWorkflows.createWorkflow.useMutation({
  onSuccess: () => { /* handle success */ },
  onError: (error) => { /* handle error */ },
});

// Invoke mutation
await createAgent.mutateAsync({ projectId, templateId, name, config });
```

### Loading/Error States

- **Loading:** Skeleton placeholders with `animate-pulse`
- **Empty states:** Conditional rendering with friendly messages
- **Error handling:** Toast notifications via `sonner`

---

## 3. Component Patterns

### Page Component Structure

```typescript
function AgentLibraryPage() {
  // 1. Data fetching hooks at top
  const { data, isLoading } = trpc.xxx.useQuery();

  // 2. Local state
  const [searchQuery, setSearchQuery] = useState("");

  // 3. Derived/computed values with useMemo
  const filteredAgents = useMemo(() => { ... }, [deps]);

  // 4. Loading state early return
  if (isLoading) return <LoadingSkeleton />;

  // 5. Main JSX render
  return ( ... );
}
```

### UI Component Library (shadcn/ui)

**40+ components in** `apps/frontend/src/components/ui/`:

| Category | Components |
|----------|------------|
| **Layout** | Card, Dialog, Sheet, Drawer, Tabs, Accordion, Collapsible |
| **Forms** | Input, Textarea, Label, Checkbox, Radio, Select, Switch, Slider |
| **Feedback** | Alert, Badge, Progress, Skeleton, Tooltip |
| **Navigation** | Button, Breadcrumb, Dropdown, Sidebar, Command |
| **Data** | Table, Data-Table, Scroll-Area |
| **Custom** | Confirmation-Dialog, Form-Dialog, Info-Dialog, Loading-Dialog |

### Import Pattern

```typescript
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
```

### Form Handling (react-hook-form)

```typescript
import { useForm } from "react-hook-form";

const form = useForm<FormData>({
  defaultValues: { name: "", description: "" },
});

const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = form;

// In JSX
<Input {...register("name", { required: "Name is required" })} />
{errors.name && <p className="text-red-500">{errors.name.message}</p>}
```

---

## 4. State Management

### Local State (`useState`)

- UI state: modals, tabs, search queries, filters
- Form submission state: `isSubmitting`, `errorMessage`

### Server State (tRPC/React Query)

- All data fetching via tRPC hooks
- Automatic caching, refetching, and optimistic updates available
- No separate state management library (Redux, Zustand)

### Context Usage

- **Clerk:** Auth context via `useAuth()`
- **Custom hooks:** `useCurrentProject()` for project context
- **No global state store** - relies on React Query cache

### Derived State (`useMemo`)

```typescript
const categories = useMemo(() => {
  const cats = new Set(visibleAgents.map(a => a.category));
  return ['All', ...Array.from(cats)];
}, [visibleAgents]);
```

---

## 5. Styling Approach

### Tailwind CSS

- **Plugin:** `@tailwindcss/vite` in Vite config
- **Import:** `./index.css` in main.tsx
- **Path alias:** `@/` → `./src/`

### Patterns Observed

```typescript
// Container/spacing
<div className="container mx-auto p-6 space-y-6">

// Grid layouts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Flexbox
<div className="flex items-center gap-4 flex-wrap">

// Conditional classes
className={selectedCategory === category
  ? "bg-blue-500 text-white"
  : "bg-white text-gray-700"}

// Animations
<div className="animate-pulse">
<div className="animate-spin">

// Transitions
className="transition-all duration-200 hover:shadow-md"
```

### Color Conventions

- Primary: `blue-500/600`
- Muted text: `text-muted-foreground`, `text-gray-500`
- Borders: `border-gray-200`
- Status: `green-500` (success), `orange-50/700` (warning), `red-500` (error)

---

## 6. Additional Patterns

### Icon Library

```typescript
import { CheckCircle2, Lock, ChevronRight, Loader2 } from "lucide-react";
```

### Toast Notifications

```typescript
import { toast } from "sonner";

toast.success("Agent created!", { description: "..." });
toast.error("Failed", { description: error.message });
const loadingToast = toast.loading("Creating...");
toast.dismiss(loadingToast);
```

### Error Boundaries

```typescript
import { ErrorBoundary } from "@/components/common/error-boundary";
<ErrorBoundary>
  <DialogContent>...</DialogContent>
</ErrorBoundary>
```

### Effects with Cleanup

```typescript
useEffect(() => {
  if (!open) return;
  // Setup logic
  reset(defaultValues);
}, [open, agent?.id]); // Intentionally limited deps
```

---

## 7. Observations

### What Works Well

- **Type safety end-to-end:** tRPC types flow from backend to frontend
- **Simple tRPC setup:** Only 4 lines to create typed client
- **Consistent UI:** shadcn/ui provides cohesive component library
- **Colocation:** Form logic stays in page components (no Redux boilerplate)
- **Loading states:** Skeleton patterns provide good UX

### Areas for Improvement

- **Large page files:** 649 lines in one file - could extract modal components
- **`any` types:** Some prop types are `any` instead of proper interfaces
- **Form complexity:** Multi-step modal with manual tab/state management
- **Defensive coding:** Lots of `try/catch` and null checks suggest fragile data
- **Mixed patterns:** Some inline styles, some Tailwind utilities inconsistently applied
- **No data prefetching:** Routes don't use TanStack Router's loader pattern

### Migration Considerations

- tRPC integration is clean and portable
- shadcn/ui components are copy-paste friendly
- React Hook Form patterns are framework-agnostic
- Auth tied to Clerk - needs abstraction if changing providers
- No complex state management to migrate
