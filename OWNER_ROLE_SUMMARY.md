# OWNER Role Access Implementation Summary

## Overview

This document summarizes the work needed to implement unrestricted data access for the OWNER role across the Aurentia platform. The OWNER role should have system-wide access to all data across all organizations, bypassing the standard organization-scoped filtering.

## Key Findings

### Current State
- OWNER role is already recognized in some role checks (e.g., `["ADMIN", "OWNER"]` patterns)
- The role exists in the database but is not yet fully integrated into data access patterns
- Admin pages (`/app/app/(admin)/admin/*`) already fetch all data without org filtering (good base)
- Some API routes already show correct patterns for OWNER handling

### Gap Analysis
- **97 query locations** across 60+ files need to be reviewed/updated
- Most are `.eq("organization_id", orgId)` filters that need conditional logic
- Many admin routes check `profile?.role !== "ADMIN"` instead of including OWNER
- Some helper functions in `utils/permissions/` don't account for OWNER role

### Critical Locations

#### Admin Routes (Straightforward updates)
10+ routes in `/app/api/admin/*` need role checks updated:
- `/app/api/admin/projects/route.ts`
- `/app/api/admin/tasks/route.ts`
- `/app/api/admin/consultants/route.ts`
- `/app/api/admin/clients/route.ts`
- And 6+ more...

#### Organization-Scoped Routes (Complex updates)
50+ routes need conditional organization_id filtering:
- Project routes (6 files)
- Task routes (2 files)
- Milestone routes (4 files)
- Organization management (7 files)
- Analytics (3 files)
- Chat/messaging (4 files)
- Notifications/activity (2 files)

#### Helper Functions (Support work)
- `/utils/permissions/check-access.ts` needs new functions
- `/lib/notifications.ts` might need role-aware filtering
- Type definitions need verification

## Implementation Effort

### Estimated Timeline
- **Phase 1 (Infrastructure)**: 1-2 hours - Create helpers and update types
- **Phase 2 (Admin routes)**: 2-3 hours - Update role checks
- **Phase 3 (Org-scoped routes)**: 4-5 hours - Add conditional filtering logic
- **Phase 4 (Testing)**: 3-4 hours - Comprehensive test coverage
- **Phase 5 (Edge cases)**: 1-2 hours - Notifications, activity logs, etc.

**Total: 11-16 hours of development work**

## Implementation Approach

### Three Types of Changes Required

#### Type A: Role Check Updates (Simplest)
Change from ADMIN-only checks to ADMIN+OWNER:
```typescript
// Before
if ((profile as any)?.role !== "ADMIN") { ... }

// After
if (!["ADMIN", "OWNER"].includes((profile as any)?.role)) { ... }
```

**Files**: 10+ admin routes
**Effort**: 2-3 hours

#### Type B: Conditional Organization Filtering (Medium)
Add OWNER bypass to organization-scoped queries:
```typescript
const isOwner = userRole === "OWNER";
let query = supabase.from("projet").select("*");
if (!isOwner) {
  query = query.eq("organization_id", organizationId);
}
```

**Files**: 40+ API routes
**Effort**: 4-5 hours

#### Type C: Multi-Organization Access (Complex)
Handle analytics and cross-org queries:
```typescript
if (isOwner) {
  // Fetch ALL data
} else {
  // Fetch only user's organizations
}
```

**Files**: Analytics and activity routes
**Effort**: 2-3 hours

## Documentation Generated

### 1. OWNER_ROLE_ACCESS_REPORT.md
Comprehensive catalog of all 97 query locations with:
- Exact file paths and line numbers
- Current filtering logic
- Required actions
- Organized by feature area
- Summary table showing effort distribution

**Use For**: Understanding scope and prioritization

### 2. OWNER_ROLE_IMPLEMENTATION_GUIDE.md
Step-by-step implementation instructions with:
- Quick reference file lists by priority
- Three implementation patterns with before/after code
- Helper functions to create
- Detailed checklist for all phases
- Code review guidelines
- Testing checklist

**Use For**: Actual development and coding

### 3. This Summary Document
High-level overview for stakeholders

## Testing Strategy

### Must Test
- [ ] OWNER user can access projects from all organizations
- [ ] OWNER user can view all tasks across orgs
- [ ] OWNER user can see all analytics without org filter
- [ ] OWNER user can access activity logs from all orgs
- [ ] OWNER user can manage members in any organization
- [ ] OWNER user can manage consultants across all orgs

### Regression Tests
- [ ] ADMIN users still have organization-scoped access only
- [ ] MANAGER users maintain their access patterns
- [ ] CONSULTANT users see only assigned tasks/projects
- [ ] CLIENT users see only relevant information
- [ ] Regular users cannot escalate privileges

### Performance Tests
- [ ] Analytics queries with full dataset access are fast enough
- [ ] Activity logs scale acceptably with all data
- [ ] No N+1 query problems introduced
- [ ] Database indexes still effective

## Deployment Plan

### Pre-Deployment
1. Code review of all changes
2. Comprehensive testing on staging environment
3. Performance benchmarking
4. Security audit to ensure no unauthorized access

### Deployment
1. Deploy to production during low-traffic period
2. Monitor logs for access anomalies
3. Check performance metrics
4. Verify OWNER users can access intended data

### Post-Deployment
1. 24-hour monitoring window
2. Gather feedback from OWNER users
3. Address any edge cases found
4. Document any behavioral differences

## Risk Assessment

### Low Risk
- No database schema changes required
- No data migrations needed
- Fully backwards compatible
- Can be easily rolled back

### Medium Risk
- Performance impact if OWNER queries large datasets
- Potential security issues if implementation has gaps
- Auth-related changes always warrant caution

### Mitigation
- Thorough code review of all auth logic
- Extensive testing before deployment
- Staged rollout if possible
- Monitoring and alerts for unusual access patterns

## Success Criteria

After implementation:
- [ ] OWNER role has unrestricted access to all organizations
- [ ] Other roles maintain organization-scoped access
- [ ] Admin pages show full cross-organizational data
- [ ] Analytics available for all organizations to OWNER
- [ ] All tests pass
- [ ] No security vulnerabilities
- [ ] Performance acceptable
- [ ] Code review approved

## Next Steps

1. **Review Documentation**: Read both detailed documents
2. **Assess Resources**: Determine who will implement
3. **Plan Timeline**: Schedule implementation phases
4. **Set Up Testing**: Prepare test environment and test users
5. **Begin Phase 1**: Start with helper function implementation
6. **Iterate**: Work through phases 2-5 in sequence

## File Locations

All documentation saved to project root:
- `/OWNER_ROLE_ACCESS_REPORT.md` - Comprehensive catalog
- `/OWNER_ROLE_IMPLEMENTATION_GUIDE.md` - Implementation instructions
- `/OWNER_ROLE_SUMMARY.md` - This file

## Questions & Clarifications

### About OWNER Role Scope
**Q**: Should OWNER be able to see/modify user profile data?
**A**: If yes, check `/app/api/profiles/` routes and admin user management

**Q**: Should OWNER have billing/subscription access?
**A**: If yes, verify billing-related routes have OWNER checks

**Q**: Should OWNER access logs show all user actions?
**A**: Likely yes - verify activity logging includes all orgs for OWNER

### About Implementation
**Q**: Can this be done incrementally?
**A**: Yes - implement by feature area, test each before moving on

**Q**: Should we create an OWNER-specific set of routes?
**A**: No - reuse existing routes with conditional filtering for cleaner architecture

**Q**: How do we test without creating real OWNER users?
**A**: Create test users with OWNER role in staging environment

## Related Documentation

See these files for broader context:
- `CLAUDE.md` - Project guidelines and patterns
- `ARCHITECTURE.md` - Technical architecture and authorization patterns
- Database schema documentation - Role structure details

---

**Generated**: 2025-11-14  
**Scope**: Full codebase OWNER role access implementation  
**Total Files Affected**: 60+  
**Total Queries to Update**: 97+  
**Estimated Effort**: 11-16 hours
