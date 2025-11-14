import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, authenticateUser } from '@/lib/api-helpers'

type ProjectScore = {
  id: string
  projet_id: string
  organization_id: string
  date_analyse: string
  score_global: number
  couleur_risque: string
  score_budget: number
  score_delais: number
  score_qualite: number
  score_ressources: number
  score_communication: number
  raisonnement_ia: string
  facteurs_critiques: unknown
  recommandations: unknown
  tendance: string
  projet?: {
    id: string
    nom: string
    description?: string
    statut?: string
    date_debut?: string
    date_fin_prevue?: string
    client?: { nom: string }
    chef_projet?: {
      nom: string
      prenom: string
      email: string
    }
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { user, error: authError } = await authenticateUser(supabase)

    if (authError || !user) {
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
      // User has no organizations, return empty array
      return successResponse({ scores: [] })
    }

    const organizationIds = (memberships as unknown as Array<{ organization_id: string }>).map(m => m.organization_id)

    // Fetch project health scores with project details
    const { data: scores, error: scoresError } = await supabase
      .from('score_sante_projet')
      .select(`
        *,
        projet:projet_id (
          id,
          nom,
          description,
          statut,
          date_debut,
          date_fin_prevue,
          client:client_id (
            nom
          ),
          chef_projet:chef_projet_id (
            nom,
            prenom,
            email
          )
        )
      `)
      .in('organization_id', organizationIds)
      .order('date_analyse', { ascending: false })

    if (scoresError) {
      console.error('Error fetching project scores:', scoresError)
      return errorResponse('Failed to fetch project scores')
    }

    // Transform and enrich the data
    const enrichedScores = (scores as unknown as ProjectScore[])?.map(score => ({
      id: score.id,
      projectId: score.projet_id,
      projectName: score.projet?.nom || 'Unknown Project',
      projectDescription: score.projet?.description,
      projectStatus: score.projet?.statut,
      projectStartDate: score.projet?.date_debut,
      projectEndDate: score.projet?.date_fin_prevue,
      clientName: score.projet?.client?.nom || 'Unknown Client',
      projectManager: score.projet?.chef_projet
        ? `${score.projet.chef_projet.prenom} ${score.projet.chef_projet.nom}`
        : 'Unassigned',
      projectManagerEmail: score.projet?.chef_projet?.email,
      dateAnalyse: score.date_analyse,
      scoreGlobal: score.score_global,
      couleurRisque: score.couleur_risque,
      scoreBudget: score.score_budget,
      scoreDelais: score.score_delais,
      scoreQualite: score.score_qualite,
      scoreRessources: score.score_ressources,
      scoreCommunication: score.score_communication,
      raisonnementIa: score.raisonnement_ia,
      facteursCritiques: score.facteurs_critiques,
      recommandations: score.recommandations,
      tendance: score.tendance,
      organizationId: score.organization_id,
    })) || []

    return successResponse({ scores: enrichedScores })
  } catch (error) {
    console.error('Unexpected error in project scores API:', error)
    return errorResponse('Internal server error')
  }
}
