import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, authenticateUser } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
import { NextRequest } from 'next/server'

/**
 * GET /api/consultants/[consultantId]
 * Get consultant details with skills, assignments, and performance data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ consultantId: string }> }
) {
  try {
    const supabase = await createClient()
    const { user, error: authError } = await authenticateUser(supabase)

    if (authError) {
      return errorResponse('Unauthorized', 401)
    }

    const { consultantId } = await params

    // Fetch consultant with related data
    const { data: consultant, error } = await supabase
      .from('consultant')
      .select(`
        *,
        manager:consultant!consultant_manager_id_fkey(id, nom, prenom, email),
        consultant_competence(
          niveau,
          date_evaluation,
          competence(id, nom, description)
        ),
        affectation(
          id,
          date_debut,
          date_fin_prevue,
          charge_allouee_pct,
          projet(id, nom, statut, client_id, client(nom))
        )
      `)
      .eq('id', consultantId)
      .single()

    if (error) {
      logger.error('Error fetching consultant', error, { consultantId })
      if (error.code === 'PGRST116') {
        return errorResponse('Consultant not found', 404)
      }
      return errorResponse('Failed to fetch consultant')
    }

    // Fetch time tracking stats
    const { data: timeStats } = await supabase
      .from('temps_passe')
      .select('heures_travaillees, date')
      .eq('consultant_id', consultantId)
      .order('date', { ascending: false })
      .limit(100)

    const totalHours = timeStats?.reduce((sum: number, record: any) => {
      return sum + (parseFloat(record.heures_travaillees as string) || 0)
    }, 0) || 0

    return successResponse({
      consultant,
      stats: {
        totalHours: Math.round(totalHours * 10) / 10,
        activeProjects: consultant.affectation?.filter((a: any) =>
          !a.date_fin_prevue || new Date(a.date_fin_prevue) > new Date()
        ).length || 0,
      },
    })
  } catch (error) {
    console.error('Unexpected error in consultant GET:', error)
    return errorResponse('Internal server error')
  }
}

/**
 * PATCH /api/consultants/[consultantId]
 * Update consultant information (ADMIN or MANAGER only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { consultantId: string } }
) {
  try {
    const supabase = await createClient()
    const { user, error: authError } = await authenticateUser(supabase)

    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // Check if user is ADMIN or MANAGER
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['ADMIN', 'MANAGER'].includes(profile.role)) {
      return errorResponse('Forbidden: Admin or Manager access required', 403)
    }

    const { consultantId } = params
    const body = await request.json()

    // Remove fields that shouldn't be updated directly
    const { id, created_at, user_id, ...updateData } = body

    // Update consultant
    const { data: consultant, error } = await supabase
      .from('consultant')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', consultantId)
      .select()
      .single()

    if (error) {
      console.error('Error updating consultant:', error)
      if (error.code === 'PGRST116') {
        return errorResponse('Consultant not found', 404)
      }
      return errorResponse('Failed to update consultant')
    }

    return successResponse({ consultant })
  } catch (error) {
    console.error('Unexpected error in consultant PATCH:', error)
    return errorResponse('Internal server error')
  }
}

/**
 * DELETE /api/consultants/[consultantId]
 * Delete/deactivate consultant (ADMIN only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { consultantId: string } }
) {
  try {
    const supabase = await createClient()
    const { user, error: authError } = await authenticateUser(supabase)

    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // Check if user is ADMIN
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'ADMIN') {
      return errorResponse('Forbidden: Admin access required', 403)
    }

    const { consultantId } = params

    // Soft delete by setting status to INACTIF instead of hard delete
    const { error } = await supabase
      .from('consultant')
      .update({
        statut: 'INACTIF',
        updated_at: new Date().toISOString(),
      })
      .eq('id', consultantId)

    if (error) {
      console.error('Error deactivating consultant:', error)
      return errorResponse('Failed to deactivate consultant')
    }

    return successResponse({ message: 'Consultant deactivated successfully' })
  } catch (error) {
    console.error('Unexpected error in consultant DELETE:', error)
    return errorResponse('Internal server error')
  }
}
