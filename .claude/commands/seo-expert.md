## 🔍 **`/seo-expert`** — Intelligent SEO Implementation & Audit

Implement comprehensive, context-aware SEO with automatic detection of project type, industry, and technical stack. Provides technical SEO, on-page optimization, schema markup, content strategy, and performance recommendations.

### Your Task

When the user requests SEO assistance:

1. **Analyze the project context**:
   - **Tech stack detection**: Identify framework (Next.js App/Pages Router, React SPA, Vue, Nuxt, Astro, static HTML, etc.)
   - **Rendering strategy**: Detect SSR, SSG, ISR, CSR capabilities and current implementation
   - **Industry/sector identification**: Analyze codebase, content, and routes to determine:
     - E-commerce (products, checkout, cart)
     - SaaS (app routes, pricing, features, auth)
     - Content/Media (blog, articles, videos)
     - Local business (locations, services, bookings)
     - Marketplace (listings, users, transactions)
     - Events/Booking (calendar, registrations, venues)
     - Education (courses, lessons, certifications)
     - Portfolio/Agency (projects, case studies, services)
   - **Business model**: B2B, B2C, B2B2C, marketplace, platform
   - **Geographic scope**: Local (city/region), national, international (detect i18n)
   - **Content patterns**: Detect dynamic routes, user-generated content, database-driven pages
   - **Existing SEO**: Check for current meta tags, schema, sitemap, robots.txt, SEO packages

2. **Determine operation mode**:
   - **Audit mode**: If SEO implementation exists, analyze and score it
   - **Generation mode**: If no/minimal SEO exists, create comprehensive implementation
   - **Enhancement mode**: If partial SEO exists, fill gaps and optimize
   - **Hybrid mode**: Combine audit of existing + generation of missing elements

3. **Technical SEO implementation** (framework-adaptive):

   **For Next.js App Router**:
   - Generate type-safe metadata objects in layouts and pages
   - Create dynamic `app/sitemap.ts` with database integration
   - Create `app/robots.ts` with crawler directives
   - Create `app/manifest.ts` for PWA metadata
   - Implement `generateMetadata()` for dynamic routes
   - Add `opengraph-image.tsx` and `twitter-image.tsx` generators
   - Use `<link rel="canonical">` for duplicate content

   **For Next.js Pages Router**:
   - Generate API routes: `pages/api/sitemap.xml.ts`, `pages/api/robots.txt.ts`
   - Implement `next-seo` configuration with SEO component
   - Create `_document.tsx` with global metadata
   - Per-page SEO with `<NextSeo>` component
   - Dynamic OG image generation with `@vercel/og`

   **For React SPA**:
   - Implement `react-helmet-async` with provider setup
   - Generate static `public/robots.txt` and `public/sitemap.xml`
   - Provide prerendering strategy (React Snap, Prerender.io, or framework recommendation)
   - Client-side metadata management with examples
   - Consider migration path to SSR/SSG for better SEO

   **For Vue/Nuxt**:
   - Use `useHead()` composable (Vue 3) or `head()` option (Vue 2)
   - Nuxt: `nuxt.config.ts` global SEO + per-page overrides
   - Generate `@nuxtjs/sitemap` configuration
   - Implement `vue-meta` if not using Nuxt

   **For Astro**:
   - Generate `<SEO>` component with frontmatter integration
   - Leverage static generation for optimal SEO
   - Create sitemap integration with `@astrojs/sitemap`

   **For Static HTML**:
   - Generate complete `<head>` sections for each page
   - Static `robots.txt` and XML sitemap
   - Inline JSON-LD structured data
   - Meta tag templates with placeholders

4. **Meta tag optimization** (context-aware):

   **Core meta tags** (all pages):
   - `<title>`: 50-60 chars, keyword-focused, brand suffix
   - `<meta name="description">`: 150-160 chars, compelling, includes primary keyword
   - `<meta name="viewport">`: Mobile-responsive declaration
   - `<link rel="canonical">`: Self-referencing or master version
   - `<meta name="robots">`: index/noindex, follow/nofollow directives
   - `<meta charset="utf-8">`: Character encoding
   - `<html lang="[locale]">`: Language declaration

   **Open Graph (social sharing)**:
   - `og:title`: Can differ from `<title>`, optimized for social
   - `og:description`: Can differ from meta description
   - `og:image`: 1200x630px, <8MB, absolute URL
   - `og:url`: Canonical URL of the page
   - `og:type`: website, article, product, video.movie, etc. (context-dependent)
   - `og:site_name`: Brand name
   - `og:locale`: Language and region (e.g., en_US, fr_FR)

   **Twitter Cards**:
   - `twitter:card`: summary, summary_large_image, app, player (context-dependent)
   - `twitter:title`, `twitter:description`, `twitter:image`: Can inherit from OG or override
   - `twitter:site`: @username of site
   - `twitter:creator`: @username of content creator

   **Additional context-specific tags**:
   - E-commerce: `product:price:amount`, `product:price:currency`
   - Articles: `article:published_time`, `article:author`, `article:section`
   - Videos: `og:video`, `og:video:type`, `og:video:width`
   - App: `al:ios:app_name`, `al:android:app_name` (App Links)

5. **Schema.org structured data** (JSON-LD, adaptive selection):

   **Universal schemas** (all projects):
   - **Organization**: Company info, logo, social profiles, contact info
   - **WebSite**: Site name, URL, search action (if site search exists)
   - **BreadcrumbList**: Navigation hierarchy for all pages

   **Industry-specific schemas** (auto-select based on detection):

   **E-commerce**:
   - `Product`: Name, image, description, SKU, brand, offers
   - `Offer`: Price, currency, availability, valid dates
   - `AggregateRating`: Average rating, review count
   - `Review`: Individual reviews with author, rating, date

   **SaaS/Software**:
   - `SoftwareApplication`: Name, OS, price, rating, screenshots
   - `FAQPage`: FAQ structured data for rich snippets
   - `HowTo`: Step-by-step guides for features
   - `VideoObject`: Tutorial/demo videos

   **Events/Bookings**:
   - `Event` or `SportsEvent`: Name, date, location, performer, offers
   - `Place` or `SportsActivityLocation`: Venue details, address, geo
   - `Offer`: Ticket pricing and availability

   **Local Business**:
   - `LocalBusiness` or specific type (Restaurant, Store, etc.)
   - `PostalAddress`: Full address with structured fields
   - `GeoCoordinates`: Latitude/longitude for maps
   - `OpeningHoursSpecification`: Business hours
   - `Review` and `AggregateRating`: Customer reviews

   **Content/Blog**:
   - `Article` or `BlogPosting`: Headline, author, date, image, publisher
   - `Person`: Author profiles with schema
   - `ImageObject`: Featured images with metadata
   - `VideoObject`: Embedded videos

   **Education**:
   - `Course`: Name, provider, description, offers
   - `EducationalOrganization`: Institution details
   - `LearningResource`: Educational content

   **Marketplace**:
   - `ItemList`: Listings or search results
   - `ListItem`: Individual items with position
   - Combine with Product/Service schemas

6. **Sitemap generation** (intelligent, dynamic):

   **XML Sitemap structure**:
   - Auto-discover all public routes from framework routing
   - Exclude auth-required, admin, API routes
   - Dynamic database-driven URLs (products, posts, profiles, etc.)
   - Priority calculation based on page type:
     - Homepage: 1.0
     - Main category pages: 0.8-0.9
     - Sub-pages and content: 0.5-0.7
     - Low-priority pages: 0.3-0.4
   - Change frequency estimation:
     - Homepage/listings: daily
     - Blog/news: weekly
     - Static pages: monthly
     - Archive pages: yearly
   - `lastmod`: Use actual file/database modified date
   - Split large sitemaps (>50k URLs) into sitemap index
   - Image sitemap extension if applicable
   - Video sitemap extension if applicable
   - Multi-language sitemap with `hreflang` alternates

   **Implementation examples**:
   - Database query integration for dynamic routes
   - Caching strategy (regenerate hourly/daily)
   - Compression (gzip) for large sitemaps

7. **Robots.txt configuration** (security-aware):
   - Allow all crawlers by default: `User-agent: *`
   - Disallow sensitive paths: `/api/`, `/admin/`, `/app/`, `/_next/`, `/private/`
   - Sitemap reference: `Sitemap: https://[domain]/sitemap.xml`
   - Crawl-delay if needed (rate limiting)
   - Specific bot rules (Google, Bing, etc.) if required
   - Detect and block common scrapers/bad bots if requested
   - Allow public assets: `/public/`, `/static/`, `/images/`

8. **On-page SEO optimization**:

   **Content structure**:
   - One `<h1>` per page (includes primary keyword)
   - Hierarchical heading structure: h1 → h2 → h3 (no skipping)
   - Keyword placement: Title, H1, first paragraph, headings, URL
   - Keyword density: 1-2% (natural, avoid stuffing)
   - LSI keywords: Semantic variations and related terms
   - Content length recommendations by page type:
     - Landing pages: 500-800 words
     - Blog posts: 1500-2500 words (comprehensive)
     - Product pages: 300-500 words + specs
     - About/Service pages: 800-1200 words

   **Internal linking**:
   - Contextual links within content (3-5 per page minimum)
   - Anchor text variety (exact match, partial, branded, generic)
   - Link to important pages from multiple sources
   - Breadcrumb navigation implementation
   - Hub-and-spoke content cluster model
   - Footer/sidebar navigation for important pages
   - Orphan page detection and linking strategy

   **URL structure**:
   - Descriptive, keyword-rich URLs
   - Hyphens for word separation (not underscores)
   - Lowercase only
   - Short and readable (3-5 words max)
   - Avoid parameters where possible (use path segments)
   - Examples: `/blog/seo-guide`, `/products/blue-sneakers`, `/pricing`

   **Image optimization**:
   - Descriptive `alt` attributes (include keywords naturally)
   - File names: descriptive-keywords.jpg (not IMG_1234.jpg)
   - Next.js `<Image>` component with automatic optimization
   - Lazy loading: `loading="lazy"` for below-fold images
   - Modern formats: WebP, AVIF with fallbacks
   - Responsive images: `srcset` and `sizes` attributes
   - Image compression: Keep under 100KB for most images
   - Structured data: `ImageObject` schema for key images

9. **Performance SEO** (Core Web Vitals optimization):

   **Largest Contentful Paint (LCP)**: <2.5s
   - Optimize hero images and above-fold content
   - Preload critical resources: `<link rel="preload">`
   - Use CDN for static assets
   - Implement critical CSS inline
   - Server-side rendering for faster initial paint

   **First Input Delay (FID)** / **Interaction to Next Paint (INP)**: <100ms / <200ms
   - Minimize JavaScript execution
   - Code splitting and lazy loading
   - Defer non-critical scripts
   - Optimize event handlers
   - Use web workers for heavy computations

   **Cumulative Layout Shift (CLS)**: <0.1
   - Specify dimensions for images and videos
   - Reserve space for ads and embeds
   - Avoid inserting content above existing content
   - Use `aspect-ratio` CSS property
   - Preload fonts to avoid FOIT/FOUT

   **Additional performance factors**:
   - Mobile-first responsive design
   - HTTPS everywhere (security ranking factor)
   - Fast server response time (TTFB <200ms)
   - Minimize redirects
   - Enable compression (gzip, brotli)
   - Browser caching headers
   - Minify HTML, CSS, JS
   - Remove unused code

10. **International & Local SEO** (if applicable):

   **International SEO** (multi-language/region):
   - `hreflang` tags for language/region variants
   - Proper URL structure: subdirectories (`/fr/`), subdomains (`fr.site.com`), or ccTLDs (`.fr`)
   - Avoid automatic redirects based on IP
   - Localized content (not machine translated)
   - Local hosting or CDN
   - Country targeting in Google Search Console
   - Currency and date format localization

   **Local SEO** (if business has physical presence):
   - Google Business Profile optimization guidance
   - NAP consistency (Name, Address, Phone) across web
   - Local schema: `LocalBusiness`, `PostalAddress`, `GeoCoordinates`
   - Location pages for multi-location businesses
   - Local keywords: "near me", city names, neighborhoods
   - Local citations and directories
   - Embed Google Maps
   - Local customer reviews and schema markup

11. **Content strategy & keyword research** (guidance):

   **Keyword research approach**:
   - Primary keyword per page (high volume, high intent)
   - Secondary keywords (2-3 related terms)
   - Long-tail variations (lower volume, higher conversion)
   - Question-based keywords for FAQ content
   - Competitor keyword gap analysis process
   - Search intent classification: Informational, Navigational, Transactional, Commercial

   **Content cluster strategy**:
   - Pillar pages for broad topics (comprehensive, 3000+ words)
   - Cluster content for specific subtopics (1500+ words each)
   - Internal linking between pillar and clusters
   - Topic authority building over time

   **Content recommendations by industry**:
   - E-commerce: Product guides, comparison posts, category pages
   - SaaS: Use cases, feature tutorials, integrations, vs. competitors
   - Content: Editorial calendar, trending topics, evergreen content
   - Local: Location pages, service area content, local events
   - Events: Event recaps, venue guides, industry news

12. **SEO audit scoring** (if auditing existing SEO):

   **Technical SEO Score** (0-100):
   - ✅ Meta tags present and optimized (title, description, OG, Twitter)
   - ✅ Schema markup implemented and valid
   - ✅ Sitemap exists and is accessible
   - ✅ Robots.txt configured correctly
   - ✅ Canonical tags implemented
   - ✅ HTTPS enabled site-wide
   - ✅ Mobile-friendly (responsive design)
   - ✅ Page speed acceptable (Core Web Vitals)
   - ❌ Identify issues with severity: Critical, High, Medium, Low

   **On-page SEO Score** (0-100):
   - ✅ Proper heading hierarchy
   - ✅ Keyword optimization (title, headings, content)
   - ✅ URL structure SEO-friendly
   - ✅ Image alt tags present
   - ✅ Internal linking sufficient
   - ✅ Content length adequate
   - ✅ Readability appropriate
   - ❌ Issues and improvement opportunities

   **Content SEO Score** (0-100):
   - ✅ Unique, valuable content
   - ✅ Keyword targeting clear
   - ✅ Content freshness (recent updates)
   - ✅ Topic depth and comprehensiveness
   - ❌ Content gaps and opportunities

   **Performance Score** (0-100):
   - ✅ LCP, FID/INP, CLS within thresholds
   - ✅ Mobile performance
   - ✅ Server response time
   - ❌ Performance bottlenecks

   **Overall SEO Health**: Average of above scores with weighted importance

### Output

After analyzing and implementing/auditing SEO, provide:

**Project Analysis**:
- **Framework detected**: Next.js App Router, React SPA, etc.
- **Industry/sector**: E-commerce, SaaS, etc. (with confidence level)
- **Business model**: B2B, B2C, etc.
- **Geographic scope**: Local, national, international
- **Current SEO status**: None, partial, comprehensive (with score if auditing)
- **Operation mode**: Audit, generation, enhancement, or hybrid

**SEO Audit Results** (if auditing):
- **Overall SEO Health Score**: X/100
  - Technical SEO: X/100
  - On-page SEO: X/100
  - Content SEO: X/100
  - Performance: X/100
- **Critical Issues** (fix immediately):
  - List of blocking issues with impact assessment
- **High-Priority Issues** (fix soon):
  - Important improvements with estimated impact
- **Medium/Low-Priority Issues** (optimize over time):
  - Nice-to-have improvements
- **Strengths** (what's working well):
  - Elements to preserve and build upon

**Generated/Recommended Files** (with full code):
- `app/sitemap.ts` or equivalent (framework-specific)
- `app/robots.ts` or `public/robots.txt`
- `app/manifest.ts` or `public/manifest.json` (if PWA)
- Metadata configuration files/components
- Schema markup components/utilities
- SEO component/layout examples
- Dynamic metadata functions for database-driven pages

**Meta Tag Templates** (per page type):
- Homepage meta tags (complete example)
- Category/listing pages
- Detail pages (product, post, profile, etc.)
- Static pages (about, contact, pricing, etc.)
- Variables to customize: `[BRAND_NAME]`, `[PAGE_TITLE]`, `[DESCRIPTION]`, etc.

**Schema Markup Examples** (context-specific):
- Organization schema (global)
- WebSite schema with SearchAction
- Page-specific schemas (Product, Article, Event, etc.)
- BreadcrumbList implementation
- JSON-LD component architecture

**Internal Linking Strategy**:
- Hub pages to identify and optimize
- Linking opportunities (specific page pairs)
- Anchor text recommendations
- Breadcrumb implementation guide

**Performance Optimization Checklist**:
- [ ] Optimize images (format, size, lazy loading)
- [ ] Implement code splitting
- [ ] Preload critical resources
- [ ] Minify and compress assets
- [ ] Configure caching headers
- [ ] Measure and monitor Core Web Vitals

**Keyword Research & Content Strategy**:
- **Primary keywords by page type**: Suggested keywords based on industry detection
- **Content cluster opportunities**: Topic areas to develop
- **Quick wins**: Low-competition, high-value keywords
- **Long-tail variations**: Specific phrases to target
- **Competitor analysis approach**: Tools and process to identify gaps

**International/Local SEO** (if applicable):
- Hreflang implementation guide
- URL structure recommendations
- Local schema markup examples
- Google Business Profile optimization tips

**Implementation Roadmap**:
1. **Week 1 - Technical Foundation**:
   - Implement meta tags across all pages
   - Generate and submit sitemap
   - Configure robots.txt
   - Add basic schema markup

2. **Week 2 - On-page Optimization**:
   - Optimize headings and content structure
   - Implement internal linking strategy
   - Optimize images (alt tags, file names)
   - Fix URL structure if needed

3. **Week 3 - Advanced Schema & Performance**:
   - Add industry-specific schema markup
   - Optimize Core Web Vitals
   - Implement dynamic metadata for database pages
   - Set up performance monitoring

4. **Week 4+ - Content & Monitoring**:
   - Create content based on keyword strategy
   - Monitor rankings and traffic
   - Iterate based on Search Console data
   - Build backlinks and authority

**Testing & Validation**:
- [ ] Google Rich Results Test (https://search.google.com/test/rich-results)
- [ ] Schema Markup Validator (https://validator.schema.org/)
- [ ] Mobile-Friendly Test (https://search.google.com/test/mobile-friendly)
- [ ] Lighthouse SEO Audit (aim for 95+ score)
- [ ] PageSpeed Insights (Core Web Vitals check)
- [ ] Test sitemap accessibility: `/sitemap.xml`
- [ ] Submit sitemap to Google Search Console and Bing Webmaster Tools
- [ ] Verify robots.txt: `/robots.txt`

**Monitoring & Ongoing Optimization**:
- **Google Search Console**: Set up and monitor
  - Index coverage
  - Search performance (queries, clicks, impressions, CTR)
  - Core Web Vitals report
  - Mobile usability issues
- **Analytics tracking**: Organic traffic, conversions, bounce rate
- **Rank tracking**: Monitor keyword positions (weekly)
- **Content refresh**: Update old content quarterly
- **Technical audits**: Monthly crawl for broken links, errors
- **Backlink monitoring**: Track link growth and quality
- **Competitor tracking**: Monitor competitor changes

**Tools Recommended**:
- Google Search Console (essential, free)
- Google Analytics 4 (traffic analysis, free)
- Lighthouse (performance & SEO, free)
- Schema Markup Validator (free)
- Screaming Frog SEO Spider (technical audits, free up to 500 URLs)
- Ahrefs/SEMrush/Moz (keyword research, paid but powerful)

**Next Steps**:
- Prioritized action items based on impact vs. effort
- Content calendar for SEO content creation
- Ongoing optimization schedule (monthly/quarterly tasks)
- Advanced features to consider (AMP, PWA, structured data expansion)

### Framework-Specific Implementation Examples

**Next.js App Router - Dynamic Metadata**:
```typescript
// app/products/[slug]/page.tsx
import type { Metadata } from 'next'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await fetchProduct(params.slug)

  return {
    title: `${product.name} | Your Store`,
    description: product.description,
    openGraph: {
      images: [product.image],
    },
  }
}
```

**React SPA - Helmet Example**:
```typescript
import { Helmet } from 'react-helmet-async'

export function ProductPage({ product }) {
  return (
    <>
      <Helmet>
        <title>{product.name} | Your Store</title>
        <meta name="description" content={product.description} />
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
      </Helmet>
      {/* Page content */}
    </>
  )
}
```

**Universal Schema Example**:
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "[YOUR_COMPANY_NAME]",
  "url": "https://[YOUR_DOMAIN]",
  "logo": "https://[YOUR_DOMAIN]/logo.png",
  "sameAs": [
    "https://twitter.com/[HANDLE]",
    "https://linkedin.com/company/[HANDLE]"
  ]
}
```
