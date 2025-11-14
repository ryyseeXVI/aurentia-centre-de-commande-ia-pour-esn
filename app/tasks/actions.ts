// @ts-nocheck
/**
 * Task Server Actions
 *
 * @fileoverview Server-side actions for task management including creation,
 * updates, deletion, and Kanban operations. These functions run exclusively on the server.
 *
 * @module app/tasks/actions
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  bulkUpdateTasksSchema,
  bulkDeleteTasksSchema,
} from '@/lib/validations/task'
import { z } from 'zod'

// Type inference from Zod schemas
type CreateTaskInput = z.infer<typeof createTaskSchema>
type UpdateTaskInput = z.infer<typeof updateTaskSchema>
type MoveTaskInput = z.infer<typeof moveTaskSchema>

/**
 * Server action for task creation
 *
 * Creates a new task in the database with proper validation and
 * project/organization context.
 *
 * @param data - Task creation information
 * @returns Object containing error message if creation fails, or success with task ID
 *
 * @example
 * ```typescript
 * const result = await createTask({
 *   projetId: '123',
 *   nom: 'Implement feature',
 *   statut: 'todo',
 *   consultantResponsableId: '456'
 * })
 * if (result.error) {
 *   console.error(result.error)
 * } else {
 *   console.log('Task created:', result.taskId)
 * }
 * ```
 */
export async function createTask(data: unknown) {
  try {
    const supabase = await createClient()

    // Validate input
    const validation = createTaskSchema.safeParse(data)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return { error: Object.values(errors)[0]?.[0] || 'Invalid task data' }
    }

    const validatedData = validation.data

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Verify project exists and get organization_id
    const { data: project, error: projectError } = await supabase
      .from('projet')
      .select('id, organization_id')
      .eq('id', validatedData.projetId)
      .single()

    if (projectError || !project) {
      return { error: 'Project not found' }
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', project.organization_id)
      .single()

    if (!membership) {
      return { error: 'Access denied to this organization' }
    }

    // Create task
    const { data: task, error: createError } = await supabase
      .from('tache')
      .insert({
        projet_id: validatedData.projetId,
        nom: validatedData.nom,
        description: validatedData.description,
        statut: validatedData.statut || 'todo',
        profile_responsable_id: validatedData.consultantResponsableId,
        livrable_id: validatedData.livrableId,
        charge_estimee_jh: validatedData.chargeEstimeeJh,
        date_fin_cible: validatedData.dateFinCible,
        color: validatedData.color,
        tags: validatedData.tags,
        position: validatedData.position || 0,
      })
      .select('id')
      .single()

    if (createError) {
      console.error('Error creating task:', createError)
      return { error: 'Failed to create task' }
    }

    // Revalidate relevant paths
    revalidatePath(`/app/organizations/${project.organization_id}/projects/${validatedData.projetId}`)
    revalidatePath(`/app/organizations/${project.organization_id}`)

    return { success: true, taskId: task.id }
  } catch (error) {
    console.error('Unexpected error in createTask:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Server action for task update
 *
 * Updates an existing task with validation
 *
 * @param taskId - ID of the task to update
 * @param data - Task update information
 * @returns Object containing error message if update fails
 */
export async function updateTask(taskId: string, data: unknown) {
  try {
    const supabase = await createClient()

    // Validate input
    const validation = updateTaskSchema.safeParse(data)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return { error: Object.values(errors)[0]?.[0] || 'Invalid task data' }
    }

    const validatedData = validation.data

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Get task and verify access
    const { data: task, error: taskError } = await supabase
      .from('tache')
      .select('id, projet_id, projet:projet_id(organization_id)')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return { error: 'Task not found' }
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', task.projet.organization_id)
      .single()

    if (!membership) {
      return { error: 'Access denied' }
    }

    // Update task
    const updateData: Record<string, any> = {}
    if (validatedData.nom !== undefined) updateData.nom = validatedData.nom
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.statut !== undefined) updateData.statut = validatedData.statut
    if (validatedData.consultantResponsableId !== undefined)
      updateData.profile_responsable_id = validatedData.consultantResponsableId
    if (validatedData.livrableId !== undefined) updateData.livrable_id = validatedData.livrableId
    if (validatedData.chargeEstimeeJh !== undefined)
      updateData.charge_estimee_jh = validatedData.chargeEstimeeJh
    if (validatedData.dateFinCible !== undefined) updateData.date_fin_cible = validatedData.dateFinCible
    if (validatedData.color !== undefined) updateData.color = validatedData.color
    if (validatedData.tags !== undefined) updateData.tags = validatedData.tags
    if (validatedData.position !== undefined) updateData.position = validatedData.position

    const { error: updateError } = await supabase
      .from('tache')
      .update(updateData)
      .eq('id', taskId)

    if (updateError) {
      console.error('Error updating task:', updateError)
      return { error: 'Failed to update task' }
    }

    // Revalidate paths
    revalidatePath(`/app/organizations/${task.projet.organization_id}/projects/${task.projet_id}`)
    revalidatePath(`/app/organizations/${task.projet.organization_id}`)

    return { success: true }
  } catch (error) {
    console.error('Unexpected error in updateTask:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Server action for task deletion
 *
 * Deletes a task from the database
 *
 * @param taskId - ID of the task to delete
 * @returns Object containing error message if deletion fails
 */
export async function deleteTask(taskId: string) {
  try {
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Get task and verify access
    const { data: task, error: taskError } = await supabase
      .from('tache')
      .select('id, projet_id, projet:projet_id(organization_id)')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return { error: 'Task not found' }
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('id, role')
      .eq('user_id', user.id)
      .eq('organization_id', task.projet.organization_id)
      .single()

    if (!membership) {
      return { error: 'Access denied' }
    }

    // Delete task
    const { error: deleteError } = await supabase.from('tache').delete().eq('id', taskId)

    if (deleteError) {
      console.error('Error deleting task:', deleteError)
      return { error: 'Failed to delete task' }
    }

    // Revalidate paths
    revalidatePath(`/app/organizations/${task.projet.organization_id}/projects/${task.projet_id}`)
    revalidatePath(`/app/organizations/${task.projet.organization_id}`)

    return { success: true }
  } catch (error) {
    console.error('Unexpected error in deleteTask:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Server action for moving a task (Kanban drag & drop)
 *
 * Updates task status and position for Kanban board
 *
 * @param taskId - ID of the task to move
 * @param data - New status and position
 * @returns Object containing error message if move fails
 */
export async function moveTask(taskId: string, data: unknown) {
  try {
    const supabase = await createClient()

    // Validate input
    const validation = moveTaskSchema.safeParse(data)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return { error: Object.values(errors)[0]?.[0] || 'Invalid move data' }
    }

    const validatedData = validation.data

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Get task and verify access
    const { data: task, error: taskError } = await supabase
      .from('tache')
      .select('id, projet_id, projet:projet_id(organization_id)')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return { error: 'Task not found' }
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', task.projet.organization_id)
      .single()

    if (!membership) {
      return { error: 'Access denied' }
    }

    // Update task position and status
    const { error: updateError } = await supabase
      .from('tache')
      .update({
        statut: validatedData.statut,
        position: validatedData.position,
      })
      .eq('id', taskId)

    if (updateError) {
      console.error('Error moving task:', updateError)
      return { error: 'Failed to move task' }
    }

    // Revalidate paths
    revalidatePath(`/app/organizations/${task.projet.organization_id}/projects/${task.projet_id}`)

    return { success: true }
  } catch (error) {
    console.error('Unexpected error in moveTask:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Server action for bulk task updates
 *
 * Updates multiple tasks at once
 *
 * @param data - Bulk update data with task IDs and updates
 * @returns Object containing error message if update fails
 */
export async function bulkUpdateTasks(data: unknown) {
  try {
    const supabase = await createClient()

    // Validate input
    const validation = bulkUpdateTasksSchema.safeParse(data)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return { error: Object.values(errors)[0]?.[0] || 'Invalid bulk update data' }
    }

    const validatedData = validation.data

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Build update object
    const updateData: Record<string, any> = {}
    if (validatedData.updates.statut !== undefined) updateData.statut = validatedData.updates.statut
    if (validatedData.updates.consultantResponsableId !== undefined)
      updateData.profile_responsable_id = validatedData.updates.consultantResponsableId
    if (validatedData.updates.tags !== undefined) updateData.tags = validatedData.updates.tags

    // Update all tasks (RLS will ensure only accessible tasks are updated)
    const { error: updateError } = await supabase
      .from('tache')
      .update(updateData)
      .in('id', validatedData.taskIds)

    if (updateError) {
      console.error('Error bulk updating tasks:', updateError)
      return { error: 'Failed to update tasks' }
    }

    // Revalidate organization paths (can't know specific project IDs)
    revalidatePath('/app/organizations')

    return { success: true }
  } catch (error) {
    console.error('Unexpected error in bulkUpdateTasks:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Server action for bulk task deletion
 *
 * Deletes multiple tasks at once
 *
 * @param data - Bulk delete data with task IDs
 * @returns Object containing error message if deletion fails
 */
export async function bulkDeleteTasks(data: unknown) {
  try {
    const supabase = await createClient()

    // Validate input
    const validation = bulkDeleteTasksSchema.safeParse(data)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return { error: Object.values(errors)[0]?.[0] || 'Invalid bulk delete data' }
    }

    const validatedData = validation.data

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Delete all tasks (RLS will ensure only accessible tasks are deleted)
    const { error: deleteError } = await supabase
      .from('tache')
      .delete()
      .in('id', validatedData.taskIds)

    if (deleteError) {
      console.error('Error bulk deleting tasks:', deleteError)
      return { error: 'Failed to delete tasks' }
    }

    // Revalidate organization paths
    revalidatePath('/app/organizations')

    return { success: true }
  } catch (error) {
    console.error('Unexpected error in bulkDeleteTasks:', error)
    return { error: 'An unexpected error occurred' }
  }
}
