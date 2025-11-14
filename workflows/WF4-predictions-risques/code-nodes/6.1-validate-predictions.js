// ===================================================================
// WF4 - Code Node 6.1 : Validate Predictions
// ===================================================================
// Description : Validation et nettoyage des prédictions de l'agent IA
// Input : Prédictions brutes de l'agent (array de 5 risques)
// Output : Prédictions validées et formatées pour insertion
// ===================================================================

const predictions = $json.predictions || [];
const projet_id = $json.projet_id;
const projet_nom = $json.projet_nom;
const workflow_execution_id = $execution.id || null;

console.log(`✅ [WF4] Validation prédictions pour ${projet_nom}`);
console.log(`   ${predictions.length} prédictions reçues de l'agent IA`);

// -------------------------------------------------------------------
// Types de risques valides
// -------------------------------------------------------------------
const TYPES_RISQUES_VALIDES = [
  'RETARD',
  'DEPASSEMENT_BUDGET',
  'BURN_OUT',
  'NON_RENOUVELLEMENT',
  'STAFFING'
];

// -------------------------------------------------------------------
// Validation et nettoyage de chaque prédiction
// -------------------------------------------------------------------
const predictionsValidees = predictions
  .map(pred => {
    // Validation type_risque
    if (!TYPES_RISQUES_VALIDES.includes(pred.type_risque)) {
      console.log(`   ⚠️  Type risque invalide : ${pred.type_risque} - SKIPPED`);
      return null;
    }

    // Clamp probabilité entre 0-100
    let proba = parseInt(pred.probabilite_pct);
    if (isNaN(proba)) proba = 50; // Défaut si invalide
    proba = Math.max(0, Math.min(100, proba));

    // Validation horizon (doit être 30, 60 ou 90)
    let horizon = parseInt(pred.horizon_jours);
    if (![30, 60, 90].includes(horizon)) {
      // Arrondir au plus proche
      if (horizon <= 45) horizon = 30;
      else if (horizon <= 75) horizon = 60;
      else horizon = 90;
    }

    // Validation justification (requis)
    const justification = pred.justification || 'Justification non fournie par l\'IA';
    if (justification.length < 10) {
      console.log(`   ⚠️  Justification trop courte pour ${pred.type_risque}`);
    }

    // Confidence (optionnel, entre 0.0-1.0)
    let confidence = parseFloat(pred.confidence);
    if (isNaN(confidence) || confidence < 0 || confidence > 1) {
      confidence = null;
    }

    // Consultant_id (uniquement pour BURN_OUT)
    const consultant_id = pred.type_risque === 'BURN_OUT' ? pred.consultant_id : null;

    return {
      projet_id: projet_id,
      consultant_id: consultant_id,
      type_risque: pred.type_risque,
      probabilite_pct: proba,
      horizon_jours: horizon,
      justification: justification.substring(0, 5000), // Max 5000 chars
      confidence: confidence,
      date_prediction: new Date().toISOString(),
      metriques_source: $json.metriques || null,
      workflow_execution_id: workflow_execution_id,
      modele_ia_utilise: 'gpt-4o-mini'
    };
  })
  .filter(p => p !== null); // Enlever les prédictions invalides

console.log(`   ✅ ${predictionsValidees.length}/${predictions.length} prédictions validées`);

// Log de chaque prédiction validée
predictionsValidees.forEach(p => {
  const emoji = p.probabilite_pct >= 70 ? '🔴' : p.probabilite_pct >= 50 ? '🟡' : '🟢';
  console.log(`   ${emoji} ${p.type_risque} : ${p.probabilite_pct}% à ${p.horizon_jours}j`);
});

// -------------------------------------------------------------------
// OUTPUT : Prédictions prêtes pour insertion Supabase
// -------------------------------------------------------------------
return predictionsValidees.map(p => ({ json: p }));
