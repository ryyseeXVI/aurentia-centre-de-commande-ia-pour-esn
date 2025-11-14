// ===================================================================
// WF4 - Code Node 2.2 : Validate Projets
// ===================================================================
// Description : Validation et logging des projets actifs récupérés
// Input : Résultats Supabase Get Many (projets ACTIF)
// Output : Projets validés + statistiques
// ===================================================================

const projets = $input.all();

// Validation
if (!projets || projets.length === 0) {
  console.log('⚠️  [WF4] Aucun projet ACTIF trouvé');
  return [{
    json: {
      error: true,
      message: 'Aucun projet actif à analyser',
      count: 0
    }
  }];
}

// Validation structure des projets
const projetsValides = projets.filter(item => {
  const p = item.json;
  return p.id && p.nom && p.date_debut && p.date_fin_prevue;
});

console.log(`✅ [WF4] ${projetsValides.length} projets ACTIF récupérés`);
console.log(`📊 [WF4] Projets à analyser :`);
projetsValides.forEach(item => {
  const p = item.json;
  console.log(`   - ${p.nom} (${p.id})`);
});

// Passer tous les projets au node suivant
return projetsValides.map(item => ({
  json: {
    projet_id: item.json.id,
    projet_nom: item.json.nom,
    date_debut: item.json.date_debut,
    date_fin_prevue: item.json.date_fin_prevue,
    statut: item.json.statut,
    client_id: item.json.client_id
  }
}));
