// ===================================================================
// WF4 - Code Node 3.2 : Log Batch
// ===================================================================
// Description : Log de chaque itération du batch (par projet)
// Input : Projet courant du Split In Batches
// Output : Projet avec métadonnées batch
// ===================================================================

const batchIndex = $node["Split In Batches"].context.currentRunIndex || 0;
const totalBatches = $node["Split In Batches"].context.noItemsLeft ? batchIndex + 1 : '?';

const projet = $json;

console.log(`\n🔄 [WF4] Batch ${batchIndex + 1}/${totalBatches}`);
console.log(`📁 [WF4] Projet : ${projet.projet_nom} (${projet.projet_id})`);

return [{
  json: {
    ...projet,
    batch_index: batchIndex,
    total_batches: totalBatches
  }
}];
