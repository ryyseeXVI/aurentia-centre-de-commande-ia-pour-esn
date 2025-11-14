// ============================================================================
// CODE JAVASCRIPT - DÉTECTION DES 6 TYPES D'INCIDENTS
// ============================================================================
// Récupère les données de tous les nœuds précédents et détecte les incidents

const orgId = $('Set Organization ID').item.json.organization_id;

// Récupérer toutes les données des nœuds précédents
const projets = $('Get Projets ACTIF').all().map(item => item.json);
const budgets = $('Get Budget Projets').all().map(item => item.json);
const tempsPasse = $('Get Temps Passé').all().map(item => item.json);
const consultants = $('Get Consultants').all().map(item => item.json);
const taches = $('Get Tâches').all().map(item => item.json);
const incidents = $('Get Incidents').all().map(item => item.json);

// Array pour stocker tous les incidents détectés
const incidentsDetectes = [];

// ============================================================================
// INCIDENT 1: Dépassement Budget (>20%)
// ============================================================================
for (const projet of projets) {
  const budget = budgets.find(b => b.projet_id === projet.id);
  if (!budget) continue;

  // Calculer le coût réel
  const tempsProjet = tempsPasse.filter(tp => tp.projet_id === projet.id);
  let coutReel = 0;

  for (const tp of tempsProjet) {
    const consultant = consultants.find(c => c.id === tp.consultant_id);
    if (consultant && consultant.taux_journalier_cout && tp.heures_travaillees) {
      coutReel += (tp.heures_travaillees * consultant.taux_journalier_cout) / 7.0;
    }
  }

  // Vérifier le dépassement
  if (budget.cout_estime_total && coutReel > budget.cout_estime_total * 1.20) {
    const depassementPct = ((coutReel / budget.cout_estime_total) * 100) - 100;
    incidentsDetectes.push({
      projet_id: projet.id,
      projet_nom: projet.nom,
      organization_id: projet.organization_id,
      type_derive: 'DEPASSEMENT_BUDGET',
      gravite: 'CRITIQUE',
      metriques: {
        cout_estime_total: budget.cout_estime_total,
        cout_reel: Math.round(coutReel * 100) / 100,
        depassement_pct: Math.round(depassementPct * 100) / 100
      }
    });
  }
}

// ============================================================================
// INCIDENT 2: Retard Planning (>30 jours)
// ============================================================================
const today = new Date();
today.setHours(0, 0, 0, 0);

for (const projet of projets) {
  if (!projet.date_fin_prevue) continue;

  const dateFin = new Date(projet.date_fin_prevue);
  dateFin.setHours(0, 0, 0, 0);

  if (dateFin < today) {
    const joursRetard = Math.floor((today - dateFin) / (1000 * 60 * 60 * 24));

    if (joursRetard > 30) {
      incidentsDetectes.push({
        projet_id: projet.id,
        projet_nom: projet.nom,
        organization_id: projet.organization_id,
        type_derive: 'RETARD_PLANNING',
        gravite: 'MAJEUR',
        metriques: {
          date_fin_prevue: projet.date_fin_prevue,
          jours_retard: joursRetard
        }
      });
    }
  }
}

// ============================================================================
// INCIDENT 3: Explosion Heures (>150%)
// ============================================================================
for (const projet of projets) {
  const tachesProjet = taches.filter(t => t.projet_id === projet.id && t.charge_estimee_jh);

  if (tachesProjet.length === 0) continue;

  // Calculer heures estimées (jours-homme * 7)
  const heuresEstimees = tachesProjet.reduce((sum, t) => sum + (t.charge_estimee_jh * 7.0), 0);

  if (heuresEstimees === 0) continue;

  // Calculer heures réelles
  let heuresReelles = 0;
  for (const tache of tachesProjet) {
    const tempsT = tempsPasse.filter(tp => tp.tache_id === tache.id);
    heuresReelles += tempsT.reduce((sum, tp) => sum + (tp.heures_travaillees || 0), 0);
  }

  // Vérifier le dépassement
  if (heuresReelles > heuresEstimees * 1.5) {
    const depassementPct = ((heuresReelles / heuresEstimees) * 100) - 100;
    incidentsDetectes.push({
      projet_id: projet.id,
      projet_nom: projet.nom,
      organization_id: projet.organization_id,
      type_derive: 'EXPLOSION_HEURES',
      gravite: 'CRITIQUE',
      metriques: {
        heures_estimees: Math.round(heuresEstimees * 100) / 100,
        heures_reelles: Math.round(heuresReelles * 100) / 100,
        depassement_pct: Math.round(depassementPct * 100) / 100
      }
    });
  }
}

// ============================================================================
// INCIDENT 4: Tâches Bloquées (>7 jours)
// ============================================================================
for (const projet of projets) {
  const tachesBloqueesProjet = taches.filter(t => {
    if (t.projet_id !== projet.id || t.statut !== 'BLOCKED') return false;

    const updatedAt = new Date(t.updated_at);
    const joursBloque = Math.floor((today - updatedAt) / (1000 * 60 * 60 * 24));

    return joursBloque > 7;
  });

  if (tachesBloqueesProjet.length > 0) {
    incidentsDetectes.push({
      projet_id: projet.id,
      projet_nom: projet.nom,
      organization_id: projet.organization_id,
      type_derive: 'TACHES_BLOQUEES',
      gravite: 'MOYEN',
      metriques: {
        nb_taches_bloquees: tachesBloqueesProjet.length
      }
    });
  }
}

// ============================================================================
// INCIDENT 5: Incidents Critiques Ouverts
// ============================================================================
for (const projet of projets) {
  const incidentsCritiquesProjet = incidents.filter(i =>
    i.projet_id === projet.id &&
    i.severite === 'CRITIQUE' &&
    !['RESOLU', 'FERME', 'CLOS'].includes(i.statut)
  );

  if (incidentsCritiquesProjet.length > 0) {
    incidentsDetectes.push({
      projet_id: projet.id,
      projet_nom: projet.nom,
      organization_id: projet.organization_id,
      type_derive: 'INCIDENTS_CRITIQUES',
      gravite: 'MOYEN',
      metriques: {
        nb_incidents_critiques: incidentsCritiquesProjet.length
      }
    });
  }
}

// ============================================================================
// INCIDENT 6: Marge Faible (<10%)
// ============================================================================
for (const projet of projets) {
  const budget = budgets.find(b => b.projet_id === projet.id);
  if (!budget || !budget.montant_total_vente) continue;

  // Calculer le coût réel
  const tempsProjet = tempsPasse.filter(tp => tp.projet_id === projet.id);
  let coutReel = 0;

  for (const tp of tempsProjet) {
    const consultant = consultants.find(c => c.id === tp.consultant_id);
    if (consultant && consultant.taux_journalier_cout && tp.heures_travaillees) {
      coutReel += (tp.heures_travaillees * consultant.taux_journalier_cout) / 7.0;
    }
  }

  const margeReelle = budget.montant_total_vente - coutReel;
  const margePct = (margeReelle / budget.montant_total_vente) * 100;

  // Vérifier si marge < 10%
  if (margePct < 10) {
    incidentsDetectes.push({
      projet_id: projet.id,
      projet_nom: projet.nom,
      organization_id: projet.organization_id,
      type_derive: 'MARGE_FAIBLE',
      gravite: 'MAJEUR',
      metriques: {
        montant_total_vente: budget.montant_total_vente,
        cout_reel: Math.round(coutReel * 100) / 100,
        marge_reelle: Math.round(margeReelle * 100) / 100,
        marge_pct: Math.round(margePct * 100) / 100
      }
    });
  }
}

// ============================================================================
// RETOURNER LES INCIDENTS DÉTECTÉS
// ============================================================================
return incidentsDetectes.map(incident => ({
  json: incident
}));
