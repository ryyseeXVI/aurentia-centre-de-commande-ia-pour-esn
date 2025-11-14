# Comprehensive Data Enhancement for matthieu.bousquet@epitech.eu

## Overview

This document describes the extensive data enhancement implemented to make the database fully testable with rich, realistic operational data linked to `matthieu.bousquet@epitech.eu`.

## Execution Instructions

Run the enhancement script:
```bash
psql <your_connection_string> -f scripts/enhance-matthieu-data.sql
```

Or via Supabase SQL Editor:
- Copy contents of `scripts/enhance-matthieu-data.sql`
- Paste into Supabase SQL Editor
- Execute

## What This Enhancement Adds

### 1. Extended Historical Time Tracking (June-August 2025)

**Added:** ~55 additional time entries covering 3 months of summer work

**Details:**
- Period: June 1 - August 31, 2025
- Workdays: Monday-Friday (excluding weekends)
- Vacation: 2 weeks excluded (Aug 4-15, 2025)
- Pattern: Realistic summer schedule
  - Monday: 5.0h
  - Tuesday: 6.0h (intensive days)
  - Wednesday: 5.5h
  - Thursday: 5.0h
  - Friday: 4.0h (summer Fridays)
- Project: BNP Modernisation Plateforme Bancaire
- Status: All validated (VALIDEE)

**Total Time Coverage:** Now spans **5+ months** (June 1 - Nov 13, 2025)

### 2. Additional Deliverables (6 New Deliverables)

All for BNP Modernisation project:

#### Backend Deliverables
1. **Microservices Core Banking** (EN_COURS)
   - Due: Dec 15, 2025
   - Core banking microservices: accounts, transfers, transactions

2. **Data Migration Pipeline** (EN_COURS)
   - Due: Jan 31, 2026
   - Mainframe → PostgreSQL migration with validation

#### Infrastructure Deliverables
3. **Kubernetes Production Cluster** (EN_COURS)
   - Due: Nov 30, 2025
   - Multi-AZ K8s with auto-scaling, monitoring

4. **CI/CD GitOps Pipeline** (A_FAIRE)
   - Due: Dec 20, 2025
   - ArgoCD, canary deployments, feature flags

#### Security & Compliance
5. **Security Audit & Pentest** (A_FAIRE)
   - Due: Feb 28, 2026
   - PCI-DSS and GDPR compliance, external pentest

6. **Disaster Recovery Plan** (A_FAIRE)
   - Due: Jan 15, 2026
   - PRA/PCA with RTO 4h / RPO 1h

### 3. Additional Tasks (10 New Tasks)

**Tasks Assigned to Matthieu (6 tasks):**

1. **Design Event-Driven Architecture** (IN_PROGRESS)
   - Deliverable: Microservices Core Banking
   - Charge: 15 jh
   - Due: Nov 20, 2025
   - Description: Kafka event sourcing, SAGA patterns, DDD

2. **Define Service Mesh Strategy** (TODO)
   - Deliverable: Microservices Core Banking
   - Charge: 10 jh
   - Due: Nov 25, 2025
   - Description: Istio traffic management, mTLS, observability

3. **Review Data Quality Checks** (TODO)
   - Deliverable: Data Migration Pipeline
   - Charge: 8 jh
   - Due: Dec 5, 2025
   - Description: Validation rules, anomaly detection

4. **Security Hardening Review** (REVIEW)
   - Deliverable: Kubernetes Production Cluster
   - Charge: 6 jh
   - Due: Nov 22, 2025
   - Description: RBAC, pod security, Vault integration

5. **Design Canary Deployment Strategy** (TODO)
   - Deliverable: CI/CD GitOps Pipeline
   - Charge: 5 jh
   - Due: Dec 18, 2025
   - Description: Flagger traffic splitting, automated rollback

6. **Coordinate External Pentest** (TODO)
   - Deliverable: Security Audit & Pentest
   - Charge: 10 jh
   - Due: Feb 15, 2026
   - Description: Pentest coordination and remediation

**Tasks Assigned to Team Members (4 tasks):**
- Build ETL Pipeline (Alexandre - IN_PROGRESS)
- Configure Multi-AZ Cluster (Julie - IN_PROGRESS)
- Setup ArgoCD GitOps (Pierre - TODO)
- Document Recovery Procedures (Sophie - TODO)

### 4. Additional Time Entries (7 New Entries)

**Matthieu's Recent Work (3 entries):**

- **Nov 11:** 6.5h - Event-driven architecture workshop
  - Task: Design Event-Driven Architecture
  - Details: DDD modeling, SAGA patterns, event modeling

- **Nov 12:** 5.0h - Schema registry specification
  - Task: Design Event-Driven Architecture
  - Details: Avro versioning, compatibility rules

- **Nov 13:** 4.5h - K8s RBAC audit
  - Task: Security Hardening Review
  - Details: Service accounts review, identified 3 over-privileged pods
  - Status: EN_ATTENTE (pending validation)

**Team Member Time Entries (4 entries):**
- Julie: 2 entries for K8s multi-AZ configuration (13.5h total)
- Alexandre: 2 entries for ETL pipeline development (15.5h total)

### 5. Additional Incidents (5 New Incidents)

All for BNP Modernisation project with varied types:

1. **Pod OOMKilled - Payment Service** (MOYENNE, RESOLU)
   - Date: Nov 10, 14:23
   - Consultant: Julie Michel
   - Impact: 12 failed transactions
   - Resolution: Memory limit increased 512Mi → 1Gi

2. **Data Migration Validation Failure** (ELEVEE, EN_COURS)
   - Date: Nov 9, 09:15
   - Consultant: Alexandre Simon
   - Issue: 2,847 invalid accounts (3.2%), IBAN checksum errors
   - Action: Automatic rollback, investigation ongoing

3. **Exposed Secret in Git History** (CRITIQUE, RESOLU)
   - Date: Nov 8, 16:45
   - Consultant: Matthieu Bousquet
   - Issue: Vault API key in Git history
   - Resolution: Immediate key rotation, no unauthorized access detected

4. **Database Connection Pool Exhausted** (MOYENNE, RESOLU)
   - Date: Nov 7, 11:30
   - Consultant: Thomas Dubois
   - Issue: N+1 queries, P95 latency 4.2s → 450ms after fix

5. **Kafka Consumer Lag Spike** (ELEVEE, RESOLU)
   - Date: Nov 6, 15:10
   - Consultant: Pierre Martin
   - Issue: 2.3M message lag after deployment
   - Recovery: 45 minutes

### 6. Additional Drift Detections (3 New Detections)

1. **Schedule Drift** (ELEVEE)
   - Date: Nov 10
   - Issue: 3 weeks delay on core banking microservices
   - Details: Velocity 22 SP/sprint vs target 35 SP/sprint

2. **Quality Drift** (MODEREE)
   - Date: Nov 12
   - Issue: Code coverage 64% (target: 80%), debt ratio 8.2% (limit: 5%)
   - Details: 47 critical code smells

3. **Workload Drift** (MODEREE)
   - Date: Nov 11
   - Issue: Team averaging 52h/week (limit: 40h)
   - Risk: 3 consultants in overtime for 4 weeks, burnout risk

### 7. Additional Risk Predictions (3 New Predictions)

1. **Deadline Risk** (67% probability, 120 days horizon)
   - Type: DELAI
   - Impact: Project delivery at risk

2. **Team Burnout Risk** (38% probability, 45 days horizon)
   - Type: CHARGE
   - Consultant: Julie Michel
   - Impact: Team capacity reduction

3. **Security Audit Failure Risk** (28% probability, 105 days horizon)
   - Type: QUALITE
   - Consultant: Matthieu Bousquet
   - Impact: PCI-DSS certification at risk

### 8. Additional AI Recommendations (3 New Recommendations)

1. **Deadline Mitigation** (EN_ATTENTE)
   - Prediction: 67% deadline risk
   - Type: REPLANIFICATION
   - Actions:
     - MVP redefinition (save 120 jh)
     - Team reinforcement: +2 backend devs for 8 weeks (€96K)
     - Weekend sprint with compensation
     - Client negotiation: 3-week extension
   - Impact: Success probability 67% → 85%

2. **Burnout Prevention** (EN_ATTENTE)
   - Prediction: 38% burnout risk
   - Type: REALLOCATION
   - Actions:
     - Redistribute 20% of Julie's load to Pierre
     - Prioritize infrastructure-as-code automation (6h/week savings)
     - Mandatory 1 day off/month during intensive period
     - Daily hours dashboard with >45h alerts
   - Impact: Burnout risk 38% → 12%

3. **Quality Improvement Plan** (APPROUVEE)
   - Prediction: 28% audit failure risk
   - Type: REFACTORING
   - Actions:
     - Dedicated sprint for test coverage (64% → 82%)
     - 2h/day/dev for refactoring (debt 8.2% → 4.5%)
     - Mandatory SonarQube quality gate
     - 2-reviewer requirement for critical PRs
     - Automated security scanning (Snyk/Trivy)
   - Timeline: 3 sprints, 15% velocity cost
   - Outcome: PCI-DSS certification assured

### 9. Additional Invoices (6 New Invoices)

Monthly invoicing for BNP project:

| Date | Amount | Due Date | Status |
|------|--------|----------|--------|
| Jun 30, 2025 | €200,000 | Jul 30, 2025 | PAYEE |
| Jul 31, 2025 | €200,000 | Aug 31, 2025 | PAYEE |
| Aug 31, 2025 | €200,000 | Sep 30, 2025 | PAYEE |
| Sep 30, 2025 | €200,000 | Oct 30, 2025 | PAYEE |
| Oct 31, 2025 | €200,000 | Nov 30, 2025 | PAYEE |
| Nov 13, 2025 | €200,000 | Dec 13, 2025 | EN_ATTENTE |

**Total invoiced:** €1,200,000 (equals project budget)
**Paid to date:** €1,000,000
**Pending:** €200,000

### 10. Updated Health Score

**Latest Analysis:** Nov 13, 2025
- **Score:** 68/100
- **Status:** ORANGE (warning zone)
- **Risk Color:** Orange

**AI Analysis:**
- **Positives:** Strong team, engaged client, solid architecture
- **Risks:**
  - 3-week delivery delay (67% deadline risk)
  - Team overwork (52h/week average)
  - Code quality below targets (64% coverage vs 80% target)
- **Critical Incidents:** 1 resolved (secret leak), 1 ongoing (data quality)
- **Active Recommendations:** MVP redefinition, team reinforcement, quality plan
- **Next Steps:** Client sprint review Nov 15, team reinforcement decision
- **Monitoring:** Velocity, team health, critical incidents

## Expected Dataset Summary After Enhancement

### Time Tracking
- **Total Time Entries:** ~110-115 entries
- **Total Hours:** ~530-550 hours
- **Time Coverage:** June 1 - Nov 13, 2025 (5.5 months)
- **Average Hours/Week:** ~25.5h (reflecting 50% allocation on BNP project)

### Tasks
- **Total Tasks:** 16 tasks
- **Matthieu's Tasks:** 9 tasks
  - TODO: 4 tasks
  - IN_PROGRESS: 2 tasks
  - REVIEW: 2 tasks
  - DONE: 1 task
- **Task Types:** Architecture, security, data quality, deployment, pentest coordination

### Incidents
- **Total Incidents:** 9 incidents
- **By Severity:**
  - CRITIQUE: 2 (1 resolved, 1 open)
  - ELEVEE: 4 (2 resolved, 2 open)
  - MOYENNE: 3 (all resolved)
- **Matthieu's Incidents:** 3 (as reporter/coordinator)

### Deliverables
- **Total Deliverables:** 10 deliverables
- **By Status:**
  - EN_COURS: 6 deliverables
  - A_FAIRE: 4 deliverables
- **Coverage:** Frontend, backend, infrastructure, security, DR

### Financial
- **Total Invoices:** 8 invoices
- **Total Invoiced:** €1,400,000
- **Payment Rate:** 85.7% (€1,200,000 paid)

### AI-Driven Insights
- **Drift Detections:** 6 total (schedule, budget, quality, workload)
- **Risk Predictions:** 7 total (deadline, budget overrun, technical debt, burnout, security)
- **AI Recommendations:** 7 total (4 pending, 1 approved, 2 implemented)

### Projects
- **Total Projects:** 3 projects across 2 organizations
- **As Project Manager:** 2 projects (BNP, AXA)
- **As Advisor:** 1 project (EDF Smart Grid - TechConsult)
- **Total Project Value:** €2,770,000

## War Room Dashboard Scenarios

With this enhanced dataset, you can fully test these War Room scenarios:

### 1. Project Health Overview
- View project health score (68/100, ORANGE)
- See trend over time with multiple health score entries
- Understand AI reasoning for score calculation

### 2. Risk Management
- View 7 different risk predictions across multiple types
- See probability percentages and time horizons
- Review AI-generated recommendations for each risk
- Track recommendation status (pending, approved, implemented)

### 3. Incident Management
- Browse 9 incidents across severity levels
- Filter by status (open vs resolved)
- See incident timeline and resolution times
- Track incidents by responsible consultant

### 4. Drift Detection
- Monitor 6 different drift types (schedule, budget, quality, workload)
- View severity levels and measured vs expected values
- See detection dates and trends

### 5. Team Workload
- View Matthieu's time tracking: 110+ entries over 5 months
- See task distribution: 9 tasks across different statuses
- Monitor workload drift (52h/week vs 40h target)
- Analyze team capacity and burnout risk

### 6. Financial Tracking
- Monitor monthly invoicing cadence
- Track payment status and cash flow
- View budget vs actual spending
- See budget overrun risk predictions

### 7. Deliverables Progress
- Track 10 deliverables across project lifecycle
- Monitor completion dates vs targets
- See deliverable dependencies
- View schedule drift impact

### 8. Quality Metrics
- Code coverage tracking (64% current vs 80% target)
- Technical debt ratio (8.2% vs 5% limit)
- Security incident tracking
- Quality improvement recommendations

### 9. Historical Analysis
- 5+ months of historical time data
- Project evolution over multiple phases
- Trend analysis for velocity and team health
- Seasonal patterns (summer vs fall workload)

### 10. Cross-Organization Collaboration
- Matthieu as PM on Aurentia projects
- Matthieu as advisor on TechConsult crisis project
- Multi-tenant data visualization
- Inter-org collaboration patterns

## Data Quality Features

This enhancement includes:

1. **Temporal Realism**
   - Realistic date patterns (summer vacation, weekday patterns)
   - Logical sequence of events (incidents → detections → predictions → recommendations)
   - Historical invoicing aligned with project timeline

2. **Operational Realism**
   - Varied task statuses reflecting real project state
   - Incidents with realistic severities and resolutions
   - Code quality metrics matching industry patterns
   - Team workload issues common in real projects

3. **Relationship Integrity**
   - All data linked to matthieu.bousquet@epitech.eu via:
     - Direct assignment (tasks, time entries)
     - Project management role (all deliverables, incidents)
     - Consultation role (risk predictions, recommendations)
   - Proper foreign key relationships throughout

4. **Business Context**
   - Banking industry terminology and requirements
   - PCI-DSS compliance considerations
   - Realistic budget and pricing (€1.2M for modernization project)
   - Industry-standard tools (Kafka, Kubernetes, ArgoCD, Istio)

## Verification Queries

The script includes verification queries to confirm data insertion:

```sql
-- Total time entries and hours for Matthieu
SELECT COUNT(*), SUM(heures_travaillees), MIN(date), MAX(date)
FROM temps_passe
WHERE consultant_id = (SELECT id FROM consultant WHERE email = 'matthieu.bousquet@epitech.eu');

-- Task breakdown by status
SELECT statut, COUNT(*)
FROM tache
WHERE consultant_responsable_id = (SELECT id FROM consultant WHERE email = 'matthieu.bousquet@epitech.eu')
GROUP BY statut;

-- Incident summary
SELECT severite, statut, COUNT(*)
FROM incident
WHERE projet_id = '6ea4adad-4d9c-4986-a3e0-4497ee51e870'
GROUP BY severite, statut;

-- Deliverable summary
SELECT statut, COUNT(*)
FROM livrable
WHERE projet_id = '6ea4adad-4d9c-4986-a3e0-4497ee51e870'
GROUP BY statut;
```

## Next Steps

1. **Execute Enhancement Script**
   ```bash
   psql <connection_string> -f scripts/enhance-matthieu-data.sql
   ```

2. **Verify Data Insertion**
   - Run verification queries at end of script
   - Check expected counts match

3. **Test War Room Features**
   - Log in as matthieu.bousquet@epitech.eu
   - Navigate through all dashboard sections
   - Verify data visibility and correctness

4. **Frontend Testing Scenarios**
   - Project health dashboard with multi-month trend
   - Risk matrix with varied probabilities
   - Incident timeline with filters
   - Team workload heatmap
   - Financial tracking charts
   - Task board with varied statuses
   - AI recommendation prioritization

## Database Size Impact

This enhancement adds approximately:
- ~60 time entry records
- ~16 task records
- ~10 deliverable records
- ~10 time entry records (team collaboration)
- ~5 incident records
- ~3 drift detection records
- ~3 risk prediction records
- ~3 recommendation records
- ~6 invoice records
- ~2 health score records

**Total:** ~120 new records

**Storage impact:** Minimal (~50-100 KB)
