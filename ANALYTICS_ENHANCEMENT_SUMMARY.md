# Analytics Overview Enhancement Summary

**Date:** 2025-11-14
**Status:** ✅ Complete

## Overview

Enhanced the Analytics Overview page to provide more accurate and comprehensive real-time data across all six top metrics. The enhancements focus on better data calculation, improved edge case handling, and intelligent risk detection.

## Enhancements Made

### 1. **Projects at Risk** - Enhanced Risk Detection ⚠️

Previously, only projects with health scores < 60 were considered "at risk". Now the metric includes:

#### Multiple Risk Criteria:
1. **Health Score Risk**: Projects with global health score < 60
2. **Deadline Risk - Overdue**: Active projects past their deadline
3. **Deadline Risk - Approaching**: Active projects with deadline within 7 days

#### Implementation:
```typescript
// Smart deduplication with Set to avoid counting projects multiple times
const atRiskProjectIds = new Set<string>()

// Add projects with low health scores (< 60)
lowScoreProjects?.forEach(p => atRiskProjectIds.add(p.projet_id))

// Add projects past deadline
// Add projects with deadline approaching (within 7 days)
deadlineProjects?.forEach(p => {
  if (p.date_fin_prevue && p.date_fin_prevue < today) {
    atRiskProjectIds.add(p.id)
  }
  else if (p.date_fin_prevue && p.date_fin_prevue <= weekFromNow && p.date_fin_prevue >= today) {
    atRiskProjectIds.add(p.id)
  }
})
```

**Benefit**: More proactive risk detection that catches projects before they become critical issues.

### 2. **Revenue Calculations** - Improved Data Handling 💰

Enhanced revenue calculation to handle various data types and edge cases:

#### Before:
```typescript
const totalRevenue = invoices?.reduce((sum, inv) => {
  return sum + (parseFloat(inv.montant as string) || 0)
}, 0) || 0
```

#### After:
```typescript
const totalRevenue = invoices?.reduce((sum, inv) => {
  const amount = typeof inv.montant === 'number'
    ? inv.montant
    : parseFloat(String(inv.montant || 0))
  return sum + (isNaN(amount) ? 0 : amount)
}, 0) || 0
```

**Improvements**:
- Handles both numeric and string invoice amounts
- Proper NaN detection prevents calculation errors
- Explicit null/undefined handling
- Consistent for both `totalRevenue` and `paidRevenue`

### 3. **Cost Calculations** - Better Accuracy 📊

Enhanced cost calculation with improved edge case handling:

#### Key Improvements:
```typescript
const totalCosts = timeEntries?.reduce((sum, entry) => {
  const hours = typeof entry.heures_travaillees === 'number'
    ? entry.heures_travaillees
    : parseFloat(String(entry.heures_travaillees || 0))

  // Skip invalid entries early
  if (isNaN(hours) || hours <= 0) return sum

  // Handle consultant rate safely
  const dailyRateValue = consultantDetails?.taux_journalier_cout
  const dailyRate = typeof dailyRateValue === 'number'
    ? dailyRateValue
    : parseFloat(String(dailyRateValue || 0))

  if (isNaN(dailyRate) || dailyRate <= 0) return sum

  const hourlyRate = dailyRate / 8 // 8-hour work day
  return sum + (hours * hourlyRate)
}, 0) || 0
```

**Benefits**:
- Early exit for invalid entries (performance improvement)
- Zero-hour entries are properly skipped
- Missing consultant rate doesn't break calculation
- More accurate cost tracking

### 4. **Hours Worked** - Robust Calculation ⏱️

Consistent type handling for hours tracking:

```typescript
const hoursWorked = timeEntries?.reduce((sum, entry) => {
  const hours = typeof entry.heures_travaillees === 'number'
    ? entry.heures_travaillees
    : parseFloat(String(entry.heures_travaillees || 0))
  return sum + (isNaN(hours) ? 0 : hours)
}, 0) || 0
```

**Benefits**:
- Consistent with cost calculation logic
- Handles various data types from database
- NaN-safe aggregation

## Metrics Summary

### All Six Cards Now Display:

1. **Total Revenue** ✅ - Sum of all invoice amounts
   - Improved: Better type handling and NaN protection

2. **Profit Margin** ✅ - (Paid Revenue - Total Costs) / Paid Revenue × 100
   - Uses paid revenue for more conservative calculation
   - Based on improved revenue and cost calculations

3. **Hours Worked** ✅ - Total tracked time across all consultants
   - Improved: Robust type handling

4. **Active Consultants** ✅ - Count of consultants with status AVAILABLE or ON_MISSION
   - Already working correctly

5. **Projects at Risk** ✅ ⭐ - Enhanced with deadline considerations
   - Now includes: low health scores + past deadlines + approaching deadlines

6. **Total Costs** ✅ - Calculated from time entries and consultant rates
   - Improved: Better edge case handling and early exit optimization

## Technical Details

### Database Queries Used:

| Metric | Table(s) | Key Filters |
|--------|----------|-------------|
| Revenue | `facture` | `organization_id IN (user's orgs)` |
| Costs | `temps_passe` + `consultant_details` | `organization_id IN (user's orgs)` |
| Hours | `temps_passe` | `organization_id IN (user's orgs)` |
| Consultants | `consultant_details` | `statut IN ('AVAILABLE', 'ON_MISSION')` + org filter |
| At Risk (Health) | `score_sante_projet` | `score_global < 60` + org filter |
| At Risk (Deadline) | `projet` | `statut = 'ACTIF'` + `date_fin_prevue` checks + org filter |

### Performance Considerations:

- **Parallel Queries**: All metrics fetch data concurrently
- **Early Exit**: Invalid entries are skipped early in reduce operations
- **Set Deduplication**: Efficient project risk deduplication using Set
- **Organization Filtering**: All queries respect multi-tenancy

## Testing

The analytics endpoint can be tested at: `/api/analytics/overview`

Expected Response:
```json
{
  "stats": {
    "totalRevenue": 150000,
    "paidRevenue": 120000,
    "totalCosts": 80000,
    "margin": 33.3,
    "hoursWorked": 1250.5,
    "activeConsultants": 15,
    "projectsAtRisk": 3
  }
}
```

## Files Modified

- `app/api/analytics/overview/route.ts` - Enhanced analytics calculation logic

## Files Referenced (for context)

- `app/app/analytics/page.tsx` - Analytics page (client component)
- `components/analytics/project-health-card.tsx` - Project health visualization
- `ARCHITECTURE.md` - Database schema reference

## Breaking Changes

✅ **None** - All changes are backward compatible

## Future Enhancements (Potential)

1. **Caching**: Add Redis caching for expensive calculations
2. **Real-time Updates**: WebSocket integration for live metrics
3. **Historical Trends**: Track metrics over time for trend analysis
4. **Alerts**: Automatic notifications when metrics cross thresholds
5. **Custom Thresholds**: Allow users to configure risk thresholds
6. **Export Functionality**: CSV/PDF export of analytics data
7. **Comparative Analytics**: Compare current vs previous periods
8. **Predictive Analytics**: ML-based forecasting of future metrics

## Notes

- All calculations respect multi-tenant organization boundaries
- Margin is calculated on **paid revenue** (not total revenue) for conservative accounting
- 8-hour work day assumption for hourly rate calculation
- 7-day window for "approaching deadline" detection
- Health score threshold of 60 is consistent with project health card logic
