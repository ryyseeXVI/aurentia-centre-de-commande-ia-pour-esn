# RLS Security Scripts

Scripts pour désactiver/réactiver les Row Level Security policies.

## ⚠️ AVERTISSEMENT

**Désactiver RLS supprime TOUTE isolation multi-tenant**. Tous les utilisateurs authentifiés peuvent voir les données de TOUTES les organisations.

**À utiliser UNIQUEMENT pour** :
- POC de 24h
- Développement local
- Démos sans données réelles

**JAMAIS en production avec données clients réelles !**

---

## 🚀 Utilisation rapide

### Option 1 : Via Supabase Dashboard (RECOMMANDÉ)

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Copiez-collez le contenu de `disable-all-rls.sql`
5. Cliquez sur **Run**

✅ Toutes les données sont maintenant accessibles à tous les utilisateurs authentifiés

### Option 2 : Via Supabase CLI (si installé)

```bash
# Désactiver RLS
supabase db execute < scripts/disable-all-rls.sql

# Pour réactiver plus tard
supabase db execute < scripts/enable-all-rls.sql
```

---

## 📋 Scripts disponibles

### `disable-all-rls.sql`
Désactive RLS sur **33 tables** :
- Tables métier (projets, tâches, consultants, etc.)
- Tables utilisateurs et organisations
- Tables de messagerie
- Tables de milestones

### `enable-all-rls.sql`
Réactive RLS sur les mêmes 33 tables.

---

## ✅ Vérification

Après avoir exécuté `disable-all-rls.sql`, vérifiez avec cette requête :

```sql
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Résultat attendu** : Toutes les tables devraient avoir `rls_enabled = false`

---

## 🔄 Pour réactiver la sécurité

Exécutez simplement `enable-all-rls.sql` de la même manière.

---

## 💡 Ce qui change après désactivation

### Avant (RLS activé) :
```typescript
// L'utilisateur A de l'organisation 1 voit UNIQUEMENT les projets de l'org 1
const { data } = await supabase.from('projet').select('*')
// Résultat : projets de l'organisation de l'utilisateur uniquement
```

### Après (RLS désactivé) :
```typescript
// L'utilisateur A voit TOUS les projets de TOUTES les organisations
const { data } = await supabase.from('projet').select('*')
// Résultat : projets de TOUTES les organisations
```

### Pour filtrer manuellement (si besoin) :
```typescript
// Filtrer par organization_id si vous voulez limiter
const { data } = await supabase
  .from('projet')
  .select('*')
  .eq('organization_id', currentOrgId)
```

---

## 🔐 Impact sur la sécurité

| Aspect | Avec RLS | Sans RLS |
|--------|----------|----------|
| Isolation données | ✅ Automatique par org | ❌ Aucune |
| Accès cross-org | ❌ Impossible | ✅ Total |
| Sécurité multi-tenant | ✅ Garantie | ❌ Nulle |
| Performance | ⚠️ Légèrement plus lent | ✅ Plus rapide |
| RGPD compliant | ✅ Oui | ❌ Non |

---

## 📌 Notes importantes

1. **Les policies sont toujours définies** dans la base, mais simplement **ignorées** quand RLS est désactivé
2. **Réactiver RLS** restaure immédiatement la sécurité (les policies existantes reprennent effet)
3. **Aucune donnée n'est perdue** en désactivant/réactivant RLS
4. **Le code applicatif** fonctionne exactement pareil (les requêtes ne changent pas)

---

## 🛠️ Alternatives considérées

Si vous aviez besoin de sécurité partielle, voici d'autres options (non implémentées ici) :

### Option A : Service Role Key (dev uniquement)
```typescript
// Backend uniquement, bypass RLS sans modifier le schéma
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Secret, jamais exposé côté client
)
```

### Option B : Super Admin Flag
```sql
-- Ajouter un flag is_super_admin aux profiles
ALTER TABLE profiles ADD COLUMN is_super_admin BOOLEAN DEFAULT false;

-- Modifier les policies pour permettre un bypass contrôlé
CREATE POLICY "Super admin can view all"
  ON projet
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
    OR
    organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
  );
```

Pour un POC de 24h, la solution choisie (désactivation totale) est la plus simple.
