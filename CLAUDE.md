# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Aurentia AI Command Center** is an AI-powered ESN (Engineering Services) management platform built with Next.js 16 App Router, React 19, TypeScript, and Supabase. The application manages consultants, projects, tasks, milestones, resources, risk prediction, and financial tracking with multi-tenancy support via organizations.

**Key Features**:
- Multi-tenant organization management
- Project and task management with Kanban/List views
- Real-time chat system (channels, direct messages, groups)
- Real-time notifications with bell icon UI
- Comprehensive admin backoffice
- Activity logging and audit trail
- Analytics and reporting
- Milestone tracking with roadmap visualization

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

### Database Operations

```bash
# Generate TypeScript types from Supabase schema
npx supabase gen types typescript --project-id=<project-id> > lib/supabase/types.ts

# Seed database with mock data
npm run seed
```

**Note**: You have access to Supabase MCP tools for database operations. Use them for querying, migrations, and type generation instead of manual SQL when appropriate.

## Project-Specific Patterns

### 1. Server vs Client Components Philosophy

**Default to Server Components**. Only use `'use client'` when:
- Using React hooks (useState, useEffect, etc.)
- Handling browser events (onClick, onChange, etc.)
- Accessing browser APIs (window, localStorage, etc.)
- Using third-party libraries that require client-side execution
- Using real-time subscriptions (Supabase realtime)

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

**Supabase MCP**: For database operations during development, you can use the Supabase MCP tools:
- `mcp__supabase__execute_sql` - Execute SQL queries
- `mcp__supabase__list_tables` - List database tables
- `mcp__supabase__generate_typescript_types` - Generate TypeScript types
- `mcp__supabase__get_project` - Get project details

### 3. Authentication & Authorization Pattern

All authentication uses Server Actions in `app/(auth)/actions.ts`:
- `signUp(data)` - User registration with Zod validation
- `signIn(data)` - Email/password login
- `signOut()` - Session termination

**Row Level Security (RLS)** is currently **DISABLED** per project requirements. Authorization is handled at the application level via role checks.

**User Roles**: `ADMIN | MANAGER | CONSULTANT | CLIENT`

Roles are stored in both:
- `profiles.role` - Default user role
- `user_organizations.role` - Organization-specific role (takes precedence)

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

**Admin API Routes**: Admin-specific endpoints are in `app/api/admin/` and require ADMIN role verification.

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

**Available Validation Schemas**:
- `lib/validations/auth.ts` - Authentication forms
- `lib/validations/task.ts` - Task operations
- `lib/validations/user.ts` - User management
- `lib/validations/organization.ts` - Organization operations
- `lib/validations/client.ts` - Client management
- `lib/validations/consultant.ts` - Consultant management
- `lib/validations/notification.ts` - Notifications
- `lib/validations/chat.ts` - Chat messages

### 6. Multi-Tenancy via Organizations

All data is scoped to organizations:
- Users belong to organizations via `user_organizations` junction table
- Projects, tasks, consultants are all linked to `organization_id`
- Authorization is enforced via role checks in API routes
- Current organization context is typically retrieved from user session

**Organization Slug Requirements**:
- 3-50 characters
- Format: `^[a-z0-9-]+$` (lowercase, numbers, hyphens only)
- Must be unique
- Auto-generated with collision handling if not provided

### 7. Component Organization

```
components/
├── ui/                # shadcn/ui components (DO NOT manually edit)
├── auth/              # Authentication-specific components
├── projects/          # Project management components (Kanban, List, Filters)
├── milestones/        # Milestone tracking components
├── settings/          # Settings and configuration components
├── sidebar/           # Navigation sidebar components
├── navbar/            # Top navigation components
├── messenger/         # Legacy messaging components
├── chat/              # Real-time chat system (NEW)
│   ├── chat-sidebar.tsx      # Chat list (channels/direct/groups)
│   ├── chat-window.tsx       # Main messaging interface
│   └── new-chat-dialog.tsx   # Create conversations/groups
├── dashboard/         # Dashboard-specific components
│   └── recent-activity.tsx   # Activity feed component
└── dialogs/           # Reusable dialog components
```

**Admin Components** (located in `app/app/(admin)/admin/_components/`):
```
_components/
├── data-table-toolbar.tsx         # Search + add button
├── data-table-pagination.tsx      # Pagination controls
├── bulk-actions-toolbar.tsx       # Multi-select bulk operations
├── delete-confirmation-dialog.tsx # Safe delete confirmation
├── empty-state.tsx                # Empty state display
├── filter-dropdown.tsx            # Reusable filter dropdowns
└── csv-export-button.tsx          # CSV export functionality
```

**shadcn/ui components**: Regenerate using `npx shadcn@latest add <component>` instead of manual edits.

### 8. Type Safety Practices

- All database operations use generated types from `lib/supabase/types.ts`
- Use `z.infer<typeof schema>` for form types
- Avoid `any` types - use `unknown` and type guards instead
- Export types from validation schemas for reuse

**Regenerate types after schema changes**:
```bash
npx supabase gen types typescript --project-id=<project-id> > lib/supabase/types.ts
```

Or use Supabase MCP: `mcp__supabase__generate_typescript_types`

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

**Activity Display**:
- Dashboard: `<RecentActivity limit={10} />` component shows recent activities
- Admin: `/app/admin/activity-logs` page shows full audit trail

### 11. Notifications System

The application has a comprehensive real-time notification system.

**Integration Points**:
- Bell icon in sidebar header (shows unread count badge)
- Component: `<NotificationsDropdown />` in `components/navbar/notifications-dropdown.tsx`
- Context: `useNotifications()` hook from `contexts/notifications-context.tsx`
- Admin management: `/app/admin/notifications` page

**Creating Notifications (Server-Side)**:
```typescript
import { notifyTaskAssigned, createNotification, notifyOrganization } from '@/lib/notifications'

// Task assignment
await notifyTaskAssigned({
  assigneeId: userId,
  assignerId: currentUserId,
  organizationId: orgId,
  taskTitle: "Fix bug",
  taskId: taskId,
})

// Custom notification
await createNotification({
  userId: recipientId,
  organizationId: orgId,
  type: "INFO",
  title: "Welcome!",
  message: "Your account has been created.",
  link: "/app/profile",
})

// Organization-wide notification
await notifyOrganization({
  organizationId: orgId,
  type: "PROJECT_UPDATE",
  title: "New Feature Released",
  message: "Check out our new analytics!",
  link: "/app/analytics",
})
```

**Creating Notifications (Client-Side)**:
```typescript
'use client'
import { notifyTaskAssignedClient, broadcastNotificationClient } from '@/lib/notifications-client'

await notifyTaskAssignedClient({
  assigneeId: userId,
  organizationId: orgId,
  taskTitle: "Review PR",
  taskId: taskId,
})
```

**Notification Types**:
`INFO | SUCCESS | WARNING | ERROR | TASK_ASSIGNED | TASK_COMPLETED | PROJECT_UPDATE | MILESTONE_REACHED | SYSTEM`

### 12. Real-Time Chat System

The application includes a complete real-time messaging system.

**Chat Types**:
1. **Organization Channels** - Public channels (general, announcements, random)
2. **Project Channels** - Project-specific communication
3. **Direct Messages** - 1-on-1 private conversations
4. **Group Chats** - Private group conversations

**Components**:
- `ChatSidebar` - Displays chat list with tabs
- `ChatWindow` - Main messaging interface with real-time updates
- `NewChatDialog` - Create conversations or groups

**Hook**: `useRealtimeChat(chatType, chatId)` provides:
- `messages` - Array of messages
- `sendMessage(content)` - Send message
- `editMessage(id, content)` - Edit message
- `deleteMessage(id)` - Delete message
- `isLoading`, `error` - State management

**Usage Example**:
```typescript
'use client'
import { useRealtimeChat } from '@/hooks/use-realtime-chat'

export function ChatComponent({ channelId }: Props) {
  const { messages, sendMessage, isLoading } = useRealtimeChat('organization', channelId)

  // Render messages and send new ones
}
```

**Chat Pattern**: The hook handles real-time subscriptions, optimistic updates, and deduplication automatically.

### 13. Admin Backoffice Pattern

Admin pages are located at `/app/app/(admin)/admin/*` and share the main application layout.

**Admin Structure**:
- Route group `(admin)` organizes files without affecting URLs
- Security check in `(admin)/layout.tsx` enforces ADMIN role
- URLs: `/app/admin/*` (not `/admin/*`)

**Admin Resources Managed**:
- Users, Organizations, Consultants, Clients
- Projects, Tasks, Milestones
- Notifications, Messaging (channels, messages, DMs)
- Activity Logs (audit trail)

**Admin Page Pattern** (Server Component):
```typescript
// app/app/(admin)/admin/[resource]/page.tsx
export default async function AdminResourcePage() {
  const supabase = await createClient()

  // Parallel data fetching
  const [{ data: items }, { data: organizations }] = await Promise.all([
    supabase.from('table').select('*').order('created_at', { ascending: false }),
    supabase.from('organizations').select('id, name'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Title</h1>
        <p className="text-muted-foreground">Description</p>
      </div>
      <ManagementTable initialItems={items || []} dependencies={organizations || []} />
    </div>
  )
}
```

**Management Table Pattern** (Client Component):
```typescript
'use client'
export function ResourceManagementTable({ initialItems, dependencies }: Props) {
  const [items, setItems] = useState(initialItems)
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<Resource | null>(null)

  // Client-side filtering with useMemo
  const filteredItems = useMemo(() => {
    return items.filter(item => /* search logic */)
  }, [items, search])

  // Client-side pagination
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, page, pageSize])

  // CRUD handlers that call API and refresh
  const handleEdit = (item) => {
    setEditingItem(item)
    setShowEditDialog(true)
  }

  const handleDelete = async (item) => {
    await fetch(`/api/admin/resources/${item.id}`, { method: 'DELETE' })
    router.refresh()
    toast.success('Deleted successfully')
  }

  return (
    <div className="space-y-4">
      <DataTableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        onAdd={() => setShowCreateDialog(true)}
      />

      {selectedIds.length > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedIds.length}
          onDelete={handleBulkDelete}
        />
      )}

      {filteredItems.length === 0 ? (
        <EmptyState
          title="No items found"
          onAction={() => setShowCreateDialog(true)}
        />
      ) : (
        <>
          <Table>{/* Render table with checkboxes */}</Table>
          <DataTablePagination
            currentPage={page}
            totalPages={Math.ceil(filteredItems.length / pageSize)}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Dialogs for CRUD operations */}
    </div>
  )
}
```

**Key Admin Patterns**:
- Server Components fetch initial data, pass to Client Components
- Client-side filtering and pagination (no backend pagination)
- Dialog-driven CRUD (no separate pages)
- Bulk operations with checkbox selection
- CSV export functionality
- `router.refresh()` after mutations to re-fetch data
- Reusable components from `_components/` directory

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
- `notification` - User notifications
- `organization_channels` - Organization-wide chat channels
- `project_channels` - Project-specific chat channels
- `direct_messages` - 1-on-1 messages
- `group_chats` - Group chat metadata
- `group_chat_members` - Group membership
- `channel_messages` - Messages for all channel types
- `message_reactions` - Message reactions (ready for implementation)
- `typing_indicators` - Real-time typing status

### Indexes

Performance indexes are in place for:
- Organization lookups: `user_organizations(user_id, organization_id)`
- Project queries: `projet(organization_id)`
- Unique constraints: `organizations(slug)`

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
| `lib/notifications.ts` | Server-side notification helpers |
| `lib/notifications-client.ts` | Client-side notification helpers |
| `contexts/notifications-context.tsx` | Notifications state management |
| `contexts/auth-context.tsx` | Authentication state management |
| `hooks/use-realtime-chat.ts` | Real-time chat hook |
| `hooks/use-milestones.ts` | Milestone management hook |
| `app/app/(admin)/layout.tsx` | Admin security guard (ADMIN role required) |

## Working with This Codebase

### Adding New Features

1. **Database changes**: Add columns/tables via Supabase dashboard or MCP, then regenerate types
2. **Validation**: Create Zod schema in `lib/validations/`
3. **API**: Create route in `app/api/` using helpers from `lib/api-helpers.ts`
4. **Server Actions**: Add to appropriate `actions.ts` file with validation
5. **Components**: Create in appropriate subdirectory under `components/`
6. **Types**: Regenerate Supabase types if schema changed

### Adding Admin Pages

1. Create page in `app/app/(admin)/admin/[resource]/page.tsx` (Server Component)
2. Create management table in `_components/[resource]-management-table.tsx` (Client Component)
3. Create form dialog in `_components/[resource]-form-dialog.tsx`
4. Add API endpoints in `app/api/admin/[resource]/`
5. Use reusable components from `_components/` directory
6. Add to sidebar navigation in `components/sidebar/app-sidebar.tsx`

### Adding Chat Features

1. Use existing `useRealtimeChat` hook for real-time messaging
2. Add API routes in `app/api/chat/` or `app/api/messenger/`
3. Update chat components in `components/chat/`
4. Ensure proper RLS policies (currently disabled, use app-level checks)

### Adding Notifications

1. Use helper functions from `lib/notifications.ts` (server) or `lib/notifications-client.ts` (client)
2. Choose appropriate notification type
3. Include relevant link and metadata
4. Notifications appear automatically in bell icon dropdown

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
6. **Don't forget to refresh after mutations**: Use `router.refresh()` in Client Components
7. **Don't use /admin URLs**: Admin pages are at `/app/admin/*` due to route group structure
8. **Don't forget role checks**: Verify user permissions in API routes and Server Actions
9. **Don't create notifications for every action**: Only for important, user-relevant events
10. **Don't forget to log activities**: Use `logActivity()` for audit trail

### TypeScript Path Aliases

```typescript
@/*           // Root directory
@/components  // components/
@/lib         // lib/
@/hooks       // hooks/
@/app         // app/
@/contexts    // contexts/
@/types       // types/
@/utils       // utils/
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
   - Re-enable RLS policies with proper testing

2. **Database**:
   - Formal migration system not configured (currently using Supabase dashboard + scripts)
   - RLS is disabled - re-enable with proper policies for production

3. **Testing**:
   - No test suite configured
   - No E2E tests
   - No integration tests

4. **Monitoring**:
   - No error tracking (Sentry or similar)
   - No performance monitoring
   - No audit logging analysis

5. **Chat Features**:
   - Message reactions (tables exist, UI not implemented)
   - Read receipts
   - File attachments
   - Search functionality
   - Push notifications

## Recent Enhancements & Fixes

### ✅ Organization & Project Creation (Fixed)
- **Issue**: HTTP 500 errors due to slug constraint violations
- **Fix**: Enhanced slug generation with 3-50 character enforcement, collision handling
- **Location**: `app/api/organizations/route.ts`, `components/dialogs/create-organization-dialog.tsx`
- **See**: `ORGANIZATION_PROJECT_FIXES.md`, `ENHANCEMENT_SUMMARY.md`

### ✅ Admin System Restructured
- **Change**: Moved from `/app/admin/` to `/app/app/(admin)/admin/`
- **Benefit**: Shared layout with main app, consistent navigation
- **URLs**: `/app/admin/*` (route group doesn't appear in URL)
- **See**: `ADMIN_RESTRUCTURING.md`

### ✅ Real-Time Chat System
- **Features**: Organization/project channels, direct messages, group chats
- **Components**: `ChatSidebar`, `ChatWindow`, `NewChatDialog`
- **Hook**: `useRealtimeChat` with optimistic updates and deduplication
- **See**: `CHAT_SYSTEM_README.md`

### ✅ Notifications & Activity Logging
- **Integration**: Bell icon in sidebar with unread count badge
- **Context**: `useNotifications()` hook for real-time updates
- **Activity**: Recent activity component on dashboard
- **Admin**: Full notification management at `/app/admin/notifications`
- **See**: `NOTIFICATIONS_AND_ACTIVITY_GUIDE.md`, `NOTIFICATIONS_GUIDE.md`

### ✅ Database Optimizations
- Added performance indexes on foreign keys
- Unique constraint on organization slug
- Disabled RLS per project requirements (app-level authorization)

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
- **Pass Server Components as props** to Client Components

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
- **Use discriminated unions** for complex state:
  ```typescript
  type Result<T> =
    | { success: true; data: T }
    | { success: false; error: string }
  ```

#### Type Inference
- **Let TypeScript infer return types** when obvious
- **Use `satisfies` operator** for type checking without widening
- **Use built-in utility types**: `Partial<T>`, `Pick<T, K>`, `Omit<T, K>`, `Required<T>`

#### Domain Types from Zod
- **Create domain-specific types** from Zod schemas:
  ```typescript
  export const userSchema = z.object({ name: z.string() })
  export type User = z.infer<typeof userSchema>
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
- **Use Supabase MCP**: For database operations during development

#### Authorization
- **RLS is currently disabled**: Use application-level checks
- **Always verify permissions**: Check user roles in API routes
- **Organization scoping**: Filter by organization_id in queries

#### Error Handling
- **Always check for errors**: Supabase doesn't throw, it returns error objects
  ```typescript
  const { data, error } = await supabase.from('users').select()
  if (error) {
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

#### Custom Styles
- **Extend Tailwind config** in `tailwind.config.ts` for custom values
- **Use CSS variables** for theming (already configured with shadcn/ui)

### Zod Best Practices

#### Schema Design
- **Define schemas close to usage**: In `lib/validations/` directory
- **Compose schemas**: Reuse common patterns
- **Export inferred types**:
  ```typescript
  export const userSchema = z.object({ ... })
  export type User = z.infer<typeof userSchema>
  ```

#### Validation
- **Use safeParse() for user input**: Graceful error handling
- **Use parse() only when guaranteed valid**: Throws on error

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

#### Database Optimization
- **Index frequently queried columns**: organization_id, user_id, created_at
- **Use connection pooling**: Supabase handles this
- **Implement pagination**: Don't fetch all records at once

#### Caching Strategies
- **Use Next.js fetch cache**: Set cache options appropriately
- **Revalidate after mutations**: Use revalidatePath(), revalidateTag()

#### Bundle Size
- **Monitor bundle size**: Use `npm run build` to check
- **Use tree-shaking**: Import only what you need
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

## Additional Resources

- **Architecture**: See `ARCHITECTURE.md` for detailed technical architecture
- **Admin System**: See `ADMIN_RESTRUCTURING.md` for admin structure details
- **Chat System**: See `CHAT_SYSTEM_README.md` for messaging implementation
- **Notifications**: See `NOTIFICATIONS_GUIDE.md` and `NOTIFICATIONS_AND_ACTIVITY_GUIDE.md`
- **Recent Fixes**: See `ORGANIZATION_PROJECT_FIXES.md` and `ENHANCEMENT_SUMMARY.md`
- **Next.js 16**: https://nextjs.org/docs (App Router)
- **React 19**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org/docs
- **Supabase**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Zod**: https://zod.dev
- **React Hook Form**: https://react-hook-form.com
