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

    // Get user's organizations
    const { data: memberships, error: membershipsError } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)

    if (membershipsError) {
      console.error('Error fetching user organizations:', membershipsError)
      return errorResponse('Failed to fetch user organizations')
    }

    if (!memberships || memberships.length === 0) {
      // User has no organizations, return zeros
      return successResponse({
        stats: {
          totalRevenue: 0,
          paidRevenue: 0,
          totalCosts: 0,
          margin: 0,
          hoursWorked: 0,
          activeConsultants: 0,
          projectsAtRisk: 0,
        },
      })
    }

    const organizationIds = memberships.map(m => m.organization_id)

    // Fetch invoices to calculate revenue (filtered by user's organizations)
    const { data: invoices, error: invoicesError } = await supabase
      .from('facture')
      .select('montant, statut_paiement, organization_id')
      .in('organization_id', organizationIds)

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
    }

    // Calculate revenue from invoices
    const totalRevenue = invoices?.reduce((sum: number, inv: any) => {
      const amount = typeof inv.montant === 'number'
        ? inv.montant
        : parseFloat(String(inv.montant || 0))
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0) || 0

    const paidRevenue = invoices?.reduce((sum: number, inv: any) => {
      if (inv.statut_paiement === 'PAYEE') {
        const amount = typeof inv.montant === 'number'
          ? inv.montant
          : parseFloat(String(inv.montant || 0))
        return sum + (isNaN(amount) ? 0 : amount)
      }
      return sum
    }, 0) || 0

    // Fetch time entries to calculate costs (filtered by user's organizations)
    const { data: timeEntries, error: timeEntriesError } = await supabase
      .from('temps_passe')
      .select(`
        heures_travaillees,
        organization_id,
        profile_id,
        profiles!temps_passe_profile_id_fkey (
          id,
          consultant_details!consultant_details_profile_id_fkey (
            taux_journalier_cout
          )
        )
      `)
      .in('organization_id', organizationIds)

    if (timeEntriesError) {
      console.error('Error fetching time entries:', timeEntriesError)
    }

    // Calculate costs from time entries and consultant rates
    const totalCosts = timeEntries?.reduce((sum: number, entry: any) => {
      const hours = typeof entry.heures_travaillees === 'number'
        ? entry.heures_travaillees
        : parseFloat(String(entry.heures_travaillees || 0))

      if (isNaN(hours) || hours <= 0) return sum

      // consultant_details is an array due to the join, get the first element
      const consultantDetails = entry.profiles?.consultant_details?.[0] || entry.profiles?.consultant_details
      const dailyRateValue = consultantDetails?.taux_journalier_cout
      const dailyRate = typeof dailyRateValue === 'number'
        ? dailyRateValue
        : parseFloat(String(dailyRateValue || 0))

      if (isNaN(dailyRate) || dailyRate <= 0) return sum

      const hourlyRate = dailyRate / 8 // Assume 8-hour work day
      return sum + (hours * hourlyRate)
    }, 0) || 0

    // Calculate profit margin based on paid revenue (more conservative than total revenue)
    const margin = paidRevenue > 0 ? ((paidRevenue - totalCosts) / paidRevenue) * 100 : 0

    // Count total hours worked
    const hoursWorked = timeEntries?.reduce((sum: number, entry: any) => {
      const hours = typeof entry.heures_travaillees === 'number'
        ? entry.heures_travaillees
        : parseFloat(String(entry.heures_travaillees || 0))
      return sum + (isNaN(hours) ? 0 : hours)
    }, 0) || 0

    // Count active consultants (filtered by user's organizations)
    const { count: activeConsultants, error: consultantsError } = await supabase
      .from('consultant_details')
      .select('*', { count: 'exact', head: true })
      .in('statut', ['AVAILABLE', 'ON_MISSION'])
      .in('organization_id', organizationIds)

    if (consultantsError) {
      console.error('Error fetching consultants:', consultantsError)
    }

    // Count projects at risk - multiple criteria:
    // 1. Health score < 60
    // 2. Active projects past deadline
    // 3. Active projects with deadline approaching (within 7 days) and low health score

    const today = new Date().toISOString().split('T')[0]
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Get projects with low health scores (< 60)
    const { data: lowScoreProjects, error: scoreError } = await supabase
      .from('score_sante_projet')
      .select('projet_id')
      .lt('score_global', 60)
      .in('organization_id', organizationIds)

    if (scoreError) {
      console.error('Error fetching low score projects:', scoreError)
    }

    // Get active projects that are past deadline or approaching deadline
    const { data: deadlineProjects, error: deadlineError } = await supabase
      .from('projet')
      .select('id, date_fin_prevue')
      .eq('statut', 'ACTIF')
      .not('date_fin_prevue', 'is', null)
      .lte('date_fin_prevue', weekFromNow)
      .in('organization_id', organizationIds)

    if (deadlineError) {
      console.error('Error fetching deadline projects:', deadlineError)
    }

    // Combine both criteria and deduplicate
    const atRiskProjectIds = new Set<string>()

    // Add projects with low health scores
    lowScoreProjects?.forEach(p => atRiskProjectIds.add(p.projet_id))

    // Add projects past or near deadline
    deadlineProjects?.forEach(p => {
      // Projects past deadline are definitely at risk
      if (p.date_fin_prevue && p.date_fin_prevue < today) {
        atRiskProjectIds.add(p.id)
      }
      // Projects with deadline within 7 days are also at risk
      else if (p.date_fin_prevue && p.date_fin_prevue <= weekFromNow && p.date_fin_prevue >= today) {
        atRiskProjectIds.add(p.id)
      }
    })

    const projectsAtRisk = atRiskProjectIds.size

    return successResponse({
      stats: {
        totalRevenue: Math.round(totalRevenue),
        paidRevenue: Math.round(paidRevenue),
        totalCosts: Math.round(totalCosts),
        margin: Math.round(margin * 10) / 10,
        hoursWorked: Math.round(hoursWorked * 10) / 10,
        activeConsultants: activeConsultants || 0,
        projectsAtRisk: projectsAtRisk || 0,
      },
    })
  } catch (error) {
    console.error('Unexpected error in analytics overview:', error)
    return errorResponse('Internal server error')
  }
}
