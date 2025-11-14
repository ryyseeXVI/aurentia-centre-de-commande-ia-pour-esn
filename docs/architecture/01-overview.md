# Architecture Overview

## System Architecture

Aurentia AI Command Center is built as a modern, scalable **multi-tenant SaaS platform** using Next.js 16 App Router with React 19 Server Components. The architecture follows a **monolithic application pattern** with clear separation of concerns between frontend, API layer, and backend services.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Browser    │  │    Mobile    │  │   Desktop    │          │
│  │  (React 19)  │  │   (Future)   │  │   (Future)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS/WSS
┌────────────────────────────┴────────────────────────────────────┐
│                     APPLICATION LAYER                            │
│                    (Next.js 16 / Vercel)                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │          React 19 Server Components (SSR)                │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │    │
│  │  │ Pages    │  │ Layouts  │  │ Components│              │    │
│  │  └──────────┘  └──────────┘  └──────────┘              │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           Next.js Middleware (Auth/Session)              │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │               API Routes (80+ endpoints)                 │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │    │
│  │  │ REST API │  │  Server  │  │  WebHooks│              │    │
│  │  │          │  │  Actions │  │          │              │    │
│  │  └──────────┘  └──────────┘  └──────────┘              │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │ API/Realtime/Storage
┌────────────────────────────┴────────────────────────────────────┐
│                      BACKEND SERVICES                            │
│                    (Supabase Platform)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  PostgreSQL  │  │  Supabase    │  │  Supabase    │          │
│  │   Database   │  │     Auth     │  │   Realtime   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │  Supabase    │  │   PostgREST  │                             │
│  │   Storage    │  │   Auto-API   │                             │
│  └──────────────┘  └──────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

## Architecture Principles

### 1. **Server-First Architecture**
- **Default to Server Components**: Components render on the server by default, reducing client-side JavaScript
- **Selective Client Interactivity**: Only interactive components use `'use client'` directive
- **Streaming SSR**: Content streams to browser for faster perceived performance
- **Smart Caching**: Aggressive caching strategies with granular revalidation

### 2. **Multi-Tenancy by Design**
- **Organization Isolation**: All data scoped to `organization_id`
- **Row Level Security**: Database-level isolation (currently disabled, application-level enforced)
- **Role-Based Access Control**: Fine-grained permissions (OWNER > ADMIN > MANAGER > CONSULTANT > CLIENT)
- **Shared Infrastructure**: Single database instance with logical separation

### 3. **Real-Time First**
- **Supabase Realtime**: WebSocket connections for live updates
- **Optimistic Updates**: Instant UI feedback with server reconciliation
- **Presence System**: Live user status and typing indicators
- **Subscriptions**: Component-level real-time data subscriptions

### 4. **API-Driven**
- **REST API**: 80+ well-documented endpoints
- **Server Actions**: Type-safe mutations with automatic revalidation
- **Consistent Patterns**: Standardized error handling, validation, rate limiting
- **Activity Logging**: Comprehensive audit trail for all mutations

### 5. **Type Safety**
- **End-to-End TypeScript**: From database to UI components
- **Zod Validation**: Runtime validation with type inference
- **Generated Types**: Database schema generates TypeScript types
- **Strict Mode**: No `any` types, comprehensive type checking

## Application Flow

### Request Lifecycle

```
1. Browser Request
   │
   ├─> Next.js Middleware
   │   ├─ Session Validation (Supabase Auth)
   │   ├─ Session Refresh (if needed)
   │   └─ Route Protection
   │
   ├─> Server Component / API Route
   │   ├─ Authentication Check
   │   ├─ Authorization Validation (role + organization)
   │   ├─ Rate Limiting (if applicable)
   │   ├─ Input Validation (Zod)
   │   ├─ Database Query (Supabase Client)
   │   ├─ Business Logic
   │   ├─ Activity Logging (for mutations)
   │   └─ Response Formatting
   │
   └─> Response
       ├─ Server-Rendered HTML (Server Components)
       ├─ JSON Data (API Routes)
       └─ Realtime Subscriptions (WebSocket)
```

### Data Flow

```
┌──────────────┐
│  User Action │
└──────┬───────┘
       │
       ├─ Client Component Event Handler
       │  ├─ Optimistic UI Update
       │  └─ Server Action / API Call
       │
       ├─> Next.js Server
       │   ├─ Validate Session
       │   ├─ Validate Input (Zod)
       │   ├─ Check Authorization
       │   └─ Execute Business Logic
       │
       ├─> Supabase
       │   ├─ Database Mutation
       │   ├─ Trigger RLS Policies
       │   ├─ Broadcast Realtime Event
       │   └─ Return Data
       │
       ├─< Response
       │   ├─ Update Client State
       │   ├─ Revalidate Cache
       │   └─ Show Success/Error Message
       │
       └─> Realtime Subscribers
           └─ Update Connected Clients
```

## Component Architecture

### Server Components (Default)

```
app/
├── page.tsx                    # Server Component (data fetching)
├── layout.tsx                  # Server Component (layout)
└── [resource]/
    ├── page.tsx                # Server Component (fetch initial data)
    └── _components/
        ├── client-table.tsx    # Client Component (interactive)
        └── server-list.tsx     # Server Component (static)
```

**Pattern:**
- Server Components fetch data and pass to Client Components
- Client Components handle interactivity (forms, modals, drag-drop)
- Server Actions handle mutations (create, update, delete)
- React Context for client-side state (auth, notifications, workspace)

### Client Components (Interactive Only)

```typescript
'use client'

// Client Components used for:
// - User interactions (clicks, input, drag-drop)
// - Browser APIs (localStorage, window, navigator)
// - React hooks (useState, useEffect, useContext)
// - Real-time subscriptions (Supabase realtime)
// - Third-party libraries requiring browser
```

## Database Architecture

### Multi-Tenant Data Model

```
organizations
    ├── user_organizations (many-to-many)
    │   └── profiles
    │
    ├── projet (projects)
    │   ├── tache (tasks)
    │   ├── milestones
    │   ├── affectation (assignments)
    │   ├── budget_projet
    │   ├── score_sante_projet (health scores)
    │   └── project_channels
    │
    ├── consultant_details
    │   ├── profile_competences
    │   └── temps_passe (time tracking)
    │
    ├── client
    │   └── facture (invoices)
    │
    ├── organization_channels
    │   └── channel_messages
    │
    ├── group_chats
    │   ├── group_chat_members
    │   └── channel_messages
    │
    ├── notifications
    └── activity_logs
```

**Key Characteristics:**
- All tables (except `organizations` and `profiles`) have `organization_id` foreign key
- Cascading deletes maintain referential integrity
- Indexes on `organization_id` for query performance
- Unique constraints for business rules (org slug, project names per org)

### Database Features

1. **PostgreSQL Extensions Used:**
   - `uuid-ossp`: UUID generation
   - `pg_trgm`: Fuzzy text search (future)
   - `pgcrypto`: Encryption functions (future)

2. **Performance Optimizations:**
   - Composite indexes on `(organization_id, status)` for common filters
   - Materialized views for analytics (planned)
   - Connection pooling via Supabase

3. **Row Level Security:**
   - Currently **DISABLED** for development
   - Application-level authorization enforced
   - RLS policies designed and ready for production

## Authentication & Authorization

### Authentication Flow

```
┌─────────────┐
│  User Login │
└──────┬──────┘
       │
       ├─> Supabase Auth
       │   ├─ Validate Credentials
       │   ├─ Issue JWT Token
       │   ├─ Set HTTP-Only Cookie
       │   └─ Create Auth Session
       │
       ├─> Next.js Server Action
       │   ├─ Create/Update Profile
       │   ├─ Load User Organizations
       │   └─ Set Default Organization
       │
       └─> Redirect to Dashboard
```

### Authorization Model

**Role Hierarchy:**
```
OWNER (Highest)
  └─> Can access ALL organizations
      └─> Can perform ANY action

ADMIN
  └─> Full access WITHIN organization
      └─> Can manage users, projects, settings

MANAGER
  └─> Can manage projects and consultants
      └─> Cannot change organization settings

CONSULTANT
  └─> Standard user access
      └─> Can view and update assigned tasks

CLIENT (Lowest)
  └─> Read-only external user
      └─> Limited to project visibility
```

**Authorization Enforcement:**

```typescript
// API Route Pattern
export async function GET(request: Request) {
  const supabase = await createClient()
  const { user, error } = await authenticateUser(supabase)
  if (error) return unauthorizedResponse()

  // Check role
  const { role } = user
  if (!['ADMIN', 'OWNER'].includes(role)) {
    return forbiddenResponse()
  }

  // Check organization membership
  const userOrgIds = await getUserOrganizationIds(user.id)

  // Query with organization filter
  const { data } = await supabase
    .from('table')
    .select('*')
    .in('organization_id', userOrgIds)

  return successResponse(data)
}
```

## Scalability Considerations

### Current Scale
- **Users**: Designed for 100-10,000 users per instance
- **Organizations**: Unlimited organizations per instance
- **Projects**: 1,000-100,000 projects
- **Real-time Connections**: 1,000-10,000 concurrent WebSocket connections

### Scaling Strategies

1. **Horizontal Scaling (Vercel)**
   - Serverless functions auto-scale
   - Edge caching for static content
   - Global CDN distribution

2. **Database Scaling (Supabase)**
   - Connection pooling (PgBouncer)
   - Read replicas for analytics queries
   - Partitioning by organization_id (if needed)

3. **Caching Strategy**
   - Next.js fetch cache (default)
   - Revalidation on demand (mutations)
   - CDN caching for public assets
   - Browser caching for user data

4. **Rate Limiting**
   - Per-user rate limits (implemented)
   - Per-endpoint rate limits
   - Bypass for internal services

## Security Architecture

### Defense in Depth

```
Layer 1: Network (Vercel/Supabase)
   ├─ HTTPS/TLS Encryption
   ├─ DDoS Protection
   └─ WAF (Web Application Firewall)

Layer 2: Application (Next.js)
   ├─ CSRF Protection (built-in)
   ├─ XSS Prevention (React escaping)
   ├─ Input Validation (Zod)
   ├─ Rate Limiting (custom)
   └─ SQL Injection Prevention (parameterized queries)

Layer 3: Authentication (Supabase Auth)
   ├─ JWT Tokens (short-lived)
   ├─ HTTP-Only Cookies
   ├─ Session Management
   └─ Password Hashing (bcrypt)

Layer 4: Authorization (Application)
   ├─ Role-Based Access Control
   ├─ Organization Scoping
   ├─ Resource-Level Permissions
   └─ Activity Logging

Layer 5: Database (RLS - Planned)
   ├─ Row Level Security Policies
   ├─ Encrypted at Rest
   └─ Backups & Recovery
```

### Data Privacy

- **GDPR Compliance**: User data deletion on request
- **Data Residency**: Supabase region selection
- **Audit Trail**: Complete activity logging
- **No PII in Logs**: Sensitive data excluded from application logs

## Technology Decisions

### Why Next.js 16?
- **Server Components**: Reduce client JS bundle size
- **App Router**: File-based routing with layouts
- **Server Actions**: Type-safe mutations without API routes
- **Streaming**: Faster time-to-first-byte
- **Edge Runtime**: Deploy to global edge network

### Why Supabase?
- **Managed PostgreSQL**: Production-ready database
- **Built-in Auth**: JWT-based authentication
- **Realtime**: WebSocket subscriptions
- **Auto-generated API**: PostgREST for rapid development
- **Storage**: File uploads and CDN
- **Cost-Effective**: Generous free tier, predictable pricing

### Why Vercel?
- **Zero-Config Deployment**: Git push to deploy
- **Edge Network**: Global CDN for low latency
- **Serverless Functions**: Auto-scaling API routes
- **Preview Deployments**: Every PR gets a URL
- **Built for Next.js**: Made by the same team

### Why TypeScript?
- **Type Safety**: Catch errors at compile time
- **IntelliSense**: Better developer experience
- **Refactoring**: Safe code changes
- **Documentation**: Types serve as documentation

### Why Tailwind CSS?
- **Utility-First**: Rapid development
- **Consistent Design**: Design system in CSS
- **Performance**: PurgeCSS removes unused styles
- **Dark Mode**: Built-in theme support

### Why shadcn/ui?
- **Copy-Paste Components**: Own the code, no dependencies
- **Accessibility**: ARIA-compliant components
- **Customizable**: Full control over styling
- **TypeScript**: Type-safe component props

## Future Architecture Enhancements

### Planned Improvements

1. **Microservices (Phase 2)**
   - AI/ML service for risk prediction
   - Notification service with queue
   - Analytics service with OLAP database

2. **Caching Layer**
   - Redis for session storage
   - Query result caching
   - Real-time event caching

3. **Event-Driven Architecture**
   - Message queue (RabbitMQ/AWS SQS)
   - Async job processing
   - Webhook delivery system

4. **Observability**
   - Distributed tracing (OpenTelemetry)
   - Error tracking (Sentry)
   - Performance monitoring (Vercel Analytics)
   - Custom metrics (Prometheus/Grafana)

5. **Testing Infrastructure**
   - Unit tests (Jest/Vitest)
   - Integration tests (Playwright)
   - E2E tests (Cypress)
   - Load testing (k6)

---

**See Also:**
- [Tech Stack Details](./02-tech-stack.md)
- [Services & Pricing](./03-services-pricing.md)
- [Architecture Diagrams](./04-diagrams.md)
