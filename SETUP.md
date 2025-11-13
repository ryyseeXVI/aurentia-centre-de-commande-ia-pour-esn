# 🚀 Aurentia ESN - Setup Guide

## ✅ What's Been Configured

### 1. Database Schema
- ✅ **profiles** table for Supabase Auth integration
- ✅ **user_role** enum (ADMIN, MANAGER, CONSULTANT, CLIENT)
- ✅ **Auto-trigger** to create profile on signup
- ✅ **RLS policies** for role-based access control
- ✅ **Helper functions**: `get_user_role()`, `is_admin()`, `is_manager_or_admin()`
- ✅ Linked **consultant** and **client** tables to profiles

### 2. Supabase Auth Integration
- ✅ Client-side auth (`lib/supabase/client.ts`)
- ✅ Server-side auth (`lib/supabase/server.ts`)
- ✅ Middleware for session management (`middleware.ts`)
- ✅ TypeScript types (`lib/supabase/types.ts`)

### 3. Environment Configuration
- ✅ `.env` file with Supabase credentials
- ✅ Packages installed: `@supabase/ssr`, `@supabase/supabase-js`

### 4. Mock Data Seed Scripts
- ✅ SQL seed (`supabase/seed.sql`) - partial
- ✅ TypeScript seed (`scripts/seed.ts`) - complete

---

## 📋 Next Steps

### Step 1: Get Service Role Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **aurentia-centre-de-commande-ia-pour-esn**
3. Go to **Settings** → **API**
4. Copy the **service_role** key (NOT the anon key)
5. Update `.env` file:

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 2: Run Seed Script

```bash
npm run seed
```

This will create:
- 👥 **12 auth users** (admin, managers, consultants, clients)
- 🏢 **8 clients** (BNP Paribas, AXA, Orange, etc.)
- 👨‍💻 **15 consultants** with hierarchy
- 🎯 **20 competences** (React, Python, AWS, etc.)
- 📊 **5 projects** with realistic scenarios
- 📅 **Assignments, tasks, time tracking, incidents**
- 🤖 **AI data**: health scores, risk predictions, recommendations

### Step 3: Test Login

Default credentials after seeding:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@aurentia.fr` | `Admin123!` |
| Manager | `celine.girard@aurentia.fr` | `Manager123!` |
| Consultant | `alexandre.simon@aurentia.fr` | `Consultant123!` |
| Client | `jean.dupont@bnpparibas.fr` | `Client123!` |

---

## 🗄️ Database Schema Overview

### Core Tables
```
profiles (auth integration)
├── consultant (with user_id FK)
├── client (with contact_user_id FK)
├── projet
│   ├── affectation (consultant assignments)
│   ├── tache (tasks)
│   ├── temps_passe (time tracking)
│   ├── livrable (deliverables)
│   ├── incident
│   ├── budget_projet
│   ├── facture (invoices)
│   └── AI Tables:
│       ├── score_sante_projet (health scores)
│       ├── detection_derive (drift detection)
│       ├── prediction_risque (risk predictions)
│       └── recommandation_action (AI recommendations)
└── competence
    └── consultant_competence (junction)
```

### Access Control (RLS Policies)

| Role | Permissions |
|------|-------------|
| **ADMIN** | Full access to all tables |
| **MANAGER** | Manage consultants, clients, projects |
| **CONSULTANT** | View all data, create own time entries |
| **CLIENT** | View own projects and reports |

---

## 🔑 Auth Integration Details

### Signup Flow
1. User signs up via Supabase Auth with metadata:
   ```ts
   {
     email: 'user@example.com',
     password: 'SecurePass123!',
     options: {
       data: {
         nom: 'Doe',
         prenom: 'John',
         role: 'CONSULTANT'
       }
     }
   }
   ```

2. **Trigger auto-creates** profile in `profiles` table
3. User can be linked to `consultant` or `client` table via `user_id`

### Role Selection
Users select their role during signup:
- ✅ **ADMIN** - Full system access
- ✅ **MANAGER** - Team & project management
- ✅ **CONSULTANT** - Project participation & time tracking
- ✅ **CLIENT** - View project status & reports

---

## 📊 Mock Data Preview

### Projects Created
1. **Modernisation Plateforme Bancaire** (BNP Paribas)
   - Team: Alexandre (PM), Émilie, Thomas, Maxime
   - Duration: 12 months
   - Budget: €800K
   - Status: ACTIF (Active)

2. **Portail Client Digital** (AXA)
   - Team: Julie (PM), Sarah, Chloé
   - Duration: 9 months
   - Budget: €450K
   - Status: ACTIF

3. **Migration Cloud Azure** (Orange)
   - Team: Nicolas (PM), Julien, Camille
   - Duration: 16 months
   - Budget: €1.2M
   - Status: ACTIF

4. **Dashboard IoT Énergies** (TotalEnergies)
   - Team: Alexandre (PM)
   - Duration: 6 months
   - Status: TERMINÉ (Completed)

5. **API E-commerce** (Carrefour)
   - Team: Julie (PM), Laura, Antoine
   - Duration: 6 months
   - Budget: €320K
   - Status: ACTIF

### AI Mock Data
- **Health Scores**: Projects rated VERT/ORANGE/ROUGE
- **Drift Detection**: Budget, schedule, workload overruns
- **Risk Predictions**: Delay, burnout, margin risks
- **Recommendations**: Resource adjustments, reschedules

---

## 🛠️ Development Workflow

### Start Dev Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Lint Code
```bash
npm run lint
```

---

## 📁 File Structure

```
aurentia-centre-de-commande-ia-pour-esn/
├── app/                          # Next.js App Router
├── components/                   # React components
├── lib/
│   └── supabase/
│       ├── client.ts            # Browser client
│       ├── server.ts            # Server client
│       ├── middleware.ts        # Session management
│       └── types.ts             # TypeScript types
├── scripts/
│   └── seed.ts                  # Database seeding script
├── supabase/
│   └── migrations/
│       └── 20251113183843_...   # Auth migration
│   └── seed.sql                 # SQL seed data
├── middleware.ts                # Next.js middleware
├── .env                         # Environment variables
└── package.json
```

---

## 🔒 Security Notes

- ✅ RLS (Row Level Security) enabled on all tables
- ✅ Service role key kept server-side only
- ✅ Anon key safe for client-side use
- ✅ Middleware protects authenticated routes
- ⚠️  **Never commit `.env` to Git!** (add to `.gitignore`)

---

## 🎯 PRD Compliance

Your schema **100% supports** the PRD requirements:

| PRD Requirement | Implementation |
|----------------|----------------|
| War Room Dashboard | ✅ All project data available |
| Real-time Monitoring | ✅ `temps_passe`, `incident` tables |
| Health Scores | ✅ `score_sante_projet` with AI reasoning |
| Drift Detection | ✅ `detection_derive` (planning, budget, workload) |
| Risk Predictions | ✅ `prediction_risque` (delay, burnout, margin) |
| AI Recommendations | ✅ `recommandation_action` |
| Margin Tracking | ✅ `budget_projet`, `facture` |
| Consultant Workload | ✅ `affectation`, `temps_passe` |
| Multi-role Access | ✅ ADMIN, MANAGER, CONSULTANT, CLIENT |

---

## 🚨 Troubleshooting

### Migration Errors
If you see RLS policy errors:
```sql
-- Check policies exist
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### Auth Issues
```ts
// Check if user is authenticated
const { data: { user } } = await supabase.auth.getUser()
console.log('Current user:', user)

// Check user role
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()
```

### Seed Script Fails
1. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
2. Check Supabase project is active
3. Run SQL seed manually via Supabase Dashboard if needed

---

## 📞 Support

For issues or questions:
- Check [Supabase Docs](https://supabase.com/docs)
- Review migration file: `supabase/migrations/20251113183843_create_profiles_and_auth_integration.sql`
- Inspect RLS policies in Supabase Dashboard

---

**🎉 You're all set! Run `npm run seed` and start building your AI Command Center!**
