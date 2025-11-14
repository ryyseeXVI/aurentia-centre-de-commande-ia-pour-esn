#!/bin/bash

# ==================================================================
# Apply Messaging System Migration
# This script applies the messaging system migration to Supabase
# ==================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "========================================="
echo "Messaging System Migration"
echo "========================================="
echo ""

# Check if .env.local exists
if [ ! -f "$PROJECT_ROOT/.env.local" ]; then
  echo "❌ Error: .env.local file not found"
  echo "Please create .env.local with your Supabase credentials"
  exit 1
fi

# Load environment variables
source "$PROJECT_ROOT/.env.local"

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL not found in .env.local"
  exit 1
fi

echo "📍 Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""

# Extract project ref from URL
PROJECT_REF=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed -E 's|https://([^.]+)\.supabase\.co|\1|')

echo "🔑 Project Ref: $PROJECT_REF"
echo ""

# Check if migration file exists
MIGRATION_FILE="$PROJECT_ROOT/supabase/migrations/20251114000000_create_messaging_system.sql"
SEED_FILE="$PROJECT_ROOT/scripts/seed-default-channels.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Error: Migration file not found at $MIGRATION_FILE"
  exit 1
fi

if [ ! -f "$SEED_FILE" ]; then
  echo "❌ Error: Seed file not found at $SEED_FILE"
  exit 1
fi

echo "========================================="
echo "OPTION 1: Supabase CLI (Recommended)"
echo "========================================="
echo ""
echo "If you have Supabase CLI installed, run:"
echo ""
echo "  npx supabase db push --project-ref $PROJECT_REF"
echo ""
echo "Then apply the seed data:"
echo "  npx supabase db execute --project-ref $PROJECT_REF -f scripts/seed-default-channels.sql"
echo ""

echo "========================================="
echo "OPTION 2: Supabase Dashboard (Manual)"
echo "========================================="
echo ""
echo "1. Open Supabase SQL Editor:"
echo "   https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
echo ""
echo "2. Copy and paste the contents of:"
echo "   $MIGRATION_FILE"
echo ""
echo "3. Click 'Run' to create the tables"
echo ""
echo "4. Then copy and paste the contents of:"
echo "   $SEED_FILE"
echo ""
echo "5. Click 'Run' to seed default channels"
echo ""

echo "========================================="
echo "OPTION 3: Automatic (Using this script)"
echo "========================================="
echo ""
read -p "Do you want to try automatic migration using Supabase CLI? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  echo "🚀 Attempting automatic migration..."
  echo ""

  # Check if supabase CLI is available
  if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js"
    exit 1
  fi

  echo "📦 Running migration..."
  npx supabase db push --project-ref "$PROJECT_REF" || {
    echo ""
    echo "❌ Migration failed. Please use Option 2 (Manual) instead."
    exit 1
  }

  echo ""
  echo "✅ Migration applied successfully!"
  echo ""

  echo "📦 Seeding default channels..."
  npx supabase db execute --project-ref "$PROJECT_REF" -f "$SEED_FILE" || {
    echo ""
    echo "❌ Seeding failed. Please use Option 2 (Manual) instead."
    exit 1
  }

  echo ""
  echo "✅ Seeding completed successfully!"
  echo ""
  echo "========================================="
  echo "🎉 All done! Your messaging system is ready!"
  echo "========================================="
  echo ""
  echo "Next steps:"
  echo "1. Restart your Next.js dev server"
  echo "2. Visit /app/chat to see your channels"
  echo "3. Start chatting!"
  echo ""
else
  echo ""
  echo "📋 Please follow Option 2 (Manual) above to apply the migration."
  echo ""
fi
