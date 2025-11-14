// ===================================================================
// WF4 - Code Node 6.3 : Log Insert
// ===================================================================
// Description : Log après insertion des prédictions dans Supabase
// Input : Résultat de l'insertion Supabase Create
// Output : Confirmation avec statistiques
// ===================================================================

const insertions = $input.all();
const nbInserted = insertions.length;

console.log(`💾 [WF4] ${nbInserted} prédictions insérées dans Supabase`);

// Compteurs par type de risque
const stats = {
  RETARD: 0,
  DEPASSEMENT_BUDGET: 0,
  BURN_OUT: 0,
  NON_RENOUVELLEMENT: 0,
  STAFFING: 0,
  total: nbInserted
};

insertions.forEach(item => {
  const pred = item.json;
  if (pred.type_risque && stats.hasOwnProperty(pred.type_risque)) {
    stats[pred.type_risque]++;
  }
});

console.log(`   📊 Répartition :`);
console.log(`      RETARD: ${stats.RETARD}`);
console.log(`      BUDGET: ${stats.DEPASSEMENT_BUDGET}`);
console.log(`      BURN-OUT: ${stats.BURN_OUT}`);
console.log(`      NON-RENOUVELLEMENT: ${stats.NON_RENOUVELLEMENT}`);
console.log(`      STAFFING: ${stats.STAFFING}`);

return [{
  json: {
    inserted: nbInserted,
    stats: stats,
    timestamp: new Date().toISOString()
  }
}];
