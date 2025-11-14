// ===================================================================
// WF4 - Code Node 4.3 : Log No Data
// ===================================================================
// Description : Log quand un projet n'a pas assez de données (<7 jours)
// Input : Projet avec historique_jours < 7
// Output : Message d'avertissement
// ===================================================================

const projet = $json;

console.log(`⚠️  [WF4] Projet ${projet.projet_nom} : données insuffisantes`);
console.log(`   Historique : ${projet.historique_jours} jours (minimum requis : 7)`);
console.log(`   ⏭️  Skipping prédictions pour ce projet`);

return [{
  json: {
    projet_id: projet.projet_id,
    projet_nom: projet.projet_nom,
    skipped: true,
    raison: 'Données insuffisantes (< 7 jours d\'historique)',
    historique_jours: projet.historique_jours
  }
}];
