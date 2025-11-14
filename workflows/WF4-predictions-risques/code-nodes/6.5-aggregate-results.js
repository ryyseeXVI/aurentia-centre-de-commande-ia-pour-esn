// ===================================================================
// WF4 - Code Node 6.5 : Aggregate Results
// ===================================================================
// Description : Agrégation finale de tous les résultats du workflow
// Input : Tous les résultats de la boucle (projets traités)
// Output : Rapport final d'exécution
// ===================================================================

const resultats = $input.all();

console.log(`\n🏁 [WF4] Workflow Prédictions Risques terminé`);

// Compteurs globaux
let projetsTraites = 0;
let projetsSkip = 0;
let predictionsTotal = 0;
let erreursIA = 0;

resultats.forEach(item => {
  const data = item.json;

  if (data.skipped) {
    projetsSkip++;
  } else if (data.agent_error) {
    erreursIA++;
  } else if (data.inserted) {
    projetsTraites++;
    predictionsTotal += data.inserted || 0;
  }
});

console.log(`📊 [WF4] Résumé d'exécution :`);
console.log(`   ✅ Projets traités : ${projetsTraites}`);
console.log(`   ⏭️  Projets skippés : ${projetsSkip} (données insuffisantes)`);
console.log(`   ❌ Erreurs IA : ${erreursIA}`);
console.log(`   💾 Prédictions totales insérées : ${predictionsTotal}`);

const duree = ($execution.startedAt)
  ? Math.round((Date.now() - new Date($execution.startedAt).getTime()) / 1000)
  : 0;

console.log(`   ⏱️  Durée totale : ${duree}s`);

// -------------------------------------------------------------------
// OUTPUT : Rapport final
// -------------------------------------------------------------------
return [{
  json: {
    workflow: 'WF4-predictions-risques',
    execution_id: $execution.id,
    timestamp: new Date().toISOString(),
    duree_secondes: duree,

    resultats: {
      projets_traites: projetsTraites,
      projets_skipes: projetsSkip,
      erreurs_ia: erreursIA,
      predictions_totales: predictionsTotal
    },

    success: erreursIA === 0,
    message: `Workflow terminé avec succès : ${predictionsTotal} prédictions générées pour ${projetsTraites} projets`
  }
}];
