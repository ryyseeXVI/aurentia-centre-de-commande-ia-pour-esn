import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, authenticateUser } from '@/lib/api-helpers'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const supabase = await createClient()
    const { user, error: authError } = await authenticateUser(supabase)

    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if ((profile as any)?.role !== 'ADMIN' && (profile as any)?.role !== 'OWNER') {
      return errorResponse('Admin access required', 403)
    }

    // Fetch all historical health scores for this project
    const { data: scores, error: scoresError } = await supabase
      .from('score_sante_projet')
      .select(`
        id,
        projet_id,
        date_analyse,
        score_global,
        couleur_risque,
        score_budget,
        score_delais,
        score_qualite,
        score_ressources,
        score_communication,
        raisonnement_ia,
        facteurs_critiques,
        recommandations,
        tendance,
        created_at
      `)
      .eq('projet_id', projectId)
      .order('date_analyse', { ascending: false })
      .limit(30) // Last 30 entries

    if (scoresError) {
      console.error('Error fetching health history:', scoresError)
      return errorResponse('Failed to fetch health score history')
    }

    // Calculate trends
    const history = (scores as any)?.map((score: any, index: number) => {
      const previousScore = (scores as any)[index + 1]
      let trend = 'stable'
      let scoreDelta = 0

      if (previousScore) {
        scoreDelta = score.score_global - previousScore.score_global
        if (scoreDelta > 5) trend = 'improving'
        else if (scoreDelta < -5) trend = 'declining'
      }

      return {
        id: score.id,
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
        trend,
        scoreDelta,
        createdAt: score.created_at,
      }
    }) || []

    return successResponse({
      projectId,
      history,
      totalRecords: history.length,
    })
  } catch (error) {
    console.error('Unexpected error in health history API:', error)
    return errorResponse('Internal server error')
  }
}
