# 📊 Mock Data Summary - Aurentia ESN Command Center

## ✅ Database Successfully Populated!

All business data has been inserted via Supabase MCP. The database is ready for use.

---

## 📈 Data Overview

| Table | Count | Description |
|-------|-------|-------------|
| **Competences** | 20 | React, Python, AWS, Azure, Docker, etc. |
| **Clients** | 8 | BNP Paribas, AXA, Orange, TotalEnergies, Carrefour, SNCF, Airbus, Thales |
| **Consultants** | 15 | 3 managers, 3 seniors, 5 consultants, 4 juniors |
| **Consultant-Competences** | 61 | Skills mapping with 1-5 levels |
| **Projets** | 5 | Active projects for French enterprise clients |
| **Affectations** | 13 | Consultant assignments (50-100% allocation) |
| **Budgets** | 5 | Project budgets (€280K - €1.2M) |
| **Livrables** | 10 | Project deliverables |
| **Taches** | 10 | Tasks assigned to consultants |
| **Temps Passé** | 11 | Time tracking entries (Nov 2024) |
| **Incidents** | 5 | Project incidents (critical to minor) |
| **Factures** | 12 | Invoices totaling €2.59M |
| **Health Scores** | 5 | AI project health analysis |
| **Dérives** | 4 | Detected drifts (planning, workload, budget) |
| **Predictions** | 6 | AI risk predictions |
| **Recommandations** | 5 | AI-generated action recommendations |
| **Profiles (auth)** | 0 | *Users will create accounts via signup* |

**Total Business Records: 174**

---

## 🏢 Mock Projects Created

### 1️⃣ Modernisation Plateforme Bancaire (BNP Paribas)
- **Team**: Alexandre Simon (PM 50%), Émilie Bernard (100%), Thomas Dubois (100%), Maxime Durand (80%)
- **Duration**: Jan 2024 → Jan 2025 (12 months)
- **Budget**: €800K sale, €520K cost, 35% margin
- **Status**: 🟠 ORANGE (72/100 health score)
- **Issue**: Slight delay, high workload for Émilie
- **AI Recommendation**: Add senior React/Node.js developer

### 2️⃣ Portail Client Digital (AXA Assurances)
- **Team**: Julie Michel (PM 60%), Sarah Robert (100%), Chloé Lefebvre (100%)
- **Duration**: Mar 2024 → Dec 2024 (9 months)
- **Budget**: €450K sale, €310K cost, 31% margin
- **Status**: 🟢 GREEN (85/100 health score)
- **Issue**: None - on track!

### 3️⃣ Migration Cloud Azure (Orange Télécom)
- **Team**: Nicolas Laurent (PM 70%), Julien Richard (100%), Camille Vincent (50%)
- **Duration**: Feb 2024 → Jun 2025 (16 months)
- **Budget**: €1.2M sale, €780K cost, 35% margin
- **Status**: 🔴 RED (45/100 health score) - **CRITICAL!**
- **Issues**:
  - Blocking AKS deployment incident (5 days)
  - Julien Richard in severe overwork (10h/day)
  - 85% burnout risk prediction
  - Budget overrun risk (72% probability)
- **AI Recommendations**:
  - URGENT: Reduce Julien's workload to 80% max
  - Add Azure expert reinforcement
  - Negotiate budget amendment (+€150K)
  - Schedule crisis meeting with client

### 4️⃣ Dashboard IoT Énergies (TotalEnergies)
- **Team**: Alexandre Simon (PM)
- **Duration**: Jun 2024 → Nov 2024 (6 months)
- **Budget**: €280K sale, €195K cost, 30% margin
- **Status**: 🟢 GREEN (95/100) - **COMPLETED!**
- **Result**: Delivered 2 weeks early, client very satisfied

### 5️⃣ API E-commerce (Carrefour)
- **Team**: Julie Michel (PM 40%), Laura Petit (100%), Antoine Roux (80%)
- **Duration**: Sep 2024 → Mar 2025 (6 months)
- **Budget**: €320K sale, €215K cost, 33% margin
- **Status**: 🟢 GREEN (90/100 health score)
- **Issue**: None - excellent start!

---

## 👥 Mock Consultants

### Management (3)
- **Laurent Moreau** (Directeur) - €600/day cost, €950/day sale
- **Céline Girard** (Manager) - €550/day cost, €900/day sale
- **Marc Leroy** (Manager) - €550/day cost, €900/day sale

### Senior Consultants (3)
- **Alexandre Simon** - React/Node.js/AWS expert (Level 5)
- **Julie Michel** - Python/Cloud/Kubernetes expert (Level 5)
- **Nicolas Laurent** - Java/Spring Boot/Azure expert (Level 5)

### Consultants (5)
- **Émilie Bernard** - React/TypeScript (Level 4)
- **Thomas Dubois** - Vue.js/Node.js (Level 4)
- **Sarah Robert** - Angular/Azure (Level 4)
- **Julien Richard** - Python/AWS (Level 4) - **Currently overworked!**
- **Laura Petit** - React/TypeScript (Level 3)

### Junior Consultants (4)
- **Maxime Durand** - React (Level 2)
- **Chloé Lefebvre** - Vue.js/TypeScript (Level 2)
- **Antoine Roux** - Python/MongoDB (Level 2)
- **Camille Vincent** - Java/Spring Boot (Level 2)

---

## 🚨 Critical Scenarios for Demo

### War Room Dashboard Should Show:

**🔴 ALERTS:**
- **Migration Cloud Azure** (Orange): RED status, blocking incident, consultant burnout risk
- **Julien Richard**: 10h/day workload (27.5h over 3 days = 9.2h avg)
- **Budget**: 72% probability of overrun on Azure migration

**🟠 WARNINGS:**
- **Modernisation Plateforme Bancaire** (BNP): ORANGE status, slight delay
- **Planning**: Moderate drift detected

**🟢 HEALTHY:**
- **Portail Client Digital** (AXA): On track, good velocity
- **API E-commerce** (Carrefour): Excellent start
- **Dashboard IoT** (TotalEnergies): Successfully completed

---

## 🔐 Supabase Auth Setup

### How Auth Works

Your database is configured with:
- ✅ `profiles` table with trigger that auto-creates profile on signup
- ✅ RLS policies based on user roles
- ✅ Role enum: `ADMIN`, `MANAGER`, `CONSULTANT`, `CLIENT`

### Signup Flow

When a user signs up, they provide:
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'SecurePassword123!',
  options: {
    data: {
      nom: 'Dupont',
      prenom: 'Jean',
      role: 'CONSULTANT'  // or ADMIN, MANAGER, CLIENT
    }
  }
})
```

**What happens:**
1. User created in `auth.users` table (managed by Supabase)
2. Trigger automatically creates row in `profiles` table
3. User can now log in

### Login Flow

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'SecurePassword123!'
})
```

### Linking Users to Consultants/Clients

**After signup**, you can link the profile to consultant records:

```typescript
// Get current user
const { data: { user } } = await supabase.auth.getUser()

// Link to consultant table
await supabase
  .from('consultant')
  .update({ user_id: user.id })
  .eq('email', user.email)
```

---

## 🛠️ Next Steps

### 1. Create Your Admin Account
Use your signup form to create an admin account:
- Email: `admin@aurentia.fr`
- Password: Choose a secure password
- Role: `ADMIN`

### 2. Test Login
- Use the credentials you just created
- Verify you can access the dashboard
- Check RLS is working (you should see all data as ADMIN)

### 3. Create Test Accounts
Create accounts for different roles to test:
- **Manager**: `manager@aurentia.fr` → role: `MANAGER`
- **Consultant**: `consultant@aurentia.fr` → role: `CONSULTANT`
- **Client**: `client@aurentia.fr` → role: `CLIENT`

### 4. Link Existing Consultants (Optional)
You can link auth users to existing consultant records:

```sql
-- After creating auth user for alexandre.simon@aurentia.fr
UPDATE consultant
SET user_id = (SELECT id FROM profiles WHERE email = 'alexandre.simon@aurentia.fr')
WHERE email = 'alexandre.simon@aurentia.fr';
```

---

## 📊 API Access Examples

### Get All Projects (as authenticated user)
```typescript
const { data: projects } = await supabase
  .from('projet')
  .select('*, client(*), chef_projet:consultant(*)')
```

### Get Project Health Scores
```typescript
const { data: health } = await supabase
  .from('score_sante_projet')
  .select('*, projet(*)')
  .order('date_analyse', { ascending: false })
```

### Get Critical Alerts
```typescript
const { data: alerts } = await supabase
  .from('detection_derive')
  .select('*, projet(*), consultant(*)')
  .eq('gravite', 'CRITIQUE')
```

### Get AI Recommendations
```typescript
const { data: recommendations } = await supabase
  .from('recommandation_action')
  .select('*, projet(*), prediction:prediction_risque(*)')
  .eq('statut', 'EN_ATTENTE')
```

---

## 🎯 Key Features Demonstrated

| Feature | Data Available |
|---------|----------------|
| **War Room Dashboard** | 5 projects with color-coded status |
| **Health Scores** | AI reasoning for each project |
| **Drift Detection** | 4 active drifts detected |
| **Risk Predictions** | 6 predictions (delay, burnout, budget) |
| **AI Recommendations** | 5 actionable recommendations |
| **Consultant Workload** | Time tracking showing overwork |
| **Margin Tracking** | Budgets vs invoices |
| **Incident Management** | 5 incidents (resolved & active) |
| **Multi-role Access** | ADMIN, MANAGER, CONSULTANT, CLIENT |

---

## 🔍 SQL Queries for Testing

### Check Data Integrity
```sql
-- Verify all foreign keys are valid
SELECT
  (SELECT COUNT(*) FROM projet WHERE client_id IS NOT NULL) as projets_with_clients,
  (SELECT COUNT(*) FROM affectation WHERE projet_id IS NOT NULL AND consultant_id IS NOT NULL) as valid_affectations,
  (SELECT COUNT(*) FROM temps_passe WHERE projet_id IS NOT NULL AND consultant_id IS NOT NULL) as valid_time_entries;
```

### Find Critical Projects
```sql
SELECT p.nom, s.score_global, s.couleur_risque, s.raisonnement_ia
FROM projet p
JOIN score_sante_projet s ON s.projet_id = p.id
WHERE s.couleur_risque IN ('ROUGE', 'ORANGE')
ORDER BY s.score_global ASC;
```

### Consultant Workload Analysis
```sql
SELECT
  c.nom,
  c.prenom,
  SUM(tp.heures_travaillees) as total_hours,
  COUNT(DISTINCT tp.date) as days_worked,
  ROUND(SUM(tp.heures_travaillees) / COUNT(DISTINCT tp.date), 2) as avg_hours_per_day
FROM consultant c
JOIN temps_passe tp ON tp.consultant_id = c.id
WHERE tp.date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY c.id, c.nom, c.prenom
HAVING SUM(tp.heures_travaillees) / COUNT(DISTINCT tp.date) > 8.5
ORDER BY avg_hours_per_day DESC;
```

---

## ✅ You're All Set!

**Database**: ✅ Fully populated with realistic mock data
**Auth**: ✅ Configured and ready (profiles table + RLS + trigger)
**Foreign Keys**: ✅ All relationships properly linked
**AI Data**: ✅ Health scores, predictions, recommendations ready

**🎉 Start building your dashboard! All data is ready to query.**

---

## 📞 Quick Reference

**Supabase Project**: `wvtdnzmdescsvxosunds`
**Region**: EU North (Stockholm)
**Database**: PostgreSQL 17.6

**Environment Variables**:
- `NEXT_PUBLIC_SUPABASE_URL`: ✅ Configured
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: ✅ Configured
- `SUPABASE_SERVICE_ROLE_KEY`: ✅ Configured

**Client Files**:
- `lib/supabase/client.ts` - Browser client
- `lib/supabase/server.ts` - Server client
- `lib/supabase/middleware.ts` - Session management
- `middleware.ts` - Route protection

---

**Ready to demo your AI Command Center! 🚀**
