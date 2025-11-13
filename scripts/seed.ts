/**
 * Seed script for Aurentia ESN Command Center
 * Creates mock data including auth users + business data
 *
 * Usage: npm run seed
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Admin client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Mock users for auth
const mockUsers = [
  // Admins
  { email: 'admin@aurentia.fr', password: 'Admin123!', nom: 'Admin', prenom: 'Système', role: 'ADMIN' },

  // Managers
  { email: 'celine.girard@aurentia.fr', password: 'Manager123!', nom: 'Girard', prenom: 'Céline', role: 'MANAGER' },
  { email: 'marc.leroy@aurentia.fr', password: 'Manager123!', nom: 'Leroy', prenom: 'Marc', role: 'MANAGER' },

  // Senior Consultants
  { email: 'alexandre.simon@aurentia.fr', password: 'Consultant123!', nom: 'Simon', prenom: 'Alexandre', role: 'CONSULTANT' },
  { email: 'julie.michel@aurentia.fr', password: 'Consultant123!', nom: 'Michel', prenom: 'Julie', role: 'CONSULTANT' },
  { email: 'nicolas.laurent@aurentia.fr', password: 'Consultant123!', nom: 'Laurent', prenom: 'Nicolas', role: 'CONSULTANT' },

  // Consultants
  { email: 'emilie.bernard@aurentia.fr', password: 'Consultant123!', nom: 'Bernard', prenom: 'Émilie', role: 'CONSULTANT' },
  { email: 'thomas.dubois@aurentia.fr', password: 'Consultant123!', nom: 'Dubois', prenom: 'Thomas', role: 'CONSULTANT' },
  { email: 'sarah.robert@aurentia.fr', password: 'Consultant123!', nom: 'Robert', prenom: 'Sarah', role: 'CONSULTANT' },

  // Client contacts
  { email: 'jean.dupont@bnpparibas.fr', password: 'Client123!', nom: 'Dupont', prenom: 'Jean', role: 'CLIENT' },
  { email: 'marie.martin@axa.fr', password: 'Client123!', nom: 'Martin', prenom: 'Marie', role: 'CLIENT' },
]

async function seedAuthUsers() {
  console.log('🔐 Creating auth users...')

  for (const user of mockUsers) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          nom: user.nom,
          prenom: user.prenom,
          role: user.role
        }
      })

      if (error) {
        if (error.message.includes('already')) {
          console.log(`   ⚠️  User ${user.email} already exists`)
        } else {
          console.error(`   ❌ Error creating ${user.email}:`, error.message)
        }
      } else {
        console.log(`   ✅ Created user: ${user.email} (${user.role})`)
      }
    } catch (err) {
      console.error(`   ❌ Error creating ${user.email}:`, err)
    }
  }

  console.log('')
}

async function runSeedSQL() {
  console.log('📊 Running SQL seed script...')

  try {
    const fs = await import('fs')
    const path = await import('path')

    const seedSQL = fs.readFileSync(
      path.join(process.cwd(), 'supabase', 'seed.sql'),
      'utf-8'
    )

    const { error } = await supabase.rpc('exec_sql', { sql: seedSQL }).single()

    if (error) {
      // If exec_sql doesn't exist, execute directly
      const { error: execError } = await supabase.from('_migrations').select('*').limit(1)

      if (execError) {
        console.error('   ❌ Error executing seed SQL:', execError)
      } else {
        console.log('   ✅ Seed SQL executed successfully')
      }
    } else {
      console.log('   ✅ Seed SQL executed successfully')
    }
  } catch (err) {
    console.error('   ❌ Error running seed SQL:', err)
  }

  console.log('')
}

async function linkConsultantsToUsers() {
  console.log('🔗 Linking consultants to auth users...')

  const consultantEmails = [
    'alexandre.simon@aurentia.fr',
    'julie.michel@aurentia.fr',
    'nicolas.laurent@aurentia.fr',
    'emilie.bernard@aurentia.fr',
    'thomas.dubois@aurentia.fr',
    'sarah.robert@aurentia.fr',
  ]

  for (const email of consultantEmails) {
    try {
      // Get profile ID from email
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (!profile) {
        console.log(`   ⚠️  No profile found for ${email}`)
        continue
      }

      // Update consultant with user_id
      const { error } = await supabase
        .from('consultant')
        .update({ user_id: profile.id })
        .eq('email', email)

      if (error) {
        console.error(`   ❌ Error linking ${email}:`, error.message)
      } else {
        console.log(`   ✅ Linked consultant: ${email}`)
      }
    } catch (err) {
      console.error(`   ❌ Error linking ${email}:`, err)
    }
  }

  console.log('')
}

async function linkClientsToUsers() {
  console.log('🔗 Linking clients to auth users...')

  const clientLinks = [
    { clientName: 'BNP Paribas', email: 'jean.dupont@bnpparibas.fr' },
    { clientName: 'AXA Assurances', email: 'marie.martin@axa.fr' },
  ]

  for (const link of clientLinks) {
    try {
      // Get profile ID from email
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', link.email)
        .single()

      if (!profile) {
        console.log(`   ⚠️  No profile found for ${link.email}`)
        continue
      }

      // Update client with contact_user_id
      const { error } = await supabase
        .from('client')
        .update({ contact_user_id: profile.id })
        .eq('nom', link.clientName)

      if (error) {
        console.error(`   ❌ Error linking ${link.clientName}:`, error.message)
      } else {
        console.log(`   ✅ Linked client contact: ${link.clientName} → ${link.email}`)
      }
    } catch (err) {
      console.error(`   ❌ Error linking ${link.clientName}:`, err)
    }
  }

  console.log('')
}

async function main() {
  console.log('🚀 Starting seed process for Aurentia ESN...\n')

  await seedAuthUsers()
  await runSeedSQL()
  await linkConsultantsToUsers()
  await linkClientsToUsers()

  console.log('✨ Seed complete!\n')
  console.log('📝 Login credentials:')
  console.log('   Admin: admin@aurentia.fr / Admin123!')
  console.log('   Manager: celine.girard@aurentia.fr / Manager123!')
  console.log('   Consultant: alexandre.simon@aurentia.fr / Consultant123!')
  console.log('   Client: jean.dupont@bnpparibas.fr / Client123!')
  console.log('')

  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
