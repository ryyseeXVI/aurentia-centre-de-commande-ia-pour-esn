## 🗄️ **`/db`** — Create Database Migration

Generate production-ready database migrations with proper schema, RLS policies, indexes, triggers, and multi-tenancy patterns for this boilerplate.

### Your Task

When the user requests a database change:

1. **Understand Requirements**:
   - New table creation or alter existing?
   - Multi-tenant (needs organization_id)? Usually YES!
   - Relationships to other tables?
   - Required columns and data types
   - Unique constraints needed?
   - Indexes for performance?

2. **Create Complete Migration File**:

   **File Location**: `supabase/migrations/###_description_in_snake_case.sql`

   **Naming Convention**: Next sequential number + descriptive name
   - Example: `20240115000000_create_resources_table.sql`
   - Use timestamp: `date +%Y%m%d%H%M%S`

   **Template for New Multi-Tenant Table**:

   ```sql
   -- Create resources table
   CREATE TABLE IF NOT EXISTS resources (
     -- Primary key
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

     -- Multi-tenancy (CRITICAL for workspace-scoped data!)
     organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

     -- Audit fields
     created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

     -- Resource-specific fields (all snake_case!)
     name VARCHAR(100) NOT NULL,
     description TEXT,
     status VARCHAR(20) NOT NULL DEFAULT 'active',
     priority INTEGER DEFAULT 0,
     metadata JSONB DEFAULT '{}'::jsonb,

     -- Constraints
     CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'archived')),
     CONSTRAINT valid_priority CHECK (priority >= 0 AND priority <= 10)
   );

   -- Create indexes (IMPORTANT for performance!)
   CREATE INDEX IF NOT EXISTS idx_resources_organization_id
     ON resources(organization_id);

   CREATE INDEX IF NOT EXISTS idx_resources_status
     ON resources(status);

   CREATE INDEX IF NOT EXISTS idx_resources_created_by
     ON resources(created_by);

   -- Composite index for common queries
   CREATE INDEX IF NOT EXISTS idx_resources_org_status
     ON resources(organization_id, status);

   -- Enable Row Level Security (CRITICAL for multi-tenancy!)
   ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

   -- RLS Policy: Users can SELECT resources from their organizations
   CREATE POLICY "Users can view resources from their organizations"
     ON resources
     FOR SELECT
     USING (
       organization_id IN (
         SELECT organization_id
         FROM user_organizations
         WHERE user_id = auth.uid()
       )
     );

   -- RLS Policy: Users can INSERT resources into their organizations
   CREATE POLICY "Users can create resources in their organizations"
     ON resources
     FOR INSERT
     WITH CHECK (
       organization_id IN (
         SELECT organization_id
         FROM user_organizations
         WHERE user_id = auth.uid()
       )
     );

   -- RLS Policy: Users can UPDATE resources in their organizations
   -- (Optionally restrict to ADMIN/OWNER roles)
   CREATE POLICY "Users can update resources in their organizations"
     ON resources
     FOR UPDATE
     USING (
       organization_id IN (
         SELECT organization_id
         FROM user_organizations
         WHERE user_id = auth.uid()
       )
     )
     WITH CHECK (
       organization_id IN (
         SELECT organization_id
         FROM user_organizations
         WHERE user_id = auth.uid()
       )
     );

   -- RLS Policy: Only OWNER can DELETE resources
   CREATE POLICY "Only owners can delete resources"
     ON resources
     FOR DELETE
     USING (
       organization_id IN (
         SELECT organization_id
         FROM user_organizations
         WHERE user_id = auth.uid()
           AND role = 'OWNER'
       )
     );

   -- Create trigger for updated_at (auto-update timestamp)
   CREATE OR REPLACE FUNCTION update_updated_at_column()
   RETURNS TRIGGER AS $$
   BEGIN
     NEW.updated_at = now();
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER update_resources_updated_at
     BEFORE UPDATE ON resources
     FOR EACH ROW
     EXECUTE FUNCTION update_updated_at_column();

   -- Add comments for documentation
   COMMENT ON TABLE resources IS 'Stores resource data with multi-tenant isolation';
   COMMENT ON COLUMN resources.organization_id IS 'Foreign key to organizations table for multi-tenancy';
   COMMENT ON COLUMN resources.status IS 'Resource status: active, inactive, or archived';
   ```

3. **RLS Policy Templates**:

   **Basic Multi-Tenant SELECT** (view own organization's data):
   ```sql
   CREATE POLICY "policy_name"
     ON table_name
     FOR SELECT
     USING (
       organization_id IN (
         SELECT organization_id
         FROM user_organizations
         WHERE user_id = auth.uid()
       )
     );
   ```

   **Role-Based SELECT** (ADMIN and OWNER only):
   ```sql
   CREATE POLICY "policy_name"
     ON table_name
     FOR SELECT
     USING (
       organization_id IN (
         SELECT organization_id
         FROM user_organizations
         WHERE user_id = auth.uid()
           AND role IN ('ADMIN', 'OWNER')
       )
     );
   ```

   **INSERT with CHECK**:
   ```sql
   CREATE POLICY "policy_name"
     ON table_name
     FOR INSERT
     WITH CHECK (
       organization_id IN (
         SELECT organization_id
         FROM user_organizations
         WHERE user_id = auth.uid()
       )
     );
   ```

   **UPDATE with USING and WITH CHECK**:
   ```sql
   CREATE POLICY "policy_name"
     ON table_name
     FOR UPDATE
     USING (
       organization_id IN (
         SELECT organization_id
         FROM user_organizations
         WHERE user_id = auth.uid()
       )
     )
     WITH CHECK (
       organization_id IN (
         SELECT organization_id
         FROM user_organizations
         WHERE user_id = auth.uid()
       )
     );
   ```

   **DELETE with role check** (OWNER only):
   ```sql
   CREATE POLICY "policy_name"
     ON table_name
     FOR DELETE
     USING (
       organization_id IN (
         SELECT organization_id
         FROM user_organizations
         WHERE user_id = auth.uid()
           AND role = 'OWNER'
       )
     );
   ```

   **User's own records** (for non-organization data like user settings):
   ```sql
   CREATE POLICY "Users can manage their own records"
     ON table_name
     FOR ALL
     USING (user_id = auth.uid())
     WITH CHECK (user_id = auth.uid());
   ```

4. **Common Column Patterns**:

   ```sql
   -- UUID primary key
   id UUID PRIMARY KEY DEFAULT gen_random_uuid()

   -- Organization foreign key (multi-tenancy)
   organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE

   -- User foreign key
   created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
   assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL

   -- Timestamps
   created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   deleted_at TIMESTAMPTZ -- for soft deletes

   -- Text fields
   name VARCHAR(100) NOT NULL
   description TEXT
   slug VARCHAR(100) UNIQUE

   -- Enums (use VARCHAR with CHECK constraint)
   status VARCHAR(20) NOT NULL DEFAULT 'active'
   CONSTRAINT valid_status CHECK (status IN ('active', 'inactive'))

   -- Numbers
   priority INTEGER DEFAULT 0
   quantity DECIMAL(10,2)

   -- Booleans
   is_active BOOLEAN DEFAULT true

   -- JSON
   metadata JSONB DEFAULT '{}'::jsonb
   settings JSONB

   -- Arrays
   tags TEXT[]
   ```

5. **Foreign Key Patterns**:

   ```sql
   -- Cascade delete when organization is deleted
   organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE

   -- Set NULL when user is deleted (preserve data)
   created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL

   -- Restrict deletion if referenced (default)
   parent_id UUID REFERENCES table_name(id) ON DELETE RESTRICT

   -- No action (must be handled manually)
   related_id UUID REFERENCES table_name(id) ON DELETE NO ACTION
   ```

6. **Index Strategies**:

   ```sql
   -- Foreign keys (ALWAYS index these!)
   CREATE INDEX idx_table_organization_id ON table_name(organization_id);
   CREATE INDEX idx_table_user_id ON table_name(user_id);

   -- Frequently queried columns
   CREATE INDEX idx_table_status ON table_name(status);
   CREATE INDEX idx_table_created_at ON table_name(created_at DESC);

   -- Composite indexes for common query patterns
   CREATE INDEX idx_table_org_status ON table_name(organization_id, status);
   CREATE INDEX idx_table_org_created ON table_name(organization_id, created_at DESC);

   -- Partial indexes for specific conditions
   CREATE INDEX idx_table_active ON table_name(organization_id)
     WHERE status = 'active';

   -- Unique indexes
   CREATE UNIQUE INDEX idx_table_slug ON table_name(organization_id, slug);

   -- Full-text search
   CREATE INDEX idx_table_name_search ON table_name
     USING gin(to_tsvector('english', name));
   ```

7. **Alter Table Examples**:

   ```sql
   -- Add column
   ALTER TABLE table_name ADD COLUMN IF NOT EXISTS new_column VARCHAR(100);

   -- Add column with default
   ALTER TABLE table_name ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;

   -- Modify column
   ALTER TABLE table_name ALTER COLUMN column_name TYPE TEXT;
   ALTER TABLE table_name ALTER COLUMN column_name SET NOT NULL;
   ALTER TABLE table_name ALTER COLUMN column_name SET DEFAULT 'value';

   -- Add constraint
   ALTER TABLE table_name ADD CONSTRAINT constraint_name
     CHECK (column_name IN ('value1', 'value2'));

   -- Drop column (careful!)
   ALTER TABLE table_name DROP COLUMN IF EXISTS column_name;

   -- Rename column
   ALTER TABLE table_name RENAME COLUMN old_name TO new_name;
   ```

8. **Rollback Migration**:

   Create a separate rollback file or add rollback SQL in comments:

   ```sql
   -- Rollback: Drop table and related objects
   /*
   DROP TRIGGER IF EXISTS update_resources_updated_at ON resources;
   DROP POLICY IF EXISTS "Users can view resources from their organizations" ON resources;
   DROP POLICY IF EXISTS "Users can create resources in their organizations" ON resources;
   DROP POLICY IF EXISTS "Users can update resources in their organizations" ON resources;
   DROP POLICY IF EXISTS "Only owners can delete resources" ON resources;
   DROP TABLE IF EXISTS resources;
   */
   ```

### Post-Migration Steps

After creating migration SQL:

1. **Apply Migration**:
   ```bash
   # Via Supabase Dashboard:
   # 1. Go to SQL Editor in Supabase Dashboard
   # 2. Paste migration SQL
   # 3. Run query
   # 4. Verify no errors
   ```

2. **Regenerate Types**:
   ```bash
   # Update TypeScript types from database schema
   npx supabase gen types typescript \
     --project-id YOUR_PROJECT_ID \
     > utils/supabase/types.ts
   ```

3. **Create TypeScript Interfaces**:
   ```typescript
   // types/resource.ts
   export interface Resource {
     id: string
     organizationId: string
     createdBy: string | null
     createdAt: string
     updatedAt: string
     name: string
     description: string | null
     status: 'active' | 'inactive' | 'archived'
     priority: number
     metadata: Record<string, any>
   }

   export interface CreateResourceInput {
     name: string
     description?: string
     status?: 'active' | 'inactive'
     priority?: number
   }

   export interface UpdateResourceInput {
     name?: string
     description?: string
     status?: 'active' | 'inactive'
     priority?: number
   }
   ```

4. **Test Migration**:
   ```sql
   -- Test RLS policies
   SET ROLE authenticated;
   SET request.jwt.claim.sub = 'user-uuid';

   -- Try to insert
   INSERT INTO resources (organization_id, name)
   VALUES ('org-uuid', 'Test Resource');

   -- Try to select
   SELECT * FROM resources WHERE organization_id = 'org-uuid';
   ```

5. **Document Schema**:
   - Use `/doc` to add to `docs/core-concepts/03-database-schema.md`

### Output

After creating migration, provide:

1. **Migration File**:
   - File path: `supabase/migrations/###_description.sql`
   - Tables created/modified
   - RLS enabled: Yes/No

2. **Schema Summary**:
   - Table name
   - Columns with types
   - Indexes created
   - Foreign keys
   - Constraints

3. **RLS Policies**:
   - SELECT: Who can view data
   - INSERT: Who can create data
   - UPDATE: Who can modify data
   - DELETE: Who can remove data

4. **Next Steps**:
   ```bash
   # 1. Apply migration via Supabase Dashboard SQL Editor

   # 2. Regenerate types
   npx supabase gen types typescript \
     --project-id YOUR_PROJECT_ID \
     > utils/supabase/types.ts

   # 3. Create TypeScript interfaces in types/

   # 4. Create API routes with /api command

   # 5. Document with /doc command
   ```

### Related Commands

- After database changes: Use `/api` to create API routes
- Create feature: Use `/feature` for complete implementation
- Document schema: Use `/doc` to add to database docs
- Verify migration: Use `/check` to verify patterns

### Critical Checklist

- [ ] All table names in snake_case
- [ ] All column names in snake_case
- [ ] organization_id column for multi-tenant tables
- [ ] RLS enabled with ALTER TABLE ... ENABLE ROW LEVEL SECURITY
- [ ] RLS policies for SELECT, INSERT, UPDATE, DELETE
- [ ] Indexes on organization_id and all foreign keys
- [ ] ON DELETE CASCADE for organization_id foreign key
- [ ] updated_at trigger created
- [ ] Constraints for data validation
- [ ] Comments added for documentation
- [ ] Types will be regenerated after applying

### Common Patterns

**One-to-Many**: Task belongs to Organization
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ...
);
```

**Many-to-Many**: Users ↔ Projects (junction table)
```sql
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  UNIQUE(project_id, user_id)
);
```

**Soft Delete**: Keep deleted records
```sql
deleted_at TIMESTAMPTZ,

-- RLS policy excludes soft-deleted
CREATE POLICY "policy_name"
  ON table_name
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND organization_id IN (...)
  );
```

**Hierarchical Data**: Parent-child relationships
```sql
parent_id UUID REFERENCES table_name(id) ON DELETE CASCADE,

-- Index for tree queries
CREATE INDEX idx_table_parent_id ON table_name(parent_id);
```
