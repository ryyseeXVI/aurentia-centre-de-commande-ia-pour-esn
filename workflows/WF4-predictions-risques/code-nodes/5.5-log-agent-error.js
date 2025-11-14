// ===================================================================
// WF4 - Code Node 5.5 : Log Agent Error
// ===================================================================
// Description : Log des erreurs de l'agent IA ou du parser
// Input : Erreur de l'agent ou du parser
// Output : Message d'erreur formaté
// ===================================================================

const projet = $json.projet_nom || $json.projet_id || 'Inconnu';
const error = $json.error || $json.message || 'Erreur inconnue';

console.log(`❌ [WF4] Erreur Agent IA pour projet ${projet}`);
console.log(`   Erreur : ${error}`);

// Si l'erreur vient du parser, elle contient souvent le JSON invalide
if ($json.output) {
  console.log(`   Output brut : ${JSON.stringify($json.output).substring(0, 200)}...`);
}

return [{
  json: {
    projet_id: $json.projet_id,
    projet_nom: projet,
    agent_error: true,
    error_message: error,
    timestamp: new Date().toISOString()
  }
}];
