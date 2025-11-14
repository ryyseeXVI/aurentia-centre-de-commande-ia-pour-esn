# Services & Pricing Report

## Executive Summary

Aurentia AI Command Center leverages **Vercel** for hosting and **Supabase** for backend services. This document provides a comprehensive breakdown of costs, pricing tiers, and recommendations for different usage scales.

## 📊 Cost Overview

### Monthly Cost Estimates (USD)

| Tier | Users | Projects | Monthly Cost | Annual Cost |
|------|-------|----------|--------------|-------------|
| **Development** | 1-10 | <10 | $0 | $0 |
| **Startup** | 10-100 | 10-50 | $45-85 | $540-1,020 |
| **Growth** | 100-1,000 | 50-500 | $85-285 | $1,020-3,420 |
| **Enterprise** | 1,000+ | 500+ | $285+ | $3,420+ |

### Cost Breakdown by Service

```
┌─────────────────────────────────────────────────────────┐
│                    Monthly Cost Breakdown                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Development (Free Tier):        $0/month                │
│  ├─ Vercel Hobby                 $0                      │
│  └─ Supabase Free                $0                      │
│                                                          │
│  Startup:                        $45-85/month            │
│  ├─ Vercel Pro                   $20                     │
│  └─ Supabase Pro                 $25-65                  │
│                                                          │
│  Growth:                         $85-285/month           │
│  ├─ Vercel Pro                   $20                     │
│  ├─ Additional Vercel Users      $0-20                   │
│  └─ Supabase Pro + Add-ons       $65-245                 │
│                                                          │
│  Enterprise:                     Custom Pricing          │
│  ├─ Vercel Enterprise            Contact Sales           │
│  └─ Supabase Enterprise          Contact Sales           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Vercel Hosting

### Pricing Tiers

#### Hobby (Free)
**Cost:** $0/month

**Includes:**
- Unlimited deployments
- Automatic HTTPS
- 100GB bandwidth/month
- Edge Network (global CDN)
- Preview deployments
- 100 GB-hrs serverless function execution
- 1,000 GB-hrs Edge Middleware execution

**Limitations:**
- Personal and non-commercial projects only
- Single team member
- No custom domains on free tier (1 domain allowed)
- Community support only

**Suitable For:**
- Development and testing
- Personal projects
- MVP development

#### Pro
**Cost:** $20/month per user

**Includes:**
- Everything in Hobby, plus:
- Commercial use allowed
- 1TB bandwidth/month
- Team collaboration
- Password protection
- 1,000 GB-hrs serverless function execution
- 1,000 GB-hrs Edge Middleware execution
- Analytics (Web Vitals)
- Deployment protection
- Advanced observability
- Email support

**Best For:**
- Small to medium teams (1-10 users)
- Production applications
- Professional projects

#### Enterprise
**Cost:** Custom pricing (contact sales)

**Includes:**
- Everything in Pro, plus:
- Custom bandwidth
- 99.99% SLA uptime guarantee
- SAML SSO
- Advanced security features
- Dedicated support
- Custom contract terms
- SOC 2 compliance
- Audit logs

**Best For:**
- Large organizations (100+ users)
- Enterprise-grade requirements
- Compliance-sensitive industries

### Vercel Add-Ons (Pro/Enterprise)

| Feature | Cost | Notes |
|---------|------|-------|
| **Additional Bandwidth** | $40/100GB | Beyond included bandwidth |
| **Additional Serverless Execution** | $40/1,000 GB-hrs | Beyond included execution time |
| **Edge Middleware Execution** | $65/1,000 GB-hrs | Beyond included execution time |
| **Additional Team Members** | $20/user/month | Pro tier only |
| **Monitoring** | Included | Web Analytics, Speed Insights |

### Expected Vercel Costs for Aurentia

**Development (Free Tier):**
- Monthly Cost: **$0**
- Suitable for testing and development

**Production (Pro Tier):**
- Base Cost: **$20/month**
- Expected Bandwidth: ~200-500GB/month (within 1TB limit)
- Expected Serverless Execution: ~500 GB-hrs/month (within 1,000 GB-hrs limit)
- Estimated Total: **$20-40/month** (1-2 team members)

**Scale (Enterprise):**
- Custom pricing based on:
  - Number of team members
  - Bandwidth requirements (>10TB/month)
  - Support SLA requirements
  - Compliance needs

## 🗄️ Supabase Backend

### Pricing Tiers

#### Free
**Cost:** $0/month

**Includes:**
- 500MB database space
- 1GB file storage
- 2GB bandwidth/month
- 50,000 monthly active users (MAU)
- Unlimited API requests
- 500MB Edge Function execution
- Realtime connections
- Auth (unlimited users, but performance may degrade)
- Daily backups (7-day retention)

**Limitations:**
- Project paused after 1 week of inactivity
- Limited compute resources
- Community support only
- No SOC 2 compliance

**Suitable For:**
- Development and testing
- Hobby projects
- MVPs

#### Pro
**Cost:** $25/month base

**Includes:**
- 8GB database space (+ $0.125/GB/month for additional)
- 100GB file storage (+ $0.021/GB/month for additional)
- 250GB bandwidth/month (+ $0.09/GB for additional)
- 100,000 monthly active users
- Unlimited API requests
- 2GB Edge Function execution (+ $2/GB for additional)
- Daily backups (14-day retention)
- Point-in-time recovery (7 days)
- Email support
- No project pausing

**Best For:**
- Production applications
- Small to medium teams
- Growing user bases

#### Pro Add-Ons (à la carte)

| Resource | Included (Pro) | Additional Cost |
|----------|----------------|-----------------|
| **Database Space** | 8GB | $0.125/GB/month |
| **File Storage** | 100GB | $0.021/GB/month |
| **Bandwidth** | 250GB | $0.09/GB |
| **Compute** | Small instance | $0.01344/hour (Medium: $0.01344/hr, Large: $0.02688/hr, XL: $0.05376/hr, 2XL: $0.10752/hr, 4XL: $0.21504/hr, 8XL: $0.43008/hr, 12XL: $0.64512/hr, 16XL: $0.86016/hr) |
| **Point-in-Time Recovery** | 7 days | $100/month (30 days) |
| **Backups** | Daily (14 days) | Included |

#### Enterprise
**Cost:** Custom pricing (starting at $599/month)

**Includes:**
- Everything in Pro, plus:
- Custom contracts (SLA, etc.)
- Dedicated support team
- Database backups stored on S3
- 99.9% uptime SLA
- SOC 2 compliance
- On-premise deployment option
- Custom compute sizing
- Advanced security features

**Best For:**
- Large organizations
- Compliance requirements
- Mission-critical applications

### Expected Supabase Costs for Aurentia

#### Development (Free Tier)
- Monthly Cost: **$0**
- Database: <500MB
- Storage: <1GB
- Bandwidth: <2GB/month
- Suitable for: Development and testing

#### Production - Small Scale (Pro)
**100 users, 50 projects, moderate activity:**

Base Pro Plan: **$25/month**

Additional Resources:
- Database Space: 20GB = +15GB × $0.125 = **$1.88/month**
- File Storage (avatars, attachments): 10GB (within 100GB free)
- Bandwidth: 100GB/month (within 250GB free)
- Compute: Small instance (included)

**Estimated Total: $27-30/month**

#### Production - Medium Scale (Pro + Add-ons)
**500 users, 200 projects, active collaboration:**

Base Pro Plan: **$25/month**

Additional Resources:
- Database Space: 50GB = +42GB × $0.125 = **$5.25/month**
- File Storage: 150GB = +50GB × $0.021 = **$1.05/month**
- Bandwidth: 500GB/month = +250GB × $0.09 = **$22.50/month**
- Compute: Upgrade to Medium = 720 hours × $0.01344 = **$9.68/month**

**Estimated Total: $63-70/month**

#### Production - Large Scale (Pro + Add-ons)
**2,000 users, 1,000 projects, high activity:**

Base Pro Plan: **$25/month**

Additional Resources:
- Database Space: 200GB = +192GB × $0.125 = **$24/month**
- File Storage: 500GB = +400GB × $0.021 = **$8.40/month**
- Bandwidth: 2TB/month = +1,750GB × $0.09 = **$157.50/month**
- Compute: Large instance = 720 hours × $0.02688 = **$19.35/month**
- Point-in-Time Recovery (30 days): **$100/month**

**Estimated Total: $334/month**

#### Enterprise Scale
**5,000+ users, 5,000+ projects:**

- Base Enterprise Plan: **$599+/month**
- Custom pricing based on:
  - Dedicated infrastructure
  - SLA requirements
  - Support level
  - Compliance needs

## 📈 Cost Projections

### Year 1 (Startup Phase)

**Months 1-3 (MVP Development):**
- Vercel: Free Hobby
- Supabase: Free
- **Monthly Cost: $0**
- **Total: $0**

**Months 4-6 (Beta Launch):**
- Vercel: Pro ($20/month)
- Supabase: Free → Pro transition ($25/month)
- **Monthly Cost: $45**
- **Total: $135**

**Months 7-12 (Growth):**
- Vercel: Pro ($20/month)
- Supabase: Pro + small add-ons ($30-40/month)
- **Monthly Cost: $50-60**
- **Total: $300-360**

**Year 1 Total: $435-495**

### Year 2 (Growth Phase)

**100-500 users, growing project base:**
- Vercel: Pro ($20/month) + potential additional team member ($20/month)
- Supabase: Pro + moderate add-ons ($50-80/month)
- **Monthly Cost: $70-120**
- **Annual Total: $840-1,440**

### Year 3+ (Scale Phase)

**500-2,000 users:**
- Vercel: Pro ($40-60/month for 2-3 team members)
- Supabase: Pro + significant add-ons OR Enterprise ($100-350/month)
- **Monthly Cost: $140-410**
- **Annual Total: $1,680-4,920**

## 💡 Cost Optimization Strategies

### Database Optimization
1. **Archive old data**: Move inactive projects to cold storage
2. **Optimize queries**: Use indexes effectively
3. **Compress files**: Reduce storage usage
4. **Clean up unused data**: Regular maintenance scripts

### Bandwidth Optimization
1. **CDN caching**: Cache static assets aggressively
2. **Image optimization**: Use Next.js Image component
3. **API response compression**: Enable gzip/brotli
4. **Pagination**: Limit data transfer per request

### Compute Optimization
1. **Server Components**: Reduce client-side JavaScript
2. **Static Generation**: Pre-render pages when possible
3. **Edge Functions**: Use Vercel Edge for faster, cheaper execution
4. **Caching**: Implement aggressive caching strategies

### General Optimization
1. **Monitor usage**: Set up billing alerts
2. **Right-size resources**: Don't over-provision
3. **Use free tiers**: Development on free tiers
4. **Incremental scaling**: Add resources as needed

## 🎯 Recommended Tier by Organization Size

| Organization Size | Users | Vercel Tier | Supabase Tier | Monthly Cost |
|-------------------|-------|-------------|---------------|--------------|
| **Solo Developer** | 1 | Hobby (Free) | Free | $0 |
| **Small Team** | 2-5 | Pro | Free → Pro | $20-45 |
| **Startup** | 5-50 | Pro | Pro | $45-85 |
| **Small Business** | 50-200 | Pro | Pro + Add-ons | $70-150 |
| **Medium Business** | 200-1,000 | Pro | Pro + Add-ons | $150-350 |
| **Enterprise** | 1,000+ | Enterprise | Enterprise | $600+ |

## 📋 Additional Services (Optional)

### Monitoring & Error Tracking

#### Sentry (Error Tracking)
- **Developer (Free)**: 5K errors/month, $0
- **Team**: 50K errors/month, $26/month
- **Business**: 500K errors/month, $80/month

#### LogRocket (Session Replay)
- **Team**: 10K sessions/month, $99/month
- **Professional**: 50K sessions/month, $249/month

### Email Services

#### SendGrid (Transactional Email)
- **Free**: 100 emails/day, $0
- **Essentials**: 40K emails/month, $19.95/month
- **Pro**: 1.5M emails/month, $89.95/month

#### Postmark (Transactional Email)
- **Free**: 100 emails/month, $0
- **Starter**: 10K emails/month, $10/month

### Analytics

#### Vercel Analytics (Included in Pro)
- Web Vitals
- Real User Monitoring
- No additional cost

#### Posthog (Product Analytics)
- **Free**: 1M events/month, $0
- **Paid**: Pay-as-you-go, $0.00031/event

## 🔒 Compliance & Security Costs

### SOC 2 Compliance
- **Vercel Enterprise**: Included
- **Supabase Enterprise**: Included ($599+/month)

### GDPR Compliance
- Built into Supabase (data residency options)
- No additional cost, but requires Enterprise tier for full features

### Penetration Testing
- **Annual Pen Test**: $5,000-15,000 (one-time, annually)
- Not required for all tiers, recommended for Enterprise

## 📊 Total Cost of Ownership (TCO) - 3 Year Projection

### Scenario 1: Startup (10-100 users)

| Year | Vercel | Supabase | Other Services | Annual Total |
|------|--------|----------|----------------|--------------|
| Year 1 | $120 | $300 | $0 | $420 |
| Year 2 | $240 | $600 | $240 | $1,080 |
| Year 3 | $240 | $900 | $480 | $1,620 |
| **3-Year Total** | **$600** | **$1,800** | **$720** | **$3,120** |

### Scenario 2: Growth (100-1,000 users)

| Year | Vercel | Supabase | Other Services | Annual Total |
|------|--------|----------|----------------|--------------|
| Year 1 | $240 | $600 | $240 | $1,080 |
| Year 2 | $480 | $1,800 | $960 | $3,240 |
| Year 3 | $480 | $3,600 | $1,200 | $5,280 |
| **3-Year Total** | **$1,200** | **$6,000** | **$2,400** | **$9,600** |

### Scenario 3: Enterprise (1,000+ users)

| Year | Vercel | Supabase | Other Services | Annual Total |
|------|--------|----------|----------------|--------------|
| Year 1 | $480 | $3,600 | $1,200 | $5,280 |
| Year 2 | $960 | $7,200 | $2,400 | $10,560 |
| Year 3 | Custom | Custom | $3,600 | $15,000+ |
| **3-Year Total** | **$1,440+** | **$10,800+** | **$7,200** | **$30,000+** |

## 🎯 Recommendations

### For Development (Current Stage)
- **Vercel**: Hobby (Free)
- **Supabase**: Free
- **Cost**: $0/month
- **Action**: Start on free tiers, monitor usage

### For Beta Launch (10-50 users)
- **Vercel**: Pro ($20/month)
- **Supabase**: Pro ($25-30/month)
- **Cost**: $45-50/month
- **Action**: Upgrade when going to production

### For Growth (100-500 users)
- **Vercel**: Pro ($20-40/month)
- **Supabase**: Pro + Add-ons ($50-100/month)
- **Optional**: Error tracking ($26/month)
- **Cost**: $96-166/month
- **Action**: Monitor metrics, scale incrementally

### For Scale (500+ users)
- **Vercel**: Pro or Enterprise
- **Supabase**: Pro + Add-ons or Enterprise
- **Recommended**: Full monitoring stack, compliance
- **Cost**: $200-600+/month
- **Action**: Evaluate Enterprise tiers, consider dedicated infrastructure

## 🚨 Cost Alerts & Monitoring

### Set Up Billing Alerts

**Vercel:**
1. Dashboard → Settings → Billing
2. Set usage alerts at 50%, 75%, 90% of limits

**Supabase:**
1. Project Settings → Billing
2. Enable usage notifications
3. Set bandwidth and storage alerts

### Monthly Review Checklist
- [ ] Check Vercel bandwidth usage
- [ ] Review Supabase database growth
- [ ] Analyze file storage trends
- [ ] Monitor active user growth
- [ ] Review compute usage patterns
- [ ] Check for unused resources
- [ ] Optimize heavy queries
- [ ] Archive old data

## 📞 Support Costs

| Tier | Vercel Support | Supabase Support | Response Time |
|------|----------------|------------------|---------------|
| **Free** | Community | Community | Best effort |
| **Pro** | Email | Email | 24-48 hours |
| **Enterprise** | Dedicated | Dedicated + Slack | <4 hours |

---

**Last Updated:** November 2025

**Note:** Prices are subject to change. Always verify current pricing at:
- Vercel: https://vercel.com/pricing
- Supabase: https://supabase.com/pricing
