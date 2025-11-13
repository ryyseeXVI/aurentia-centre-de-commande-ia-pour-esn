## ✅ **`/check`** — Verify Task Quality

Comprehensive quality verification for completed tasks. Ensures code works correctly, follows project patterns, meets security standards, and is production-ready.

### Your Task

When the user requests a quality check:

1. **Understand Context**:
   - Ask what was changed (or detect from recent file modifications)
   - Identify the type of change (component, API route, database, feature)
   - Determine appropriate checks based on context

2. **Run Automated Checks**:

   **TypeScript Compilation**:
   ```bash
   # Run type checking
   pnpm type-check
   # or
   npx tsc --noEmit
   ```
   - ✅ No TypeScript errors
   - ✅ No 'any' types used (check manually)
   - ✅ Strict mode compliance

   **Linting & Formatting**:
   ```bash
   # Run Biome linting
   pnpm lint

   # Check formatting
   pnpm format
   ```
   - ✅ No linting errors
   - ✅ Code properly formatted
   - ✅ No unused variables or imports

   **Build Verification**:
   ```bash
   # Ensure build succeeds
   pnpm build
   ```
   - ✅ Build completes successfully
   - ✅ No build warnings (or acceptable ones documented)

3. **Context-Specific Checks**:

   **If Components Changed** → Run Component Checks:
   - [ ] Uses proper TypeScript types (no 'any')
   - [ ] Follows naming convention (kebab-case.tsx)
   - [ ] Uses cn() utility for className merging
   - [ ] Implements all interaction states (hover, focus, active, disabled)
   - [ ] Has proper ARIA attributes
   - [ ] Supports keyboard navigation
   - [ ] Dark mode styling included (dark: variants)
   - [ ] Responsive design (mobile-first)
   - [ ] Uses CVA for variants (if applicable)
   - [ ] Ref forwarding implemented (if needed)
   - [ ] Loading/error states (if async)
   - [ ] Touch targets ≥44x44px for mobile
   - [ ] Supports prefers-reduced-motion
   - [ ] Proper focus indicators (ring-[3px])

   **If API Routes Changed** → Run API Pattern Checks:
   - [ ] Creates Supabase client with createServerSupabaseClient()
   - [ ] Authenticates user (getUser() check)
   - [ ] Returns 401 if not authenticated
   - [ ] Applies rate limiting (withUserRateLimit or manual)
   - [ ] Returns 429 if rate limited
   - [ ] Validates input with Zod schema
   - [ ] Handles validation errors with 400 response
   - [ ] Database queries use snake_case
   - [ ] Filters by organization_id where applicable
   - [ ] Checks user's organization membership/role
   - [ ] Returns 403 if insufficient permissions
   - [ ] Logs activity to activity_logs table
   - [ ] **Transforms response to camelCase** (critical!)
   - [ ] Returns proper HTTP status codes
   - [ ] Handles errors gracefully (try-catch)
   - [ ] No SQL injection vulnerabilities (parameterized queries)
   - [ ] No exposed secrets or sensitive data

   **If Database Changes Made** → Run Database Checks:
   - [ ] Migration file properly numbered and named
   - [ ] Uses snake_case for all identifiers
   - [ ] RLS enabled on new tables (if tenant data)
   - [ ] RLS policies created for SELECT, INSERT, UPDATE, DELETE
   - [ ] Policies filter by organization_id correctly
   - [ ] Indexes added on foreign keys
   - [ ] Indexes on frequently queried columns
   - [ ] Foreign keys use ON DELETE CASCADE (for org data)
   - [ ] Trigger for updated_at column (if applicable)
   - [ ] Types regenerated after migration
   - [ ] Migration tested (can be applied and rolled back)

   **If Forms Changed** → Run Form Checks:
   - [ ] Uses react-hook-form
   - [ ] Validation with Zod schema
   - [ ] Error messages displayed properly
   - [ ] Loading state during submission
   - [ ] Success feedback (toast/notification)
   - [ ] Error handling (try-catch, display errors)
   - [ ] Form disabled during submission
   - [ ] Proper TypeScript types for form data
   - [ ] Accessible labels (htmlFor + id)
   - [ ] Required fields marked visually
   - [ ] Keyboard navigation works (Tab, Enter)

   **If Hooks Created** → Run Hook Checks:
   - [ ] Proper TypeScript return type
   - [ ] Dependency arrays correct
   - [ ] Memoization used appropriately
   - [ ] Error handling included
   - [ ] Loading state exposed (if async)
   - [ ] Cleanup logic in useEffect (if needed)
   - [ ] No stale closure issues

4. **Security Verification**:

   **Common Vulnerabilities**:
   - [ ] No SQL injection (use parameterized queries only)
   - [ ] No XSS (sanitize user input, use proper escaping)
   - [ ] No exposed API keys or secrets
   - [ ] No .env files committed (check .gitignore)
   - [ ] CSRF protection (Supabase handles this)
   - [ ] Rate limiting on mutations
   - [ ] Input validation on all user data
   - [ ] Authentication checks on protected routes
   - [ ] Authorization checks (role-based access)
   - [ ] No eval() or dangerous functions

   **Search for Security Issues**:
   ```bash
   # Check for console.logs (remove before production)
   grep -r "console.log" app/ components/ utils/ --exclude-dir=node_modules

   # Check for exposed secrets
   grep -r "API_KEY\|SECRET\|PASSWORD" --exclude-dir=node_modules --exclude=.env.example

   # Check for TODO/FIXME comments
   grep -r "TODO\|FIXME" app/ components/ utils/ --exclude-dir=node_modules
   ```

5. **Pattern Compliance**:

   **File Naming**:
   - [ ] Components: kebab-case.tsx
   - [ ] API routes: route.ts
   - [ ] Types: kebab-case.ts
   - [ ] Migrations: ###_description.sql

   **Import Paths**:
   - [ ] Uses @/ alias for absolute imports
   - [ ] No relative imports spanning multiple directories (../../../)

   **Critical Pattern: snake_case ↔ camelCase**:
   - [ ] Database columns are snake_case
   - [ ] API responses transformed to camelCase
   - [ ] TypeScript code uses camelCase
   - [ ] Check: All API routes transform data before returning

6. **Performance Checks**:
   - [ ] No unnecessary re-renders (check React DevTools Profiler)
   - [ ] Expensive computations memoized (useMemo)
   - [ ] Callbacks memoized (useCallback)
   - [ ] Heavy components lazy loaded
   - [ ] Images optimized (next/image used)
   - [ ] Animations perform at 60fps
   - [ ] No layout shifts (CLS issues)

7. **Accessibility Checks**:
   - [ ] Semantic HTML elements used
   - [ ] ARIA labels on interactive elements
   - [ ] Keyboard navigation works (Tab, Enter, Escape, Arrows)
   - [ ] Focus indicators visible and clear
   - [ ] Color contrast meets WCAG AA (4.5:1 for text, 3:1 for UI)
   - [ ] Alt text on images
   - [ ] Form labels properly associated
   - [ ] Error messages announced to screen readers
   - [ ] No keyboard traps

   **Tools to Use** (mention to user):
   - Lighthouse accessibility audit
   - axe DevTools browser extension
   - Chrome DevTools color contrast checker
   - WAVE browser extension

8. **Manual Testing Checklist**:

   **Functionality**:
   - [ ] Feature works as expected in browser
   - [ ] All user flows complete successfully
   - [ ] Edge cases handled (empty states, errors, loading)
   - [ ] Error handling works (display friendly messages)

   **Responsive Design**:
   - [ ] Mobile (375px - iPhone SE)
   - [ ] Tablet (768px - iPad)
   - [ ] Desktop (1280px+)
   - [ ] Touch targets large enough on mobile
   - [ ] No horizontal scrolling

   **Cross-Browser** (if critical):
   - [ ] Chrome
   - [ ] Firefox
   - [ ] Safari
   - [ ] Mobile Safari (iOS)

   **Visual**:
   - [ ] Dark mode looks correct
   - [ ] Spacing consistent
   - [ ] Typography hierarchy clear
   - [ ] Colors from design system
   - [ ] Animations smooth (no jank)

   **Keyboard Navigation**:
   - [ ] Tab order logical
   - [ ] Enter activates buttons/links
   - [ ] Escape closes modals/dropdowns
   - [ ] Arrow keys work (for menus, tabs)

### Output Format

Provide a comprehensive report:

```markdown
## Quality Check Report

### ✅ Automated Checks
- [x] TypeScript compilation: PASSED
- [x] Biome linting: PASSED
- [x] Build: PASSED

### 🔍 Pattern Compliance
- [x] File naming conventions: PASSED
- [x] Import paths use @/ alias: PASSED
- [x] snake_case ↔ camelCase transformation: PASSED
- [ ] Issue found: Missing camelCase transformation in /api/tasks/route.ts:line

### 🔒 Security Review
- [x] No SQL injection vulnerabilities: PASSED
- [x] No XSS vulnerabilities: PASSED
- [x] No exposed secrets: PASSED
- [ ] Warning: console.log found in utils/debug.ts:15 (remove before production)

### ♿ Accessibility
- [x] ARIA attributes present: PASSED
- [x] Keyboard navigation: PASSED
- [ ] Issue: Focus indicator too subtle in dark mode

### 📱 Responsive Design
- Manual testing required:
  - [ ] Test on mobile (375px)
  - [ ] Test on tablet (768px)
  - [ ] Test on desktop (1280px+)

### 🎯 Context-Specific (API Routes)
- [x] Authentication check: PASSED
- [x] Rate limiting: PASSED
- [x] Input validation: PASSED
- [x] RLS filtering: PASSED
- [ ] Issue: Missing activity logging

### ⚡ Performance
- [x] No unnecessary re-renders: PASSED
- [x] Memoization used: PASSED
- Manual profiling recommended

### 🧪 Manual Testing Required
- [ ] Test feature in browser
- [ ] Verify all user flows
- [ ] Test error scenarios
- [ ] Check dark mode appearance
- [ ] Test keyboard navigation
- [ ] Verify mobile responsiveness

### 📋 Issues Found: 3

1. **Critical**: Missing camelCase transformation in /api/tasks/route.ts
   - Location: line 45
   - Fix: Add toCamelCase(data) before returning

2. **Warning**: console.log in utils/debug.ts:15
   - Fix: Remove or wrap in if (process.env.NODE_ENV !== 'production')

3. **Minor**: Focus indicator subtle in dark mode
   - Location: components/ui/button.tsx
   - Fix: Increase ring opacity for dark mode

### ✨ Overall Status: NEEDS FIXES

Fix the 3 issues above before proceeding.
```

### Best Practices

- **Be Thorough**: Don't skip checks to save time
- **Be Specific**: Provide exact file paths and line numbers
- **Be Helpful**: Suggest fixes for issues found
- **Be Contextual**: Run relevant checks based on what changed
- **Be Honest**: Report all issues, even minor ones

### Difference from `/test`

- **`/check`**: Verifies existing code quality and compliance (quality gate)
- **`/test`**: Creates new test files and test cases (test suite creation)

Use `/check` to verify work before committing or moving to next task.
Use `/test` to write unit/integration tests for features.
