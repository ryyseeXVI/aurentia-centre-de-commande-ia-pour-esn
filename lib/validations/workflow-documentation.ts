import { z } from 'zod'

// ============================================================================
// WORKFLOW DOCUMENTATION VALIDATION SCHEMAS
// ============================================================================

// Enums
export const WorkflowPrioritySchema = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
export const WorkflowPhaseSchema = z.enum(['MVP', 'PRODUCTION', 'OPTIMIZATION'])
export const WorkflowStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'DEVELOPMENT', 'TESTING'])
export const TriggerTypeSchema = z.enum(['schedule', 'webhook', 'manual', 'event'])
export const NoteTypeSchema = z.enum([
  'overview',
  'step',
  'data',
  'dependency',
  'warning',
  'cost',
  'custom'
])
export const NoteColorSchema = z.enum([
  'yellow',
  'blue',
  'green',
  'red',
  'orange',
  'purple',
  'pink'
])
export const FlowTypeSchema = z.enum(['READ', 'WRITE', 'BOTH'])
export const DependencyTypeSchema = z.enum(['REQUIRED', 'OPTIONAL', 'RECOMMENDED'])
export const StepTypeSchema = z.enum([
  'trigger',
  'data',
  'transform',
  'condition',
  'action',
  'loop',
  'log'
])

// Base schemas
export const UUIDSchema = z.string().uuid()

// ============================================================================
// WORKFLOW DOCUMENTATION
// ============================================================================

export const WorkflowDocumentationCreateSchema = z.object({
  workflow_code: z
    .string()
    .min(2, 'Workflow code must be at least 2 characters')
    .max(10, 'Workflow code must be at most 10 characters')
    .regex(/^WF\d+$/, 'Workflow code must match pattern WFX (e.g., WF1, WF2)'),
  workflow_name: z
    .string()
    .min(1, 'Workflow name is required')
    .max(255, 'Workflow name is too long'),
  workflow_version: z.string().default('1.0'),
  objective: z.string().min(1, 'Objective is required'),
  description: z.string().optional(),
  trigger_type: TriggerTypeSchema.optional(),
  trigger_config: z.record(z.string(), z.any()).optional(), // JSONB
  priority: WorkflowPrioritySchema.optional(),
  phase: WorkflowPhaseSchema.optional(),
  status: WorkflowStatusSchema.default('INACTIVE'),
  cost_per_execution: z.number().min(0).optional(),
  cost_per_month: z.number().min(0).optional(),
  n8n_workflow_id: z.string().optional(),
  n8n_workflow_url: z.string().url().optional()
})

export const WorkflowDocumentationUpdateSchema =
  WorkflowDocumentationCreateSchema.partial()

export const WorkflowDocumentationSchema = WorkflowDocumentationCreateSchema.extend({
  id: UUIDSchema,
  organization_id: UUIDSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  created_by: UUIDSchema.nullable(),
  updated_by: UUIDSchema.nullable()
})

// ============================================================================
// STICKY NOTES
// ============================================================================

export const StickyNoteCreateSchema = z.object({
  workflow_id: UUIDSchema,
  note_type: NoteTypeSchema,
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title is too long'),
  content: z.string().min(1, 'Content is required'),
  position_x: z.number().int().default(0),
  position_y: z.number().int().default(0),
  width: z.number().int().min(100).max(1000).default(300),
  height: z.number().int().min(100).max(1000).default(200),
  color: NoteColorSchema.default('yellow'),
  display_order: z.number().int().default(0),
  group_id: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(), // JSONB
  attachments: z.record(z.string(), z.any()).optional(), // JSONB
  is_pinned: z.boolean().default(false),
  is_collapsed: z.boolean().default(false)
})

export const StickyNoteUpdateSchema = StickyNoteCreateSchema.partial().extend({
  is_archived: z.boolean().optional()
})

export const StickyNoteSchema = StickyNoteCreateSchema.extend({
  id: UUIDSchema,
  is_archived: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  created_by: UUIDSchema.nullable(),
  updated_by: UUIDSchema.nullable()
})

// Batch position update
export const StickyNoteBatchPositionUpdateSchema = z.object({
  updates: z.array(
    z.object({
      id: UUIDSchema,
      position_x: z.number().int(),
      position_y: z.number().int()
    })
  )
})

// ============================================================================
// DATA FLOW
// ============================================================================

export const DataFlowCreateSchema = z.object({
  workflow_id: UUIDSchema,
  table_name: z
    .string()
    .min(1, 'Table name is required')
    .max(100, 'Table name is too long'),
  table_schema: z.string().default('public'),
  flow_type: FlowTypeSchema,
  purpose: z.string().optional(),
  columns_used: z.array(z.string()).optional(),
  position_x: z.number().int().optional(),
  position_y: z.number().int().optional()
})

export const DataFlowUpdateSchema = DataFlowCreateSchema.partial()

export const DataFlowSchema = DataFlowCreateSchema.extend({
  id: UUIDSchema,
  created_at: z.string().datetime()
})

// ============================================================================
// WORKFLOW DEPENDENCY
// ============================================================================

export const WorkflowDependencyCreateSchema = z.object({
  workflow_id: UUIDSchema,
  depends_on_workflow_id: UUIDSchema,
  dependency_type: DependencyTypeSchema.optional(),
  description: z.string().optional()
})

export const WorkflowDependencySchema = WorkflowDependencyCreateSchema.extend({
  id: UUIDSchema,
  created_at: z.string().datetime()
})

// ============================================================================
// WORKFLOW STEP
// ============================================================================

export const WorkflowStepCreateSchema = z.object({
  workflow_id: UUIDSchema,
  step_number: z.number().int().min(1),
  step_name: z
    .string()
    .min(1, 'Step name is required')
    .max(255, 'Step name is too long'),
  step_type: StepTypeSchema.optional(),
  description: z.string().optional(),
  code_snippet: z.string().optional(),
  n8n_node_type: z.string().optional(),
  n8n_node_id: z.string().optional(),
  position_x: z.number().int().optional(),
  position_y: z.number().int().optional(),
  configuration: z.record(z.string(), z.any()).optional() // JSONB
})

export const WorkflowStepUpdateSchema = WorkflowStepCreateSchema.partial()

export const WorkflowStepSchema = WorkflowStepCreateSchema.extend({
  id: UUIDSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

// ============================================================================
// COMPLETE WORKFLOW WITH RELATIONS
// ============================================================================

export const WorkflowWithRelationsSchema = WorkflowDocumentationSchema.extend({
  sticky_notes: z.array(StickyNoteSchema).optional(),
  data_flows: z.array(DataFlowSchema).optional(),
  dependencies: z.array(WorkflowDependencySchema).optional(),
  steps: z.array(WorkflowStepSchema).optional()
})

// ============================================================================
// QUERY FILTERS
// ============================================================================

export const WorkflowFilterSchema = z.object({
  status: WorkflowStatusSchema.optional(),
  phase: WorkflowPhaseSchema.optional(),
  priority: WorkflowPrioritySchema.optional(),
  search: z.string().optional()
})

export const StickyNoteFilterSchema = z.object({
  workflow_id: UUIDSchema,
  note_type: NoteTypeSchema.optional(),
  group_id: z.string().optional(),
  is_pinned: z.boolean().optional(),
  is_archived: z.boolean().default(false)
})

// ============================================================================
// CLONE WORKFLOW
// ============================================================================

export const CloneWorkflowSchema = z.object({
  source_workflow_id: UUIDSchema,
  new_workflow_code: z
    .string()
    .regex(/^WF\d+$/, 'Workflow code must match pattern WFX'),
  new_workflow_name: z.string().min(1, 'Workflow name is required'),
  organization_id: UUIDSchema
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type WorkflowPriority = z.infer<typeof WorkflowPrioritySchema>
export type WorkflowPhase = z.infer<typeof WorkflowPhaseSchema>
export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>
export type TriggerType = z.infer<typeof TriggerTypeSchema>
export type NoteType = z.infer<typeof NoteTypeSchema>
export type NoteColor = z.infer<typeof NoteColorSchema>
export type FlowType = z.infer<typeof FlowTypeSchema>
export type DependencyType = z.infer<typeof DependencyTypeSchema>
export type StepType = z.infer<typeof StepTypeSchema>

export type WorkflowDocumentationCreate = z.infer<
  typeof WorkflowDocumentationCreateSchema
>
export type WorkflowDocumentationUpdate = z.infer<
  typeof WorkflowDocumentationUpdateSchema
>
export type WorkflowDocumentation = z.infer<typeof WorkflowDocumentationSchema>

export type StickyNoteCreate = z.infer<typeof StickyNoteCreateSchema>
export type StickyNoteUpdate = z.infer<typeof StickyNoteUpdateSchema>
export type StickyNote = z.infer<typeof StickyNoteSchema>
export type StickyNoteBatchPositionUpdate = z.infer<
  typeof StickyNoteBatchPositionUpdateSchema
>

export type DataFlowCreate = z.infer<typeof DataFlowCreateSchema>
export type DataFlowUpdate = z.infer<typeof DataFlowUpdateSchema>
export type DataFlow = z.infer<typeof DataFlowSchema>

export type WorkflowDependencyCreate = z.infer<typeof WorkflowDependencyCreateSchema>
export type WorkflowDependency = z.infer<typeof WorkflowDependencySchema>

export type WorkflowStepCreate = z.infer<typeof WorkflowStepCreateSchema>
export type WorkflowStepUpdate = z.infer<typeof WorkflowStepUpdateSchema>
export type WorkflowStep = z.infer<typeof WorkflowStepSchema>

export type WorkflowWithRelations = z.infer<typeof WorkflowWithRelationsSchema>

export type WorkflowFilter = z.infer<typeof WorkflowFilterSchema>
export type StickyNoteFilter = z.infer<typeof StickyNoteFilterSchema>

export type CloneWorkflow = z.infer<typeof CloneWorkflowSchema>
