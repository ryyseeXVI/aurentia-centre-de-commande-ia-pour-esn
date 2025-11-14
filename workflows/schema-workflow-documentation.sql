-- ============================================================================
-- WORKFLOW DOCUMENTATION WITH STICKY NOTES
-- Schema for visual and interactive workflow documentation
-- ============================================================================

-- ============================================================================
-- TABLE: workflow_documentation
-- Purpose: Store main workflow information
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_documentation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Workflow identification
  workflow_code VARCHAR(10) NOT NULL, -- WF1, WF2, etc.
  workflow_name VARCHAR(255) NOT NULL,
  workflow_version VARCHAR(10) DEFAULT '1.0',

  -- Workflow metadata
  objective TEXT NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50), -- 'schedule', 'webhook', 'manual', 'event'
  trigger_config JSONB, -- { "cron": "0 7 * * *", "frequency": "daily" }

  -- Priority and phase
  priority VARCHAR(20), -- 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
  phase VARCHAR(20), -- 'MVP', 'PRODUCTION', 'OPTIMIZATION'
  status VARCHAR(20) DEFAULT 'INACTIVE', -- 'ACTIVE', 'INACTIVE', 'DEVELOPMENT', 'TESTING'

  -- Cost estimation
  cost_per_execution DECIMAL(10, 4),
  cost_per_month DECIMAL(10, 4),

  -- N8N integration
  n8n_workflow_id VARCHAR(100), -- N8N workflow ID if deployed
  n8n_workflow_url TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),

  CONSTRAINT workflow_code_org_unique UNIQUE (organization_id, workflow_code)
);

-- ============================================================================
-- TABLE: workflow_sticky_note
-- Purpose: Individual sticky notes for workflow documentation
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_sticky_note (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflow_documentation(id) ON DELETE CASCADE,

  -- Note identification
  note_type VARCHAR(50) NOT NULL, -- 'overview', 'step', 'data', 'dependency', 'warning', 'cost', 'custom'
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,

  -- Visual properties
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  width INTEGER DEFAULT 300,
  height INTEGER DEFAULT 200,
  color VARCHAR(20) DEFAULT 'yellow', -- 'yellow', 'blue', 'green', 'red', 'orange', 'purple', 'pink'

  -- Ordering and grouping
  display_order INTEGER DEFAULT 0,
  group_id VARCHAR(100), -- To group related notes together

  -- Rich content
  metadata JSONB, -- Additional structured data
  attachments JSONB, -- Links, files, references

  -- State
  is_pinned BOOLEAN DEFAULT FALSE,
  is_collapsed BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- ============================================================================
-- TABLE: workflow_data_flow
-- Purpose: Track input/output tables for each workflow
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_data_flow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflow_documentation(id) ON DELETE CASCADE,

  -- Table information
  table_name VARCHAR(100) NOT NULL,
  table_schema VARCHAR(100) DEFAULT 'public',
  flow_type VARCHAR(10) NOT NULL, -- 'READ', 'WRITE', 'BOTH'

  -- Description
  purpose TEXT,
  columns_used TEXT[], -- Array of column names used

  -- Visual representation
  position_x INTEGER,
  position_y INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT workflow_table_unique UNIQUE (workflow_id, table_name, flow_type)
);

-- ============================================================================
-- TABLE: workflow_dependency
-- Purpose: Track dependencies between workflows
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_dependency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dependency relationship
  workflow_id UUID NOT NULL REFERENCES workflow_documentation(id) ON DELETE CASCADE,
  depends_on_workflow_id UUID NOT NULL REFERENCES workflow_documentation(id) ON DELETE CASCADE,

  -- Dependency details
  dependency_type VARCHAR(50), -- 'REQUIRED', 'OPTIONAL', 'RECOMMENDED'
  description TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT no_self_dependency CHECK (workflow_id != depends_on_workflow_id),
  CONSTRAINT workflow_dependency_unique UNIQUE (workflow_id, depends_on_workflow_id)
);

-- ============================================================================
-- TABLE: workflow_step
-- Purpose: Individual steps/nodes in the workflow
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_step (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflow_documentation(id) ON DELETE CASCADE,

  -- Step identification
  step_number INTEGER NOT NULL,
  step_name VARCHAR(255) NOT NULL,
  step_type VARCHAR(50), -- 'trigger', 'data', 'transform', 'condition', 'action', 'loop', 'log'

  -- Step details
  description TEXT,
  code_snippet TEXT,
  n8n_node_type VARCHAR(100), -- e.g., 'n8n-nodes-base.code', 'n8n-nodes-base.supabase'
  n8n_node_id VARCHAR(100),

  -- Visual position
  position_x INTEGER,
  position_y INTEGER,

  -- Configuration
  configuration JSONB,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT workflow_step_number_unique UNIQUE (workflow_id, step_number)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Main indexes
CREATE INDEX idx_workflow_doc_org ON workflow_documentation(organization_id);
CREATE INDEX idx_workflow_doc_code ON workflow_documentation(workflow_code);
CREATE INDEX idx_workflow_doc_status ON workflow_documentation(status);
CREATE INDEX idx_workflow_doc_phase ON workflow_documentation(phase);

-- Sticky notes indexes
CREATE INDEX idx_sticky_note_workflow ON workflow_sticky_note(workflow_id);
CREATE INDEX idx_sticky_note_type ON workflow_sticky_note(note_type);
CREATE INDEX idx_sticky_note_group ON workflow_sticky_note(group_id);
CREATE INDEX idx_sticky_note_pinned ON workflow_sticky_note(is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX idx_sticky_note_archived ON workflow_sticky_note(is_archived) WHERE is_archived = FALSE;

-- Data flow indexes
CREATE INDEX idx_data_flow_workflow ON workflow_data_flow(workflow_id);
CREATE INDEX idx_data_flow_table ON workflow_data_flow(table_name);
CREATE INDEX idx_data_flow_type ON workflow_data_flow(flow_type);

-- Dependency indexes
CREATE INDEX idx_dependency_workflow ON workflow_dependency(workflow_id);
CREATE INDEX idx_dependency_depends_on ON workflow_dependency(depends_on_workflow_id);

-- Step indexes
CREATE INDEX idx_step_workflow ON workflow_step(workflow_id);
CREATE INDEX idx_step_number ON workflow_step(step_number);
CREATE INDEX idx_step_type ON workflow_step(step_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE workflow_documentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_sticky_note ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_data_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_dependency ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_step ENABLE ROW LEVEL SECURITY;

-- RLS Policy: workflow_documentation
CREATE POLICY workflow_documentation_select ON workflow_documentation
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY workflow_documentation_insert ON workflow_documentation
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('ADMIN', 'MANAGER')
    )
  );

CREATE POLICY workflow_documentation_update ON workflow_documentation
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('ADMIN', 'MANAGER')
    )
  );

CREATE POLICY workflow_documentation_delete ON workflow_documentation
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role = 'ADMIN'
    )
  );

-- RLS Policy: workflow_sticky_note (via workflow's organization)
CREATE POLICY sticky_note_select ON workflow_sticky_note
  FOR SELECT
  USING (
    workflow_id IN (
      SELECT id FROM workflow_documentation WHERE organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY sticky_note_insert ON workflow_sticky_note
  FOR INSERT
  WITH CHECK (
    workflow_id IN (
      SELECT id FROM workflow_documentation WHERE organization_id IN (
        SELECT organization_id FROM user_organizations
        WHERE user_id = auth.uid()
        AND role IN ('ADMIN', 'MANAGER')
      )
    )
  );

CREATE POLICY sticky_note_update ON workflow_sticky_note
  FOR UPDATE
  USING (
    workflow_id IN (
      SELECT id FROM workflow_documentation WHERE organization_id IN (
        SELECT organization_id FROM user_organizations
        WHERE user_id = auth.uid()
        AND role IN ('ADMIN', 'MANAGER')
      )
    )
  );

CREATE POLICY sticky_note_delete ON workflow_sticky_note
  FOR DELETE
  USING (
    workflow_id IN (
      SELECT id FROM workflow_documentation WHERE organization_id IN (
        SELECT organization_id FROM user_organizations
        WHERE user_id = auth.uid()
        AND role IN ('ADMIN', 'MANAGER')
      )
    )
  );

-- Similar RLS policies for other tables (abbreviated for brevity)
CREATE POLICY data_flow_select ON workflow_data_flow FOR SELECT USING (
  workflow_id IN (SELECT id FROM workflow_documentation WHERE organization_id IN (
    SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
  ))
);

CREATE POLICY dependency_select ON workflow_dependency FOR SELECT USING (
  workflow_id IN (SELECT id FROM workflow_documentation WHERE organization_id IN (
    SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
  ))
);

CREATE POLICY step_select ON workflow_step FOR SELECT USING (
  workflow_id IN (SELECT id FROM workflow_documentation WHERE organization_id IN (
    SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
  ))
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER workflow_documentation_updated
  BEFORE UPDATE ON workflow_documentation
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_updated_at();

CREATE TRIGGER workflow_sticky_note_updated
  BEFORE UPDATE ON workflow_sticky_note
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_updated_at();

CREATE TRIGGER workflow_step_updated
  BEFORE UPDATE ON workflow_step
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_updated_at();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Complete workflow overview with counts
CREATE OR REPLACE VIEW v_workflow_overview AS
SELECT
  wd.id,
  wd.organization_id,
  wd.workflow_code,
  wd.workflow_name,
  wd.workflow_version,
  wd.objective,
  wd.priority,
  wd.phase,
  wd.status,
  wd.trigger_type,
  wd.cost_per_month,
  wd.n8n_workflow_id,
  wd.created_at,
  wd.updated_at,

  -- Counts
  COUNT(DISTINCT wsn.id) AS sticky_note_count,
  COUNT(DISTINCT wdf.id) AS data_table_count,
  COUNT(DISTINCT ws.id) AS step_count,
  COUNT(DISTINCT wdep.id) AS dependency_count,

  -- Pinned notes
  COUNT(DISTINCT wsn.id) FILTER (WHERE wsn.is_pinned = TRUE) AS pinned_note_count

FROM workflow_documentation wd
LEFT JOIN workflow_sticky_note wsn ON wd.id = wsn.workflow_id AND wsn.is_archived = FALSE
LEFT JOIN workflow_data_flow wdf ON wd.id = wdf.workflow_id
LEFT JOIN workflow_step ws ON wd.id = ws.workflow_id
LEFT JOIN workflow_dependency wdep ON wd.id = wdep.workflow_id

GROUP BY wd.id;

-- View: Workflow with all sticky notes
CREATE OR REPLACE VIEW v_workflow_with_notes AS
SELECT
  wd.id AS workflow_id,
  wd.workflow_code,
  wd.workflow_name,
  wd.status,

  -- Sticky note details
  wsn.id AS note_id,
  wsn.note_type,
  wsn.title AS note_title,
  wsn.content AS note_content,
  wsn.position_x,
  wsn.position_y,
  wsn.width,
  wsn.height,
  wsn.color,
  wsn.display_order,
  wsn.group_id,
  wsn.is_pinned,
  wsn.metadata AS note_metadata

FROM workflow_documentation wd
LEFT JOIN workflow_sticky_note wsn ON wd.id = wsn.workflow_id
WHERE wsn.is_archived = FALSE OR wsn.is_archived IS NULL

ORDER BY wd.workflow_code, wsn.display_order;

-- View: Workflow data dependencies graph
CREATE OR REPLACE VIEW v_workflow_data_graph AS
SELECT
  wd.workflow_code,
  wd.workflow_name,
  wdf.table_name,
  wdf.flow_type,
  wdf.purpose,

  -- Count workflows reading from this table
  (SELECT COUNT(DISTINCT workflow_id)
   FROM workflow_data_flow
   WHERE table_name = wdf.table_name
   AND flow_type IN ('READ', 'BOTH')
  ) AS reader_count,

  -- Count workflows writing to this table
  (SELECT COUNT(DISTINCT workflow_id)
   FROM workflow_data_flow
   WHERE table_name = wdf.table_name
   AND flow_type IN ('WRITE', 'BOTH')
  ) AS writer_count

FROM workflow_documentation wd
JOIN workflow_data_flow wdf ON wd.id = wdf.workflow_id

ORDER BY wdf.table_name, wd.workflow_code;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Get workflow by code
CREATE OR REPLACE FUNCTION get_workflow_by_code(
  p_org_id UUID,
  p_workflow_code VARCHAR
)
RETURNS TABLE (
  id UUID,
  workflow_code VARCHAR,
  workflow_name VARCHAR,
  objective TEXT,
  status VARCHAR,
  sticky_note_count BIGINT,
  step_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.workflow_code,
    v.workflow_name,
    v.objective,
    v.status,
    v.sticky_note_count,
    v.step_count
  FROM v_workflow_overview v
  WHERE v.organization_id = p_org_id
  AND v.workflow_code = p_workflow_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Clone workflow documentation
CREATE OR REPLACE FUNCTION clone_workflow_documentation(
  p_source_workflow_id UUID,
  p_new_workflow_code VARCHAR,
  p_new_workflow_name VARCHAR,
  p_organization_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_new_workflow_id UUID;
BEGIN
  -- Insert new workflow
  INSERT INTO workflow_documentation (
    organization_id, workflow_code, workflow_name, objective, description,
    trigger_type, trigger_config, priority, phase, status,
    cost_per_execution, cost_per_month, created_by
  )
  SELECT
    p_organization_id, p_new_workflow_code, p_new_workflow_name, objective, description,
    trigger_type, trigger_config, priority, phase, 'DEVELOPMENT',
    cost_per_execution, cost_per_month, auth.uid()
  FROM workflow_documentation
  WHERE id = p_source_workflow_id
  RETURNING id INTO v_new_workflow_id;

  -- Clone sticky notes
  INSERT INTO workflow_sticky_note (
    workflow_id, note_type, title, content, position_x, position_y,
    width, height, color, display_order, group_id, metadata, created_by
  )
  SELECT
    v_new_workflow_id, note_type, title, content, position_x, position_y,
    width, height, color, display_order, group_id, metadata, auth.uid()
  FROM workflow_sticky_note
  WHERE workflow_id = p_source_workflow_id AND is_archived = FALSE;

  -- Clone data flows
  INSERT INTO workflow_data_flow (
    workflow_id, table_name, table_schema, flow_type, purpose, columns_used
  )
  SELECT
    v_new_workflow_id, table_name, table_schema, flow_type, purpose, columns_used
  FROM workflow_data_flow
  WHERE workflow_id = p_source_workflow_id;

  -- Clone steps
  INSERT INTO workflow_step (
    workflow_id, step_number, step_name, step_type, description,
    code_snippet, n8n_node_type, n8n_node_id, configuration
  )
  SELECT
    v_new_workflow_id, step_number, step_name, step_type, description,
    code_snippet, n8n_node_type, n8n_node_id, configuration
  FROM workflow_step
  WHERE workflow_id = p_source_workflow_id;

  RETURN v_new_workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SAMPLE DATA INSERT (for testing)
-- ============================================================================

-- Note: This will be populated by a seed script based on the README.md files
-- in workflows/ directory

COMMENT ON TABLE workflow_documentation IS 'Main workflow information and metadata';
COMMENT ON TABLE workflow_sticky_note IS 'Individual sticky notes for visual workflow documentation';
COMMENT ON TABLE workflow_data_flow IS 'Input/output tables for each workflow';
COMMENT ON TABLE workflow_dependency IS 'Dependencies between workflows';
COMMENT ON TABLE workflow_step IS 'Individual steps/nodes in workflows';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
