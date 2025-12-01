# Working Capital Calculator Feature - Implementation Plan

## Feature Overview

The Working Capital Calculator helps business owners optimize their working capital management (current assets minus current liabilities) to improve cash flow and business valuation. It analyzes key metrics like Days Sales Outstanding (DSO), Days Inventory Outstanding (DIO), and Days Payable Outstanding (DPO) to provide actionable recommendations.

## Business Value

**Impact on Valuation:**
- Better working capital management can improve valuation by 5-15%
- Reduces financial risk assessment
- Shows operational efficiency to potential buyers
- Improves cash flow predictability

**Key User Benefits:**
- Understand working capital position
- Identify optimization opportunities
- Calculate cash conversion cycle
- Benchmark against industry standards
- Get specific improvement recommendations

## Feature Components

### 1. Working Capital Analysis Engine
**Location:** `backend/services/workingCapitalEngine.js`

**Key Metrics to Calculate:**

1. **Days Sales Outstanding (DSO)**
   - Formula: (Accounts Receivable / Revenue) × 365
   - Measures time to collect payment from customers
   - Lower is better (faster cash collection)
   - Industry benchmarks provided

2. **Days Inventory Outstanding (DIO)**
   - Formula: (Inventory / Cost of Goods Sold) × 365
   - Measures time inventory sits before sale
   - Lower is better (faster inventory turnover)
   - Varies by industry

3. **Days Payable Outstanding (DPO)**
   - Formula: (Accounts Payable / Cost of Goods Sold) × 365
   - Measures time to pay suppliers
   - Higher is better (more favorable payment terms)
   - Must balance with supplier relationships

4. **Cash Conversion Cycle (CCC)**
   - Formula: DSO + DIO - DPO
   - Negative is ideal (company gets paid before paying suppliers)
   - Key indicator of working capital efficiency

5. **Working Capital as % of Revenue**
   - Formula: (Current Assets - Current Liabilities) / Revenue
   - Shows capital intensity of business
   - Benchmark against industry average

**Engine Outputs:**
```javascript
{
  metrics: {
    dso: { value: 45, benchmark: 40, gap: -5 },
    dio: { value: 60, benchmark: 55, gap: -5 },
    dpo: { value: 35, benchmark: 38, gap: 3 },
    ccc: { value: 70, benchmark: 57, gap: -13 },
    wcPercentage: { value: 0.12, benchmark: 0.10, gap: -0.02 }
  },
  recommendations: [
    {
      title: "Improve Collections",
      description: "...",
      impact: 150000,
      effort: "medium",
      timeline: "3-6 months"
    }
  ],
  financialImpact: {
    currentCCC: 70,
    optimizedCCC: 50,
    cashReleased: 250000,
    improvementPercent: 28.6
  },
  riskAssessment: {
    score: 65,
    grade: 'B',
    factors: {...}
  }
}
```

### 2. Backend API Routes
**Location:** `backend/routes/workingCapitalRoutes.js`

**Endpoints:**

1. **POST /api/valuations/:id/working-capital/calculate**
   - Calculate working capital metrics
   - Request body includes current/quick assets, inventory, payables, COGS, revenue
   - Returns comprehensive analysis

2. **POST /api/valuations/:id/working-capital/optimize**
   - Get optimization scenarios
   - Shows impact of improving different metrics
   - Returns multiple scenarios (conservative, moderate, aggressive)

3. **POST /api/valuations/:id/working-capital/recommendations**
   - Get actionable recommendations
   - Specific to company's gaps
   - Includes implementation timeline and effort

4. **GET /api/valuations/:id/working-capital/benchmarks**
   - Get industry benchmarks
   - Provides context for metrics
   - Shows performance vs peers

### 3. Frontend Components

#### a) WorkingCapitalForm Component
**Location:** `frontend/src/components/WorkingCapitalForm.js`

Features:
- Input form for working capital data
- Step-by-step guide for data entry
- Input validation (positive numbers, logical relationships)
- Context-specific help text
- Save progress functionality

Data to collect:
- Accounts Receivable
- Inventory
- Accounts Payable
- Cost of Goods Sold (COGS)
- Annual Revenue
- Current Assets (total)
- Current Liabilities (total)

#### b) WorkingCapitalAnalysis Component
**Location:** `frontend/src/components/WorkingCapitalAnalysis.js`

Features:
- Display calculated metrics with color coding
- Visual comparison to industry benchmarks
- Cash conversion cycle visualization (chart)
- Key findings summary
- Improvement opportunities

#### c) WorkingCapitalOptimization Component
**Location:** `frontend/src/components/WorkingCapitalOptimization.js`

Features:
- Interactive optimization scenarios
- Sliders to adjust metrics
- Real-time impact calculation
- Cash released visualization
- Recommended targets

#### d) WorkingCapitalRecommendations Component
**Location:** `frontend/src/components/WorkingCapitalRecommendations.js`

Features:
- List of prioritized recommendations
- Implementation timeline for each
- Effort level assessment
- Financial impact per recommendation
- Check off completed improvements

### 4. Styling & UI
**Location:** `frontend/src/styles/WorkingCapital.css`

Styling approach:
- Consistent with existing dashboard design
- Color-coded metrics (green for good, yellow for fair, red for concerning)
- Responsive tables for data display
- Visual indicators for benchmarks
- Chart styling (Chart.js compatible)

## Data Model

### Working Capital Input Schema
```javascript
{
  valuationId: string,
  date: ISO string,

  // Balance sheet items
  accountsReceivable: number,
  inventory: number,
  otherCurrentAssets: number,
  totalCurrentAssets: number,

  accountsPayable: number,
  otherCurrentLiabilities: number,
  totalCurrentLiabilities: number,

  // P&L items
  annualRevenue: number,
  costOfGoodsSold: number,

  // Optional context
  industry: string (from parent valuation),
  seasonalFactors: [optional notes about seasonal variations]
}
```

### Industry Benchmarks
```javascript
{
  tech: { dso: 45, dio: 30, dpo: 38, ccc: 37, wcPercentage: 0.08 },
  manufacturing: { dso: 50, dio: 65, dpo: 40, ccc: 75, wcPercentage: 0.15 },
  retail: { dso: 20, dio: 45, dpo: 35, ccc: 30, wcPercentage: 0.12 },
  healthcare: { dso: 60, dio: 25, dpo: 30, ccc: 55, wcPercentage: 0.10 },
  // ... more industries
}
```

## Implementation Phases

### Phase 1: Core Engine (Days 3, AM)
- Create workingCapitalEngine.js with metric calculations
- Build comprehensive test suite
- Add industry benchmark data
- Implement recommendation generation logic

### Phase 2: API Integration (Days 3, PM)
- Create workingCapitalRoutes.js
- Implement database schema (if needed)
- Add authentication middleware
- Create integration tests

### Phase 3: Frontend Form (Days 4, AM)
- Build WorkingCapitalForm component
- Add validation logic
- Create context/store for state management
- Style form with responsive design

### Phase 4: Frontend Analysis & Visualization (Days 4, PM)
- Build WorkingCapitalAnalysis component
- Integrate Chart.js for cash conversion cycle chart
- Build comparison tables
- Add color coding and visual indicators

### Phase 5: Integration & Testing (Days 4, Evening)
- Integrate all components into Dashboard
- End-to-end testing
- Performance optimization
- Documentation

## Testing Strategy

### Unit Tests (40+ tests)
- Metric calculations with known data
- Edge cases (zero values, negative scenarios)
- Benchmark comparisons
- Recommendation generation logic
- Data validation

### Integration Tests (25+ tests)
- API endpoint functionality
- Database operations
- Authentication checks
- Data normalization

### Component Tests (20+ tests)
- Form validation
- Input sanitization
- Component rendering
- User interactions

### E2E Tests
- Complete workflow: enter data → analyze → optimize → implement
- Verify calculations match backend
- Test recommendation implementation

## Success Criteria

- [ ] All working capital metrics calculated correctly
- [ ] Recommendations generated based on gaps
- [ ] Optimization scenarios show accurate impact
- [ ] User can enter data and see analysis within 2-3 minutes
- [ ] 90%+ test coverage
- [ ] Performance: calculations complete in <1 second
- [ ] UI responsive on mobile and desktop
- [ ] Data persists when navigating away
- [ ] Users can see impact on overall valuation

## Estimated Effort

- Backend Engine: 3 hours
- API Routes & Tests: 2 hours
- Frontend Components: 4 hours
- Styling & Integration: 1.5 hours
- Testing & Documentation: 1.5 hours

**Total: ~12 hours (Days 3-4)**

## Integration Points

### With Existing Features
1. **Dashboard Integration**
   - Add working capital card to dashboard
   - Show current CCC and key gaps
   - Link to detailed analysis

2. **Valuation Impact**
   - Working capital improvements should impact overall valuation
   - Include in suggestion improvements list
   - Show before/after valuation

3. **PDF Reports**
   - Include working capital analysis in Standard & Premium templates
   - Add metrics table to PDF
   - Include recommendations in export

### Data Flow
1. User completes wizard with base financial data
2. User can optionally fill working capital form
3. Backend calculates metrics and recommendations
4. Frontend displays analysis and optimization scenarios
5. User can mark improvements as implemented
6. Overall valuation recalculated with improved metrics
7. Report exported with working capital section

## Risk & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Complex calculations | Low | Comprehensive unit tests, formula validation |
| Data quality issues | Medium | Input validation, sanity checks, user guidance |
| Industry benchmark accuracy | Medium | Use trusted sources, allow custom benchmarks |
| UI complexity | Low | Progressive disclosure, step-by-step wizard |
| Performance with large numbers | Low | Optimize calculations, cache benchmarks |

## Nice-to-Have Features (Future)

- Upload financial data from CSV/Excel
- Historical trend analysis (multi-year comparison)
- Scenario modeling ("what-if" analysis)
- Custom benchmark creation
- Integration with accounting software APIs
- Seasonal adjustment factors
- Cash flow forecasting
- Supplier payment optimization

## Deliverables Checklist

- [ ] workingCapitalEngine.js (with 40+ tests)
- [ ] workingCapitalRoutes.js (with 25+ tests)
- [ ] Database schema (if needed)
- [ ] WorkingCapitalForm.js component
- [ ] WorkingCapitalAnalysis.js component
- [ ] WorkingCapitalOptimization.js component
- [ ] WorkingCapitalRecommendations.js component
- [ ] WorkingCapital.css styling
- [ ] Integration into Dashboard.js
- [ ] PDF template updates
- [ ] Complete documentation
- [ ] All tests passing (90%+ coverage)

---

**Ready to build?** ✅ Feature plan complete. Ready for implementation.
