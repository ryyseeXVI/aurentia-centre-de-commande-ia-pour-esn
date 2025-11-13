## 🚀 **`/deploy`** — Pre-Deployment Checklist

Comprehensive pre-deployment verification to ensure the application is production-ready. Prevents common deployment issues and security vulnerabilities.

### Your Task

When preparing for deployment:

1. **Code Quality Verification**:

   ```bash
   # TypeScript compilation
   pnpm type-check
   # Should pass with 0 errors

   # Linting
   pnpm lint
   # Should pass with 0 errors

   # Build
   pnpm build
   # Should complete successfully

   # Check for console.logs (remove for production)
   grep -r "console.log" app/ components/ utils/ --exclude-dir=node_modules

   # Check for debugger statements
   grep -r "debugger" app/ components/ utils/ --exclude-dir=node_modules

   # Check for TODO/FIXME for critical issues
   grep -r "TODO.*CRITICAL\|FIXME.*CRITICAL" app/ components/ --exclude-dir=node_modules
   ```

   **Checklist**:
   - [ ] TypeScript compiles without errors
   - [ ] Linting passes
   - [ ] Build succeeds
   - [ ] No console.logs in production code
   - [ ] No debugger statements
   - [ ] No critical TODOs unresolved

2. **Database Verification**:

   **Migrations**:
   - [ ] All migrations applied to production database
   - [ ] Migration history matches local/staging
   - [ ] No pending migrations

   **RLS Policies**:
   - [ ] RLS enabled on all multi-tenant tables
   - [ ] Policies tested and working
   - [ ] No data leaks between organizations

   **Indexes**:
   - [ ] Indexes on all foreign keys
   - [ ] Indexes on frequently queried columns
   - [ ] Performance tested with production-like data

   **Types**:
   - [ ] TypeScript types regenerated and committed
   - [ ] Types match current database schema

   **Backup**:
   - [ ] Recent database backup exists
   - [ ] Backup restore process tested

3. **Environment Variables**:

   **Documentation**:
   - [ ] All required env vars documented in `.env.example`
   - [ ] No secrets in `.env.example` (use placeholder values)

   **Production Setup**:
   - [ ] All env vars set in hosting platform (Vercel/other)
   - [ ] Supabase URL and keys configured
   - [ ] Stripe keys configured (live mode, not test)
   - [ ] Resend API key configured
   - [ ] Upstash Redis URL configured (for rate limiting)
   - [ ] All third-party API keys valid

   **Security**:
   - [ ] No secrets committed in code
   - [ ] `.env` files in `.gitignore`
   - [ ] API keys rotated if exposed

4. **Security Audit**:

   **SQL Injection**:
   - [ ] All database queries use parameterized queries (Supabase handles this)
   - [ ] No string concatenation in SQL

   **XSS Prevention**:
   - [ ] User input sanitized
   - [ ] Dangerous HTML escaped
   - [ ] No eval() or Function() with user input

   **Authentication**:
   - [ ] Auth required on protected routes
   - [ ] Session management working
   - [ ] Password reset flow secure

   **Authorization**:
   - [ ] Role-based access control working
   - [ ] organization_id filtering enforced
   - [ ] RLS policies prevent data leaks

   **Rate Limiting**:
   - [ ] Rate limiting configured on all mutation endpoints
   - [ ] Upstash Redis configured for production
   - [ ] Rate limits appropriate for production load

   **CORS**:
   - [ ] CORS configured properly (if needed)
   - [ ] Only allow trusted origins

   **Headers**:
   - [ ] Security headers configured (CSP, X-Frame-Options, etc.)

5. **Stripe Configuration** (if billing features used):

   **Products & Prices**:
   - [ ] Products created in live mode
   - [ ] Prices configured correctly
   - [ ] Test mode disabled

   **Webhooks**:
   - [ ] Webhook endpoint configured in Stripe dashboard
   - [ ] Webhook secret added to env vars
   - [ ] Webhook signing verification working
   - [ ] Webhook events handled (checkout.session.completed, etc.)

   **Customer Portal**:
   - [ ] Customer portal configured
   - [ ] Portal link working in production

   **Testing**:
   - [ ] Test subscription flow in production (with real card)
   - [ ] Test cancellation flow
   - [ ] Test webhook delivery

6. **Email Configuration** (Resend):

   **Setup**:
   - [ ] Resend API key configured
   - [ ] From domain verified in Resend
   - [ ] Email templates tested

   **Testing**:
   - [ ] Send test email in production
   - [ ] Verify delivery and rendering
   - [ ] Check spam score

7. **Performance Verification**:

   **Bundle Size**:
   - [ ] Bundle size acceptable (<500KB first load JS)
   - [ ] Code splitting working
   - [ ] No duplicate dependencies

   **Images**:
   - [ ] All images using next/image
   - [ ] Images optimized (WebP format)
   - [ ] Proper sizing and lazy loading

   **Loading Performance**:
   - [ ] Lighthouse score >90 (Performance)
   - [ ] First Contentful Paint <2s
   - [ ] Time to Interactive <3.5s
   - [ ] No layout shifts (CLS <0.1)

   **Runtime Performance**:
   - [ ] No memory leaks
   - [ ] Animations at 60fps
   - [ ] No unnecessary re-renders

8. **Testing Checklist**:

   **Functionality**:
   - [ ] All critical user flows working
   - [ ] Authentication (login, signup, logout)
   - [ ] Organization creation and switching
   - [ ] Billing (if applicable)
   - [ ] Core features tested

   **Responsive Design**:
   - [ ] Mobile (375px - iPhone SE)
   - [ ] Tablet (768px - iPad)
   - [ ] Desktop (1280px+)
   - [ ] Touch targets adequate on mobile

   **Cross-Browser**:
   - [ ] Chrome (latest)
   - [ ] Firefox (latest)
   - [ ] Safari (latest)
   - [ ] Mobile Safari (iOS)

   **Accessibility**:
   - [ ] Keyboard navigation works
   - [ ] Screen reader tested (basic check)
   - [ ] Color contrast meets WCAG AA
   - [ ] No accessibility errors in Lighthouse

9. **Monitoring & Logging**:

   **Error Tracking**:
   - [ ] Error tracking configured (Sentry, etc.)
   - [ ] Test error reporting works

   **Analytics**:
   - [ ] Analytics configured (Vercel Analytics, etc.)
   - [ ] Event tracking working

   **Logs**:
   - [ ] Server logs accessible
   - [ ] Log retention configured

10. **Documentation**:

   **User Documentation**:
   - [ ] User guide up to date
   - [ ] Feature documentation complete

   **Developer Documentation**:
   - [ ] README up to date
   - [ ] API documentation current
   - [ ] Environment variables documented
   - [ ] Deployment process documented

   **Change Log**:
   - [ ] CHANGELOG.md updated
   - [ ] Breaking changes documented

11. **Rollback Plan**:

   - [ ] Previous version can be restored quickly
   - [ ] Database rollback plan exists (if schema changed)
   - [ ] Feature flags for risky features (if applicable)

### Deployment Commands

```bash
# Vercel deployment
git push origin main  # Triggers auto-deployment

# Or manual deployment
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs
```

### Post-Deployment Verification

After deploying:

1. **Smoke Tests**:
   - [ ] Homepage loads
   - [ ] Login works
   - [ ] Core feature works
   - [ ] No console errors

2. **Monitoring**:
   - [ ] Check error rate (should be low)
   - [ ] Check response times
   - [ ] Check database connections

3. **User Communication**:
   - [ ] Announce new features (if applicable)
   - [ ] Notify users of changes
   - [ ] Monitor user feedback

### Output

Provide a deployment readiness report:

```markdown
## Deployment Readiness Report

### ✅ Code Quality
- [x] TypeScript: PASSED
- [x] Linting: PASSED
- [x] Build: PASSED
- [x] No console.logs: PASSED

### ✅ Database
- [x] Migrations applied: PASSED
- [x] RLS enabled: PASSED
- [x] Backup taken: PASSED

### ✅ Environment
- [x] All env vars set: PASSED
- [x] Secrets secured: PASSED

### ✅ Security
- [x] SQL injection: PASSED
- [x] XSS prevention: PASSED
- [x] Auth/authz: PASSED
- [x] Rate limiting: PASSED

### ⚠️ Issues Found: 2

1. **Warning**: Bundle size 520KB (target: <500KB)
   - Consider code splitting React Bits components

2. **Minor**: No error tracking configured
   - Recommend setting up Sentry

### 🚀 Deployment Status: READY (with minor issues)

The application is ready for deployment. Address warnings before next release.
```

### Related Commands

- Before deploying: Use `/check` to verify code quality
- After code changes: Use `/review` for code review
- Performance issues: Use `/optimize` before deploying
- Documentation: Use `/doc` to ensure docs are current

### Emergency Rollback

If issues occur after deployment:

```bash
# Vercel: Rollback to previous deployment
vercel rollback

# Database: Restore from backup (if schema changed)
# Contact Supabase support or use backup restore

# Monitor: Check error rates and logs
vercel logs --follow
```

### Common Deployment Issues

1. **Build fails**: Usually TypeScript errors or missing dependencies
2. **Runtime errors**: Often missing environment variables
3. **Database connection fails**: Check Supabase URL and keys
4. **Rate limiting not working**: Verify Upstash Redis configured
5. **Stripe webhooks failing**: Check webhook secret and endpoint URL
6. **Emails not sending**: Verify Resend API key and domain
7. **Performance degradation**: Check bundle size and database indexes

### Pre-Deployment Checklist Summary

Copy this checklist and verify each item:

- [ ] Code quality: TypeScript, lint, build all pass
- [ ] Database: Migrations applied, RLS enabled, types updated
- [ ] Environment: All variables set, secrets secured
- [ ] Security: Auth, authz, rate limiting, no vulnerabilities
- [ ] Stripe: Configured for live mode, webhooks working
- [ ] Email: Resend configured, domain verified
- [ ] Performance: Bundle size OK, Lighthouse score >90
- [ ] Testing: Core flows work, responsive, cross-browser
- [ ] Monitoring: Error tracking and analytics configured
- [ ] Documentation: Up to date
- [ ] Rollback plan: In place and tested
