# Architecture Documentation

## Aurentia AI Command Center - Technical Architecture

**Version:** 1.0.0
**Last Updated:** 2025-11-13
**Framework:** Next.js 16 (App Router) with React 19 and TypeScript
**Database:** Supabase (PostgreSQL with Realtime)

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Core Concepts](#core-concepts)
5. [Database Schema](#database-schema)
6. [Authentication Flow](#authentication-flow)
7. [API Patterns](#api-patterns)
8. [Security](#security)
9. [Best Practices](#best-practices)
10. [Development Workflow](#development-workflow)

---

## Overview

Aurentia is an AI-powered command center for ESN (Engineering Services) project management. The application enables consultants, managers, and administrators to track projects, manage resources, predict risks, and optimize margins in real-time.

### Key Features

- **User Management**: Multi-role authentication (Admin, Manager, Consultant, Client)
- **Project Tracking**: Comprehensive project management with real-time updates
- **Resource Allocation**: Consultant assignment and workload tracking
- **Risk Prediction**: AI-powered risk detection and recommendations
- **Financial Analysis**: Cost tracking, margin calculation, and invoicing
- **Skills Management**: Competency tracking and evaluation

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.x | React framework with App Router for SSR/SSG |
| **React** | 19.x | UI library with Server Components |
| **TypeScript** | 5.x | Type safety across the entire application |
| **Tailwind CSS** | 3.x | Utility-first CSS framework |
| **shadcn/ui** | Latest | Pre-built accessible component library |
| **Zod** | 4.x | Runtime type validation and schema generation |

### Backend & Database

| Technology | Version | Purpose |
|------------|---------|---------|
| **Supabase** | Latest | PostgreSQL database with Realtime subscriptions |
| **Supabase Auth** | Latest | Authentication and authorization |
| **Supabase Storage** | Latest | File storage for avatars and documents |
| **PostgreSQL** | 17.x | Relational database with advanced features |

### Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting and quality checks |
| **Prettier** | Code formatting |
| **Husky** | Git hooks for pre-commit validation |
| **TypeScript Compiler** | Type checking during development |

---

## Project Structure

```
aurentia-centre-de-commande-ia-pour-esn/
├── app/                          # Next.js App Router directory
│   ├── (auth)/                   # Authentication route group
│   │   ├── login/               # Login page
│   │   ├── register/            # Registration page
│   │   └── actions.ts           # Server actions for auth
│   ├── (dashboard)/             # Protected dashboard routes
│   │   └── dashboard/           # Main dashboard
│   ├── auth/callback/           # OAuth callback handler
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Home page (redirects to dashboard)
│   └── globals.css              # Global styles and Tailwind imports
│
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components (55 components)
│   ├── auth/                    # Authentication forms
│   │   ├── login-form.tsx       # Login form component
│   │   └── register-form.tsx    # Registration form component
│   └── error-boundary.tsx       # Global error boundary component
│
├── lib/                          # Utility libraries and configurations
│   ├── supabase/                # Supabase client configurations
│   │   ├── client.ts            # Browser client for Client Components
│   │   ├── server.ts            # Server client for Server Components
│   │   ├── middleware.ts        # Session management middleware
│   │   └── types.ts             # Generated database types
│   ├── validations/             # Zod validation schemas
│   │   └── auth.ts              # Authentication validation schemas
│   └── utils.ts                 # Utility functions (cn helper)
│
├── hooks/                        # Custom React hooks
│   └── use-mobile.ts            # Mobile viewport detection hook
│
├── middleware.ts                 # Next.js middleware (auth checks)
├── supabase/                     # Supabase configuration and migrations
│   ├── migrations/              # SQL migration files
│   └── seed.sql                 # Database seed data
│
├── public/                       # Static assets
├── .env.local                    # Environment variables (not in repo)
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies and scripts
```

### Directory Conventions

#### `/app` - Application Routes

- Uses Next.js App Router (file-system routing)
- **Route Groups**: `(auth)`, `(dashboard)` for organizing without affecting URL structure
- **Server Components by default**: Opt into Client Components with `'use client'`
- **Colocation**: Components, styles, and logic can live next to routes

#### `/components` - Reusable Components

- **`/ui`**: shadcn/ui components (DON'T edit directly, regenerate if needed)
- **`/auth`**: Authentication-specific components
- **Root level**: Shared components like ErrorBoundary

#### `/lib` - Shared Utilities

- **`/supabase`**: Database client configurations
- **`/validations`**: Zod schemas for input validation
- **Root level**: Generic utilities (classnames, formatters, etc.)

---

## Core Concepts

### 1. Server vs Client Components

**Server Components** (default in Next.js App Router):
```typescript
// No 'use client' directive = Server Component
export default async function ProfilePage() {
  const supabase = await createClient() // Server client
  const { data } = await supabase.from('profiles').select('*')
  return <div>{data.nom}</div>
}
```

**Client Components** (requires explicit opt-in):
```typescript
'use client'

import { useState } from 'react'

export default function InteractiveForm() {
  const [value, setValue] = useState('')
  return <input value={value} onChange={(e) => setValue(e.target.value)} />
}
```

**When to use Client Components:**
- Interactivity (onClick, onChange, etc.)
- React hooks (useState, useEffect, etc.)
- Browser APIs (window, localStorage, etc.)
- Third-party libraries that require client-side execution

### 2. Server Actions

Server Actions enable server-side mutations directly from Client Components:

```typescript
// app/(auth)/actions.ts
'use server'

export async function signUp(data: SignUpInput) {
  // Validate input
  const validation = signUpSchema.safeParse(data)
  if (!validation.success) return { error: 'Invalid input' }

  // Perform server-side logic
  const supabase = await createClient()
  await supabase.auth.signUp(validation.data)

  redirect('/dashboard')
}
```

**Benefits:**
- Type-safe client-server communication
- No need for API routes for simple mutations
- Automatic CSRF protection
- Works with progressive enhancement

### 3. Type Safety with Supabase

All database operations are fully typed using generated TypeScript types:

```typescript
import type { Database } from '@/lib/supabase/types'

// Type-safe database queries
const { data } = await supabase
  .from('profiles')          // Auto-complete table names
  .select('nom, prenom')     // Auto-complete column names
  .eq('role', 'CONSULTANT')  // Type-checked enum values

// data is typed as: { nom: string; prenom: string }[]
```

**Regenerate types:**
```bash
npx supabase gen types typescript --project-id=<project-id> > lib/supabase/types.ts
```

### 4. Validation with Zod

All user input is validated using Zod schemas:

```typescript
import { signUpSchema } from '@/lib/validations/auth'

// Runtime validation
const result = signUpSchema.safeParse(formData)

if (!result.success) {
  // Get field-specific errors
  const errors = result.error.flatten().fieldErrors
  // { email: ['Invalid email'], password: ['Too short'] }
}

// Use validated data (guaranteed to match schema)
const validatedData = result.data
```

---

## Database Schema

### Core Tables

#### `profiles` - User Profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'CONSULTANT',
  organization_id UUID REFERENCES organizations,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `organizations` - Companies/Organizations
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `projet` - Projects
```sql
CREATE TABLE projet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations,
  client_id UUID NOT NULL REFERENCES client,
  chef_projet_id UUID REFERENCES consultant,
  nom TEXT NOT NULL,
  description TEXT,
  statut TEXT NOT NULL DEFAULT 'EN_COURS',
  date_debut DATE NOT NULL,
  date_fin_prevue DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `consultant` - Consultants
```sql
CREATE TABLE consultant (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations,
  user_id UUID REFERENCES profiles,
  manager_id UUID REFERENCES consultant,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT,
  statut TEXT,
  date_embauche DATE NOT NULL,
  taux_journalier_cout DECIMAL NOT NULL,
  taux_journalier_vente DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Enums

```sql
CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'CONSULTANT', 'CLIENT');
```

### Row Level Security (RLS)

All tables have RLS enabled to enforce data access policies:

```sql
-- Example: Users can only see their own organization's data
CREATE POLICY "Users can view their organization's projects"
  ON projet
  FOR SELECT
  USING (organization_id = auth.jwt() ->> 'organization_id');
```

---

## Authentication Flow

### Registration Flow

```
1. User fills registration form
   ↓
2. Client-side validation (Zod schema)
   ↓
3. Submit to signUp() server action
   ↓
4. Server-side validation (Zod schema)
   ↓
5. Create user in Supabase Auth
   ↓
6. Send verification email
   ↓
7. User clicks verification link
   ↓
8. Redirect to /auth/callback
   ↓
9. Exchange code for session
   ↓
10. Create profile in database (trigger)
    ↓
11. Redirect to /dashboard
```

### Login Flow

```
1. User enters email/password
   ↓
2. Client-side validation
   ↓
3. Submit to signIn() server action
   ↓
4. Authenticate with Supabase
   ↓
5. Create session + set cookies
   ↓
6. Redirect to /dashboard
```

### Session Management

- **Middleware**: Refreshes session on every request
- **Client**: Session auto-refreshes before expiry
- **Server**: Session accessed via server-side cookie

---

## API Patterns

### Server Actions Pattern

```typescript
// 1. Define input type with Zod
export const myActionSchema = z.object({
  field: z.string(),
})

// 2. Create server action
'use server'
export async function myAction(input: z.infer<typeof myActionSchema>) {
  // Validate
  const result = myActionSchema.safeParse(input)
  if (!result.success) return { error: 'Invalid input' }

  // Business logic
  const supabase = await createClient()
  await supabase.from('table').insert(result.data)

  // Revalidate or redirect
  revalidatePath('/dashboard')
  return { success: true }
}
```

### Database Query Pattern

```typescript
// Server Component
export default async function DataPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('table')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw error

  return <DataList items={data} />
}
```

---

## Security

### Input Validation

✅ **IMPLEMENTED**:
- Zod schemas for all auth forms
- Server-side validation in server actions
- Type safety with TypeScript

⚠️ **TODO**:
- Add validation for all other forms
- Implement rate limiting
- Add CAPTCHA for auth endpoints

### Authentication

✅ **IMPLEMENTED**:
- Supabase Auth with email/password
- Email verification
- Session management via middleware
- Secure cookie handling

⚠️ **TODO**:
- Add OAuth providers (Google, GitHub)
- Implement MFA (Multi-Factor Authentication)
- Add account lockout after failed attempts

### Authorization

✅ **IMPLEMENTED**:
- Row Level Security (RLS) policies
- Role-based access control (RBAC)
- Organization-level data isolation

⚠️ **TODO**:
- Granular permissions system
- Audit logging for sensitive operations

### Error Handling

✅ **IMPLEMENTED**:
- Error boundary component
- Type-safe error returns from server actions

⚠️ **TODO**:
- Replace console.error with proper logging
- Integrate error tracking (Sentry)
- Add structured logging

---

## Best Practices

### Code Organization

1. **Co-locate related code**: Keep components, styles, and logic together
2. **Use barrel exports**: `components/ui/index.ts` for cleaner imports
3. **Separate concerns**: Business logic in `/lib`, UI in `/components`
4. **Type everything**: No `any` types, always define interfaces

### Component Patterns

```typescript
// ✅ Good: Server Component with data fetching
export default async function Page() {
  const data = await fetchData()
  return <ClientComponent data={data} />
}

// ✅ Good: Client Component with interactivity
'use client'
export function ClientComponent({ data }) {
  const [state, setState] = useState(data)
  return <button onClick={() => setState(...)}>Click</button>
}

// ❌ Bad: Mixing server and client concerns
'use client'
export function BadComponent() {
  const data = await fetch(...) // Can't use await in Client Component
  return <div>{data}</div>
}
```

### Performance Optimization

1. **Use Server Components by default**: Reduces JavaScript bundle size
2. **Lazy load Client Components**: Use `next/dynamic` for code splitting
3. **Optimize images**: Use `next/image` for automatic optimization
4. **Cache database queries**: Use React cache() or Next.js unstable_cache()

### TypeScript Best Practices

```typescript
// ✅ Good: Explicit return types
export async function getData(): Promise<Project[]> {
  // ...
}

// ✅ Good: Type inference from Zod
export const schema = z.object({ name: z.string() })
export type SchemaType = z.infer<typeof schema>

// ❌ Bad: Using any
export function doSomething(data: any) { }

// ❌ Bad: Non-null assertions without checks
const value = data!.field!.nested!
```

---

## Development Workflow

### Initial Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd aurentia-centre-de-commande-ia-pour-esn

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Run migrations
npx supabase db push

# 5. Start development server
npm run dev
```

### Development Commands

```bash
# Development
npm run dev          # Start Next.js dev server (http://localhost:3000)

# Type Checking
npm run type-check   # Run TypeScript compiler

# Linting & Formatting
npm run lint         # Run ESLint
npm run format       # Format with Prettier

# Database
npx supabase migration new <name>   # Create new migration
npx supabase db reset               # Reset database
npx supabase gen types typescript   # Regenerate types

# Build & Deploy
npm run build        # Production build
npm start            # Start production server
```

### Git Workflow

1. **Create feature branch**: `git checkout -b feature/my-feature`
2. **Make changes**: Write code with proper types and docs
3. **Commit**: Use conventional commits (`feat:`, `fix:`, `docs:`)
4. **Push**: `git push origin feature/my-feature`
5. **Pull Request**: Create PR for review

### Code Review Checklist

- [ ] TypeScript compiles without errors
- [ ] All functions have JSDoc comments
- [ ] Input validation with Zod
- [ ] No console.log/console.error (use proper logging)
- [ ] Error handling implemented
- [ ] Tests written (TODO: add testing setup)

---

## Additional Resources

### Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Zod](https://zod.dev)

### Project-Specific Docs

- [`SETUP.md`](./SETUP.md) - Setup instructions
- [`MIGRATIONS_GUIDE.md`](./MIGRATIONS_GUIDE.md) - Database migration guide
- [`MOCK_DATA_SUMMARY.md`](./MOCK_DATA_SUMMARY.md) - Test data documentation

---

**Last Updated**: 2025-11-13 by Claude Code
**Maintainer**: Aurentia Development Team
