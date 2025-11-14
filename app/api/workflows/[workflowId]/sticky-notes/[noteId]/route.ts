import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  authenticateUser,
  successResponse,
  errorResponse,
  unauthorizedResponse
} from '@/lib/api-helpers'
import { StickyNoteUpdateSchema } from '@/lib/validations/workflow-documentation'

// ============================================================================
// PUT /api/workflows/[workflowId]/sticky-notes/[noteId]
// Update a sticky note
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string; noteId: string }> }
) {
  const supabase = await createClient()
  const { user, error: authError } = await authenticateUser(supabase)

  if (authError || !user) return unauthorizedResponse()

  try {
    const { workflowId, noteId } = await params

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

    // Verify sticky note exists and belongs to workflow
    const { data: existingNote } = await supabase
      .from('workflow_sticky_note')
      .select('id')
      .eq('id', noteId)
      .eq('workflow_id', workflowId)
      .single()

    if (!existingNote) {
      return errorResponse('Sticky note not found', 404)
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = StickyNoteUpdateSchema.safeParse(body)

    if (!validation.success) {
      return errorResponse(
        'Validation error: ' + JSON.stringify(validation.error.flatten().fieldErrors),
        400
      )
    }

    const validatedData = validation.data

    // Update sticky note
    const { data: stickyNote, error } = await supabase
      .from('workflow_sticky_note')
      .update({
        ...validatedData,
        updated_by: user.id
      })
      .eq('id', noteId)
      .select()
      .single()

    if (error) {
      console.error('[API] Error updating sticky note:', error)
      return errorResponse('Failed to update sticky note', 500)
    }

    return successResponse(stickyNote)
  } catch (error) {
    console.error('[API] Unexpected error in PUT /api/workflows/[workflowId]/sticky-notes/[noteId]:', error)
    return errorResponse('Internal server error', 500)
  }
}

// ============================================================================
// DELETE /api/workflows/[workflowId]/sticky-notes/[noteId]
// Delete a sticky note (soft delete by default, hard delete with ?permanent=true)
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string; noteId: string }> }
) {
  const supabase = await createClient()
  const { user, error: authError } = await authenticateUser(supabase)

  if (authError || !user) return unauthorizedResponse()

  try {
    const { workflowId, noteId } = await params

    // Get query parameter for permanent deletion
    const { searchParams } = new URL(request.url)
    const permanent = searchParams.get('permanent') === 'true'

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

    // Verify sticky note exists and belongs to workflow
    const { data: existingNote } = await supabase
      .from('workflow_sticky_note')
      .select('id, title')
      .eq('id', noteId)
      .eq('workflow_id', workflowId)
      .single()

    if (!existingNote) {
      return errorResponse('Sticky note not found', 404)
    }

    if (permanent) {
      // Hard delete
      const { error } = await supabase
        .from('workflow_sticky_note')
        .delete()
        .eq('id', noteId)

      if (error) {
        console.error('[API] Error deleting sticky note:', error)
        return errorResponse('Failed to delete sticky note', 500)
      }

      return successResponse({
        message: `Sticky note "${(existingNote as unknown as { title: string }).title}" permanently deleted`
      })
    } else {
      // Soft delete (archive)
      const { error } = await supabase
        .from('workflow_sticky_note')
        .update({
          is_archived: true,
          updated_by: user.id
        })
        .eq('id', noteId)

      if (error) {
        console.error('[API] Error archiving sticky note:', error)
        return errorResponse('Failed to archive sticky note', 500)
      }

      return successResponse({
        message: `Sticky note "${(existingNote as unknown as { title: string }).title}" archived successfully`
      })
    }
  } catch (error) {
    console.error('[API] Unexpected error in DELETE /api/workflows/[workflowId]/sticky-notes/[noteId]:', error)
    return errorResponse('Internal server error', 500)
  }
}
