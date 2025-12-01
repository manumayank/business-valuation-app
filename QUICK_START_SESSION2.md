# Quick Start Guide - Session 2
## Working Capital Calculator - Complete Implementation

**Status:** Backend complete, ready for frontend
**Estimated Time:** 7-9 hours
**Priority:** Complete before dealing analysis

---

## 🚀 What's Already Done

### Backend ✅
- `backend/services/workingCapitalEngine.js` - 591 lines, fully implemented
- `backend/services/workingCapitalEngine.test.js` - 66 tests, 99% coverage, ALL PASSING
- Industry benchmarks for 7 sectors
- 6+ recommendation types
- Risk assessment (4-factor scoring)
- Full input validation

### Tests ✅
```
✅ 66 tests passing
✅ 99% statement coverage
✅ 92.75% branch coverage
✅ All edge cases covered
```

---

## ⏭️ What Needs to Be Done (Session 2)

### Phase 1: API Routes (2 hours)
```bash
# File: backend/routes/workingCapitalRoutes.js
# Endpoints:
POST /api/valuations/:id/working-capital/analyze
GET /api/valuations/:id/working-capital/benchmarks

# Tests: 25+ tests in workingCapitalRoutes.test.js
```

### Phase 2: Frontend Components (5 hours)
```bash
# Create 4 components:
frontend/src/components/WorkingCapitalForm.js (180 lines)
frontend/src/components/WorkingCapitalAnalysis.js (200 lines)
frontend/src/components/WorkingCapitalOptimization.js (180 lines)
frontend/src/components/WorkingCapitalRecommendations.js (150 lines)

# Create styling:
frontend/src/styles/WorkingCapital.css (300-400 lines)
```

### Phase 3: Integration (1.5-2 hours)
```bash
# Update: frontend/src/components/Dashboard.js
# Update: backend/templates/standard-report.html
# Update: backend/templates/premium-report.html
# Update: backend/server.js (register routes)

# Final: Run tests, achieve 90%+ coverage
```

---

## 📋 Implementation Checklist for Session 2

### Before Starting
- [ ] Read WEEK2_SESSION1_SUMMARY.md
- [ ] Review WEEK2_SESSION2_ROADMAP.md
- [ ] Check workingCapitalEngine.js implementation
- [ ] Review passing tests

### During Session
- [ ] Build API routes (Task 1.1-1.4)
- [ ] Build frontend components (Task 2.1-2.4)
- [ ] Create styling (Task 2.5)
- [ ] Integrate with Dashboard (Task 3.1)
- [ ] Update PDF templates (Task 3.2)
- [ ] Run all tests (Task 3.3)

### After Session
- [ ] Verify 90%+ test coverage
- [ ] Document complete feature
- [ ] Review for next feature (Deal Analysis)

---

## 🎯 Key Code Snippets to Use

### API Route Template
```javascript
// backend/routes/workingCapitalRoutes.js
const { analyzeWorkingCapital } = require('../services/workingCapitalEngine');

router.post('/:id/working-capital/analyze', requireAuth, async (req, res) => {
  const analysis = analyzeWorkingCapital(req.body);
  res.json(analysis);
});
```

### Component Template
```javascript
// frontend/src/components/WorkingCapitalForm.js
import { useState } from 'react';

export default function WorkingCapitalForm({ valuationId, onAnalyze }) {
  const [data, setData] = useState({...});

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch(`/api/valuations/${valuationId}/working-capital/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    const analysis = await response.json();
    onAnalyze(analysis);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit">Analyze Working Capital</button>
    </form>
  );
}
```

### Dashboard Integration
```javascript
// frontend/src/components/Dashboard.js
import WorkingCapitalForm from './WorkingCapitalForm';
import WorkingCapitalAnalysis from './WorkingCapitalAnalysis';

// In component:
const [wcAnalysis, setWcAnalysis] = useState(null);

<section className="dashboard-section">
  <h3>Working Capital Analysis</h3>
  <WorkingCapitalForm valuationId={valuationId} onAnalyze={setWcAnalysis} />
  {wcAnalysis && <WorkingCapitalAnalysis analysis={wcAnalysis} />}
</section>
```

---

## 🧪 Testing Quick Reference

### Run Tests
```bash
# All tests
npm test

# Specific test file
npm test -- workingCapitalEngine.test.js
npm test -- workingCapitalRoutes.test.js

# With coverage
npm test -- --coverage
```

### Expected Results
```
Working Capital Engine Tests:
✅ 66 passing
✅ 99% coverage

Working Capital Routes Tests:
✅ 25+ passing (build in Session 2)

Overall:
✅ 165+ total tests passing
✅ 90%+ overall coverage
```

---

## 📁 Files to Create/Modify in Session 2

### Create (New Files)
- [ ] `backend/routes/workingCapitalRoutes.js`
- [ ] `backend/routes/workingCapitalRoutes.test.js`
- [ ] `frontend/src/components/WorkingCapitalForm.js`
- [ ] `frontend/src/components/WorkingCapitalAnalysis.js`
- [ ] `frontend/src/components/WorkingCapitalOptimization.js`
- [ ] `frontend/src/components/WorkingCapitalRecommendations.js`
- [ ] `frontend/src/styles/WorkingCapital.css`

### Modify (Existing Files)
- [ ] `backend/server.js` (register routes)
- [ ] `frontend/src/components/Dashboard.js` (import & integrate)
- [ ] `backend/templates/standard-report.html` (add WC section)
- [ ] `backend/templates/premium-report.html` (add WC section)

---

## ⚡ Quick Commands

```bash
# Install dependencies (already done)
npm install

# Run backend server
cd backend && npm run dev

# Run frontend
cd frontend && npm start

# Run all tests
npm test

# Run specific tests
npm test -- workingCapitalEngine.test.js

# Check coverage
npm test -- --coverage

# Build for production (later)
npm run build
```

---

## 🎨 Styling Reference

### Color Scheme (Match Existing)
```css
/* From Dashboard.css */
--primary-blue: #0066cc;
--success-green: #2e7d32;
--warning-yellow: #f57c00;
--error-red: #c81e1e;
--light-bg: #f8f9fa;
--card-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
```

### Component Layout
```
WorkingCapitalForm
├── Step 1: Basic Info
├── Step 2: Assets
├── Step 3: Liabilities
├── Step 4: Revenue/Industry
└── Step 5: Review

WorkingCapitalAnalysis
├── Metrics Grid (DSO, DIO, DPO, CCC, WC%)
├── Benchmark Comparison
└── Summary Cards

WorkingCapitalOptimization
├── Current Metrics
├── Adjustment Sliders
├── Impact Visualization
└── Scenarios

WorkingCapitalRecommendations
├── Filtered by Priority
├── Grouped by Category
└── Action Items
```

---

## 🚨 Common Issues & Solutions

### Issue: Tests Fail After Changes
**Solution:** Run `npm test` after each component to catch issues early

### Issue: API Route Not Found
**Solution:** Check that routes are registered in `server.js` with `app.use('/api/valuations', workingCapitalRoutes)`

### Issue: Component Props Not Passing
**Solution:** Add prop validation and document expected props in component comments

### Issue: Styling Not Applying
**Solution:** Check import path and CSS class names match JSX className props

### Issue: API Authorization Fails
**Solution:** Ensure `requireAuth` middleware is applied and token is being sent in headers

---

## 📊 Progress Tracking

### Session 2 Milestones
```
Hour 1-2:   API Routes ✓
Hour 2-4:   Form + Analysis Components ✓
Hour 4-6:   Optimization + Recommendations ✓
Hour 6-7:   Styling ✓
Hour 7-9:   Integration + Testing ✓
```

### Coverage Targets
```
After Phase 1: 99% (engine already done)
After Phase 2: ~85% (add component tests)
After Phase 3: 90%+ (integration tests)
```

---

## 💡 Pro Tips

1. **Start with API first** - Test backend before building UI
2. **Use sample data** - Create test inputs for each component
3. **Test frequently** - Run tests after each major change
4. **Mobile first** - Design for small screens, expand up
5. **Reuse styles** - Match existing Dashboard.css patterns
6. **Document props** - Comment expected props for each component
7. **Keep it simple** - Each component should have one responsibility
8. **Error handling** - Add try/catch to all async operations

---

## 📚 Reference Documents

### For Implementation Details
- `WORKING_CAPITAL_PLAN.md` - Full feature specification
- `WEEK2_SESSION2_ROADMAP.md` - Step-by-step guide
- `WEEK2_SESSION1_SUMMARY.md` - What's been done

### For Code Patterns
- `backend/routes/reportRoutes.js` - API route example
- `frontend/src/components/ExportReport.js` - Component example
- `backend/services/pdfGenerator.test.js` - Test pattern

### For Context
- `PROJECT_STATUS_OVERVIEW.md` - Full project status
- `CLAUDE.md` - Project requirements & architecture

---

## 🎯 Success = When This is Done

When Session 2 is complete:
- ✅ 3 API endpoints working
- ✅ 4 frontend components rendering
- ✅ Form inputs working
- ✅ Analysis displaying correctly
- ✅ Optimization showing impact
- ✅ Recommendations prioritized
- ✅ Styling responsive
- ✅ Dashboard integration complete
- ✅ 90%+ test coverage
- ✅ 165+ tests passing
- ✅ PDF includes WC section
- ✅ Ready for Deal Analysis feature

---

## 🚀 Ready to Start?

1. Open this file when starting Session 2
2. Follow the checklist
3. Reference the quick code snippets
4. Use the session roadmap for detailed steps
5. Run tests frequently
6. Update checklist as you progress

**You've got this!** 💪

The backend is solid, tests are passing, and everything is ready for the frontend.

---

**Last Updated:** November 17, 2024
**Next Update:** After Session 2 Completion
**Estimated Session 2 Start:** TBD (Your Choice)

Good luck! 🚀
