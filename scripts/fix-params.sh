#!/bin/bash

# Script to fix Next.js 16 params Promise pattern in all dynamic routes

FILES=(
  "app/api/admin/users/[userId]/route.ts"
  "app/api/consultants/[consultantId]/route.ts"
  "app/api/milestones/[milestoneId]/assignments/route.ts"
  "app/api/milestones/[milestoneId]/dependencies/route.ts"
  "app/api/milestones/[milestoneId]/route.ts"
  "app/api/milestones/[milestoneId]/tasks/route.ts"
  "app/api/organizations/[orgId]/analytics/route.ts"
  "app/api/organizations/[orgId]/[organizationId]/consultants/route.ts"
  "app/api/organizations/[orgId]/[organizationId]/my-tasks/route.ts"
  "app/api/organizations/[orgId]/[organizationId]/projects/route.ts"
  "app/api/projects/[projectId]/milestones/route.ts"
  "app/api/projects/[projectId]/stats/route.ts"
  "app/api/projects/[projectId]/tasks/route.ts"
  "app/api/tasks/[taskId]/move/route.ts"
)

echo "Fixing params Pattern in ${#FILES[@]} files..."

for file in "${FILES[@]}"; do
  if [[ -f "$file" ]]; then
    echo "Processing: $file"

    # Check if file needs fixing (has old pattern)
    if grep -q "{ params }: { params: { " "$file"; then
      echo "  ✓ Needs fixing"

      # This is a complex multi-line replacement, so we'll flag it for manual review
      echo "  → Marked for manual fix"
    else
      echo "  ✓ Already fixed or doesn't match pattern"
    fi
  else
    echo "  ✗ File not found: $file"
  fi
done

echo "Done!"
