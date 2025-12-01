# Week 2 - Session 2 Roadmap
## Working Capital Calculator - Complete Implementation Guide

**Estimated Duration:** 7-9 hours
**Recommended Approach:** 1 full focused day or 2 shorter sessions

---

## 📋 Implementation Checklist

### Phase 1: API Routes (2 hours)
- [ ] Task 1.1: Create workingCapitalRoutes.js with 3 endpoints
- [ ] Task 1.2: Write 25+ integration tests for API routes
- [ ] Task 1.3: Verify all tests passing
- [ ] Task 1.4: Update backend/server.js to register routes

### Phase 2: Frontend Components (5 hours)
- [ ] Task 2.1: Create WorkingCapitalForm.js component
- [ ] Task 2.2: Create WorkingCapitalAnalysis.js component
- [ ] Task 2.3: Create WorkingCapitalOptimization.js component
- [ ] Task 2.4: Create WorkingCapitalRecommendations.js component
- [ ] Task 2.5: Create WorkingCapital.css styling

### Phase 3: Integration (1.5-2 hours)
- [ ] Task 3.1: Integrate components into Dashboard
- [ ] Task 3.2: Add WC section to PDF templates
- [ ] Task 3.3: Run all tests (backend + frontend)
- [ ] Task 3.4: Achieve 90%+ overall coverage
- [ ] Task 3.5: Documentation & final review

---

## 🔧 Phase 1 Detail: API Routes (2 hours)

### Task 1.1: Create API Routes File

**File:** `backend/routes/workingCapitalRoutes.js`

**Code Template:**
```javascript
const express = require('express');
const router = express.Router();
const { analyzeWorkingCapital } = require('../services/workingCapitalEngine');
const { requireAuth } = require('../middleware/authMiddleware');

/**
 * POST /api/valuations/:id/working-capital/analyze
 * Analyze working capital for a valuation
 */
router.post('/:id/working-capital/analyze', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { accountsReceivable, inventory, accountsPayable, costOfGoodsSold, annualRevenue, totalCurrentAssets, totalCurrentLiabilities, industry } = req.body;

    // Validate inputs
    if (!accountsReceivable || !annualRevenue || !industry) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Analyze
    const analysis = analyzeWorkingCapital({
      accountsReceivable,
      inventory,
      accountsPayable,
      costOfGoodsSold,
      annualRevenue,
      totalCurrentAssets,
      totalCurrentLiabilities,
      industry
    });

    // Save to database (if needed)
    // await db.run(...)

    res.json(analysis);
  } catch (error) {
    console.error('WC analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze working capital' });
  }
});

/**
 * GET /api/valuations/:id/working-capital/benchmarks
 * Get industry benchmarks
 */
router.get('/:id/working-capital/benchmarks', requireAuth, async (req, res) => {
  try {
    const { industry } = req.query;
    const { getBenchmarks } = require('../services/workingCapitalEngine');

    const benchmarks = getBenchmarks(industry);
    res.json(benchmarks);
  } catch (error) {
    console.error('Benchmark error:', error);
    res.status(500).json({ error: 'Failed to get benchmarks' });
  }
});

module.exports = router;
```

**Time:** ~30 minutes

### Task 1.2: Write API Tests

**File:** `backend/routes/workingCapitalRoutes.test.js`

**Test Structure:**
- Test analyze endpoint with valid data
- Test with missing required fields
- Test authorization (requireAuth)
- Test error handling
- Test benchmarks endpoint
- Test data validation
- 25+ total tests

**Time:** ~1 hour (follow pattern from reportRoutes.test.js)

### Task 1.3: Register Routes in Server

**File:** `backend/server.js`

**Add Before Error Handlers:**
```javascript
const workingCapitalRoutes = require('./routes/workingCapitalRoutes');
app.use('/api/valuations', workingCapitalRoutes);
```

**Time:** ~5 minutes

### Task 1.4: Verify & Test

```bash
# Run all backend tests
npm test

# Should see:
# - workingCapitalEngine.test.js: 66 passing
# - workingCapitalRoutes.test.js: 25+ passing
# - All other tests still passing
```

**Time:** ~15 minutes

---

## 🎨 Phase 2 Detail: Frontend Components (5 hours)

### Task 2.1: WorkingCapitalForm Component

**File:** `frontend/src/components/WorkingCapitalForm.js`

**Purpose:** Guided form for entering working capital data

**Key Features:**
- Stepper/wizard UI (4-5 steps)
- Real-time validation
- Inline help text
- Save progress
- Submit to API

**Structure:**
```javascript
// Step 1: Basic Company Info
// Step 2: Current Assets
// Step 3: Current Liabilities & COGS
// Step 4: Annual Revenue & Industry
// Step 5: Review & Submit
```

**Estimated Lines:** 180-200
**Time:** 1.5-2 hours

### Task 2.2: WorkingCapitalAnalysis Component

**File:** `frontend/src/components/WorkingCapitalAnalysis.js`

**Purpose:** Display metrics vs industry benchmarks

**Features:**
- Metrics display with values
- Benchmark comparison
- Color coding (green/yellow/red)
- Gap visualization
- Summary cards
- Key findings

**Structure:**
```javascript
// Display DSO, DIO, DPO, CCC, WC%
// Show benchmark for each
// Show gap (positive/negative)
// Color indicators
// Text summary of findings
```

**Estimated Lines:** 200-250
**Time:** 1.5-2 hours

### Task 2.3: WorkingCapitalOptimization Component

**File:** `frontend/src/components/WorkingCapitalOptimization.js`

**Purpose:** Interactive scenario modeling

**Features:**
- Sliders for metric adjustment
- Real-time impact calculation
- Before/after comparison
- Cash released visualization
- Multiple scenarios (conservative/moderate/aggressive)
- Estimated valuation lift

**Structure:**
```javascript
// Show current metrics
// Sliders to adjust each metric
// Calculate impact in real-time
// Show cash released
// Show new CCC
// Show valuation impact
```

**Estimated Lines:** 180-200
**Time:** 1.5-2 hours

### Task 2.4: WorkingCapitalRecommendations Component

**File:** `frontend/src/components/WorkingCapitalRecommendations.js`

**Purpose:** Display actionable recommendations

**Features:**
- List of prioritized recommendations
- Priority badges (high/medium/low)
- Effort level indicators
- Timeline for implementation
- Financial impact display
- Checkbox to mark as "implementing"
- Group by category (collections, inventory, payables)

**Structure:**
```javascript
// Filter recommendations by priority
// Sort by impact
// Group by category
// Display with impact amount
// Allow user to implement
```

**Estimated Lines:** 150-200
**Time:** 1-1.5 hours

### Task 2.5: Create Styling

**File:** `frontend/src/styles/WorkingCapital.css`

**Styling Areas:**
- Form styling & layout
- Analysis card styling
- Benchmark comparison tables
- Color coding (green/yellow/red)
- Slider styling
- Recommendation cards
- Responsive design

**Estimated Lines:** 300-400
**Time:** 1-1.5 hours

---

## 🔌 Phase 3 Detail: Integration (1.5-2 hours)

### Task 3.1: Dashboard Integration

**File:** `frontend/src/components/Dashboard.js`

**Changes:**
1. Import WorkingCapitalForm, Analysis, Optimization, Recommendations
2. Add new section in dashboard
3. Add state for WC data
4. Add API call to fetch/analyze WC data
5. Pass data to components

**Code Pattern:**
```javascript
import WorkingCapitalForm from './WorkingCapitalForm';
import WorkingCapitalAnalysis from './WorkingCapitalAnalysis';

// In JSX:
<section className="dashboard-section">
  <h3>Working Capital Analysis</h3>
  <WorkingCapitalForm valuationId={valuationId} onAnalyze={handleWCAnalysis} />
  {wcAnalysis && <WorkingCapitalAnalysis analysis={wcAnalysis} />}
  {wcAnalysis && <WorkingCapitalRecommendations recommendations={wcAnalysis.recommendations} />}
</section>
```

**Time:** ~30-45 minutes

### Task 3.2: PDF Template Updates

**Files:** `backend/templates/standard-report.html`, `premium-report.html`

**Add to Standard Template:**
- Working capital metrics section
- Key metrics table (DSO, DIO, DPO, CCC)
- Benchmark comparison
- Top 3 recommendations

**Add to Premium Template:**
- Full working capital analysis
- All metrics with detailed explanations
- Optimization opportunities
- All recommendations
- Action plan

**Time:** ~30 minutes

### Task 3.3: Run All Tests

```bash
# Run all tests with coverage
npm test -- --coverage

# Should show:
# - workingCapitalEngine.test.js: 66 passing
# - workingCapitalRoutes.test.js: 25+ passing
# - Component tests: 20+ passing (if written)
# - Total: 110+ tests passing
```

**Time:** ~15 minutes

### Task 3.4: Achieve 90%+ Coverage

**Target Coverage:**
- Statements: >90%
- Branches: >85%
- Functions: >90%
- Lines: >90%

**If Coverage Low:**
1. Identify uncovered lines (jest coverage report)
2. Write additional tests
3. Re-run coverage
4. Repeat until target reached

**Time:** ~30 minutes

### Task 3.5: Final Documentation

**Create:** `WORKING_CAPITAL_COMPLETE.md`

**Include:**
- Feature summary
- How to use
- API endpoints
- Component props
- Example data
- Testing instructions
- Known limitations
- Future enhancements

**Time:** ~30 minutes

---

## 📊 Session Timeline Example

### Option A: Single 8-Hour Day
```
09:00 - 10:30  Phase 1: API Routes (1.5h)
10:30 - 10:45  Break (15 min)
10:45 - 12:30  Phase 2a: WorkingCapitalForm + Analysis (1.75h)
12:30 - 13:15  Lunch (45 min)
13:15 - 15:00  Phase 2b: Optimization + Recommendations (1.75h)
15:00 - 15:15  Break (15 min)
15:15 - 16:15  Phase 2c: Styling (1h)
16:15 - 17:00  Phase 3: Integration & Testing (45 min)
17:00 - 17:30  Buffer & final fixes (30 min)
```

### Option B: Two 4-Hour Sessions
```
Session 2A (Day 1):
- Phase 1: API Routes (2h)
- Phase 2a: Form & Analysis (2h)

Session 2B (Day 2):
- Phase 2b: Optimization & Recommendations (1.5h)
- Phase 2c: Styling (1h)
- Phase 3: Integration (1.5h)
```

---

## 🚨 Common Pitfalls to Avoid

1. **Incomplete Input Validation** - Frontend should validate before sending to API
2. **Missing Error Handling** - Add try/catch to all async operations
3. **Hardcoded Values** - Use props/state instead of hardcoding
4. **Inconsistent Styling** - Follow existing design system (dashboard.css)
5. **Missing Tests** - Write tests as you build components
6. **Incomplete Props Passing** - Document expected props in each component
7. **API Integration Issues** - Test API routes before building components
8. **Responsive Design** - Test on mobile, tablet, desktop

---

## ✅ Verification Checklist

Before considering the feature "done":

### Backend
- [ ] All 66 engine tests passing
- [ ] All 25+ API route tests passing
- [ ] Server starts without errors
- [ ] API endpoints respond correctly
- [ ] Authentication working properly

### Frontend
- [ ] Form collects all required data
- [ ] Analysis displays metrics correctly
- [ ] Optimization shows real-time impact
- [ ] Recommendations are prioritized properly
- [ ] Styling looks professional
- [ ] Responsive on mobile/tablet/desktop

### Integration
- [ ] Works with existing Dashboard
- [ ] Data persists between sessions
- [ ] PDF exports include WC section
- [ ] Overall test coverage >90%
- [ ] No console errors

### Documentation
- [ ] API endpoints documented
- [ ] Component props documented
- [ ] Usage examples provided
- [ ] Known limitations listed
- [ ] Future enhancements noted

---

## 🎯 Success Criteria

The feature is **complete when:**

1. ✅ All backend tests passing (66 + 25+)
2. ✅ All frontend tests passing (20+)
3. ✅ Components render without errors
4. ✅ Form submits data to API successfully
5. ✅ Analysis displays correctly
6. ✅ Optimization scenarios work
7. ✅ Recommendations show proper priority
8. ✅ Styling is consistent & responsive
9. ✅ Overall test coverage >90%
10. ✅ Feature documented & user-ready

---

## 💡 Tips for Success

1. **Start with API routes** - Backend first, then test with frontend
2. **Use the templates** - Reference reportRoutes.js for patterns
3. **Test frequently** - Run tests after each component
4. **Keep components focused** - Each component has one responsibility
5. **Document as you go** - Makes final documentation easier
6. **Review existing styles** - Match Dashboard.css color scheme
7. **Use sample data** - Create test data for each component
8. **Iterate on UI** - Get feedback on component layouts
9. **Performance matters** - Don't do unnecessary re-renders
10. **Mobile first** - Design for small screens, scale up

---

## 🚀 Ready to Start?

When you begin Session 2:

1. Start with Task 1.1 (API Routes)
2. Use this roadmap to track progress
3. Update todo list as you complete tasks
4. Run tests after each major component
5. Keep documentation updated

**Estimated Completion Time:** 7-9 hours
**Recommended Approach:** Single focused day

Good luck! You've got this! 💪

---

## Quick Reference Links

- Engine Implementation: ✅ Done (`backend/services/workingCapitalEngine.js`)
- Engine Tests: ✅ Done (`backend/services/workingCapitalEngine.test.js`)
- Feature Plan: `WORKING_CAPITAL_PLAN.md`
- Session 1 Summary: `WEEK2_SESSION1_SUMMARY.md`
- PDF Export (reference): `PDF_EXPORT_IMPLEMENTATION.md`

---

**Last Updated:** Session 1 Complete
**Next Update:** After Session 2 Completion
