// ===================================================================
// WF4 - Code Node 4.1 : Fetch Historique 90j (Supabase REST API)
// ===================================================================
// Description : Récupération historique 90 jours depuis 6 tables Supabase
//               Utilise l'API REST directement avec credentials env vars
// Input : Projet courant
// Output : Historique agrégé pour ce projet
// ===================================================================

const projet_id = $json.projet_id;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('❌ Variables SUPABASE_URL et SUPABASE_KEY requises dans environment N8N');
}

// Dates pour historique 90 jours
const now = new Date();
const date90j = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
const date30j = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
const date90jStr = date90j.toISOString();
const date30jStr = date30j.toISOString();

console.log(`📊 [WF4] Fetch historique 90j pour projet ${$json.projet_nom}`);

// -------------------------------------------------------------------
// Fonction utilitaire : Query Supabase REST API
// -------------------------------------------------------------------
async function querySupabase(table, select, filters = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const params = new URLSearchParams();
  params.append('select', select);

  Object.entries(filters).forEach(([key, value]) => {
    params.append(key, value);
  });

  const response = await fetch(`${url}?${params}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  });

  if (!response.ok) {
    throw new Error(`Supabase query failed for ${table}: ${response.statusText}`);
  }

  return await response.json();
}

// -------------------------------------------------------------------
// REQUÊTE 1 : Temps passé (90 jours)
// -------------------------------------------------------------------
const tempsPasseData = await querySupabase(
  'temps_passe',
  'date,heures,consultant_id',
  {
    'projet_id': `eq.${projet_id}`,
    'date': `gte.${date90jStr}`,
    'order': 'date.asc'
  }
);

// Agrégation manuelle par jour (GROUP BY simulation)
const tempsPasseByDay = {};
tempsPasseData.forEach(tp => {
  const jour = tp.date.split('T')[0];
  if (!tempsPasseByDay[jour]) {
    tempsPasseByDay[jour] = { heures_total: 0, consultants: new Set() };
  }
  tempsPasseByDay[jour].heures_total += tp.heures || 0;
  if (tp.consultant_id) {
    tempsPasseByDay[jour].consultants.add(tp.consultant_id);
  }
});

const totalHeures90j = Object.values(tempsPasseByDay).reduce((sum, day) => sum + day.heures_total, 0);
const joursAvecActivite = Object.keys(tempsPasseByDay).length;

console.log(`   ⏱️  Temps passé : ${totalHeures90j}h sur ${joursAvecActivite} jours`);

// -------------------------------------------------------------------
// REQUÊTE 2 : Budget projet
// -------------------------------------------------------------------
const budgetData = await querySupabase(
  'budget_projet',
  'montant_total,montant_consomme,date_mise_a_jour',
  {
    'projet_id': `eq.${projet_id}`,
    'limit': '1'
  }
);

const budget = budgetData.length > 0 ? {
  montant_total: budgetData[0].montant_total || 0,
  montant_consomme: budgetData[0].montant_consomme || 0,
  budget_restant: (budgetData[0].montant_total || 0) - (budgetData[0].montant_consomme || 0)
} : {
  montant_total: 0,
  montant_consomme: 0,
  budget_restant: 0
};

console.log(`   💰 Budget : ${budget.montant_consomme}€ / ${budget.montant_total}€ (restant: ${budget.budget_restant}€)`);

// -------------------------------------------------------------------
// REQUÊTE 3 : Incidents (90 jours)
// -------------------------------------------------------------------
const incidentsData = await querySupabase(
  'incident',
  'severite,statut,date_detection',
  {
    'projet_id': `eq.${projet_id}`,
    'date_detection': `gte.${date90jStr}`
  }
);

// Agrégation par sévérité
const incidentsBySeverite = {
  CRITIQUE: 0,
  MAJEUR: 0,
  MINEUR: 0,
  ouverts: 0,
  total: incidentsData.length
};

incidentsData.forEach(inc => {
  if (inc.severite && incidentsBySeverite.hasOwnProperty(inc.severite)) {
    incidentsBySeverite[inc.severite]++;
  }
  if (inc.statut === 'OUVERT' || inc.statut === 'EN_COURS') {
    incidentsBySeverite.ouverts++;
  }
});

console.log(`   🔥 Incidents : ${incidentsBySeverite.total} total (${incidentsBySeverite.CRITIQUE} critiques, ${incidentsBySeverite.ouverts} ouverts)`);

// -------------------------------------------------------------------
// REQUÊTE 4 : Scores santé (30 derniers jours pour tendance)
// -------------------------------------------------------------------
const scoresData = await querySupabase(
  'score_sante_projet',
  'score_global,date_calcul',
  {
    'projet_id': `eq.${projet_id}`,
    'date_calcul': `gte.${date30jStr}`,
    'order': 'date_calcul.asc'
  }
);

const scores = scoresData.map(s => ({
  score: s.score_global || 0,
  date: s.date_calcul
})).sort((a, b) => new Date(a.date) - new Date(b.date));

const scoreActuel = scores.length > 0 ? scores[scores.length - 1].score : null;
const scoreMoyen = scores.length > 0
  ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length
  : null;

console.log(`   📈 Score santé : ${scoreActuel} (moyenne 30j: ${scoreMoyen?.toFixed(1)})`);

// -------------------------------------------------------------------
// REQUÊTE 5 : Tâches (90 jours)
// -------------------------------------------------------------------
const tachesData = await querySupabase(
  'tache',
  'statut,charge_estimee_heures,date_fin_reelle',
  {
    'projet_id': `eq.${projet_id}`
  }
);

// Agrégation par statut
const tachesByStatut = {
  total: tachesData.length,
  A_FAIRE: 0,
  EN_COURS: 0,
  TERMINE: 0,
  charge_restante: 0,
  terminees_30j: 0
};

tachesData.forEach(t => {
  if (t.statut && tachesByStatut.hasOwnProperty(t.statut)) {
    tachesByStatut[t.statut]++;
  }

  if (t.statut === 'A_FAIRE' || t.statut === 'EN_COURS') {
    tachesByStatut.charge_restante += t.charge_estimee_heures || 0;
  }

  if (t.statut === 'TERMINE' && t.date_fin_reelle) {
    const dateFin = new Date(t.date_fin_reelle);
    if (dateFin >= date30j) {
      tachesByStatut.terminees_30j++;
    }
  }
});

console.log(`   ✅ Tâches : ${tachesByStatut.TERMINE}/${tachesByStatut.total} terminées (charge restante: ${tachesByStatut.charge_restante}h)`);

// -------------------------------------------------------------------
// REQUÊTE 6 : Affectations consultants (90 jours)
// -------------------------------------------------------------------
const affectationsData = await querySupabase(
  'affectation',
  'consultant_id,taux_occupation,date_debut,date_fin',
  {
    'projet_id': `eq.${projet_id}`
  }
);

// Filtrer affectations actives ou récentes (90j)
const affectationsActives = affectationsData.filter(a => {
  const dateFin = a.date_fin ? new Date(a.date_fin) : new Date('2099-12-31');
  return dateFin >= date90j;
});

const tauxOccupationMoyen = affectationsActives.length > 0
  ? affectationsActives.reduce((sum, a) => sum + (a.taux_occupation || 0), 0) / affectationsActives.length
  : 0;

console.log(`   👥 Consultants : ${affectationsActives.length} affectés (occupation moyenne: ${tauxOccupationMoyen.toFixed(0)}%)`);

// -------------------------------------------------------------------
// CALCUL : Jours écoulés et jours restants
// -------------------------------------------------------------------
const dateDebut = new Date($json.date_debut);
const dateFinPrevue = new Date($json.date_fin_prevue);
const joursEcoules = Math.max(0, Math.floor((now - dateDebut) / (1000 * 60 * 60 * 24)));
const joursRestants = Math.max(0, Math.floor((dateFinPrevue - now) / (1000 * 60 * 60 * 24)));

console.log(`   📅 Durée : ${joursEcoules}j écoulés, ${joursRestants}j restants`);

// -------------------------------------------------------------------
// OUTPUT : Historique agrégé
// -------------------------------------------------------------------
return [{
  json: {
    projet_id: projet_id,
    projet_nom: $json.projet_nom,
    date_debut: $json.date_debut,
    date_fin_prevue: $json.date_fin_prevue,

    // Métadonnées temporelles
    historique_jours: joursAvecActivite,
    jours_ecoules: joursEcoules,
    jours_restants: joursRestants,

    // Données agrégées
    temps_passe: {
      total_heures_90j: totalHeures90j,
      jours_activite: joursAvecActivite,
      heures_moyennes_jour: joursAvecActivite > 0 ? totalHeures90j / joursAvecActivite : 0
    },

    budget: budget,

    incidents: {
      total: incidentsBySeverite.total,
      critiques: incidentsBySeverite.CRITIQUE,
      majeurs: incidentsBySeverite.MAJEUR,
      mineurs: incidentsBySeverite.MINEUR,
      ouverts: incidentsBySeverite.ouverts
    },

    scores: {
      actuel: scoreActuel,
      moyen_30j: scoreMoyen,
      historique: scores
    },

    taches: {
      total: tachesByStatut.total,
      a_faire: tachesByStatut.A_FAIRE,
      en_cours: tachesByStatut.EN_COURS,
      terminees: tachesByStatut.TERMINE,
      charge_restante_heures: tachesByStatut.charge_restante,
      terminees_30j: tachesByStatut.terminees_30j
    },

    affectations: {
      nombre_consultants: affectationsActives.length,
      taux_occupation_moyen: tauxOccupationMoyen,
      details: affectationsActives
    }
  }
}];
