# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Aurentia AI Command Center** is an AI-powered ESN (Engineering Services) management platform built with Next.js 16 App Router, React 19, TypeScript, and Supabase. The application manages consultants, projects, tasks, resources, risk prediction, and financial tracking with multi-tenancy support via organizations.

**Key Architecture Reference**: See `ARCHITECTURE.md` for comprehensive technical architecture, database schema, security patterns, and development best practices.

## Essential Commands

### Development

```bash
# Start development server (default port: 3000)
npm run dev

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Database seeding
npm run seed
```

### Build & Production

```bash
# Production build
npm run build

# Start production server
npm start
```

### Database Operations (Supabase)

```bash
# Apply SQL migrations directly (for this project, use the scripts or Supabase dashboard)
# Note: No formal migration system is configured yet

# Seed database with mock data
npm run seed

# Generate TypeScript types from Supabase schema
npx supabase gen types typescript --project-id=<project-id> > lib/supabase/types.ts
```

## Project-Specific Patterns

### 1. Server vs Client Components Philosophy

**Default to Server Components**. Only use `'use client'` when:
- Using React hooks (useState, useEffect, etc.)
- Handling browser events (onClick, onChange, etc.)
- Accessing browser APIs (window, localStorage, etc.)
- Using third-party libraries that require client-side execution

**Pattern**: Fetch data in Server Components, pass to Client Components:

```typescript
// app/some-page/page.tsx (Server Component)
import { createClient } from '@/lib/supabase/server'
import { ClientComponent } from './client-component'

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.from('table').select('*')
  return <ClientComponent data={data} />
}

// app/some-page/client-component.tsx (Client Component)
'use client'
import { useState } from 'react'

export function ClientComponent({ data }) {
  const [state, setState] = useState(data)
  // interactive logic here
}
```

### 2. Supabase Client Usage

**Critical**: Use the correct Supabase client for your context:

- **Server Components/Server Actions**: `import { createClient } from '@/lib/supabase/server'`
  - Handles server-side cookies
  - Must be called with `await createClient()`

- **Client Components**: `import { createClient } from '@/lib/supabase/client'`
  - Browser-based authentication
  - No await needed: `const supabase = createClient()`

**Never** use the client version in Server Components or vice versa.

### 3. Authentication & Authorization Pattern

All authentication uses Server Actions in `app/(auth)/actions.ts`:
- `signUp(data)` - User registration with Zod validation
- `signIn(data)` - Email/password login
- `signOut()` - Session termination

**Row Level Security (RLS)** is enabled on all tables. Queries automatically filter by user's organization via RLS policies.

Session management is handled by middleware (`middleware.ts`) which refreshes sessions on every request.

### 4. API Routes Pattern

API routes follow a specific structure in `app/api/`:

```typescript
// Use helper functions from lib/api-helpers.ts
import { authenticateUser, successResponse, errorResponse } from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { user, error } = await authenticateUser(supabase)

  if (error) return unauthorizedResponse()

  // Business logic...
  return successResponse(data)
}
```

**Rate limiting** is implemented using `withUserRateLimit` wrapper (see `app/api/organizations/[organizationId]/members/route.ts` for examples).

### 5. Validation Strategy

All user input **must** be validated using Zod schemas:

1. Define schemas in `lib/validations/`
2. Use in both client (form validation) and server (security)
3. Use `safeParse()` for graceful error handling

Example from `app/(auth)/actions.ts`:
```typescript
const validation = signUpSchema.safeParse(data)
if (!validation.success) {
  const errors = validation.error.flatten().fieldErrors
  return { error: Object.values(errors)[0]?.[0] }
}
const validatedData = validation.data
```

### 6. Multi-Tenancy via Organizations

All data is scoped to organizations:
- Users belong to organizations via `user_organizations` junction table
- Projects, tasks, consultants are all linked to `organization_id`
- RLS policies enforce organization-level data isolation
- Current organization context is typically retrieved from user session

### 7. Component Organization

```
components/
├── ui/           # shadcn/ui components (DO NOT manually edit)
├── auth/         # Authentication-specific components
├── projects/     # Project management components
├── milestones/   # Milestone tracking components
├── settings/     # Settings and configuration components
├── sidebar/      # Navigation sidebar components
├── navbar/       # Top navigation components
└── messenger/    # Messaging/communication components
```

**shadcn/ui components**: Regenerate using `npx shadcn@latest add <component>` instead of manual edits.

### 8. Type Safety Practices

- All database operations use generated types from `lib/supabase/types.ts`
- Use `z.infer<typeof schema>` for form types
- Avoid `any` types - use `unknown` and type guards instead
- Export types from validation schemas for reuse

### 9. Error Handling

**Current State**:
- Client: React Error Boundary in `components/error-boundary.tsx`
- Server Actions: Return `{ error: string }` objects
- API Routes: Use helpers from `lib/api-helpers.ts`

**⚠️ Known Issue**: `console.error` is used throughout (exposes PII). These should be replaced with proper server-side logging.

### 10. Activity Logging

Use `logActivity()` helper from `lib/api-helpers.ts` to track user actions:

```typescript
await logActivity(supabase, 'MEMBER_ADDED', 'Added user@example.com', {
  organizationId: org.id,
  resourceType: 'user',
  resourceId: userId,
  metadata: { role: 'MEMBER' }
})
```

## Database Schema Essentials

### Key Tables

- `profiles` - User profiles (linked to auth.users)
- `organizations` - Multi-tenant organizations
- `user_organizations` - User-org membership with roles
- `projet` - Projects
- `consultant` - Consultant records
- `tache` - Tasks
- `milestone` - Project milestones
- `activity_logs` - Audit trail

### User Roles

Enum: `ADMIN | MANAGER | CONSULTANT | CLIENT`

Roles are stored in both:
- `profiles.role` - Default user role
- `user_organizations.role` - Organization-specific role (takes precedence)

## Important Files & Their Purpose

| File | Purpose |
|------|---------|
| `middleware.ts` | Session refresh on every request |
| `lib/supabase/middleware.ts` | Core session management logic |
| `app/(auth)/actions.ts` | Authentication server actions |
| `lib/validations/auth.ts` | Zod schemas for auth forms |
| `lib/api-helpers.ts` | Reusable API route utilities |
| `components/error-boundary.tsx` | Global error handling |
| `lib/utils.ts` | `cn()` utility for className merging |

## Working with This Codebase

### Adding New Features

1. **Database changes**: Add columns/tables via Supabase dashboard, then regenerate types
2. **Validation**: Create Zod schema in `lib/validations/`
3. **API**: Create route in `app/api/` using helpers from `lib/api-helpers.ts`
4. **Server Actions**: Add to appropriate `actions.ts` file with validation
5. **Components**: Create in appropriate subdirectory under `components/`
6. **Types**: Regenerate Supabase types if schema changed

### Adding shadcn/ui Components

```bash
npx shadcn@latest add <component-name>
```

Configuration is in `components.json` (New York style, CSS variables, Lucide icons).

### Common Pitfalls to Avoid

1. **Don't mix Supabase clients**: Server client in server contexts, client client in browser
2. **Don't skip validation**: Always validate user input with Zod on both client and server
3. **Don't edit ui/ components**: Use shadcn CLI to regenerate instead
4. **Don't forget organization context**: Most queries need organization filtering
5. **Don't use console.error in production code**: Replace with proper logging
6. **Don't bypass RLS**: Let Row Level Security handle access control

### TypeScript Path Aliases

```typescript
@/*           // Root directory
@/components  // components/
@/lib         // lib/
@/hooks       // hooks/
@/app         // app/
```

## Environment Variables

Required variables (in `.env.local`):

```bash
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # For OAuth callbacks
```

## Testing & Quality

**Current State**: No formal testing setup exists yet.

**Linting**: ESLint with Next.js config (see `eslint.config.mjs`)

**Type Checking**: Run `npx tsc --noEmit` before commits to catch type errors.

## Known TODOs & Technical Debt

From codebase analysis:

1. **Security**:
   - Replace `console.error` with proper logging (throughout codebase)
   - Add rate limiting to auth endpoints (noted in `app/(auth)/actions.ts`)
   - Implement CAPTCHA for signup/login
   - Add password complexity requirements (validation exists, needs uncommenting)

2. **Database**:
   - Formal migration system not configured (currently using Supabase dashboard + scripts)
   - Missing indexes on frequently queried columns

3. **Testing**:
   - No test suite configured
   - No E2E tests
   - No integration tests

4. **Monitoring**:
   - No error tracking (Sentry or similar)
   - No performance monitoring
   - No audit logging analysis

## Technology-Specific Best Practices

### Next.js 16 App Router Best Practices

#### Data Fetching
- **Prefer Server Components for data fetching**: Fetch data where it's needed, not at the top level
- **Use parallel data fetching**: Make multiple fetch requests simultaneously
  ```typescript
  // ✅ Good: Parallel fetching
  const [users, projects] = await Promise.all([
    supabase.from('users').select(),
    supabase.from('projects').select()
  ])

  // ❌ Bad: Sequential fetching
  const users = await supabase.from('users').select()
  const projects = await supabase.from('projects').select()
  ```
- **Cache strategically**: Use `fetch` with `cache` options or React's `cache()` for deduplication
- **Revalidate data appropriately**: Use `revalidatePath()` or `revalidateTag()` after mutations

#### Metadata & SEO
- **Define metadata in layout.tsx and page.tsx**:
  ```typescript
  export const metadata: Metadata = {
    title: 'Page Title',
    description: 'Page description for SEO',
  }
  ```
- **Use generateMetadata for dynamic pages**: Fetch data to generate metadata
- **Include Open Graph and Twitter cards** for social sharing

#### Route Organization
- **Use route groups** `()` for organization without affecting URLs
- **Use loading.tsx** for instant loading states with Suspense
- **Use error.tsx** for granular error boundaries per route
- **Implement not-found.tsx** for custom 404 pages

#### Performance Optimization
- **Use next/image** for all images: Automatic optimization, lazy loading, proper sizing
  ```typescript
  import Image from 'next/image'
  <Image src="/logo.png" alt="Logo" width={200} height={100} priority />
  ```
- **Implement Streaming**: Break up slow data fetches with `<Suspense>` boundaries
- **Use next/font** for font optimization (already configured with Geist)
- **Dynamic imports for heavy Client Components**:
  ```typescript
  const HeavyComponent = dynamic(() => import('./heavy-component'), {
    loading: () => <Spinner />,
    ssr: false // if needed
  })
  ```

#### Server Actions Best Practices
- **Always use 'use server'** directive at the top of action files
- **Validate all inputs** with Zod before processing
- **Return serializable data only**: No functions, undefined, symbols
- **Use revalidatePath/revalidateTag** instead of router.refresh()
- **Handle errors gracefully**: Return error objects, don't throw
- **Use progressive enhancement**: Forms work without JavaScript
  ```typescript
  'use server'

  export async function createProject(formData: FormData) {
    const validation = projectSchema.safeParse({
      name: formData.get('name'),
      // ...
    })
    if (!validation.success) return { error: validation.error }

    // Mutation logic
    revalidatePath('/projects')
    return { success: true }
  }
  ```

### React 19 Server Components Best Practices

#### Component Boundaries
- **Default to Server Components**: Only add 'use client' when necessary
- **Keep Client Component boundaries small**: Push 'use client' down the tree
  ```typescript
  // ✅ Good: Small client boundary
  function ServerPage() {
    return <div>
      <ServerHeader />
      <ClientInteractiveButton />  {/* Only this is client */}
      <ServerContent />
    </div>
  }

  // ❌ Bad: Entire page is client
  'use client'
  function ClientPage() {
    return <div>{/* Everything becomes client-side */}</div>
  }
  ```
- **Pass Server Components as props** to Client Components:
  ```typescript
  // Client Component can accept Server Components as children
  'use client'
  function ClientWrapper({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>
  }

  // Server Component
  function ServerPage() {
    return <ClientWrapper>
      <ServerComponent />  {/* Stays on server */}
    </ClientWrapper>
  }
  ```

#### Async Components
- **Use async/await in Server Components**: They're async by default
- **Handle loading states** with Suspense boundaries
- **Implement error boundaries** with error.tsx or ErrorBoundary

#### State Management
- **Avoid prop drilling**: Use composition and children props
- **Use React Context sparingly**: Only for Client Components
- **Prefer URL state**: searchParams for filters, pagination, etc.
  ```typescript
  // Server Component can read searchParams directly
  async function ProductList({ searchParams }: { searchParams: { q?: string } }) {
    const products = await searchProducts(searchParams.q)
    return <List products={products} />
  }
  ```

### TypeScript Best Practices

#### Type Safety
- **Enable strict mode** (already enabled in tsconfig.json)
- **Avoid `any` at all costs**: Use `unknown` with type guards
  ```typescript
  // ✅ Good
  function process(data: unknown) {
    if (typeof data === 'string') {
      return data.toUpperCase()
    }
  }

  // ❌ Bad
  function process(data: any) {
    return data.toUpperCase()  // No type safety
  }
  ```
- **Use discriminated unions** for complex state:
  ```typescript
  type Result<T> =
    | { success: true; data: T }
    | { success: false; error: string }
  ```

#### Type Inference
- **Let TypeScript infer return types** when obvious:
  ```typescript
  // ✅ Good: Inferred return type
  function add(a: number, b: number) {
    return a + b  // inferred as number
  }

  // ✅ Also good: Explicit when complex
  async function fetchUser(): Promise<User | null> {
    // ...
  }
  ```
- **Use `satisfies` operator** for type checking without widening:
  ```typescript
  const config = {
    endpoint: '/api/users',
    timeout: 5000
  } satisfies Config  // Type checked but keeps literal types
  ```

#### Utility Types
- **Use built-in utility types**: `Partial<T>`, `Pick<T, K>`, `Omit<T, K>`, `Required<T>`
- **Create domain-specific types** from Zod schemas:
  ```typescript
  export const userSchema = z.object({ name: z.string() })
  export type User = z.infer<typeof userSchema>
  ```

#### Generics
- **Use generics for reusable components**:
  ```typescript
  interface DataTableProps<T> {
    data: T[]
    columns: Column<T>[]
  }

  function DataTable<T>({ data, columns }: DataTableProps<T>) {
    // Fully typed
  }
  ```

### Supabase Best Practices

#### Query Optimization
- **Select only needed columns**: Don't use `select('*')` unless necessary
  ```typescript
  // ✅ Good
  const { data } = await supabase
    .from('profiles')
    .select('id, nom, prenom')

  // ❌ Bad: Fetches all columns
  const { data } = await supabase.from('profiles').select('*')
  ```
- **Use single() for one result**: Better type safety and error handling
- **Implement pagination**: Use `range()` for large datasets
  ```typescript
  const { data } = await supabase
    .from('projects')
    .select('*')
    .range(0, 9)  // First 10 items
  ```
- **Use indexes**: Ensure frequently queried columns have indexes in Postgres

#### Row Level Security (RLS)
- **Always enable RLS** on tables with sensitive data
- **Test RLS policies thoroughly**: Use Supabase SQL Editor to test
- **Keep policies simple**: Complex policies hurt performance
- **Use organization_id filtering** for multi-tenancy (already implemented)

#### Error Handling
- **Always check for errors**: Supabase doesn't throw, it returns error objects
  ```typescript
  const { data, error } = await supabase.from('users').select()
  if (error) {
    // Handle error appropriately
    console.error('Database error:', error)
    return { error: 'Failed to fetch users' }
  }
  ```
- **Use maybeSingle()** when a row might not exist (avoids error)

#### Real-time Subscriptions
- **Unsubscribe on cleanup**: Prevent memory leaks
  ```typescript
  useEffect(() => {
    const channel = supabase
      .channel('projects')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'projet'
      }, handleChange)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
  ```
- **Filter subscriptions** to reduce bandwidth

#### Type Safety
- **Regenerate types** after schema changes:
  ```bash
  npx supabase gen types typescript --project-id=<id> > lib/supabase/types.ts
  ```
- **Use generated types** in all queries for autocomplete and type safety

### Tailwind CSS Best Practices

#### Utility-First Approach
- **Use utility classes directly**: Avoid creating CSS files
- **Use the `cn()` helper** (from `lib/utils.ts`) for conditional classes:
  ```typescript
  import { cn } from '@/lib/utils'

  <div className={cn(
    'base-class',
    isActive && 'active-class',
    variant === 'primary' && 'primary-class'
  )} />
  ```
- **Extract components, not classes**: Use React components for reusability

#### Responsive Design
- **Mobile-first approach**: Default styles are mobile, use `md:`, `lg:` for larger screens
  ```typescript
  <div className="text-sm md:text-base lg:text-lg">
    Responsive text
  </div>
  ```

#### Custom Styles
- **Extend Tailwind config** in `tailwind.config.ts` for custom values
- **Use CSS variables** for theming (already configured with shadcn/ui)
- **Avoid arbitrary values** `[#123456]` when possible: Use config instead

#### Performance
- **Tailwind automatically purges unused styles** in production
- **Avoid @apply in CSS files**: Use utilities directly for better tree-shaking

### Zod Best Practices

#### Schema Design
- **Define schemas close to usage**: In `lib/validations/` directory
- **Compose schemas**: Reuse common patterns
  ```typescript
  const baseUserSchema = z.object({
    email: emailSchema,
    nom: nomSchema,
    prenom: prenomSchema,
  })

  const createUserSchema = baseUserSchema.extend({
    password: passwordSchema,
  })

  const updateUserSchema = baseUserSchema.partial()
  ```

#### Validation
- **Use safeParse() for user input**: Graceful error handling
- **Use parse() only when guaranteed valid**: Throws on error
  ```typescript
  // ✅ Good: User input
  const result = schema.safeParse(userInput)
  if (!result.success) {
    return { error: result.error.flatten() }
  }

  // ✅ Good: Internal/trusted data
  const config = configSchema.parse(trustedConfig)
  ```

#### Error Messages
- **Provide custom error messages**:
  ```typescript
  z.string().min(1, 'Name is required').max(50, 'Name is too long')
  ```
- **Use flatten() for form errors**:
  ```typescript
  const errors = result.error.flatten().fieldErrors
  // { email: ['Invalid email'], password: ['Too short'] }
  ```

#### Transformations
- **Transform data during validation**:
  ```typescript
  const schema = z.object({
    email: z.string().email().toLowerCase().trim(),
    age: z.string().transform(val => parseInt(val, 10)),
  })
  ```

#### Type Inference
- **Export inferred types**:
  ```typescript
  export const userSchema = z.object({ ... })
  export type User = z.infer<typeof userSchema>
  ```

### Security Best Practices

#### Input Validation
- **Validate ALL user input**: Client-side AND server-side with Zod
- **Sanitize HTML content**: Use DOMPurify if accepting rich text
- **Validate file uploads**: Check MIME types, file size, file extensions

#### XSS Prevention
- **React escapes by default**: JSX prevents XSS automatically
- **Be careful with dangerouslySetInnerHTML**: Only use with sanitized content
- **Validate URLs**: Use Zod's `z.string().url()` for user-provided links

#### Authentication & Authorization
- **Never trust client-side auth checks**: Always verify on server
- **Use RLS policies**: Let Postgres enforce access control
- **Implement RBAC**: Check user roles in Server Actions/API routes
- **Use HTTP-only cookies**: Supabase handles this automatically

#### SQL Injection Prevention
- **Use Supabase's query builder**: Automatic parameterization
- **Never concatenate SQL strings**: If you must use raw SQL, use parameterized queries

#### Rate Limiting
- **Implement rate limiting** on API routes (partially implemented with `withUserRateLimit`)
- **Rate limit expensive operations**: Authentication, file uploads, data exports

### Performance Best Practices

#### Code Splitting
- **Automatic route-based splitting**: Next.js handles this
- **Dynamic imports for heavy components**:
  ```typescript
  const Chart = dynamic(() => import('recharts'), { ssr: false })
  ```

#### Image Optimization
- **Always use next/image**: Never use `<img>` tags
- **Specify dimensions**: Prevents layout shift
- **Use priority for LCP images**: Images above the fold
- **Optimize image sources**: Use WebP/AVIF formats

#### Database Optimization
- **Index frequently queried columns**: organization_id, user_id, created_at
- **Use connection pooling**: Supabase handles this
- **Implement pagination**: Don't fetch all records at once
- **Use database functions**: For complex queries, create Postgres functions

#### Caching Strategies
- **Use Next.js fetch cache**: Set cache options appropriately
- **Implement stale-while-revalidate**: For non-critical data
- **Use React cache()**: For deduplicating requests in Server Components
- **Revalidate after mutations**: Use revalidatePath(), revalidateTag()

#### Bundle Size
- **Monitor bundle size**: Use `npm run build` to check
- **Use tree-shaking**: Import only what you need
  ```typescript
  // ✅ Good
  import { Button } from '@/components/ui/button'

  // ❌ Bad: Imports everything
  import * as Components from '@/components/ui'
  ```
- **Lazy load heavy dependencies**: Chart libraries, PDF viewers, etc.

### Code Quality Best Practices

#### Naming Conventions
- **Components**: PascalCase (`UserProfile.tsx`)
- **Files**: kebab-case (`user-profile.tsx` for non-component files)
- **Functions**: camelCase (`fetchUserData`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_UPLOAD_SIZE`)
- **Types/Interfaces**: PascalCase (`UserProfile`, `ApiResponse`)

#### Component Patterns
- **Extract reusable logic**: Create custom hooks
- **Keep components small**: Single responsibility principle
- **Use compound components**: For complex UI patterns
  ```typescript
  <Card>
    <CardHeader>
      <CardTitle>Title</CardTitle>
    </CardHeader>
    <CardContent>Content</CardContent>
  </Card>
  ```

#### File Organization
- **Colocate related files**: Keep components, styles, tests together
- **Use barrel exports**: `index.ts` files for cleaner imports
- **Separate concerns**: UI components vs business logic vs utilities

#### Error Handling
- **Use Error Boundaries**: For unexpected React errors
- **Return error objects**: In Server Actions (don't throw)
- **Provide user-friendly messages**: Don't expose technical details
- **Log errors appropriately**: Server-side only (not console.error)

#### Documentation
- **Use JSDoc comments**: For public functions and complex logic
- **Write self-documenting code**: Clear variable and function names
- **Document complex business logic**: Explain the "why", not the "what"
- **Keep README and docs updated**: Especially after architectural changes

#### Testing (When Implemented)
- **Test business logic**: Pure functions, utilities, validation
- **Test critical paths**: Authentication, payments, data mutations
- **Use React Testing Library**: For component testing
- **E2E tests for user flows**: Login, create project, etc.

## Additional Resources

- **Architecture**: See `ARCHITECTURE.md` for detailed technical architecture
- **Next.js 16**: https://nextjs.org/docs (App Router)
- **React 19**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org/docs
- **Supabase**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Zod**: https://zod.dev
- **React Hook Form**: https://react-hook-form.com
