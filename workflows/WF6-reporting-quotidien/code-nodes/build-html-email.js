// Node 22 : Code - Build HTML Email
// Ce code génère un email HTML compatible tous clients (tables + inline styles)

const { stats, destinataires } = $input.first().json;
const llmOutput = $input.first().json.llmOutput || $input.first().json;

// Couleur selon urgence
const urgenceColors = {
  FAIBLE: '#10b981',
  MOYEN: '#f59e0b',
  ELEVE: '#ef4444'
};
const urgenceColor = urgenceColors[llmOutput.niveau_urgence] || '#6b7280';

// HTML avec TABLES et INLINE STYLES (compatibilité email maximale)
const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporting Quotidien - ${stats.dateRapport}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background: #f9fafb;">

  <table role="presentation" style="max-width: 800px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding: 30px;">

        <!-- Header -->
        <table role="presentation" style="width: 100%; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px;" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <h1 style="margin: 0; color: #1f2937; font-size: 28px;">📊 Reporting Quotidien - ESN</h1>
              <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">${stats.dateRapport} - Généré à ${stats.heureGeneration}</p>
            </td>
          </tr>
        </table>

        <!-- Vue Globale avec TABLES -->
        <table role="presentation" style="width: 100%; margin-bottom: 30px;" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 10px;">🎯 Vue Globale</h2>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" style="width: 100%;" cellpadding="10" cellspacing="10">
                <tr>
                  <td style="background: #f9fafb; padding: 15px; border-radius: 6px; text-align: center; border: 1px solid #e5e7eb; width: 20%;">
                    <div style="font-size: 32px; font-weight: bold; margin-bottom: 5px;">${stats.totalProjets}</div>
                    <div style="color: #6b7280; font-size: 14px;">Total Projets</div>
                  </td>
                  <td style="background: #f9fafb; padding: 15px; border-radius: 6px; text-align: center; border: 1px solid #e5e7eb; width: 20%;">
                    <div style="font-size: 32px; font-weight: bold; margin-bottom: 5px; color: #10b981;">🟢 ${stats.projetsVert}</div>
                    <div style="color: #6b7280; font-size: 14px;">VERT (≥70)</div>
                  </td>
                  <td style="background: #f9fafb; padding: 15px; border-radius: 6px; text-align: center; border: 1px solid #e5e7eb; width: 20%;">
                    <div style="font-size: 32px; font-weight: bold; margin-bottom: 5px; color: #f59e0b;">🟠 ${stats.projetsOrange}</div>
                    <div style="color: #6b7280; font-size: 14px;">ORANGE (40-69)</div>
                  </td>
                  <td style="background: #f9fafb; padding: 15px; border-radius: 6px; text-align: center; border: 1px solid #e5e7eb; width: 20%;">
                    <div style="font-size: 32px; font-weight: bold; margin-bottom: 5px; color: #ef4444;">🔴 ${stats.projetsRouge}</div>
                    <div style="color: #6b7280; font-size: 14px;">ROUGE (<40)</div>
                  </td>
                  <td style="background: #f9fafb; padding: 15px; border-radius: 6px; text-align: center; border: 1px solid #e5e7eb; width: 20%;">
                    <div style="font-size: 32px; font-weight: bold; margin-bottom: 5px;">${stats.scoreMoyen}</div>
                    <div style="color: #6b7280; font-size: 14px;">Score Moyen</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Résumé Exécutif IA -->
        <table role="presentation" style="width: 100%; margin-bottom: 30px;" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 10px;">🤖 Résumé Exécutif ${llmOutput.mode === 'FALLBACK_STATIQUE' ? '(Mode dégradé)' : 'IA'}</h2>
            </td>
          </tr>
          <tr>
            <td>
              <div style="display: inline-block; padding: 6px 12px; border-radius: 4px; background: ${urgenceColor}; color: white; font-size: 12px; font-weight: bold; margin-bottom: 15px;">URGENCE : ${llmOutput.niveau_urgence}</div>
            </td>
          </tr>
          <tr>
            <td style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 20px; white-space: pre-wrap;">${llmOutput.resume_executif}</td>
          </tr>
        </table>

        <!-- Top 3 Projets Critiques -->
        <table role="presentation" style="width: 100%; margin-bottom: 30px;" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 10px;">🔴 Top 3 Projets Critiques</h2>
            </td>
          </tr>
          <tr>
            <td style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px;">
              ${stats.top3Critiques.map((p, i) => `
                <div style="margin-bottom: 10px; padding: 10px; background: white; border-radius: 4px;">
                  <strong>${i+1}. ${p.nom}</strong><br>
                  Score : <span style="color: #ef4444;">${p.score}/100</span><br>
                  Manager : ${p.manager}<br>
                  Raison : ${p.raison}
                </div>
              `).join('')}
            </td>
          </tr>
        </table>

        <!-- Alertes Critiques 24h -->
        <table role="presentation" style="width: 100%; margin-bottom: 30px; border-collapse: collapse;" cellpadding="12" cellspacing="0">
          <tr>
            <td colspan="2">
              <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 10px;">⚠️ Alertes Critiques (24h)</h2>
            </td>
          </tr>
          <tr style="background: #f9fafb;">
            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 600;">Type</th>
            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 600;">Nombre</th>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Dérives critiques détectées</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><strong>${stats.derivesCritiques}</strong></td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Prédictions risque > 80%</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><strong>${stats.predictionsHautRisque}</strong></td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Incidents non résolus</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><strong>${stats.incidentsNonResolus}</strong></td>
          </tr>
        </table>

        <!-- Actions Immédiates -->
        <table role="presentation" style="width: 100%; margin-bottom: 30px;" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 10px;">🎯 Actions Immédiates</h2>
            </td>
          </tr>
          <tr>
            <td style="background: #fefce8; border-left: 4px solid #eab308; padding: 15px;">
              <ul style="margin: 10px 0; padding-left: 20px;">
                ${llmOutput.actions_immediates.map(action => `<li style="margin-bottom: 8px;">${action}</li>`).join('')}
              </ul>
            </td>
          </tr>
        </table>

        <!-- Indicateurs Clés -->
        <table role="presentation" style="width: 100%; margin-bottom: 30px; border-collapse: collapse;" cellpadding="12" cellspacing="0">
          <tr>
            <td colspan="2">
              <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 10px;">📈 Indicateurs Clés</h2>
            </td>
          </tr>
          <tr style="background: #f9fafb;">
            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 600;">Indicateur</th>
            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 600;">Valeur</th>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Marge budget consommée</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><strong>${stats.margeConsommee}%</strong></td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Consultants en surcharge</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><strong>${stats.consultantsSurcharge}</strong></td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" style="width: 100%; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align: center; color: #6b7280; font-size: 12px;">
              <p>🤖 Rapport généré automatiquement par Aurentia ESN Command Center</p>
              <p>Pour toute question, contactez votre PMO ou la direction delivery.</p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;

// Extraire emails destinataires
const emailList = destinataires.map(d => d.email).join(', ');

console.log(`📧 HTML généré: ${html.length} caractères, ${destinataires.length} destinataires`);

return [{
  json: {
    html,
    subject: `📊 Reporting Quotidien ESN - ${stats.dateRapport}`,
    toEmail: emailList,
    stats,
    llmOutput
  }
}];
