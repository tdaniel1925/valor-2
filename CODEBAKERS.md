# CODEBAKERS.md — Pattern Reference Library
# Claude Code: Read this during PPBV Stage 3. Pull ONLY the sections relevant to your current build into BUILD-PROMPT.md.

---

## [ONBOARDING] New Machine Setup

**Every project using this workflow must have `_BUILD/STARTUP.md` generated in Stage 2.**

Detection: Claude auto-detects the stack by scanning the project root for dependency manifests (`package.json`, `requirements.txt`, `pyproject.toml`, `Gemfile`, `go.mod`, `Cargo.toml`, `composer.json`). Based on what it finds, it checks for installed dependencies and environment files.

Fresh clone indicators (any of these missing = fresh clone):
- `package.json` exists but `node_modules/` does not
- `requirements.txt` / `pyproject.toml` exists but no `venv/` or `.venv/`
- `Gemfile` exists but no `vendor/bundle/`
- `go.mod` exists but dependencies not downloaded
- `Cargo.toml` exists but no `target/`
- `composer.json` exists but no `vendor/`
- `.env.example` exists but no `.env`, `.env.local`, or `.dev.vars`

Rules:
- Secrets are NEVER committed to git. They live in `.env.local` / `.dev.vars` / `.env` which must be recreated manually from `.env.example` on every fresh clone.
- `_BUILD/STARTUP.md` is auto-generated with stack-specific instructions. It detects the package manager, runtime versions, database tools, and dev server commands from the project files.
- The trigger phrase to resume after setup is **"setup done"**.
- Claude re-verifies the environment after "setup done" before proceeding.

---

## [COMPONENT] React/Next.js Components

**Structure:** One component per file. Default export. Props interface above component.
```tsx
interface FeatureCardProps {
  title: string;
  description: string;
  onClick: () => void;
  isLoading?: boolean;
}

export default function FeatureCard({ title, description, onClick, isLoading = false }: FeatureCardProps) {
  // component body
}
```

**State management:** Use `useState` for local UI state. Use server state tools (React Query / SWR) for API data. Never store API data in `useState`.

**Loading/Error pattern:** Every component that fetches data must handle three states:
```tsx
if (isLoading) return <Skeleton />;
if (error) return <ErrorState message={error.message} onRetry={refetch} />;
if (!data || data.length === 0) return <EmptyState />;
return <ActualContent data={data} />;
```

**Event handlers:** Prefix with `handle`. `handleSubmit`, `handleDelete`, `handleToggle`. Never inline complex logic in JSX.

**Conditional rendering:** Extract to variables above the return. No nested ternaries in JSX.
```tsx
// YES
const statusBadge = isActive ? <ActiveBadge /> : <InactiveBadge />;
return <div>{statusBadge}</div>;

// NO
return <div>{isActive ? <ActiveBadge /> : isExpired ? <ExpiredBadge /> : <InactiveBadge />}</div>;
```

---

## [API] API Routes (Next.js App Router)

**Structure:** Every route follows this exact order:
```ts
export async function POST(req: Request) {
  // 1. Parse and validate input
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  // 2. Auth check
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // 3. Business logic (wrapped in try/catch)
  try {
    const result = await doTheThing(parsed.data);
    return Response.json(result);
  } catch (err) {
    console.error('[POST /api/route]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Validation:** Use Zod for all input validation. Define schemas next to the route.
```ts
const CreateItemSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['a', 'b', 'c']),
  metadata: z.record(z.string()).optional(),
});
```

**Error responses:** Always return `{ error: string }` for errors. Always include status code. Never expose internal error details to client.

**Naming:** File path IS the route. Keep it RESTful: `app/api/items/route.ts` for collection, `app/api/items/[id]/route.ts` for single.

---

## [DB] Database (Supabase)

**Queries:** Use the Supabase client, not raw SQL. Type everything with generated types.
```ts
const { data, error } = await supabase
  .from('items')
  .select('id, name, status, created_at')
  .eq('org_id', orgId)
  .order('created_at', { ascending: false });

if (error) throw new Error(`Failed to fetch items: ${error.message}`);
```

**Row Level Security:** Every table gets RLS enabled. No exceptions. Write policies before writing queries.

**Migrations:** One migration per feature. Name format: `YYYYMMDD_HHMMSS_feature_name.sql`. Always include rollback comment.
```sql
-- Migration: Add status column to items
ALTER TABLE items ADD COLUMN status text NOT NULL DEFAULT 'active';

-- Rollback: ALTER TABLE items DROP COLUMN status;
```

**Realtime:** Use Supabase channels for live updates. Always unsubscribe on component unmount.
```ts
useEffect(() => {
  const channel = supabase.channel('items').on('postgres_changes',
    { event: '*', schema: 'public', table: 'items' },
    (payload) => handleChange(payload)
  ).subscribe();
  return () => { supabase.removeChannel(channel); };
}, []);
```

---

## [AUTH] Authentication

**Session check:** Server components use `getSession()`. Client components use `useSession()` hook. Never check auth on the client for protected actions — always verify server-side.

**Protected routes:** Use middleware for page-level auth. Use per-route checks for API-level auth.
```ts
// middleware.ts
const publicPaths = ['/login', '/signup', '/forgot-password'];
if (!session && !publicPaths.includes(pathname)) {
  return NextResponse.redirect(new URL('/login', req.url));
}
```

**Role-based access:** Check roles server-side. Never rely on hiding UI to enforce permissions.
```ts
if (session.user.role !== 'admin') {
  return Response.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## [FORM] Forms and Validation

**Pattern:** Controlled inputs with Zod validation on submit.
```tsx
const [form, setForm] = useState({ name: '', email: '' });
const [errors, setErrors] = useState<Record<string, string>>({});

const handleSubmit = () => {
  const result = FormSchema.safeParse(form);
  if (!result.success) {
    setErrors(result.error.flatten().fieldErrors);
    return;
  }
  setErrors({});
  mutation.mutate(result.data);
};
```

**Error display:** Show errors inline below each field. Red text, aria-describedby for accessibility.

**Submit button states:** Disabled while submitting. Show spinner. Prevent double-submit.
```tsx
<button disabled={isPending} onClick={handleSubmit}>
  {isPending ? <Spinner /> : 'Save'}
</button>
```

**Optimistic updates:** For non-critical actions (toggles, likes), update UI immediately and rollback on error.

---

## [ERROR] Error Handling

**Global error boundary:** Wrap app in error boundary that catches render errors.

**API errors → Toast:** Failed API calls show toast notification with retry option. Never silent failures.
```ts
const { mutate } = useMutation({
  mutationFn: createItem,
  onError: (err) => toast.error(`Failed to create: ${err.message}`, { action: { label: 'Retry', onClick: () => mutate(data) } }),
  onSuccess: () => toast.success('Created successfully'),
});
```

**Try/catch scope:** Wrap the smallest possible block. Never wrap an entire function body.

**User-facing messages:** Never show raw error messages, stack traces, or error codes to users. Map to friendly messages.

---

## [STYLE] UI/Styling

**Framework:** Tailwind CSS only. No custom CSS files unless absolutely necessary.

**Spacing:** 8px rhythm. Use `p-2`, `p-4`, `p-6`, `p-8`. Avoid odd values.

**Cards:** `rounded-xl shadow-sm border p-6 hover:shadow-md transition`

**Accents:** Coral `#FF7F50` for primary actions and highlights. Use sparingly.

**Gradients:** Mesh gradient backgrounds for hero/landing sections only. Not on cards or forms.

**Responsive breakpoints:** Build mobile layout first. Add `md:` and `lg:` for larger screens. Test at 375px, 768px, 1280px.

**Dark mode:** Support if the project uses it. Use `dark:` variants. Never hardcode white backgrounds — use `bg-white dark:bg-gray-900`.

**Animations:** Subtle only. `transition-all duration-200` for hover states. No bouncing, no sliding unless it's a meaningful state change.

---

## [TEST] Testing

**What to test:** Business logic, API routes, complex state transitions. NOT styling, NOT simple renders.

**API route tests:** Test happy path, validation failure, auth failure, and business logic error.
```ts
describe('POST /api/items', () => {
  it('creates item with valid data', async () => { /* ... */ });
  it('returns 400 for invalid input', async () => { /* ... */ });
  it('returns 401 without session', async () => { /* ... */ });
  it('returns 500 on db failure', async () => { /* ... */ });
});
```

**Naming:** Describe what it does, not how. `"creates item with valid data"` not `"should call supabase insert"`.

---

## [PERF] Performance

**Images:** Use `next/image`. Always set width/height. Use WebP format.

**Imports:** Dynamic import for heavy components not needed at initial load.
```ts
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), { loading: () => <Skeleton /> });
```

**Data fetching:** Fetch on the server when possible (Server Components). Use `Suspense` for streaming.

**Lists:** Virtualize lists over 50 items. Use `react-window` or similar.

**Bundle:** No dependencies over 50kb without explicit justification.

---

## [SEC] Security

**Env vars:** All secrets in `.env.local`. Never commit to git. Add to `.env.example` with placeholder values.

**SQL injection:** Supabase client handles parameterization. If writing raw SQL, ALWAYS use parameterized queries. Never interpolate user input into SQL strings.

**XSS:** React handles escaping by default. Never use `dangerouslySetInnerHTML` unless sanitized with DOMPurify.

**CORS:** Only allow specific origins in production. Never `*`.

**Rate limiting:** Add to all public-facing API routes. Use upstash ratelimit or similar.

**File uploads:** Validate file type AND content (not just extension). Set size limits. Scan if possible.
