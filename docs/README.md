# Aurentia AI Command Center Documentation

Complete documentation for developers, administrators, and end users.

## 📚 Documentation Index

### Getting Started

Perfect for new developers and team members:

1. **[Installation Guide](./getting-started/01-installation.md)** - Set up your development environment
2. **[Setup & Configuration](./getting-started/02-setup.md)** - Configure environment variables and database
3. **[Test Accounts](./getting-started/03-test-accounts.md)** - Pre-configured accounts for testing different roles
4. **[First Run Tutorial](./getting-started/04-first-run.md)** - Your first steps with the platform

**Quick Start:** See [README.md](../README.md) for a rapid overview.

---

### Architecture

Understanding the system design and technical decisions:

1. **[System Overview](./architecture/01-overview.md)** - High-level architecture, components, data flow
2. **[Tech Stack](./architecture/02-tech-stack.md)** - Technologies used and rationale
3. **[Services & Pricing](./architecture/03-services-pricing.md)** - Cost analysis for Vercel, Supabase, and projections
4. **[Architecture Diagrams](./architecture/04-diagrams.md)** - Visual representations of the system

**Key Documents:**
- 📊 **[Services & Pricing](./architecture/03-services-pricing.md)** - Essential for budget planning
- 🏗️ **[System Overview](./architecture/01-overview.md)** - Start here for architecture understanding

---

### Core Concepts

Essential knowledge for working with the platform:

1. **[Authentication & Authorization](./core-concepts/01-authentication.md)** - How auth works, role hierarchy
2. **[Multi-Tenancy](./core-concepts/02-multi-tenancy.md)** - Organization-based data isolation
3. **[Database Schema](./core-concepts/03-database-schema.md)** - Complete database documentation (40+ tables)
4. **[API Conventions](./core-concepts/04-api-conventions.md)** - Request/response patterns, error handling

**Must Read:**
- 🗄️ **[Database Schema](./core-concepts/03-database-schema.md)** - Reference for all database tables
- 🔐 **[Multi-Tenancy](./core-concepts/02-multi-tenancy.md)** - Critical for understanding data scoping

---

### API Reference

Complete API documentation for 80+ endpoints:

- **[API Overview](./api-reference/00-api-overview.md)** - All endpoints at a glance
- **[Authentication API](./api-reference/01-authentication.md)** - User authentication endpoints
- **[Organizations API](./api-reference/02-organizations.md)** - Manage organizations (detailed example)
- **[Projects API](./api-reference/03-projects.md)** - Project management endpoints
- **[Tasks API](./api-reference/04-tasks.md)** - Task operations (Kanban, CRUD)
- **[Milestones API](./api-reference/05-milestones.md)** - Milestone tracking
- **[Consultants API](./api-reference/06-consultants.md)** - Consultant management
- **[Analytics API](./api-reference/07-analytics.md)** - Analytics and reporting
- **[Messaging API](./api-reference/08-messaging.md)** - Real-time chat system
- **[Notifications API](./api-reference/09-notifications.md)** - Notification management
- **[Admin API](./api-reference/10-admin.md)** - Admin backoffice endpoints

**Start Here:**
- 📋 **[API Overview](./api-reference/00-api-overview.md)** - Quick reference for all endpoints
- 🏢 **[Organizations API](./api-reference/02-organizations.md)** - Detailed example of API documentation

---

### Features

User guides for major features:

1. **[Project Management](./features/project-management.md)** - Kanban boards, project tracking
2. **[Task Management](./features/task-management.md)** - Creating and managing tasks
3. **[Milestones & Roadmaps](./features/milestones.md)** - Milestone planning and tracking
4. **[Analytics Dashboard](./features/analytics.md)** - Financial, time tracking, team performance
5. **[Messaging System](./features/messaging.md)** - Real-time chat (channels, DMs, groups)
6. **[Notifications](./features/notifications.md)** - Notification system and bell icon UI

---

### Development

For developers working on the codebase:

1. **[Code Patterns & Best Practices](./development/code-patterns.md)** - Coding standards
2. **[Testing Guidelines](./development/testing.md)** - How to test features
3. **[Deployment Guide](./development/deployment.md)** - Deploying to production

**See Also:** [CLAUDE.md](../CLAUDE.md) for comprehensive development guidelines.

---

## 🎯 Quick Links by Role

### For New Developers

1. Read [README.md](../README.md) for project overview
2. Follow [Installation Guide](./getting-started/01-installation.md)
3. Review [Architecture Overview](./architecture/01-overview.md)
4. Study [Database Schema](./core-concepts/03-database-schema.md)
5. Browse [API Overview](./api-reference/00-api-overview.md)

### For Product Managers

1. [README.md](../README.md) - Feature overview
2. [Architecture Overview](./architecture/01-overview.md) - System capabilities
3. [Services & Pricing](./architecture/03-services-pricing.md) - Cost analysis
4. [Test Accounts](./getting-started/03-test-accounts.md) - Test different roles

### For DevOps/SRE

1. [Architecture Overview](./architecture/01-overview.md) - Infrastructure
2. [Services & Pricing](./architecture/03-services-pricing.md) - Service dependencies
3. [Deployment Guide](./development/deployment.md) - Deploy process
4. [Database Schema](./core-concepts/03-database-schema.md) - Backup strategy

### For QA/Testers

1. [Test Accounts](./getting-started/03-test-accounts.md) - Test credentials and scenarios
2. [API Overview](./api-reference/00-api-overview.md) - Endpoints to test
3. [Feature Guides](./features/) - Feature specifications

---

## 📊 Statistics

### Documentation Coverage

- **Total Documents**: 25+ markdown files
- **API Endpoints Documented**: 80+
- **Database Tables Documented**: 40+
- **Code Examples**: 100+
- **Architecture Diagrams**: 10+

### Documentation Metrics

| Category | Files | Status |
|----------|-------|--------|
| Getting Started | 4 | ✅ Complete |
| Architecture | 4 | ✅ Complete |
| Core Concepts | 4 | ✅ Complete |
| API Reference | 11 | ✅ Complete (Overview + Detailed Examples) |
| Features | 6 | ⚠️ Planned |
| Development | 3 | ⚠️ Planned |

---

## 🔍 Searching the Documentation

### By Topic

- **Authentication**: [Authentication Guide](./core-concepts/01-authentication.md), [Test Accounts](./getting-started/03-test-accounts.md)
- **Organizations**: [Organizations API](./api-reference/02-organizations.md), [Multi-Tenancy](./core-concepts/02-multi-tenancy.md)
- **Database**: [Database Schema](./core-concepts/03-database-schema.md)
- **Pricing**: [Services & Pricing](./architecture/03-services-pricing.md)
- **API Endpoints**: [API Overview](./api-reference/00-api-overview.md)

### By Use Case

- **Setting up development environment**: [Installation](./getting-started/01-installation.md) → [Setup](./getting-started/02-setup.md)
- **Understanding data model**: [Database Schema](./core-concepts/03-database-schema.md)
- **Integrating with API**: [API Overview](./api-reference/00-api-overview.md) → Specific API docs
- **Estimating costs**: [Services & Pricing](./architecture/03-services-pricing.md)
- **Testing with different roles**: [Test Accounts](./getting-started/03-test-accounts.md)

---

## 🤝 Contributing to Documentation

### Adding New Documentation

1. Place files in appropriate directory (`getting-started/`, `api-reference/`, etc.)
2. Follow existing naming convention: `##-topic-name.md`
3. Add entry to this index
4. Cross-reference related documents
5. Include code examples where applicable

### Documentation Standards

- **Use clear headings** (H2 for sections, H3 for subsections)
- **Include code examples** for technical content
- **Add cross-references** to related docs
- **Keep examples realistic** (use actual data patterns)
- **Update table of contents** when adding files

### Documentation Templates

See existing files for templates:
- API endpoint: [Organizations API](./api-reference/02-organizations.md)
- Core concept: [Database Schema](./core-concepts/03-database-schema.md)
- Getting started: [Test Accounts](./getting-started/03-test-accounts.md)

---

## 📞 Getting Help

### Documentation Issues

If you find errors, outdated information, or missing documentation:

1. Check [Issues](https://github.com/your-org/repo/issues) for existing reports
2. Create a new issue with `[docs]` prefix
3. Include page reference and description of issue

### Questions

For questions about the documentation:

1. Check the [FAQ](../FAQ.md) (if available)
2. Ask in team chat (development channel)
3. Create a documentation issue for clarification

---

## 🔄 Documentation Updates

**Last Major Update**: November 2025

**Recent Changes**:
- ✅ Complete API documentation (80+ endpoints)
- ✅ Database schema documentation (40+ tables)
- ✅ Services & pricing analysis
- ✅ Architecture diagrams and overview
- ✅ Test accounts guide with permission matrix

**Upcoming**:
- Feature user guides (project management, analytics, etc.)
- Development workflow guides
- Deployment best practices
- Video tutorials

---

## 📝 Feedback

We value your feedback! Help us improve this documentation:

- **What's missing?** Let us know what you'd like to see documented
- **What's unclear?** Point out confusing sections
- **What's helpful?** Share what works well

---

**Quick Links:**
- [Main README](../README.md)
- [Architecture Overview](./architecture/01-overview.md)
- [Database Schema](./core-concepts/03-database-schema.md)
- [API Overview](./api-reference/00-api-overview.md)
- [Test Accounts](./getting-started/03-test-accounts.md)
- [Services & Pricing](./architecture/03-services-pricing.md)

---

*Documentation maintained by the Aurentia Team*
