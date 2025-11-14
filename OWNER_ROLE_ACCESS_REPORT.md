# OWNER Role Unrestricted Data Access Implementation Report

## Executive Summary

This report identifies all locations in the codebase where organization_id filtering is applied to database queries. The OWNER role should have unrestricted access to all data across all organizations, while other roles (ADMIN, MANAGER, CONSULTANT, CLIENT) should remain organization-scoped.

**Current State**: The OWNER role is already recognized in role checks (`["ADMIN", "OWNER"]` patterns) but is NOT yet implemented in data filtering logic.

**Total Locations Requiring Updates**: 97 query locations across 60+ files

---

## Part 1: API Routes (Organization-Scoped Data)

### 1. Project-Related API Routes

#### `/app/api/projects/route.ts`
- **GET (lines 32-108)**: Filters projects by `organization_id` when `organizationId` param provided
- **GET (lines 112-153)**: Filters projects by multiple organization_ids via `.in("organization_id", organizationIds)`
- **POST (line 201)**: Checks user has access to organization before creating project
- **Action Required**: Add OWNER role bypass to skip organization filtering

#### `/app/api/projects/[projectId]/route.ts`
- **GET (line 46)**: Filters membership check `.eq("organization_id", project.organization_id)`
- **PUT (line 121)**: Filters membership check `.eq("organization_id", existingProject.organization_id)`
- **DELETE (line 247)**: Filters membership check `.eq("organization_id", existingProject.organization_id)`
- **Action Required**: Allow OWNER to bypass organization_id verification

#### `/app/api/projects/[projectId]/tasks/route.ts`
- **GET (line 48)**: `.eq("organization_id", project.organization_id)`
- **POST (line 182)**: `.eq("organization_id", project.organization_id)`
- **Action Required**: OWNER should access all project tasks

#### `/app/api/projects/[projectId]/members/route.ts`
- **GET (line 45)**: `.eq("organization_id", project.organization_id)`
- **POST (line 71)**: `.eq("organization_id", project.organization_id)`
- **Action Required**: OWNER should access all project members

#### `/app/api/projects/[projectId]/tags/route.ts`
- **POST (line 45)**: `.eq("organization_id", project.organization_id)`
- **Action Required**: OWNER should access all project tags

#### `/app/api/admin/projects/route.ts`
- **GET (lines 28-36)**: Fetches ALL projects (no organization filter - GOOD for OWNER)
- **POST (lines 124-136)**: Creates projects in any organization
- **Status**: Already admin-only, needs OWNER role check update (line 24, 69)

### 2. Task-Related API Routes

#### `/app/api/tasks/[taskId]/route.ts`
- **GET (line 64)**: `.eq("organization_id", task.projet.organization_id)`
- **PUT (line 149)**: `.eq("organization_id", existingTask.organization_id)`
- **DELETE (line 308)**: `.eq("organization_id", existingTask.organization_id)`
- **Action Required**: OWNER bypass for organization_id check

#### `/app/api/tasks/[taskId]/move/route.ts`
- **POST (line 45)**: `.eq("organization_id", existingTask.organization_id)`
- **Action Required**: OWNER bypass needed

#### `/app/api/admin/tasks/route.ts`
- **GET (lines 28-37)**: Fetches ALL tasks (no organization filter - GOOD)
- **POST (lines 159-176)**: Creates tasks in any organization
- **Status**: Admin-only, needs OWNER role update (line 24, 70)

### 3. Milestone-Related API Routes

#### `/app/api/milestones/[milestoneId]/route.ts`
- **GET (line 110)**: `.eq("organization_id", (milestone as any).organization_id)`
- **PUT (line 276)**: `.eq("organization_id", existingMilestone.organization_id)`
- **DELETE (line 553)**: `.eq("organization_id", existingMilestone.organization_id)`
- **Action Required**: OWNER bypass for organization check

#### `/app/api/milestones/[milestoneId]/tasks/route.ts`
- **GET (line 49)**: `.eq("organization_id", (milestone as any).organization_id)`
- **POST (line 229)**: `.eq("organization_id", (milestone as any).organization_id)`
- **PUT (line 363)**: `.eq("organization_id", (milestone as any).organization_id)`
- **Action Required**: OWNER bypass needed

#### `/app/api/milestones/[milestoneId]/assignments/route.ts`
- **GET (line 54)**: `.eq("organization_id", (milestone as any).organization_id)`
- **POST (line 91)**: `.eq("organization_id", (milestone as any).organization_id)`
- **DELETE (line 237)**: `.eq("organization_id", (milestone as any).organization_id)`
- **Action Required**: OWNER bypass needed

#### `/app/api/milestones/[milestoneId]/dependencies/route.ts`
- **POST (line 53)**: `.eq("organization_id", (milestone as any).organization_id)`
- **GET (line 133)**: `.eq("organization_id", (milestone as any).organization_id)`
- **DELETE (line 295)**: `.eq("organization_id", (milestone as any).organization_id)`
- **Action Required**: OWNER bypass needed

#### `/app/api/admin/milestones/route.ts`
- **GET**: Fetches ALL milestones (no org filter - check needed)
- **Status**: Admin-only, needs OWNER role check update

### 4. Organization & Member Management

#### `/app/api/organizations/[orgId]/route.ts`
- **GET (line 43)**: `.eq("organization_id", orgId)`
- **PUT (line 119)**: `.eq("organization_id", orgId)`
- **DELETE (line 240)**: `.eq("organization_id", orgId)`
- **Action Required**: OWNER access to any organization

#### `/app/api/organizations/[orgId]/members/route.ts`
- **GET (line 43)**: `.eq("organization_id", orgId)`
- **POST (line 70)**: `.eq("organization_id", orgId)`
- **PUT (line 131)**: `.eq("organization_id", orgId)`
- **DELETE (line 176)**: `.eq("organization_id", orgId)`
- **Action Required**: OWNER should manage all organization members

#### `/app/api/organizations/[orgId]/consultants/route.ts`
- **GET (line 40)**: `.eq("organization_id", orgId)`
- **POST (line 77)**: `.eq("organization_id", orgId)`
- **PUT (line 151)**: `.eq("organization_id", orgId)`
- **DELETE (line 198)**: `.eq("organization_id", orgId)`
- **GET details (line 209)**: `.eq("organization_id", orgId)`
- **Action Required**: OWNER should access all organization consultants

#### `/app/api/organizations/[orgId]/consultants/[consultantId]/route.ts`
- **GET (line 42)**: `.eq("organization_id", orgId)`
- **PUT (line 74)**: `.eq("organization_id", orgId)`
- **DELETE (line 130)**: `.eq("organization_id", orgId)`
- **PATCH (line 170)**: `.eq("organization_id", orgId)`
- **PUT status (line 199)**: `.eq("organization_id", orgId)`
- **PUT availability (line 216)**: `.eq("organization_id", orgId)`
- **GET manager (line 323)**: `.eq("organization_id", orgId)`
- **PUT manager (line 338)**: `.eq("organization_id", orgId)`
- **DELETE manager (line 353)**: `.eq("organization_id", orgId)`
- **Action Required**: OWNER should manage all consultants

#### `/app/api/organizations/[orgId]/projects/route.ts`
- **GET (line 33)**: `.eq("organization_id", orgId)`
- **POST (line 59)**: `.eq("organization_id", orgId)`
- **PUT (line 144)**: `.eq("organization_id", orgId)`
- **Action Required**: OWNER should access all organization projects

#### `/app/api/organizations/[orgId]/invitations/route.ts`
- **GET (line 37)**: `.eq("organization_id", orgId)`
- **POST (line 63)**: `.eq("organization_id", orgId)`
- **Action Required**: OWNER should manage all invitations

#### `/app/api/organizations/[orgId]/join-codes/route.ts`
- Multiple operations with organization_id checks
- **Action Required**: OWNER should manage all join codes

#### `/app/api/admin/organizations/route.ts`
- **GET**: Fetches ALL organizations (check needed)
- **Status**: Admin-only, needs OWNER role check

### 5. Analytics & Reporting

#### `/app/api/analytics/overview/route.ts`
- **Lines 46, 84, 127, 146, 159**: `.in("organization_id", organizationIds)`
- **Action Required**: OWNER should see ALL analytics without organization filtering

#### `/app/api/organizations/[orgId]/analytics/route.ts`
- **Lines 34, 62, 76, 87, 106, 118, 128, 151, 159, 172**: Multiple `.eq("organization_id", orgId)` calls
- **Action Required**: OWNER should access analytics for any organization

#### `/app/api/analytics/time-tracking/route.ts`
- **Status**: Check if organization_id filtering exists

#### `/app/api/analytics/project-scores/route.ts`
- **Status**: Check if organization_id filtering exists

#### `/app/api/dashboard/stats/route.ts`
- **Lines 48, 54, 61, 73, 83**: Multiple `.eq("organization_id", orgId)` calls
- **Action Required**: OWNER should access dashboard stats for any organization

### 6. Chat & Messaging

#### `/app/api/messenger/channels/route.ts`
- **GET (lines 40, 43, 54)**: `.eq("organization_id", organizationId)` or from profile
- **POST (line 119)**: `.eq("organization_id", organizationId)`
- **Action Required**: OWNER should access all channels

#### `/app/api/messenger/messages/route.ts`
- **POST (line 69, 95)**: `.eq("organization_id", (channel as any).organization_id)`
- **PUT (line 219)**: `.eq("organization_id", organizationId)`
- **DELETE (line 247)**: `.eq("organization_id", organizationId)`
- **Action Required**: OWNER should access all messages

#### `/app/api/messenger/typing/route.ts`
- **POST (line 54)**: `.eq("organization_id", organizationId)`
- **Action Required**: OWNER should access typing indicators

#### `/app/api/messenger/reactions/route.ts`
- **POST (line 67)**: `.eq("organization_id", organizationId)`
- **DELETE (line 80, 95)**: `.eq("organization_id", organizationId)`
- **Action Required**: OWNER should manage all reactions

#### `/app/api/chat/channels/route.ts`
- **GET (line 43)**: `.eq("organization_id", (profile as any).organization_id)`
- **POST (line 121, 135)**: `.eq("organization_id", organizationId)`
- **Action Required**: OWNER should access all chat channels

### 7. Notifications & Activity

#### `/app/api/notifications/route.ts`
- **GET (line 40)**: `.eq("organization_id", organizationId)`
- **Action Required**: Query should not filter by organization for OWNER

#### `/app/api/activity/route.ts`
- **GET (lines 68, 74)**: `.in("organization_id", orgIds)` and `.eq("organization_id", organizationId)`
- **Action Required**: OWNER should see ALL activity logs

#### `/app/api/admin/notifications/route.ts`
- **Status**: Check role requirements

---

## Part 2: Server Components (Data Fetching Pages)

### Admin Pages (All Currently Fetch ALL Data - Check Role Guards)

#### `/app/app/(admin)/admin/organizations/page.tsx` (Line 11-14)
```typescript
const { data: organizations } = await supabase
  .from("organizations")
  .select("*")
  .order("created_at", { ascending: false });
```
- **Status**: Fetches ALL organizations (no org filter - GOOD for OWNER/ADMIN)
- **Issue**: Need to verify role check at route level (admin/layout.tsx)

#### `/app/app/(admin)/admin/projects/page.tsx` (Lines 12-24)
```typescript
const [{ data: projects }, ...] = await Promise.all([
  supabase.from("projet").select(...).order(...),
  supabase.from("organizations").select(...),
  ...
]);
```
- **Status**: Fetches ALL projects (no org filter - GOOD)
- **Issue**: Health scores might need organization filtering

#### `/app/app/(admin)/admin/tasks/page.tsx` (Lines 12-18)
```typescript
const [{ data: tasks }, ...] = await Promise.all([
  supabase.from("tache").select(...).order(...),
  ...
]);
```
- **Status**: Fetches ALL tasks (no org filter - GOOD)

#### `/app/app/(admin)/admin/activity-logs/page.tsx` (Lines 19-22)
```typescript
const { data: logs } = await supabase
  .from("activity_logs")
  .select("*, user:profiles(prenom, nom)")
  .order("created_at", { ascending: false });
```
- **Status**: Fetches ALL activity logs (no org filter - GOOD for OWNER/ADMIN)

#### `/app/app/(admin)/admin/consultants/page.tsx` (Lines 18-26)
```typescript
const [{ data: consultants }, ...] = await Promise.all([
  supabase.from("profiles").select("*").eq("role", "CONSULTANT"),
  supabase.from("organizations").select(...),
]);
```
- **Status**: Fetches ALL consultants with CONSULTANT role

#### `/app/app/(admin)/admin/clients/page.tsx` (Lines 18-26)
```typescript
const [{ data: clients }, ...] = await Promise.all([
  supabase.from("profiles").select("*").eq("role", "CLIENT"),
  ...
]);
```
- **Status**: Fetches ALL clients with CLIENT role

#### `/app/app/(admin)/admin/milestones/page.tsx` (Lines 12-18)
```typescript
const [{ data: milestones }, ...] = await Promise.all([
  supabase.from("milestone").select(...).order(...),
  ...
]);
```
- **Status**: Fetches ALL milestones (no org filter - GOOD)

### Other Server Components

#### `/app/app/(admin)/admin/layout.tsx`
```typescript
if (profileError || (profile?.role !== "ADMIN" && profile?.role !== "OWNER")) {
  redirect("/app");
}
```
- **Status**: GOOD - Already checks for OWNER role
- **Action**: Verify this guard works correctly for all admin pages

---

## Part 3: Key Files Needing Role-Check Implementation

### 1. **utils/permissions/check-access.ts**
- **Current State**: Functions check for ADMIN/MANAGER roles
- **Action Required**: 
  - Update `checkOrganizationAccess()` to return TRUE for OWNER role (bypass org check)
  - Update `checkOrganizationAdminAccess()` to include OWNER
  - Create new helper `isSystemOwner()` to check global OWNER role

### 2. **lib/notifications.ts** (97 file found with organization_id references)
- **Lines 69, 115, 574, 640, 787**: Organization filtering in notification creation
- **Action Required**: Pass user role to notification helpers and bypass org filter for OWNER

### 3. **Admin API Routes** (All `/app/api/admin/*` routes)
- **Current Pattern**: Check `profile?.role !== "ADMIN"` (line 24, 69, etc.)
- **Action Required**: Update to `!["ADMIN", "OWNER"].includes(profile?.role)`

---

## Part 4: Role Type Definition

### Current `/types/roles.ts` or similar
- **Status**: Check if OWNER role is defined in UserRole type
- **Action Required**: Ensure OWNER is included: `type UserRole = "ADMIN" | "MANAGER" | "CONSULTANT" | "CLIENT" | "OWNER"`

---

## Implementation Strategy

### Step 1: Update Role Checks (Highest Priority)
1. Update all admin route role checks from:
   ```typescript
   if ((profile as any)?.role !== "ADMIN") { ... }
   ```
   To:
   ```typescript
   if (!["ADMIN", "OWNER"].includes((profile as any)?.role)) { ... }
   ```

2. Update permission check utilities in `utils/permissions/check-access.ts`

### Step 2: Create Helper Function
```typescript
// lib/auth-helpers.ts
export async function hasFullDataAccess(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  
  return profile?.role === "OWNER";
}
```

### Step 3: Update Data Fetching Patterns
For organization-scoped queries, add conditional logic:

```typescript
// Example pattern
const user = await getUser();
const userRole = await getUserRole(user.id);
const isOwner = userRole === "OWNER";

let query = supabase.from("projet").select("*");

// Skip organization filtering for OWNER
if (!isOwner) {
  query = query.eq("organization_id", organizationId);
}
```

### Step 4: Update Analytics & Admin Features
- Ensure OWNER can see cross-organization analytics
- Ensure OWNER can manage resources across all organizations
- Ensure activity logs show all organization activities for OWNER

### Step 5: Client-Side UI Updates
- Ensure admin dashboard components handle unrestricted data
- Update data tables to handle large datasets (all data)

---

## Summary Table: Files Requiring Updates

| Category | Count | Priority | Examples |
|----------|-------|----------|----------|
| API Routes (Core) | 25+ | HIGH | projects, tasks, milestones |
| Org Management APIs | 15+ | HIGH | members, consultants, invitations |
| Admin Routes | 8+ | HIGH | /api/admin/* |
| Analytics APIs | 5+ | HIGH | overview, organization stats |
| Chat APIs | 5+ | MEDIUM | channels, messages |
| Notification APIs | 3+ | MEDIUM | notifications, activity |
| Server Components | 8+ | MEDIUM | admin pages |
| Helper Functions | 3+ | HIGH | check-access, permissions |
| **TOTAL** | **~97** | — | — |

---

## Testing Checklist

- [ ] OWNER user can view projects from all organizations
- [ ] OWNER user can view tasks from all organizations
- [ ] OWNER user can view analytics across all organizations
- [ ] OWNER user can access all activity logs
- [ ] OWNER user can manage members in any organization
- [ ] OWNER user can see all notifications
- [ ] ADMIN users still have organization-scoped access
- [ ] Regular users maintain existing access patterns
- [ ] Performance acceptable with full data access

---

## Known Patterns to Watch For

1. **Membership Verification Pattern**:
   ```typescript
   const { data: membership } = await supabase
     .from("user_organizations")
     .select("role")
     .eq("user_id", userId)
     .eq("organization_id", orgId)
     .single();
   ```
   - OWNER might bypass this check entirely

2. **Multi-Organization Filter Pattern**:
   ```typescript
   .in("organization_id", organizationIds)
   ```
   - For OWNER, should fetch from ALL organizations

3. **Admin Role Check Pattern**:
   ```typescript
   if ((profile as any)?.role !== "ADMIN")
   ```
   - Needs to include OWNER

---

## Related Documentation
- See `CLAUDE.md` - Multi-tenancy section
- See `ARCHITECTURE.md` - Authorization patterns
- Database schema notes on role structure

