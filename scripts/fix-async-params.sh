#!/bin/bash

# Script to fix Next.js 16 async params pattern in API routes
# Changes: { params }: { params: { id: string } }
# To: { params }: { params: Promise<{ id: string }> }
# And: const { id } = params
# To: const { id } = await params

echo "Fixing async params in API routes..."

# Find all route.ts files with dynamic segments
find app/api -name "route.ts" -path "*/\[*\]/*" | while read file; do
    echo "Processing: $file"

    # Fix params type signature - add Promise wrapper
    sed -i 's/{ params }: { params: {/{ params }: { params: Promise<{/g' "$file"

    # Fix params destructuring - add await
    sed -i 's/const { \([^}]*\) } = params$/const { \1 } = await params/g' "$file"

    # Also handle cases with trailing comments or whitespace
    sed -i 's/const { \([^}]*\) } = params[[:space:]]*$/const { \1 } = await params/g' "$file"
done

echo "Done! Fixed async params pattern in all API routes."
