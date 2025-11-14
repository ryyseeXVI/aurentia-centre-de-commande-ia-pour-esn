// ===================================================================
// WF4 - Code Node 4.4 : Calculs Métriques
// ===================================================================
// Description : Calcul des 7 métriques prédictives clés
// Input : Historique 90j agrégé
// Output : Métriques + données pour l'agent IA
// ===================================================================

const h = $json; // historique

console.log(`📐 [WF4] Calculs métriques pour ${h.projet_nom}`);

// -------------------------------------------------------------------
// MÉTRIQUE 1 : Vélocité (tâches terminées/jour)
// -------------------------------------------------------------------
const velocite = h.taches.terminees_30j > 0
  ? h.taches.terminees_30j / 30
  : 0;

console.log(`   📏 Vélocité : ${velocite.toFixed(2)} tâches/jour`);

// -------------------------------------------------------------------
// MÉTRIQUE 2 : Burn rate (budget consommé/jour)
// -------------------------------------------------------------------
const burn_rate = h.jours_ecoules > 0
  ? h.budget.montant_consomme / h.jours_ecoules
  : 0;

console.log(`   🔥 Burn rate : ${burn_rate.toFixed(2)}€/jour`);

// -------------------------------------------------------------------
// MÉTRIQUE 3 : Charge moyenne consultants
// -------------------------------------------------------------------
const charge_moyenne = h.affectations.taux_occupation_moyen || 0;

console.log(`   ⚡ Charge moyenne : ${charge_moyenne.toFixed(0)}%`);

// -------------------------------------------------------------------
// MÉTRIQUE 4 : Heures hebdomadaires moyennes
// -------------------------------------------------------------------
const heures_hebdomadaires = h.temps_passe.jours_activite > 0
  ? (h.temps_passe.total_heures_90j / h.temps_passe.jours_activite) * 7
  : 0;

console.log(`   🕒 Heures hebdo : ${heures_hebdomadaires.toFixed(1)}h`);

// -------------------------------------------------------------------
// MÉTRIQUE 5 : Tendance score santé (régression linéaire simple)
// -------------------------------------------------------------------
let tendance_score = 0;

if (h.scores.historique && h.scores.historique.length >= 3) {
  const scores = h.scores.historique;
  const n = scores.length;

  // Régression linéaire : y = ax + b, on cherche la pente (a)
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  scores.forEach((s, index) => {
    const x = index; // index comme variable temps
    const y = s.score;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  // Pente = (n*ΣXY - ΣX*ΣY) / (n*ΣX² - (ΣX)²)
  const denominateur = (n * sumX2 - sumX * sumX);
  if (denominateur !== 0) {
    tendance_score = (n * sumXY - sumX * sumY) / denominateur;
  }
}

const tendanceStr = tendance_score > 0 ? '📈 Hausse' : tendance_score < 0 ? '📉 Baisse' : '➡️ Stable';
console.log(`   ${tendanceStr} Score : ${tendance_score.toFixed(2)} pts/jour`);

// -------------------------------------------------------------------
// MÉTRIQUE 6 : Ratio budget consommé
// -------------------------------------------------------------------
const ratio_budget_consomme = h.budget.montant_total > 0
  ? (h.budget.montant_consomme / h.budget.montant_total) * 100
  : 0;

console.log(`   💸 Budget consommé : ${ratio_budget_consomme.toFixed(1)}%`);

// -------------------------------------------------------------------
// MÉTRIQUE 7 : Ratio temps écoulé
// -------------------------------------------------------------------
const totalJours = h.jours_ecoules + h.jours_restants;
const ratio_temps_ecoule = totalJours > 0
  ? (h.jours_ecoules / totalJours) * 100
  : 0;

console.log(`   ⏱️  Temps écoulé : ${ratio_temps_ecoule.toFixed(1)}%`);

// -------------------------------------------------------------------
// CALCULS SPÉCIFIQUES POUR RÈGLES MÉTIER
// -------------------------------------------------------------------

// Règle RETARD : (charge_restante / vélocité) vs jours_restants
const jours_necessaires_velocite = velocite > 0
  ? h.taches.charge_restante_heures / (velocite * 8) // 8h/jour moyen
  : 999999;

const risque_retard_calcul = h.jours_restants > 0
  ? jours_necessaires_velocite > (h.jours_restants * 1.2)
  : false;

// Règle DEPASSEMENT BUDGET : (burn_rate × jours_restants) vs budget_restant
const budget_necessaire = burn_rate * h.jours_restants;
const risque_budget_calcul = budget_necessaire > (h.budget.budget_restant * 0.9);

// Règle BURN-OUT : Score composite
const score_burnout = (charge_moyenne / 100 * 0.4) +
                     (heures_hebdomadaires / 50 * 0.3) +
                     (h.incidents.ouverts / 10 * 0.3);

const risque_burnout_calcul = score_burnout > 0.75;

console.log(`\n🎯 [WF4] Indicateurs risques calculés :`);
console.log(`   ${risque_retard_calcul ? '🔴' : '🟢'} RETARD : ${jours_necessaires_velocite.toFixed(1)}j nécessaires vs ${h.jours_restants}j restants`);
console.log(`   ${risque_budget_calcul ? '🔴' : '🟢'} BUDGET : ${budget_necessaire.toFixed(0)}€ nécessaires vs ${h.budget.budget_restant}€ restants`);
console.log(`   ${risque_burnout_calcul ? '🔴' : '🟢'} BURN-OUT : Score ${score_burnout.toFixed(2)} (seuil: 0.75)`);

// -------------------------------------------------------------------
// OUTPUT : Métriques complètes pour l'agent IA
// -------------------------------------------------------------------
return [{
  json: {
    // Infos projet
    projet_id: h.projet_id,
    projet_nom: h.projet_nom,
    date_debut: h.date_debut,
    date_fin_prevue: h.date_fin_prevue,
    jours_ecoules: h.jours_ecoules,
    jours_restants: h.jours_restants,

    // Métriques calculées
    metriques: {
      velocite_taches_jour: velocite,
      burn_rate_euro_jour: burn_rate,
      charge_moyenne_pct: charge_moyenne,
      heures_hebdomadaires: heures_hebdomadaires,
      tendance_score: tendance_score,
      ratio_budget_consomme_pct: ratio_budget_consomme,
      ratio_temps_ecoule_pct: ratio_temps_ecoule
    },

    // Calculs règles métier
    calculs_regles: {
      jours_necessaires_velocite: jours_necessaires_velocite,
      budget_necessaire: budget_necessaire,
      score_burnout: score_burnout,
      risque_retard_indique: risque_retard_calcul,
      risque_budget_indique: risque_budget_calcul,
      risque_burnout_indique: risque_burnout_calcul
    },

    // Données brutes pour l'IA
    donnees_brutes: {
      budget: h.budget,
      incidents: h.incidents,
      scores: h.scores,
      taches: h.taches,
      affectations: h.affectations,
      temps_passe: h.temps_passe
    }
  }
}];
