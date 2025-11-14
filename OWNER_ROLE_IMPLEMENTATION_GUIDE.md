# OWNER Role Implementation Guide

## Quick Reference: Files to Update

### Priority 1: Role Check Updates (Admin Routes)
These need the most straightforward changes - updating role validation from ADMIN-only to ADMIN+OWNER.

```
/app/api/admin/projects/route.ts (lines 24, 69)
/app/api/admin/tasks/route.ts (lines 24, 70)
/app/api/admin/milestones/route.ts
/app/api/admin/consultants/route.ts (lines 24, 69)
/app/api/admin/clients/route.ts (lines 16, 45)
/app/api/admin/organizations/route.ts
/app/api/admin/users/route.ts
/app/api/admin/notifications/route.ts
/app/api/admin/messaging/channels/route.ts
/app/api/admin/messaging/messages/route.ts
```

### Priority 2: Organization-Scoped Access Patterns
These require conditional logic to bypass organization_id filtering for OWNER.

#### Project Routes
```
/app/api/projects/route.ts (lines 32-108, 135)
/app/api/projects/[projectId]/route.ts (lines 46, 121, 247)
/app/api/projects/[projectId]/tasks/route.ts (lines 48, 182)
/app/api/projects/[projectId]/members/route.ts (lines 45, 71)
/app/api/projects/[projectId]/tags/route.ts (line 45)
/app/api/organizations/[orgId]/projects/route.ts (lines 33, 59, 144)
```

#### Task Routes
```
/app/api/tasks/[taskId]/route.ts (lines 64, 149, 308)
/app/api/tasks/[taskId]/move/route.ts (line 45)
```

#### Milestone Routes
```
/app/api/milestones/[milestoneId]/route.ts (lines 110, 276, 553)
/app/api/milestones/[milestoneId]/tasks/route.ts (lines 49, 229, 363)
/app/api/milestones/[milestoneId]/assignments/route.ts (lines 54, 91, 237)
/app/api/milestones/[milestoneId]/dependencies/route.ts (lines 53, 133, 295)
```

#### Organization Management Routes
```
/app/api/organizations/[orgId]/route.ts (lines 43, 119, 240)
/app/api/organizations/[orgId]/members/route.ts (lines 43, 70, 131, 176)
/app/api/organizations/[orgId]/consultants/route.ts (lines 40, 77, 151, 198, 209)
/app/api/organizations/[orgId]/consultants/[consultantId]/route.ts (multiple)
/app/api/organizations/[orgId]/invitations/route.ts (lines 37, 63)
/app/api/organizations/[orgId]/join-codes/route.ts
```

#### Analytics Routes
```
/app/api/analytics/overview/route.ts (lines 46, 84, 127, 146, 159)
/app/api/organizations/[orgId]/analytics/route.ts (lines 34, 62, 76, 87, 106, 118, 128, 151, 159, 172)
/app/api/dashboard/stats/route.ts (lines 48, 54, 61, 73, 83)
```

#### Chat & Messaging Routes
```
/app/api/messenger/channels/route.ts (lines 40, 43, 54, 119)
/app/api/messenger/messages/route.ts (lines 69, 95, 219, 247)
/app/api/messenger/typing/route.ts (line 54)
/app/api/messenger/reactions/route.ts (lines 67, 80, 95)
/app/api/chat/channels/route.ts (lines 43, 121, 135)
```

#### Notification & Activity Routes
```
/app/api/notifications/route.ts (line 40)
/app/api/activity/route.ts (lines 68, 74)
/app/api/admin/notifications/route.ts
```

### Priority 3: Helper Function Updates
```
/utils/permissions/check-access.ts
  - Update checkOrganizationAccess()
  - Update checkOrganizationAdminAccess()
  - Add isSystemOwner() helper

/lib/notifications.ts
  - Add role parameter to notification functions
  - Bypass organization filtering for OWNER
```

### Priority 4: Type Definitions
```
/types/tasks.ts
/types (any role-related types)
  - Ensure OWNER is in UserRole type union
```

---

## Implementation Patterns

### Pattern 1: Admin Route Role Check
**Change From:**
```typescript
const { data: profile } = await supabase
  .from("profiles")
  .select("role, organization_id")
  .eq("id", user.id)
  .single();

if ((profile as any)?.role !== "ADMIN") {
  return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
}
```

**Change To:**
```typescript
const { data: profile } = await supabase
  .from("profiles")
  .select("role, organization_id")
  .eq("id", user.id)
  .single();

const userRole = (profile as any)?.role;
if (!["ADMIN", "OWNER"].includes(userRole)) {
  return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
}
```

### Pattern 2: Organization-Scoped Query with OWNER Bypass
**Change From:**
```typescript
// Verify user has access to this organization
const { data: membership } = await supabase
  .from("user_organizations")
  .select("role")
  .eq("user_id", user.id)
  .eq("organization_id", organizationId)
  .single();

if (!membership) {
  return NextResponse.json(
    { error: "Not authorized to view projects in this organization" },
    { status: 403 }
  );
}

// Get all projects for this organization
const { data: projects } = await supabase
  .from("projet")
  .select("*")
  .eq("organization_id", organizationId);
```

**Change To:**
```typescript
// Get user's profile to check role
const { data: userProfile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single();

const isOwner = (userProfile as any)?.role === "OWNER";

// Skip membership check for OWNER
if (!isOwner) {
  const { data: membership } = await supabase
    .from("user_organizations")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", organizationId)
    .single();

  if (!membership) {
    return NextResponse.json(
      { error: "Not authorized to view projects in this organization" },
      { status: 403 }
    );
  }
}

// Get projects - filter by org unless OWNER
let query = supabase.from("projet").select("*");

if (!isOwner) {
  query = query.eq("organization_id", organizationId);
}

const { data: projects } = await query;
```

### Pattern 3: Multi-Organization Access (e.g., Analytics Overview)
**Change From:**
```typescript
const { data: memberships } = await supabase
  .from("user_organizations")
  .select("organization_id")
  .eq("user_id", user.id);

const organizationIds = memberships.map(m => m.organization_id);

const { data: invoices } = await supabase
  .from("facture")
  .select("montant, statut_paiement, organization_id")
  .in("organization_id", organizationIds);
```

**Change To:**
```typescript
// Get user's profile to check role
const { data: userProfile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single();

const isOwner = (userProfile as any)?.role === "OWNER";

let query = supabase.from("facture").select("montant, statut_paiement, organization_id");

if (isOwner) {
  // OWNER sees ALL invoices
  const { data: invoices } = await query;
} else {
  // Regular users see only their organization's invoices
  const { data: memberships } = await supabase
    .from("user_organizations")
    .select("organization_id")
    .eq("user_id", user.id);

  const organizationIds = memberships.map(m => m.organization_id);
  const { data: invoices } = await query.in("organization_id", organizationIds);
}
```

---

## Helper Functions to Create

### 1. Create `/lib/auth-helpers.ts`
```typescript
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Check if user has system-wide OWNER role
 * OWNER can access all data across all organizations
 */
export async function isSystemOwner(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    return false;
  }

  return profile.role === "OWNER";
}

/**
 * Get user's role from profile
 */
export async function getUserRole(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  return profile?.role || null;
}

/**
 * Check if user is admin (ADMIN or OWNER)
 */
export async function isAdminUser(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const role = await getUserRole(supabase, userId);
  return role === "ADMIN" || role === "OWNER";
}
```

### 2. Update `/utils/permissions/check-access.ts`
```typescript
// Add to existing functions:

/**
 * Check if user is system owner
 */
export async function checkSystemOwnerAccess(
  supabase: SupabaseClient,
  userId: string,
): Promise<AccessCheckResult> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return {
      hasAccess: false,
      reason: "User not found",
    };
  }

  const hasAccess = data.role === "OWNER";

  return {
    hasAccess,
    role: data.role as UserRole,
    reason: hasAccess ? undefined : "User is not system owner",
  };
}

// Update existing function:
export async function checkOrganizationAccess(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string,
): Promise<AccessCheckResult> {
  // Check if user is system owner first
  const ownerCheck = await checkSystemOwnerAccess(supabase, userId);
  if (ownerCheck.hasAccess) {
    return {
      hasAccess: true,
      role: "OWNER",
    };
  }

  // Then check organization-specific access
  const { data, error } = await supabase
    .from("user_organizations")
    .select("role")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .single();

  if (error || !data) {
    return {
      hasAccess: false,
      reason: "User is not a member of this organization",
    };
  }

  const allowedRoles: UserRole[] = ["MANAGER", "ADMIN"];
  const hasAccess = allowedRoles.includes(data.role as UserRole);

  return {
    hasAccess,
    role: data.role as UserRole,
    reason: hasAccess
      ? undefined
      : "Insufficient permissions (requires MANAGER or ADMIN role)",
  };
}
```

---

## Checklist: Implementation Steps

### Phase 1: Infrastructure (1-2 hours)
- [ ] Verify OWNER role is in UserRole type definition
- [ ] Create `/lib/auth-helpers.ts` with helper functions
- [ ] Update `/utils/permissions/check-access.ts` with system owner check

### Phase 2: Admin Routes (2-3 hours)
- [ ] Update all admin route role checks (`/app/api/admin/*`)
- [ ] Test admin routes with OWNER user
- [ ] Verify admin pages still work correctly

### Phase 3: Organization-Scoped Routes (4-5 hours)
By category:
- [ ] Project routes (5 files)
- [ ] Task routes (2 files)
- [ ] Milestone routes (4 files)
- [ ] Organization management routes (6 files)
- [ ] Analytics routes (3 files)
- [ ] Chat/messaging routes (4 files)
- [ ] Notification/activity routes (2 files)

For each:
1. Fetch user role at start of route
2. Check `const isOwner = role === "OWNER"`
3. Wrap organization_id filters in `if (!isOwner) { ... }`

### Phase 4: Testing (3-4 hours)
- [ ] Create test OWNER user
- [ ] Test each route category with OWNER user
- [ ] Test cross-organization data access
- [ ] Test analytics with OWNER
- [ ] Verify ADMIN users still have scoped access
- [ ] Verify regular users maintain existing access
- [ ] Performance testing with full data access

### Phase 5: Edge Cases (1-2 hours)
- [ ] Test notification filtering for OWNER
- [ ] Test activity log filtering for OWNER
- [ ] Test chat/messaging access for OWNER
- [ ] Test member management for OWNER across orgs

---

## Code Review Checklist

For each modified file:
- [ ] OWNER bypass logic is correct
- [ ] Non-OWNER access remains scoped
- [ ] Error handling is appropriate
- [ ] No security vulnerabilities introduced
- [ ] Performance is acceptable
- [ ] Tests pass
- [ ] Type safety maintained

---

## Deployment Considerations

1. **Database**: No schema changes needed - OWNER role can use existing structure
2. **Migrations**: No migrations required
3. **Backwards Compatibility**: Fully compatible - just adds new access level
4. **Rollback**: Can revert code changes to restore OWNER scoped access
5. **Monitoring**: Watch for unusual cross-organization data access patterns

---

## Related Files Already Updated

These files already have OWNER role recognition - verify they align with changes:

```
/app/app/(admin)/layout.tsx
  - Line: "profile?.role !== "ADMIN" && profile?.role !== "OWNER""
  - Already includes OWNER check

/app/api/organizations/[orgId]/route.ts
  - Uses ["ADMIN", "OWNER"] pattern
  - DELETE operation requires OWNER

/app/api/organizations/[orgId]/members/route.ts
  - Already checks ["ADMIN", "OWNER"]

/app/api/organizations/[orgId]/consultants/route.ts
  - Already checks ["ADMIN", "OWNER"]

/app/api/organizations/[orgId]/invitations/route.ts
  - Already checks ["ADMIN", "OWNER"]
```

These show the correct pattern to follow for new updates.

