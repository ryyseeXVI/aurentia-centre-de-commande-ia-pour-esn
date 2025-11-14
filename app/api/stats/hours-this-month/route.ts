// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, authenticateUser } from '@/lib/api-helpers'

export async function GET() {
  try {
    const supabase = await createClient()
    const { user, error: authError } = await authenticateUser(supabase)

    if (authError) {
      return errorResponse('Unauthorized', 401)
    }

    // Get start and end of current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const startDateStr = startOfMonth.toISOString().split('T')[0]
    const endDateStr = endOfMonth.toISOString().split('T')[0]

    // Sum hours from temps_passe for current month
    const { data, error } = await supabase
      .from('temps_passe')
      .select('heures_travaillees')
      .gte('date', startDateStr)
      .lte('date', endDateStr)

    if (error) {
      console.error('Error fetching hours this month:', error)
      return errorResponse('Failed to fetch hours this month')
    }

    // Calculate total hours
    const totalHours = data?.reduce((sum, record) => {
      return sum + (parseFloat(record.heures_travaillees as string) || 0)
    }, 0) || 0

    return successResponse({ total: Math.round(totalHours * 10) / 10 }) // Round to 1 decimal
  } catch (error) {
    console.error('Unexpected error in hours-this-month stats:', error)
    return errorResponse('Internal server error')
  }
}
