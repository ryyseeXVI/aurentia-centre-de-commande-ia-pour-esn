// ===================================================================
// WF4 - Code Node 1.2 : Log Start
// ===================================================================
// Description : Log du démarrage du workflow avec timestamp
// Input : Trigger schedule
// Output : Message de confirmation
// ===================================================================

const now = new Date();
const dateStr = now.toISOString();

console.log('🚀 [WF4] Démarrage workflow Prédictions Risques');
console.log(`⏰ [WF4] Timestamp : ${dateStr}`);

return [{
  json: {
    workflow: 'WF4-predictions-risques',
    status: 'started',
    timestamp: dateStr,
    message: '🚀 Workflow démarré avec succès'
  }
}];
