# Aurentia AI Command Center

**An AI-powered ESN (Engineering Services) management platform for intelligent project and consultant management.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8)](https://tailwindcss.com/)

## 🎯 Overview

Aurentia AI Command Center is a comprehensive management platform designed for Engineering Services companies (ESN/SSII). It provides intelligent project management, consultant allocation, real-time collaboration, and AI-powered risk prediction to optimize project delivery and profitability.

### Key Features

- **🏢 Multi-Tenant Architecture** - Complete organization isolation with role-based access control
- **📊 Project Management** - Kanban boards, task tracking, milestone roadmaps
- **👥 Consultant Management** - Skill tracking, allocation management, performance analytics
- **💬 Real-Time Messaging** - Organization channels, project channels, direct messages, group chats
- **🔔 Smart Notifications** - Real-time updates with customizable notification types
- **📈 Analytics & Reporting** - Financial metrics, time tracking, project health monitoring
- **⚡ AI-Powered Insights** - Risk prediction, project health scores, intelligent recommendations
- **🔐 Secure & Compliant** - Role-based permissions, activity logging, audit trail
- **🎨 Modern UI** - Beautiful, responsive interface built with shadcn/ui

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.17 or later
- **npm** or **pnpm**
- **Supabase** account (for database and authentication)
- **Git** for version control

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/aurentia-centre-de-commande-ia-pour-esn.git
cd aurentia-centre-de-commande-ia-pour-esn

# Install dependencies
npm install
# or
pnpm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Configuration

Create a `.env.local` file with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Database Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Run the database migrations** (see `db.sql` or use Supabase dashboard)
3. **Generate TypeScript types**:

```bash
npx supabase gen types typescript --project-id=your-project-id > lib/supabase/types.ts
```

4. **Seed the database** (optional):

```bash
npm run seed
```

### Running the Application

```bash
# Development mode (with hot reload)
npm run dev

# Production build
npm run build
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## 🧪 Test Accounts

For development and testing, use these pre-configured accounts:

### Owner Account (Full Access)
- **Email**: `elliot.estrade@gmail.com`
- **Password**: `elliot12345`
- **Role**: OWNER (unrestricted access across all organizations)

### Admin Account
- **Email**: `bousquet.matthieu0@gmail.com`
- **Password**: `matt13005`
- **Role**: ADMIN (full access within their organization)

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

### Getting Started
- [Installation Guide](docs/getting-started/01-installation.md)
- [Setup & Configuration](docs/getting-started/02-setup.md)
- [Test Accounts](docs/getting-started/03-test-accounts.md)
- [First Run Tutorial](docs/getting-started/04-first-run.md)

### Architecture
- [System Overview](docs/architecture/01-overview.md)
- [Tech Stack](docs/architecture/02-tech-stack.md)
- [Services & Pricing](docs/architecture/03-services-pricing.md)
- [Architecture Diagrams](docs/architecture/04-diagrams.md)

### Core Concepts
- [Authentication & Authorization](docs/core-concepts/01-authentication.md)
- [Multi-Tenancy](docs/core-concepts/02-multi-tenancy.md)
- [Database Schema](docs/core-concepts/03-database-schema.md)
- [API Conventions](docs/core-concepts/04-api-conventions.md)

### API Reference
- [Authentication API](docs/api-reference/01-authentication.md)
- [Organizations API](docs/api-reference/02-organizations.md)
- [Projects API](docs/api-reference/03-projects.md)
- [Tasks API](docs/api-reference/04-tasks.md)
- [Milestones API](docs/api-reference/05-milestones.md)
- [Consultants API](docs/api-reference/06-consultants.md)
- [Analytics API](docs/api-reference/07-analytics.md)
- [Messaging API](docs/api-reference/08-messaging.md)
- [Notifications API](docs/api-reference/09-notifications.md)
- [Admin API](docs/api-reference/10-admin.md)

### Features
- [Project Management](docs/features/project-management.md)
- [Task Management](docs/features/task-management.md)
- [Milestones & Roadmaps](docs/features/milestones.md)
- [Analytics Dashboard](docs/features/analytics.md)
- [Messaging System](docs/features/messaging.md)
- [Notifications](docs/features/notifications.md)

### Development
- [Code Patterns & Best Practices](docs/development/code-patterns.md)
- [Testing Guidelines](docs/development/testing.md)
- [Deployment Guide](docs/development/deployment.md)

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Validation**: Zod

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage
- **API**: Next.js API Routes + Server Actions

### Infrastructure
- **Hosting**: Vercel
- **Database**: Supabase Cloud
- **Version Control**: Git

## 🎯 Project Structure

```
aurentia-centre-de-commande-ia-pour-esn/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication pages (login, register)
│   ├── (admin)/             # Admin backoffice (route group)
│   ├── api/                 # API routes (80+ endpoints)
│   ├── analytics/           # Analytics pages
│   ├── organizations/       # Organization management
│   └── layout.tsx           # Root layout
├── components/              # React components
│   ├── ui/                  # shadcn/ui components (auto-generated)
│   ├── auth/                # Authentication components
│   ├── projects/            # Project management components
│   ├── analytics/           # Analytics components
│   ├── chat/                # Real-time chat components
│   └── ...
├── lib/                     # Utilities and helpers
│   ├── supabase/            # Supabase clients (server/client)
│   ├── validations/         # Zod validation schemas
│   ├── api-helpers.ts       # API utilities
│   ├── notifications.ts     # Notification helpers
│   └── utils.ts             # General utilities
├── hooks/                   # Custom React hooks
├── contexts/                # React contexts (Auth, Notifications, Workspace)
├── types/                   # TypeScript type definitions
├── utils/                   # Utility functions
├── docs/                    # Comprehensive documentation
├── supabase/               # Supabase migrations
├── db.sql                  # Database schema
└── CLAUDE.md               # AI assistant instructions
```

## 🔑 Key Concepts

### Multi-Tenancy

The platform is designed with **organization-based multi-tenancy**:
- Each user belongs to one or more organizations
- All data is scoped to organizations via `organization_id`
- Role-based access control (OWNER, ADMIN, MANAGER, CONSULTANT, CLIENT)
- Complete data isolation between organizations

### Role Hierarchy

```
OWNER > ADMIN > MANAGER > CONSULTANT > CLIENT
```

- **OWNER**: Unrestricted access across all organizations (super-admin)
- **ADMIN**: Full access within their organization
- **MANAGER**: Can manage projects and consultants
- **CONSULTANT**: Regular user access
- **CLIENT**: Read-only external user

### Authentication Flow

1. User signs up or logs in via Supabase Auth
2. Profile created in `profiles` table
3. User joins organization(s) via `user_organizations`
4. Role determines access level
5. Session managed via middleware (auto-refresh)

## 📊 Features Overview

### Project Management
- Kanban board with drag-and-drop
- List view with advanced filtering
- Project health monitoring
- Budget tracking
- Timeline management

### Task Management
- Create, assign, and track tasks
- Priority levels (low, medium, high, urgent)
- Status tracking (TODO, IN_PROGRESS, IN_REVIEW, DONE)
- Tags and color coding
- Time tracking integration

### Analytics Dashboard
- **Financial Analytics**: Revenue, costs, profit margins
- **Time Tracking**: Hours worked, utilization rates
- **Team Performance**: Consultant productivity metrics
- **Project Health**: Risk assessment and health scores
- **Custom Reports**: Exportable CSV data

### Real-Time Messaging
- **Organization Channels**: Company-wide communication
- **Project Channels**: Project-specific discussions
- **Direct Messages**: 1-on-1 conversations
- **Group Chats**: Private group conversations
- **Message Reactions**: React to messages with emojis
- **Typing Indicators**: Real-time typing status

### Notifications
- Real-time updates via Supabase Realtime
- Bell icon with unread count badge
- Customizable notification types
- Action links for quick access
- Mark as read/unread functionality

## 🛠️ Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Production build
npm start                # Start production server

# Code Quality
npx tsc --noEmit         # Type checking
npm run lint             # ESLint
npm run format           # Prettier (if configured)

# Database
npm run seed             # Seed database with test data
npx supabase gen types   # Generate TypeScript types
```

## 🚢 Deployment

### Vercel Deployment (Recommended)

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel automatically builds and deploys

```bash
# Using Vercel CLI
npm install -g vercel
vercel
```

### Environment Variables (Production)

```bash
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

## 📈 Monitoring & Analytics

- **Vercel Analytics**: Built-in performance monitoring
- **Supabase Dashboard**: Database metrics and logs
- **Activity Logs**: Full audit trail in the application
- **Error Tracking**: (Recommended: Sentry integration)

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Follow Next.js and React best practices
- **Formatting**: Use Prettier (configure as needed)
- **Components**: Prefer Server Components, use `'use client'` only when necessary
- **Validation**: Always use Zod for input validation

## 📝 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:

- **Documentation**: See `docs/` directory
- **Issues**: Create a GitHub issue
- **Email**: support@aurentia.com (if applicable)

## 🙏 Acknowledgments

- **Next.js Team** for the amazing framework
- **Supabase** for the powerful backend platform
- **shadcn/ui** for beautiful UI components
- **Vercel** for seamless deployment

---

**Built with ❤️ by the Aurentia Team**

*Last Updated: November 2025*
