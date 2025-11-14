import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  authenticateUser,
  successResponse,
  errorResponse,
  unauthorizedResponse
} from '@/lib/api-helpers'
import {
  StickyNoteCreateSchema,
  StickyNoteBatchPositionUpdateSchema
} from '@/lib/validations/workflow-documentation'

// ============================================================================
// GET /api/workflows/[workflowId]/sticky-notes
// Get all sticky notes for a workflow
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const supabase = await createClient()
  const { user, error: authError } = await authenticateUser(supabase)

  if (authError || !user) return unauthorizedResponse()

  try {
    const { workflowId } = await params

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const noteType = searchParams.get('note_type')
    const groupId = searchParams.get('group_id')
    const isPinned = searchParams.get('is_pinned')
    const includeArchived = searchParams.get('include_archived') === 'true'

    // Get user's organization
    const { data: userOrg, error: orgError } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (orgError || !userOrg) {
      return errorResponse('Organization not found', 404)
    }

    const orgId = (userOrg as unknown as { organization_id: string }).organization_id

    // Verify workflow belongs to user's organization
    const { data: workflow } = await supabase
      .from('workflow_documentation')
      .select('id')
      .eq('id', workflowId)
      .eq('organization_id', orgId)
      .single()

    if (!workflow) {
      return errorResponse('Workflow not found', 404)
    }

    // Build query
    let query = supabase
      .from('workflow_sticky_note')
      .select('*')
      .eq('workflow_id', workflowId)

    // Apply filters
    if (!includeArchived) {
      query = query.eq('is_archived', false)
    }
    if (noteType) query = query.eq('note_type', noteType)
    if (groupId) query = query.eq('group_id', groupId)
    if (isPinned) query = query.eq('is_pinned', isPinned === 'true')

    // Execute query
    const { data: stickyNotes, error } = await query.order('display_order', {
      ascending: true
    })

    if (error) {
      console.error('[API] Error fetching sticky notes:', error)
      return errorResponse('Failed to fetch sticky notes', 500)
    }

    return successResponse(stickyNotes)
  } catch (error) {
    console.error('[API] Unexpected error in GET /api/workflows/[workflowId]/sticky-notes:', error)
    return errorResponse('Internal server error', 500)
  }
}

// ============================================================================
// POST /api/workflows/[workflowId]/sticky-notes
// Create a new sticky note
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const supabase = await createClient()
  const { user, error: authError } = await authenticateUser(supabase)

  if (authError || !user) return unauthorizedResponse()

  try {
    const { workflowId } = await params

    // Get user's organization and check role
    const { data: userOrg, error: orgError } = await supabase
      .from('user_organizations')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single()

    if (orgError || !userOrg) {
      return errorResponse('Organization not found', 404)
    }

    const typedUserOrg = userOrg as unknown as { organization_id: string; role: string }

    // Check if user has permission
    if (!['ADMIN', 'MANAGER'].includes(typedUserOrg.role)) {
      return errorResponse('Insufficient permissions', 403)
    }

    // Verify workflow belongs to user's organization
    const { data: workflow } = await supabase
      .from('workflow_documentation')
      .select('id')
      .eq('id', workflowId)
      .eq('organization_id', typedUserOrg.organization_id)
      .single()

    if (!workflow) {
      return errorResponse('Workflow not found', 404)
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = StickyNoteCreateSchema.safeParse({
      ...body,
      workflow_id: workflowId
    })

    if (!validation.success) {
      return errorResponse(
        'Validation error: ' + JSON.stringify(validation.error.flatten().fieldErrors),
        400
      )
    }

    const validatedData = validation.data

    // Create sticky note
    const { data: stickyNote, error } = await supabase
      .from('workflow_sticky_note')
      .insert({
        ...validatedData,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('[API] Error creating sticky note:', error)
      return errorResponse('Failed to create sticky note', 500)
    }

    return successResponse(stickyNote, 201)
  } catch (error) {
    console.error('[API] Unexpected error in POST /api/workflows/[workflowId]/sticky-notes:', error)
    return errorResponse('Internal server error', 500)
  }
}

// ============================================================================
// PATCH /api/workflows/[workflowId]/sticky-notes
// Batch update positions of multiple sticky notes
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const supabase = await createClient()
  const { user, error: authError } = await authenticateUser(supabase)

  if (authError || !user) return unauthorizedResponse()

  try {
    const { workflowId } = await params

    // Get user's organization and check role
    const { data: userOrg, error: orgError } = await supabase
      .from('user_organizations')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single()

    if (orgError || !userOrg) {
      return errorResponse('Organization not found', 404)
    }

    const typedUserOrg = userOrg as unknown as { organization_id: string; role: string }

    // Check if user has permission
    if (!['ADMIN', 'MANAGER'].includes(typedUserOrg.role)) {
      return errorResponse('Insufficient permissions', 403)
    }

    // Verify workflow belongs to user's organization
    const { data: workflow } = await supabase
      .from('workflow_documentation')
      .select('id')
      .eq('id', workflowId)
      .eq('organization_id', typedUserOrg.organization_id)
      .single()

    if (!workflow) {
      return errorResponse('Workflow not found', 404)
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = StickyNoteBatchPositionUpdateSchema.safeParse(body)

    if (!validation.success) {
      return errorResponse(
        'Validation error: ' + JSON.stringify(validation.error.flatten().fieldErrors),
        400
      )
    }

    const { updates } = validation.data

    // Update all positions in parallel
    const updatePromises = updates.map((update) =>
      supabase
        .from('workflow_sticky_note')
        .update({
          position_x: update.position_x,
          position_y: update.position_y,
          updated_by: user.id
        })
        .eq('id', update.id)
        .eq('workflow_id', workflowId)
    )

    const results = await Promise.all(updatePromises)

    // Check for errors
    const errors = results.filter((result) => result.error)
    if (errors.length > 0) {
      console.error('[API] Error updating sticky note positions:', errors)
      return errorResponse('Failed to update some sticky note positions', 500)
    }

    return successResponse({
      message: `Successfully updated ${updates.length} sticky notes`,
      count: updates.length
    })
  } catch (error) {
    console.error('[API] Unexpected error in PATCH /api/workflows/[workflowId]/sticky-notes:', error)
    return errorResponse('Internal server error', 500)
  }
}
