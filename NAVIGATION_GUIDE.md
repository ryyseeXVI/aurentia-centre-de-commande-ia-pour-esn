# 🗺️ Aurentia AI Command Center - Navigation Guide

## Overview

This guide explains where to find all features in your ESN management platform and how to navigate between them.

---

## 📍 Main Application Routes

### Authentication Pages

| Page | Route | Description |
|------|-------|-------------|
| **Login** | `/login` | User authentication with email/password and Google OAuth |
| **Register** | `/register` | New user registration with email verification |

---

### Core Dashboard

| Page | Route | Description | Features |
|------|-------|-------------|----------|
| **Main Dashboard** | `/app` | Central hub showing overview of your ESN | • Organization stats<br>• Active projects<br>• Consultant count<br>• Hours tracked<br>• Quick actions |
| **Profile** | `/app/profile` | User profile management | • Personal information<br>• Avatar upload<br>• **Theme switcher (Light/Dark/System)**<br>• Role information |

---

### Organization Management

| Page | Route | Description | Key Actions |
|------|-------|-------------|-------------|
| **Organizations List** | `/app/organizations` | View all client organizations | • List all organizations<br>• Organization roles<br>• Quick access to projects |
| **Organization Detail** | `/app/organizations/[orgId]` | Detailed view of a specific organization | • Organization information<br>• View all projects<br>• Access project details |

---

### 🎯 **Project Management System** (NEW!)

| Page | Route | Description | Tabs Available |
|------|-------|-------------|----------------|
| **Project Detail** | `/app/organizations/[orgId]/projects/[projectId]` | Complete project management interface | **Overview** • Task stats<br>• Milestone progress<br>• Completion percentage<br>• Project information<br><br>**Kanban** • Drag-and-drop task board<br>• Create/edit tasks<br>• Move tasks between columns<br>• Task cards with details<br><br>**Milestones** • Create milestones<br>• Track deliverables<br>• Dependencies<br>• Progress tracking<br><br>**Roadmap** • Timeline visualization<br>• Milestone dependencies<br>• Critical path (coming soon) |

#### How to Access Projects:
1. Go to **Dashboard** (`/app`)
2. Click on an **Organization** in the "Client Organizations" section
3. You'll see all projects for that organization
4. Click "**View Project**" on any project card
5. You'll be taken to the full project management interface with:
   - **Overview Tab**: Stats, completion tracking
   - **Kanban Tab**: Full drag-and-drop task board
   - **Milestones Tab**: Deliverable tracking
   - **Roadmap Tab**: Visual timeline

---

### Consultant Management

| Page | Route | Description |
|------|-------|-------------|
| **Consultants List** | `/app/consultants` | View all consultants in your ESN |
| **Consultant Detail** | `/app/consultants/[consultantId]` | Individual consultant profile and assignment history |

---

### Administrative Tools

| Page | Route | Access Level | Description |
|------|-------|--------------|-------------|
| **Admin Dashboard** | `/app/admin` | Admins only | Comprehensive admin panel with three tabs:<br>• **Users**: Manage user roles and permissions<br>• **Organizations**: Create/manage client organizations<br>• **Consultants**: View all consultant data |
| **Analytics** | `/app/analytics` | Managers & Admins | Performance metrics and business intelligence |
| **Chat** | `/app/chat` | All users | Team communication and messaging |

---

## 🎨 **NEW UI Enhancements**

### Theme Switching
- **Location**: Profile page (`/app/profile`)
- **Options**: Light, Dark, System preference
- **Persistence**: Saved to localStorage
- **Access**: Bottom of profile page in "Appearance" card

### Visual Polish Applied To:
✅ **Dashboard** - Enhanced stat cards with colored borders and icons
✅ **Auth Pages** - Gradient overlays and better branding
✅ **Admin Panel** - Color-coded tabs, enhanced empty states
✅ **Organizations** - Improved hover states and visual hierarchy
✅ **Profile** - Theme switcher with beautiful card design
✅ **Project Detail** (NEW) - Complete tabbed interface with kanban board

### Color System
The entire application now uses a consistent color palette:
- `chart-1`: Light blue - Organizations
- `chart-2`: Purple - Projects
- `chart-3`: Deep purple - Consultants
- `chart-4`: Primary purple - Main actions
- `chart-5`: Dark purple - Accent elements

---

## 🚀 Quick Navigation Paths

### To Create/Manage Tasks:
1. Dashboard → Organization → Project → **Kanban Tab**
2. Drag and drop tasks between columns (TODO, IN PROGRESS, DONE, BLOCKED)
3. Click "New Task" to create tasks

### To Track Milestones:
1. Dashboard → Organization → Project → **Milestones Tab**
2. Click "New Milestone" to create
3. Link tasks to milestones
4. Track dependencies

### To View Project Progress:
1. Dashboard → Organization → Project → **Overview Tab**
2. See completion percentage, task breakdown, milestone progress

### To Manage Users (Admin):
1. Dashboard → Admin Dashboard → **Users Tab**
2. Edit roles, manage permissions, delete users

### To Add Organizations (Admin):
1. Dashboard → Admin Dashboard → **Organizations Tab**
2. Click "Add Organization"

### To Change Theme:
1. Dashboard → Profile → **Appearance Card** (at bottom)
2. Choose Light, Dark, or System

---

## 📊 Feature Status

| Feature | Status | Location |
|---------|--------|----------|
| **Kanban Board** | ✅ Fully Implemented | Project Detail → Kanban Tab |
| **Milestones** | ✅ Fully Implemented | Project Detail → Milestones Tab |
| **Roadmap** | ⚠️ UI Ready, Visualization Coming Soon | Project Detail → Roadmap Tab |
| **Theme Switcher** | ✅ Fully Implemented | Profile Page |
| **Task Management** | ✅ Drag & Drop Working | Kanban Board |
| **Milestone Dependencies** | ✅ Backend Ready | Milestones Tab |
| **Critical Path Analysis** | 🔜 Coming Soon | Roadmap Tab |

---

## 🎯 Typical User Workflows

### Project Manager Daily Workflow:
1. Check **Dashboard** for overview
2. Navigate to active **Projects**
3. Review **Kanban board** for task status
4. Update **Milestones** as needed
5. Check **Analytics** for performance metrics

### Consultant Workflow:
1. View **Dashboard** for assigned tasks
2. Access **Project Kanban** to move tasks
3. Update **Profile** and availability
4. Use **Chat** for team communication

### Admin Workflow:
1. Monitor **Dashboard** metrics
2. Manage **Users** in Admin panel
3. Create/edit **Organizations**
4. Review **Consultants** performance
5. Access **Analytics** for business insights

---

## 🔗 Quick Links

- **Main App**: http://localhost:3000/app
- **Projects**: Click any organization → View projects → Click project
- **Kanban**: Projects → Kanban tab
- **Admin**: http://localhost:3000/app/admin
- **Profile (Theme)**: http://localhost:3000/app/profile

---

## 💡 Tips

1. **All projects now have full kanban boards** - just navigate to any project!
2. **The theme persists** across sessions - set it once in your profile
3. **Hover effects** provide visual feedback throughout the app
4. **Drag and drop** works smoothly on the kanban board
5. **Empty states** guide you when there's no data
6. **Color coding** helps distinguish different data types

---

## 🎨 UI Polish Highlights

### Enhanced Elements:
- **Stat Cards**: Colored left borders + icon backgrounds
- **List Items**: Smooth hover states with color transitions
- **Empty States**: Engaging circular icon backgrounds
- **Buttons**: Enhanced hover states with color changes
- **Tables**: Better row hover effects
- **Icons**: Color-coded throughout for visual hierarchy
- **Transitions**: Smooth 200ms color transitions everywhere
- **Theme Switching**: 300ms smooth transition between themes

### Accessibility:
- Proper ARIA labels
- Keyboard navigation support
- Focus indicators on interactive elements
- Color contrast compliance
- Screen reader friendly

---

*Last Updated: 2025-11-14*
*Version: 2.0 - Complete UI Polish + Project Management*
