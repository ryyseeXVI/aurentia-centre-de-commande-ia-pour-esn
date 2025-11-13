# Database Migrations Guide

Apply these migrations **in order** through the Supabase SQL Editor.

## 📍 Where to Apply

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **aurentia-centre-de-commande-ia-pour-esn**
3. Click **SQL Editor** in the sidebar
4. For each migration below, copy the file contents and click **Run**

---

## 🚀 Migrations (Apply in This Order)

### 1. **Add Missing Foreign Key Indexes**
**File:** `supabase/migrations/20251113191446_add_missing_foreign_key_indexes.sql`
**Purpose:** Performance optimization - 30-70% faster JOINs
**Time:** ~10 seconds

### 2. **Fix CASCADE Delete Constraints**
**File:** `supabase/migrations/20251113191447_fix_cascade_delete_constraints.sql`
**Purpose:** Enable cascade deletion (deleting projet → deletes all related data)
**Time:** ~5 seconds

### 3. **Convert VARCHAR to TEXT**
**File:** `supabase/migrations/20251113191449_convert_varchar_to_text.sql`
**Purpose:** PostgreSQL best practice, more flexible
**Time:** ~2 seconds

### 4. **Enable Realtime Subscriptions**
**File:** `supabase/migrations/20251113191450_enable_realtime_subscriptions.sql`
**Purpose:** Enable real-time updates for 10 tables (dashboard, tasks, incidents, etc.)
**Time:** ~3 seconds

**Verify realtime is enabled:**
```sql
SELECT tablename FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
```
Should return 10 tables.

### 5. **Implement Multi-Tenancy**
**File:** `supabase/migrations/20251113191500_implement_multi_tenancy.sql`
**Purpose:** Add organizations, organization_id to all tables
**Time:** ~20 seconds

**Verify organizations created:**
```sql
SELECT * FROM organizations;
SELECT COUNT(*) FROM information_schema.columns
WHERE column_name = 'organization_id' AND table_schema = 'public';
```
Should show 1 organization and 17 tables with organization_id.

### 6. **Update RLS Policies for Multi-Tenancy**
**File:** `supabase/migrations/20251113191501_update_rls_policies_for_multi_tenancy.sql`
**Purpose:** Implement organization-scoped data access
**Time:** ~15 seconds

**Verify RLS policies:**
```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```
Each table should have 3-4 policies.

---

## ⚠️ Post-Migration: Assign Users to Organization

After migration 6, users need to be assigned to the default organization:

```sql
-- Get your user ID
SELECT id, email FROM auth.users;

-- Assign yourself as OWNER of default organization
INSERT INTO user_organizations (user_id, organization_id, role)
VALUES (
  'YOUR_USER_ID_HERE'::UUID,
  '00000000-0000-0000-0000-000000000001'::UUID,
  'OWNER'
);

-- Or assign ALL existing users as ADMINs
INSERT INTO user_organizations (user_id, organization_id, role)
SELECT
  id,
  '00000000-0000-0000-0000-000000000001'::UUID,
  'ADMIN'
FROM auth.users
ON CONFLICT (user_id, organization_id) DO NOTHING;
```

---

## ✅ Final Verification

Run this to verify everything is set up correctly:

```sql
-- Check realtime tables (should be 10)
SELECT COUNT(*) as realtime_tables FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Check foreign key indexes (should be 20+)
SELECT COUNT(*) as index_count FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%';

-- Check CASCADE constraints (should be 11)
SELECT COUNT(*) as cascade_count FROM information_schema.referential_constraints
WHERE constraint_schema = 'public' AND delete_rule = 'CASCADE';

-- Check organization_id columns (should be 17)
SELECT COUNT(*) as org_id_columns FROM information_schema.columns
WHERE table_schema = 'public' AND column_name = 'organization_id';

-- Check RLS policies (should be 50+)
SELECT COUNT(*) as policy_count FROM pg_policies WHERE schemaname = 'public';

-- Check user assignments
SELECT COUNT(*) as assigned_users FROM user_organizations;
```

---

## 📋 Expected Results

After all migrations:
- ✅ 20+ indexes on foreign keys
- ✅ 11 CASCADE delete constraints
- ✅ All VARCHAR → TEXT
- ✅ 10 tables with realtime enabled
- ✅ 17 tables with organization_id
- ✅ 50+ RLS policies
- ✅ 1 default organization
- ✅ Users assigned to organization

---

## 🎯 Next Steps

1. Update your application code to include `organization_id` in queries
2. Test realtime subscriptions in your frontend
3. Create additional organizations if needed
4. Invite team members and assign them to organizations

---

## 📚 Role Permissions

- **OWNER**: Full access, can delete everything
- **ADMIN**: Manage consultants, budgets, invoices, competences
- **MANAGER**: Manage projects, assignments, tasks, incidents
- **MEMBER**: View and update tasks, time tracking
