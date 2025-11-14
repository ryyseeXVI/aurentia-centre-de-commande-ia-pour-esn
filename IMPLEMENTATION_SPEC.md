# Implementation Specification: ESN Compass

**Project**: ESN Compass - Command Center for Engineering Services Company
**Database**: Supabase (PostgreSQL)
**Framework**: Next.js 14+ (App Router)
**Auth**: Supabase Auth
**UI**: shadcn/ui + Tailwind CSS
**Storage**: Supabase Storage (bucket: `profile-pictures`)

---

## 🎯 PROJECT VISION

**ESN Compass** is a comprehensive project management and analytics platform for a **single Engineering Services Company (ESN)** to manage:

- **Client Organizations** (Total, OpenAI, Microsoft, etc.)
- **Projects** for each client (e.g., OpenAI → GPT-4, GPT-5, GPT-4.1)
- **Consultants** (ESN employees) assigned to projects
- **Time tracking**, budgets, invoicing, and analytics
- **Team collaboration** with global chat and project workspaces

**NOT multi-tenant SaaS.** This is a single agency application where all users work for the same ESN.

---

## 📊 CORE DATA MODEL

### Critical Understanding

**Organizations = CLIENT COMPANIES** (not ESN entities!)

```
Organization (Client Company: OpenAI, Total, Microsoft, etc.)
  └── Projects (1:N) (GPT-4, GPT-5, Refinery Alpha, etc.)
      ├── Tasks
      ├── Milestones
      ├── Deliverables (livrables)
      └── Consultants (assigned via affectations table)
```

### Database Tables (Supabase)

**Key Tables:**
- `organizations` - **Client companies** (OpenAI, Total, etc.) ⚠️ Currently has wrong data
- `client` - **Also client companies** (Airbus, AXA, BNP Paribas, etc.) ⚠️ Duplicate/confusion
- `projet` - Projects for client organizations
  - `projet.organization_id` → `organizations.id` (which client)
  - `projet.client_id` → `client.id` (legacy, might be redundant)
- `consultant` - ESN employees/consultants
- `affectation` - Consultant → Project assignments
- `tache` - Tasks within projects
- `temps_passe` - Time tracking (170 rows)
- `budget_projet` - Project budgets (7 rows)
- `facture` - Invoices (15 rows)
- `livrable` - Deliverables (13 rows)
- `milestones` - Project milestones
- `profiles` - User profiles (linked to auth.users)
- `notifications` - User notifications
- `activity_logs` - Audit trail
- `channel_messages` - Chat messages
- `project_channels` - Project-specific chat channels

**Data Migration Note:**
The current database has a semantic issue:
- `organizations` table contains ESN names ("Aurentia ESN", "TechConsult Partners")
- `client` table contains actual client companies (Airbus, AXA, etc.)

**Resolution:** For implementation purposes, treat **`organizations` table as the authoritative client companies**. The existing `client` table data may need to be migrated or the routing adjusted accordingly. For n8n integration, the user references `organizations`, so we'll use that as the primary entity.

### Relationship Verification

**✅ CONFIRMED:** One organization can have multiple projects

**Current Data:**
- Aurentia ESN: 3 projects
  - Modernisation Plateforme Bancaire
  - Plateforme E-commerce Omnicanal
  - Portail Client Digital 2.0
- TechConsult Partners: 2 projects
- Digital Solutions Group: 2 projects

### Simplified Permission Model

**NO multi-tenancy.** Single agency app.

**Permissions based on:**
1. **`profiles.role`** (ENUM: ADMIN, MANAGER, CONSULTANT, CLIENT)
   - **ADMIN**: Full system access
   - **MANAGER**: Can manage projects they're assigned to as chef_projet
   - **CONSULTANT**: Can work on assigned projects (via affectations)
   - **CLIENT**: Optional client portal access (read-only)

2. **`affectation` table** (project assignments)
   - If consultant has affectation record for a project → can access project
   - Admins can access all projects
   - Managers can access projects where they're chef_projet_id

**Tables to ignore/deprecate:**
- `user_organizations` - Empty (0 rows), not used in single-agency model
- `profiles.organization_id` - Nullable field, not used

---

## 🗺️ COMPLETE ROUTING STRUCTURE

```
/app - Global ESN Dashboard
  ├─ Global metrics: all clients, all projects, all consultants
  ├─ Recent activity
  ├─ Quick actions

/app/chat - Global Team Chat
  ├─ General channel (all ESN employees)
  ├─ Direct messages
  ├─ Project channels (auto-created per project)
  ├─ Custom channels
  └─ Always accessible from sidebar

/app/consultants - All Consultants
  ├─ List all ESN consultants
  ├─ Filter by skills, availability, assignments
  ├─ Consultant detail view
  └─ Skills matrix

/app/organizations - All Client Companies
  ├─ List all client organizations
  ├─ Grid/table view with stats
  ├─ Search and filter
  └─ Create new client organization

/app/organizations/[orgId] - Client Company Dashboard
  ├─ Client overview and metrics
  ├─ Contact information
  ├─ All projects for this client
  ├─ Assigned consultants
  └─ Financial summary

/app/organizations/[orgId]/projects - Projects List (for this client)
  ├─ All projects for this client organization
  ├─ Filter by status, project manager
  ├─ Create new project
  └─ Project cards/table view

/app/organizations/[orgId]/projects/[projectId] - Project Workspace
  ├─ / - Project overview dashboard
  ├─ /board - Kanban board (tache table)
  ├─ /roadmap - Timeline with milestones
  ├─ /tasks - Task list view
  ├─ /team - Assigned consultants (affectations)
  ├─ /files - Document management (optional)
  └─ /settings - Project settings

/app/analytics - Global Analytics
  ├─ / - Analytics overview dashboard
  ├─ /time-tracking - Hours analysis (temps_passe)
  ├─ /financial - Revenue, costs, margins (facture, budget_projet)
  ├─ /team-performance - Consultant utilization, productivity
  └─ /project-health - Health scores, risks, incidents

/app/profile - User Profile Settings
  ├─ Personal information (prenom, nom, phone)
  ├─ Avatar upload (profile-pictures bucket)
  ├─ Password change
  └─ Notification preferences

/app/admin - Administration Panel (ADMIN only)
  ├─ /consultants - Manage consultants (CRUD)
  ├─ /organizations - Manage client companies
  ├─ /users - User account management
  ├─ /settings - System settings
  └─ /audit-logs - Activity logs
```

---

## 🎨 SIDEBAR NAVIGATION STRUCTURE

**Adaptive sidebar based on current route context**

### Global Level (/app/*)

```
🏠 ESN Compass

📊 Dashboard
💬 Chat (always accessible)

📁 Management
  ├─ Organizations (Client Companies)
  ├─ Consultants
  └─ All Projects

📈 Analytics
  ├─ Overview
  ├─ Time Tracking
  ├─ Financial Reports
  └─ Team Performance

⚙️ Admin (if role = ADMIN)
  ├─ Manage Consultants
  ├─ Manage Organizations
  ├─ User Management
  └─ Settings

👤 User Menu
  ├─ Profile
  └─ Sign Out
```

### Organization Context (/app/organizations/[orgId]/*)

**Breadcrumb shows:** Organizations → [Client Name]

**Sidebar adds context section:**
```
← Back to Organizations

📋 [Client Name] Overview
📁 Projects (for this client)
👥 Assigned Team
💰 Financials

[Rest of global navigation remains]
```

### Project Context (/app/organizations/[orgId]/projects/[projectId]/*)

**Breadcrumb shows:** Organizations → [Client Name] → [Project Name]

**Sidebar adds project section:**
```
← Back to [Client Name]

📊 Project: [Project Name]
  ├─ Overview
  ├─ Board (Kanban)
  ├─ Roadmap (Milestones)
  ├─ Tasks
  ├─ Team
  └─ Settings

[Rest of global navigation remains]
```

### Collapsible Sections (Global View)

Use shadcn/ui `Collapsible` component for sections:

```typescript
📁 Management (collapsible, default: open)
  ├─ Dashboard
  ├─ Organizations
  ├─ Consultants
  └─ All Projects

📈 Analytics (collapsible, default: closed)
  ├─ Overview
  ├─ Time Tracking
  ├─ Financial
  └─ Team Performance

⚙️ Admin (collapsible, only if ADMIN, default: closed)
  ├─ Consultants
  ├─ Organizations
  ├─ Users
  └─ Settings

💬 Chat (always visible, not collapsible)

👤 Profile (footer, always visible)
```

---

## 🔧 IMPLEMENTATION PHASES

## PHASE 1: Foundation & Authentication

### 1.1 Create Authentication Context

**File: `contexts/auth-context.tsx`**

Provides:
- `user` object from Supabase Auth
- `loading` state
- `signOut()` function
- `refreshUser()` function

**Implementation:**
```typescript
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createBrowserSupabaseClient } from '@/utils/supabase/client'

interface AuthContextType {
  user: User | null
  profile: any | null // User profile from profiles table
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserSupabaseClient()

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    setProfile(data)
  }

  const refreshUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      await fetchProfile(user.id)
    }
  }

  useEffect(() => {
    // Initial user fetch
    refreshUser().finally(() => setLoading(false))

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) {
          await fetchProfile(currentUser.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

### 1.2 Fix Authentication Redirects

**File: `app/(auth)/actions.ts`**

**Change line 154:**
```typescript
// OLD:
redirect('/dashboard')

// NEW:
redirect('/app')
```

**Change line 258:**
```typescript
// OLD:
redirect('/dashboard')

// NEW:
redirect('/app')
```

### 1.3 Create App Layout with Sidebar

**File: `app/app/layout.tsx`**

```typescript
import { AuthProvider } from '@/contexts/auth-context'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { Toaster } from '@/components/ui/toaster'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>
        </div>
        <Toaster />
      </SidebarProvider>
    </AuthProvider>
  )
}
```

### 1.4 Create Global Dashboard

**File: `app/app/page.tsx`**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Users, FolderKanban, Clock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function GlobalDashboard() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    totalProjects: 0,
    totalConsultants: 0,
    totalHoursThisMonth: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      // Fetch global stats
      Promise.all([
        fetch('/api/stats/organizations').then(r => r.json()),
        fetch('/api/stats/projects').then(r => r.json()),
        fetch('/api/stats/consultants').then(r => r.json()),
        fetch('/api/stats/hours-this-month').then(r => r.json()),
      ]).then(([orgs, projects, consultants, hours]) => {
        setStats({
          totalOrganizations: orgs.count || 0,
          totalProjects: projects.count || 0,
          totalConsultants: consultants.count || 0,
          totalHoursThisMonth: hours.total || 0,
        })
      }).finally(() => setLoading(false))
    }
  }, [user, authLoading, router])

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome to ESN Compass</h1>
        <p className="text-muted-foreground mt-2">
          {profile?.prenom ? `Hello ${profile.prenom}!` : 'Overview of your ESN operations'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Organizations</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
            <p className="text-xs text-muted-foreground">Active clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">Ongoing engagements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConsultants}</div>
            <p className="text-xs text-muted-foreground">Team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours This Month</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHoursThisMonth}h</div>
            <p className="text-xs text-muted-foreground">Tracked time</p>
          </CardContent>
        </Card>
      </div>

      {/* Add recent activity, quick actions, etc. */}
    </div>
  )
}
```

---

## PHASE 2: Enhanced Sidebar with Context Awareness

### 2.1 Create Collapsible Nav Component

**File: `components/sidebar/nav-main.tsx`**

```typescript
'use client'

import { ChevronRight } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'

interface NavItem {
  title: string
  url: string
  icon?: any
  badge?: string | number
  items?: NavItem[]
}

interface NavSection {
  title: string
  items: NavItem[]
  defaultOpen?: boolean
}

export function NavMain({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname()

  return (
    <>
      {sections.map((section) => (
        <SidebarGroup key={section.title}>
          <Collapsible defaultOpen={section.defaultOpen ?? true} className="group/collapsible">
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                {section.title}
                <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {!item.items ? (
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url}
                      >
                        <Link href={item.url}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                          {item.badge && (
                            <span className="ml-auto text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    ) : (
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto h-4 w-4" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={pathname === subItem.url}
                                >
                                  <Link href={subItem.url}>
                                    {subItem.icon && <subItem.icon />}
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      ))}
    </>
  )
}
```

### 2.2 Create Adaptive App Sidebar

**File: `components/sidebar/app-sidebar.tsx`**

```typescript
'use client'

import {
  LayoutDashboard,
  MessageSquare,
  Building2,
  Users,
  FolderKanban,
  BarChart3,
  Clock,
  DollarSign,
  TrendingUp,
  Settings,
  Shield,
  UserCog,
  ArrowLeft,
} from 'lucide-react'
import { usePathname, useParams } from 'next/navigation'
import * as React from 'react'
import { NavMain } from '@/components/sidebar/nav-main'
import { NavUser } from '@/components/sidebar/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, profile } = useAuth()
  const pathname = usePathname()
  const params = useParams()

  const organizationId = params?.orgId as string | undefined
  const projectId = params?.projectId as string | undefined

  const [orgName, setOrgName] = React.useState<string>('')
  const [projectName, setProjectName] = React.useState<string>('')

  // Fetch organization and project names if in context
  React.useEffect(() => {
    if (organizationId) {
      fetch(`/api/organizations/${organizationId}`)
        .then(r => r.json())
        .then(data => setOrgName(data.organization?.name || ''))
    }
    if (projectId) {
      fetch(`/api/projects/${projectId}`)
        .then(r => r.json())
        .then(data => setProjectName(data.project?.nom || ''))
    }
  }, [organizationId, projectId])

  const isAdmin = profile?.role === 'ADMIN'

  // Base global navigation
  const globalSections = React.useMemo(() => {
    const sections = [
      {
        title: 'Management',
        defaultOpen: true,
        items: [
          {
            title: 'Dashboard',
            url: '/app',
            icon: LayoutDashboard,
          },
          {
            title: 'Organizations',
            url: '/app/organizations',
            icon: Building2,
          },
          {
            title: 'Consultants',
            url: '/app/consultants',
            icon: Users,
          },
          {
            title: 'All Projects',
            url: '/app/projects',
            icon: FolderKanban,
          },
        ],
      },
      {
        title: 'Analytics',
        defaultOpen: false,
        items: [
          {
            title: 'Overview',
            url: '/app/analytics',
            icon: BarChart3,
          },
          {
            title: 'Time Tracking',
            url: '/app/analytics/time-tracking',
            icon: Clock,
          },
          {
            title: 'Financial',
            url: '/app/analytics/financial',
            icon: DollarSign,
          },
          {
            title: 'Team Performance',
            url: '/app/analytics/team',
            icon: TrendingUp,
          },
        ],
      },
    ]

    if (isAdmin) {
      sections.push({
        title: 'Administration',
        defaultOpen: false,
        items: [
          {
            title: 'Manage Consultants',
            url: '/app/admin/consultants',
            icon: UserCog,
          },
          {
            title: 'Manage Organizations',
            url: '/app/admin/organizations',
            icon: Building2,
          },
          {
            title: 'Settings',
            url: '/app/admin/settings',
            icon: Settings,
          },
        ],
      })
    }

    return sections
  }, [isAdmin])

  // Context-specific sections (organization or project)
  const contextSection = React.useMemo(() => {
    if (projectId && organizationId) {
      // Project context
      return {
        title: `Project: ${projectName || 'Loading...'}`,
        defaultOpen: true,
        items: [
          {
            title: 'Overview',
            url: `/app/organizations/${organizationId}/projects/${projectId}`,
            icon: LayoutDashboard,
          },
          {
            title: 'Board',
            url: `/app/organizations/${organizationId}/projects/${projectId}/board`,
            icon: FolderKanban,
          },
          {
            title: 'Roadmap',
            url: `/app/organizations/${organizationId}/projects/${projectId}/roadmap`,
            icon: TrendingUp,
          },
          {
            title: 'Tasks',
            url: `/app/organizations/${organizationId}/projects/${projectId}/tasks`,
            icon: Clock,
          },
          {
            title: 'Team',
            url: `/app/organizations/${organizationId}/projects/${projectId}/team`,
            icon: Users,
          },
          {
            title: 'Settings',
            url: `/app/organizations/${organizationId}/projects/${projectId}/settings`,
            icon: Settings,
          },
        ],
      }
    } else if (organizationId) {
      // Organization context
      return {
        title: `Client: ${orgName || 'Loading...'}`,
        defaultOpen: true,
        items: [
          {
            title: 'Overview',
            url: `/app/organizations/${organizationId}`,
            icon: LayoutDashboard,
          },
          {
            title: 'Projects',
            url: `/app/organizations/${organizationId}/projects`,
            icon: FolderKanban,
          },
          {
            title: 'Team',
            url: `/app/organizations/${organizationId}/team`,
            icon: Users,
          },
        ],
      }
    }
    return null
  }, [organizationId, projectId, orgName, projectName])

  const allSections = contextSection ? [contextSection, ...globalSections] : globalSections

  const userData = {
    name: profile?.prenom && profile?.nom
      ? `${profile.prenom} ${profile.nom}`
      : user?.email?.split('@')[0] || 'User',
    email: user?.email || '',
    avatar: profile?.avatar_url || '',
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <Shield className="h-6 w-6" />
          <span className="font-bold">ESN Compass</span>
        </div>

        {/* Back button when in context */}
        {(organizationId || projectId) && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href={projectId ? `/app/organizations/${organizationId}` : '/app/organizations'}>
                  <ArrowLeft />
                  <span>Back</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* Chat - always accessible */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/app/chat')}>
              <Link href="/app/chat">
                <MessageSquare />
                <span>Chat</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <NavMain sections={allSections} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
```

---

## PHASE 3: Organizations & Projects Pages

### 3.1 Organizations List Page

**File: `app/app/organizations/page.tsx`**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, PlusCircle, Search } from 'lucide-react'
import Link from 'next/link'

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/organizations')
      .then(r => r.json())
      .then(data => setOrganizations(data.organizations || []))
      .finally(() => setLoading(false))
  }, [])

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Client Organizations</h1>
          <p className="text-muted-foreground mt-2">
            Manage all your client companies and their projects
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Client
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div>Loading organizations...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrgs.map((org) => (
            <Link key={org.id} href={`/app/organizations/${org.id}`}>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Building2 className="h-8 w-8 text-primary" />
                    <span className="text-xs text-muted-foreground">
                      {org.project_count || 0} projects
                    </span>
                  </div>
                  <CardTitle className="mt-4">{org.name}</CardTitle>
                  {org.description && (
                    <CardDescription>{org.description}</CardDescription>
                  )}
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

### 3.2 Organization Detail Page

**File: `app/app/organizations/[orgId]/page.tsx`**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FolderKanban, Users, DollarSign, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function OrganizationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const organizationId = params.orgId as string

  const [organization, setOrganization] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/organizations/${organizationId}`).then(r => r.json()),
      fetch(`/api/organizations/${organizationId}/projects`).then(r => r.json()),
    ]).then(([orgData, projectsData]) => {
      setOrganization(orgData.organization)
      setProjects(projectsData.projects || [])
    }).finally(() => setLoading(false))
  }, [organizationId])

  if (loading) {
    return <div>Loading organization...</div>
  }

  if (!organization) {
    return <div>Organization not found</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{organization.name}</h1>
        <p className="text-muted-foreground mt-2">{organization.description || 'Client organization'}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Consultants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€245K</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Projects</h2>
            <Button>New Project</Button>
          </div>

          <div className="space-y-2">
            {projects.map((project) => (
              <Link key={project.id} href={`/app/organizations/${organizationId}/projects/${project.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>{project.nom}</CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {project.statut}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="team">
          Team members assigned to this client
        </TabsContent>

        <TabsContent value="financials">
          Financial overview and invoices
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### 3.3 Project Workspace Page

**File: `app/app/organizations/[orgId]/projects/[projectId]/page.tsx`**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle2, Clock, Users, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ProjectWorkspacePage() {
  const params = useParams()
  const projectId = params.projectId as string
  const organizationId = params.orgId as string

  const [project, setProject] = useState<any>(null)
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    teamMembers: 0,
    hoursLogged: 0,
  })

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}`).then(r => r.json()),
      fetch(`/api/projects/${projectId}/stats`).then(r => r.json()),
    ]).then(([projectData, statsData]) => {
      setProject(projectData.project)
      setStats(statsData.stats || {})
    })
  }, [projectId])

  if (!project) {
    return <div>Loading project...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{project.nom}</h1>
        <p className="text-muted-foreground mt-2">{project.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.completedTasks}/{stats.totalTasks}
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamMembers}</div>
            <p className="text-xs text-muted-foreground">Members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Logged</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hoursLogged}h</div>
            <p className="text-xs text-muted-foreground">Total time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.statut}</div>
            <p className="text-xs text-muted-foreground">Current</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href={`/app/organizations/${organizationId}/projects/${projectId}/board`}>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Kanban Board</CardTitle>
              <CardDescription>Manage tasks with drag-and-drop</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href={`/app/organizations/${organizationId}/projects/${projectId}/roadmap`}>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Roadmap</CardTitle>
              <CardDescription>View project milestones and timeline</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href={`/app/organizations/${organizationId}/projects/${projectId}/tasks`}>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Task List</CardTitle>
              <CardDescription>Detailed task management</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href={`/app/organizations/${organizationId}/projects/${projectId}/team`}>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Team</CardTitle>
              <CardDescription>Manage team assignments</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}
```

---

## PHASE 4: Global Chat

### 4.1 Chat Page

**File: `app/app/chat/page.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

export default function ChatPage() {
  const { user, profile } = useAuth()
  const [channels, setChannels] = useState<any[]>([])
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    // Fetch channels
    fetch('/api/chat/channels')
      .then(r => r.json())
      .then(data => {
        setChannels(data.channels || [])
        if (data.channels?.length > 0) {
          setSelectedChannel(data.channels[0].id)
        }
      })
  }, [])

  useEffect(() => {
    if (selectedChannel) {
      // Fetch messages for selected channel
      fetch(`/api/chat/channels/${selectedChannel}/messages`)
        .then(r => r.json())
        .then(data => setMessages(data.messages || []))
    }
  }, [selectedChannel])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel) return

    await fetch(`/api/chat/channels/${selectedChannel}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newMessage }),
    })

    setNewMessage('')
    // Refresh messages
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      {/* Channels sidebar */}
      <Card className="w-64 p-4">
        <h2 className="font-semibold mb-4">Channels</h2>
        <div className="space-y-2">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannel(channel.id)}
              className={`w-full text-left px-3 py-2 rounded-md ${
                selectedChannel === channel.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              # {channel.name}
            </button>
          ))}
        </div>
      </Card>

      {/* Chat area */}
      <Card className="flex-1 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold">
            {channels.find(c => c.id === selectedChannel)?.name || 'Select a channel'}
          </h2>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex gap-3">
                <Avatar>
                  <AvatarFallback>{message.sender_name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold">{message.sender_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button onClick={handleSendMessage}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  )
}
```

---

## PHASE 5: Analytics Dashboard

### 5.1 Analytics Overview

**File: `app/app/analytics/page.tsx`**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, TrendingUp, Clock, DollarSign, Users, AlertCircle } from 'lucide-react'

export default function AnalyticsOverviewPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCosts: 0,
    margin: 0,
    hoursWorked: 0,
    activeConsultants: 0,
    projectsAtRisk: 0,
  })

  useEffect(() => {
    // Fetch analytics data from various tables
    fetch('/api/analytics/overview')
      .then(r => r.json())
      .then(data => setStats(data.stats || {}))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Overview</h1>
        <p className="text-muted-foreground mt-2">
          Global insights across all clients and projects
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.margin}%</div>
            <p className="text-xs text-muted-foreground">Profit margin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Worked</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hoursWorked}h</div>
            <p className="text-xs text-muted-foreground">Total tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Consultants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeConsultants}</div>
            <p className="text-xs text-muted-foreground">Team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects at Risk</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.projectsAtRisk}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Add charts and detailed analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue vs Costs Over Time</CardTitle>
          <CardDescription>Monthly breakdown from facture and temps_passe tables</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Chart component to be implemented (use Recharts or similar)
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## PHASE 6: User Profile & Admin

### 6.1 User Profile Page

**File: `app/app/profile/page.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Upload } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createBrowserSupabaseClient } from '@/utils/supabase/client'

export default function ProfilePage() {
  const { user, profile, refreshUser } = useAuth()
  const { toast } = useToast()
  const supabase = createBrowserSupabaseClient()

  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    phone: '',
  })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (profile) {
      setFormData({
        prenom: profile.prenom || '',
        nom: profile.nom || '',
        phone: profile.phone || '',
      })
    }
  }, [profile])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', variant: 'destructive' })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large (max 2MB)', variant: 'destructive' })
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${user?.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath)

      // Update profile with new avatar URL
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: data.publicUrl }),
      })

      await refreshUser()
      toast({ title: 'Avatar updated successfully' })
    } catch (error) {
      toast({ title: 'Failed to upload avatar', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await refreshUser()
        toast({ title: 'Profile updated successfully' })
      }
    } catch (error) {
      toast({ title: 'Failed to update profile', variant: 'destructive' })
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your personal information</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Upload a profile picture (max 2MB)</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback>
                  {profile?.prenom?.[0]}{profile?.nom?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
                <label htmlFor="avatar-upload">
                  <Button type="button" variant="outline" disabled={uploading} asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      {uploading ? 'Uploading...' : 'Upload Avatar'}
                    </span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prenom">First Name</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nom">Last Name</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (read-only)</Label>
                <Input id="email" value={user?.email || ''} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <Button onClick={handleSaveProfile}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Password change functionality to be implemented
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### 6.2 Admin Consultants Management

**File: `app/app/admin/consultants/page.tsx`**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, UserPlus } from 'lucide-react'

export default function AdminConsultantsPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [consultants, setConsultants] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect() => {
    if (profile?.role !== 'ADMIN') {
      router.push('/app')
      return
    }

    fetch('/api/consultants')
      .then(r => r.json())
      .then(data => setConsultants(data.consultants || []))
  }, [profile, router])

  const filteredConsultants = consultants.filter(c =>
    c.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Consultants</h1>
          <p className="text-muted-foreground mt-2">
            CRUD operations on all ESN consultants
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Consultant
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search consultants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rate (€/day)</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredConsultants.map((consultant) => (
              <TableRow key={consultant.id}>
                <TableCell className="font-medium">
                  {consultant.prenom} {consultant.nom}
                </TableCell>
                <TableCell>{consultant.email}</TableCell>
                <TableCell>{consultant.role || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={consultant.statut === 'ACTIF' ? 'default' : 'secondary'}>
                    {consultant.statut}
                  </Badge>
                </TableCell>
                <TableCell>€{consultant.taux_journalier_cout}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

---

## 📦 REQUIRED API ROUTES

### API Routes to Create

**File: `app/api/organizations/route.ts`** ✅ Already exists

**File: `app/api/organizations/[orgId]/route.ts`**
- GET: Fetch organization details
- PATCH: Update organization
- DELETE: Delete organization (admin only)

**File: `app/api/organizations/[orgId]/projects/route.ts`**
- GET: List projects for organization
- POST: Create new project

**File: `app/api/projects/[projectId]/route.ts`**
- GET: Fetch project details
- PATCH: Update project
- DELETE: Delete project

**File: `app/api/projects/[projectId]/stats/route.ts`**
- GET: Project statistics (tasks, team, hours)

**File: `app/api/consultants/route.ts`**
- GET: List all consultants
- POST: Create consultant (admin)

**File: `app/api/stats/organizations/route.ts`**
- GET: Count of organizations

**File: `app/api/stats/projects/route.ts`**
- GET: Count of active projects

**File: `app/api/stats/consultants/route.ts`**
- GET: Count of active consultants

**File: `app/api/stats/hours-this-month/route.ts`**
- GET: Total hours from temps_passe for current month

**File: `app/api/analytics/overview/route.ts`**
- GET: Global analytics (revenue, costs, margin, hours, consultants, risks)

**File: `app/api/profile/route.ts`**
- GET: Current user profile
- PATCH: Update profile

**File: `app/api/chat/channels/route.ts`**
- GET: List all channels
- POST: Create channel

**File: `app/api/chat/channels/[channelId]/messages/route.ts`**
- GET: Fetch messages for channel
- POST: Send message

---

## 🔐 SECURITY CONSIDERATIONS

### 1. Enable RLS on score_sante_projet

**Execute SQL migration:**
```sql
ALTER TABLE score_sante_projet ENABLE ROW LEVEL SECURITY;
```

### 2. Row Level Security Patterns

All tables should filter by organization membership or project assignment:

```sql
-- Example RLS policy for projet table
CREATE POLICY "Users can view projects in their assigned organizations"
  ON projet FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM affectation
      WHERE affectation.projet_id = projet.id
        AND affectation.consultant_id IN (
          SELECT id FROM consultant WHERE user_id = auth.uid()
        )
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  );
```

### 3. API Route Protection

All API routes should verify:
1. User is authenticated
2. User has appropriate role (ADMIN for admin routes)
3. User has access to requested resource (via affectations or role)

---

## ✅ IMPLEMENTATION CHECKLIST

### Phase 1: Foundation
- [ ] Create `contexts/auth-context.tsx`
- [ ] Fix auth redirects in `app/(auth)/actions.ts`
- [ ] Create `app/app/layout.tsx` (with sidebar)
- [ ] Create `app/app/page.tsx` (global dashboard)

### Phase 2: Sidebar
- [ ] Create `components/sidebar/nav-main.tsx` (collapsible)
- [ ] Create `components/sidebar/app-sidebar.tsx` (context-aware)
- [ ] Test sidebar navigation and context switching

### Phase 3: Organizations & Projects
- [ ] Create `/app/organizations` page
- [ ] Create `/app/organizations/[orgId]` page
- [ ] Create `/app/organizations/[orgId]/projects/[projectId]` page
- [ ] Create `/app/organizations/[orgId]/projects/[projectId]/board` page

### Phase 4: Chat
- [ ] Create `/app/chat` page
- [ ] Implement real-time messaging (Supabase Realtime)
- [ ] Add channel creation and management

### Phase 5: Analytics
- [ ] Create `/app/analytics` page
- [ ] Implement analytics queries (temps_passe, facture, budget_projet)
- [ ] Add charts (Recharts or similar)

### Phase 6: Profile & Admin
- [ ] Create `/app/profile` page
- [ ] Implement avatar upload to `profile-pictures` bucket
- [ ] Create `/app/admin/consultants` page
- [ ] Create `/app/admin/organizations` page

### Phase 7: API Routes
- [ ] Create all required API routes
- [ ] Add proper authentication checks
- [ ] Add role-based authorization

### Phase 8: Security & Polish
- [ ] Enable RLS on score_sante_projet
- [ ] Review all RLS policies
- [ ] Add loading states everywhere
- [ ] Add error boundaries
- [ ] Test all user flows

---

## 🎯 SUCCESS CRITERIA

Implementation is complete when:

1. ✅ User can sign up, confirm email, and land on /app
2. ✅ Global dashboard shows stats across all clients/projects
3. ✅ User can navigate: Organizations → Projects → Tasks
4. ✅ Sidebar adapts based on current context (global/org/project)
5. ✅ Chat is accessible from anywhere and works
6. ✅ Analytics pages display data from database tables
7. ✅ User can edit profile and upload avatar to `profile-pictures` bucket
8. ✅ Admin can CRUD consultants and organizations
9. ✅ All routes are protected by auth + role checks
10. ✅ No console errors, smooth navigation, fast loading

---

**END OF SPECIFICATION**

This specification provides complete implementation guidance for **ESN Compass** - a single-agency project management platform with client organizations, projects, analytics, and team collaboration.
