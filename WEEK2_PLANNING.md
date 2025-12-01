# Week 2 Planning - Advanced Features

**Total Estimated Time**: 36 hours
**Target Completion**: End of Week 2

---

## Overview

Week 2 focuses on three high-value features that significantly increase the application's capability and monetization potential:

1. **PDF Report Generation** (14 hours) - Export valuations as professional PDFs
2. **Working Capital Calculator** (10 hours) - Additional financial analysis capability
3. **Deal Analysis Module** (12 hours) - Offer/acquisition analysis

---

## Feature 1: PDF Report Generation

### Business Value
- **High**: Core monetization feature, required for investor presentations
- **User Demand**: Essential for sharing results with stakeholders
- **Competitive Advantage**: Professional branding/customization

### Requirements

#### 1.1 Report Templates (3 different versions)

**Lite Report** (Free tier)
- Headline valuation
- Key financial metrics
- Risk grade
- Top 3 value drivers
- Top 3 improvement suggestions
- Basic company branding

**Standard Report** (Paid tier)
- Everything in Lite +
- All value drivers with impact amounts
- Complete performance gaps analysis
- Full improvement recommendations with priorities
- Valuation method breakdown
- Industry benchmark comparison
- 5-page report

**Premium Report** (Enterprise tier)
- Everything in Standard +
- Executive summary
- Detailed risk analysis with category breakdown
- Industry benchmarking charts/visuals
- Improvement ROI estimates
- Comparable company analysis
- Professional graphics/charts
- 10-15 page report

#### 1.2 Technical Implementation

**Backend Requirements:**
- HTML template system (one for each report type)
- PDF generation library (Puppeteer or similar)
- API endpoint: `POST /api/valuations/:id/export-pdf`
- Report generation service
- Styled HTML rendering

**Frontend Requirements:**
- "Export Report" button on dashboard
- Report type selector (Lite/Standard/Premium)
- Download dialog
- Loading indicator during generation
- Email report option (future)

**Database Changes:**
- Track report generation history
- Store report preferences per user
- Audit log for report exports

### Implementation Details

#### Backend Structure
```
backend/
├── services/
│   └── pdfGenerator.js (new)
│       ├── generateReport(valuation, template, options)
│       ├── renderHTML(template, data)
│       └── htmlToPDF(html)
├── templates/
│   ├── lite-report.html (new)
│   ├── standard-report.html (new)
│   └── premium-report.html (new)
├── routes/
│   └── reportRoutes.js (new)
│       └── POST /api/valuations/:id/export-pdf
└── middleware/
    └── pdfMiddleware.js (new - caching, compression)
```

#### Dependencies to Add
```json
{
  "puppeteer": "^19.0.0",     // HTML to PDF
  "handlebars": "^4.7.7",      // Template engine
  "html-formatter": "^1.3.0",  // HTML formatting
  "sharp": "^0.32.0"           // Image optimization
}
```

#### API Endpoint Specification

**Request:**
```javascript
POST /api/valuations/:id/export-pdf
Content-Type: application/json
Authorization: Bearer {token}

{
  "template": "standard",  // lite | standard | premium
  "companyLogo": "base64_string",  // optional
  "customBranding": {
    "colors": {
      "primary": "#0066cc",
      "accent": "#ff6600"
    },
    "fontFamily": "Arial"
  }
}
```

**Response:**
```javascript
Status: 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="valuation-2025-11-17.pdf"

[Binary PDF data]
```

#### HTML Template Structure

```html
<!-- lite-report.html -->
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Professional CSS for PDF */
    body { font-family: Arial, sans-serif; }
    .header { border-bottom: 2px solid #0066cc; }
    .valuation-box { background: #f5f5f5; padding: 20px; }
    .metric { display: inline-block; width: 48%; }
    .chart { page-break-inside: avoid; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Business Valuation Report</h1>
    <p>{{companyName}} - {{calculationDate}}</p>
  </div>

  <div class="valuation-box">
    <h2>{{recommendedValuation}}</h2>
    <p>Recommended Business Valuation</p>
  </div>

  <div class="metrics">
    {{#each metrics}}
      <div class="metric">
        <strong>{{this.label}}</strong>
        <p>{{this.value}}</p>
      </div>
    {{/each}}
  </div>

  <div class="drivers">
    <h3>Value Drivers</h3>
    {{#each drivers}}
      <div class="driver">{{this.description}}</div>
    {{/each}}
  </div>
</body>
</html>
```

### Testing Strategy

**Unit Tests:**
- Template rendering with different data
- HTML generation
- PDF conversion
- Error handling

**Integration Tests:**
- Full export flow
- File download
- Report contains correct data

**Manual Tests:**
- PDF quality and formatting
- Mobile-friendly rendering
- Chart display
- Logo insertion

### Success Criteria

✅ All three report templates render correctly
✅ PDF file downloads without corruption
✅ Report contains accurate data from valuation
✅ File size < 2MB for standard report
✅ Generation time < 3 seconds
✅ Works on all browsers

---

## Feature 2: Working Capital Calculator

### Business Value
- **Medium**: Adds analytical depth to platform
- **User Demand**: Common financial metric for business owners
- **Differentiation**: Few competitors calculate working capital

### Requirements

#### 2.1 Data Collection

**New Input Fields:**
```javascript
{
  // Current Assets
  cash: number,
  accountsReceivable: number,
  inventory: number,
  prepaidExpenses: number,

  // Current Liabilities
  accountsPayable: number,
  shortTermDebt: number,
  accruedExpenses: number,

  // Additional Metrics
  operatingCycleDays: number,  // Days to convert inventory back to cash
  paymentTermsDays: number,    // Days to pay suppliers
  collectionDays: number       // Days to collect from customers
}
```

#### 2.2 Calculations

**Working Capital (WC) Formula:**
```
WC = Current Assets - Current Liabilities
WC = (Cash + AR + Inventory + Prepaid) - (AP + ST Debt + Accrued)
```

**Key Metrics:**
```
Current Ratio = Current Assets / Current Liabilities
  Goal: 1.5 - 2.0 (indicates liquidity health)

Quick Ratio = (CA - Inventory) / CL
  Goal: 1.0+ (stricter liquidity measure)

Operating Cycle = Days Inventory Outstanding + Days Sales Outstanding
  Lower = Better (faster cash conversion)

Cash Conversion Cycle = Operating Cycle - Days Payable Outstanding
  Goal: 0 or negative (ideally get paid before paying suppliers)
```

**Impact on Valuation:**
- High WC requirement = Lower valuation (more cash tied up)
- Negative CCC = Higher valuation (efficient cash flow)
- Strong current ratio = Reduces risk score

### Implementation Details

#### Backend Structure
```
backend/
├── services/
│   └── workingCapitalService.js (new)
│       ├── calculateWorkingCapital(inputs)
│       ├── calculateCurrentRatio(inputs)
│       ├── calculateOperatingCycle(inputs)
│       ├── calculateCCC(inputs)
│       └── assessWCHealth(metrics)
├── routes/
│   └── workingCapitalRoutes.js (new)
│       ├── POST /api/valuations/:id/working-capital
│       ├── GET /api/valuations/:id/working-capital
│       └── PUT /api/valuations/:id/working-capital
└── models/
    └── workingCapitalData.js (new)
```

#### Database Schema

```sql
CREATE TABLE working_capital_data (
  id UUID PRIMARY KEY,
  valuation_id UUID NOT NULL REFERENCES valuations(id),

  -- Current Assets
  cash DECIMAL,
  accounts_receivable DECIMAL,
  inventory DECIMAL,
  prepaid_expenses DECIMAL,

  -- Current Liabilities
  accounts_payable DECIMAL,
  short_term_debt DECIMAL,
  accrued_expenses DECIMAL,

  -- Metrics
  operating_cycle_days INTEGER,
  payment_terms_days INTEGER,
  collection_days INTEGER,

  -- Calculated Values
  working_capital DECIMAL,
  current_ratio DECIMAL,
  quick_ratio DECIMAL,
  cash_conversion_cycle INTEGER,

  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### Frontend Form Structure

```javascript
// New component: WorkingCapitalCalculator.js
<form>
  <section>
    <h3>Current Assets</h3>
    <input type="number" label="Cash" />
    <input type="number" label="Accounts Receivable" />
    <input type="number" label="Inventory" />
    <input type="number" label="Prepaid Expenses" />
  </section>

  <section>
    <h3>Current Liabilities</h3>
    <input type="number" label="Accounts Payable" />
    <input type="number" label="Short-Term Debt" />
    <input type="number" label="Accrued Expenses" />
  </section>

  <section>
    <h3>Operating Metrics</h3>
    <input type="number" label="Days in Operating Cycle" />
    <input type="number" label="Payment Terms (Days)" />
    <input type="number" label="Collection Period (Days)" />
  </section>

  <button>Calculate</button>
</form>

// Results Display
<div>
  <MetricCard label="Working Capital" value={wc} status="good|warning|bad" />
  <MetricCard label="Current Ratio" value={cr} benchmark="1.5-2.0" />
  <MetricCard label="Quick Ratio" value={qr} />
  <MetricCard label="Cash Conversion Cycle" value={ccc} benchmark="< 0 is best" />

  <Insight>
    {insightText} // e.g., "Your CCC is {days} days. Industry average is..."
  </Insight>
</div>
```

### Testing Strategy

**Unit Tests:**
- Ratio calculations with known values
- Cycle calculations
- Edge cases (zero, negative)
- Benchmark comparisons

**Integration Tests:**
- Save WC data with valuation
- Retrieve WC data
- Update WC and recalculate valuation

### Success Criteria

✅ All calculations accurate to 2 decimal places
✅ Data persists with valuation
✅ Insights provide actionable recommendations
✅ Impacts valuation appropriately
✅ < 100ms calculation time

---

## Feature 3: Deal Analysis Module

### Business Value
- **High**: Enables exit planning and M&A scenario analysis
- **User Demand**: Critical for business owners considering sale
- **Monetization**: Premium feature, high willingness to pay

### Requirements

#### 3.1 Deal Structure Analysis

**Offer Analysis Inputs:**
```javascript
{
  // Offer Terms
  purchasePrice: number,
  cashAtClosing: number,
  earnoutAmount: number,
  earnoutYears: number,
  earnoutConditions: string,

  // Seller Financing
  sellerFinanceAmount: number,
  sellerFinanceRate: number,
  sellerFinanceYears: number,

  // Adjustments
  inventoryAdjustment: number,
  accountsReceivableAdjustment: number,
  liabilityAdjustment: number,

  // Taxes
  estimatedTaxRate: number,
  capitalGainsInclusion: number  // % of gain subject to tax
}
```

**Calculations:**
```
Enterprise Value = Purchase Price - (Cash - Liabilities)

Net Proceeds = Purchase Price
             - Transaction Costs (typically 5-10%)
             - Taxes
             + Earnout PV (discounted)
             + Seller Finance PV (discounted)
             - Holdback/Escrow

After-Tax Proceeds = Net Proceeds * (1 - Tax Rate)

IRR = Internal Rate of Return if held X more years
```

#### 3.2 Multiple Offer Comparison

Allow user to add multiple offers and compare:
- Purchase price
- Net proceeds
- After-tax proceeds
- Deal structure benefits
- Risk assessment

#### 3.3 Earnout Analysis

Analyze earnout scenarios:
```javascript
{
  baseOffer: number,
  earnoutTargets: [
    {
      year: 1,
      targetMetric: "EBITDA", // Revenue, EBITDA, Profit
      targetValue: number,
      paymentIfHit: number,
      probability: 0.8  // 80% chance
    }
  ],
  discountRate: 0.15  // 15% to discount future payments
}
```

**Expected Value = Sum of (payment × probability × PV factor)**

### Implementation Details

#### Backend Structure
```
backend/
├── services/
│   └── dealAnalysisService.js (new)
│       ├── calculateNetProceeds(offer)
│       ├── calculateAfterTaxProceeds(offer)
│       ├── calculateIRR(offer, yearsHeld)
│       ├── calculateEarnoutPV(earnout)
│       ├── compareOffers(offers)
│       └── assessDealStructure(offer)
├── routes/
│   └── dealAnalysisRoutes.js (new)
│       ├── POST /api/valuations/:id/offer-analysis
│       ├── GET /api/valuations/:id/offers
│       ├── PUT /api/valuations/:id/offers/:offerId
│       ├── DELETE /api/valuations/:id/offers/:offerId
│       └── POST /api/valuations/:id/offers/compare
└── models/
    └── dealAnalysis.js (new)
```

#### Database Schema

```sql
CREATE TABLE offer_analysis (
  id UUID PRIMARY KEY,
  valuation_id UUID NOT NULL REFERENCES valuations(id),

  -- Offer Terms
  purchase_price DECIMAL,
  cash_at_closing DECIMAL,
  earnout_amount DECIMAL,
  earnout_years INTEGER,
  earnout_conditions TEXT,

  -- Seller Financing
  seller_finance_amount DECIMAL,
  seller_finance_rate DECIMAL,
  seller_finance_years INTEGER,

  -- Adjustments
  inventory_adj DECIMAL,
  ar_adj DECIMAL,
  liability_adj DECIMAL,

  -- Tax Info
  estimated_tax_rate DECIMAL,
  capital_gains_inclusion DECIMAL,

  -- Calculated Results
  net_proceeds DECIMAL,
  after_tax_proceeds DECIMAL,
  transaction_costs DECIMAL,

  -- Risk Assessment
  deal_risk_score INTEGER,  -- 0-100
  structure_assessment TEXT,

  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE earnout_targets (
  id UUID PRIMARY KEY,
  offer_id UUID NOT NULL REFERENCES offer_analysis(id),
  year INTEGER,
  target_metric VARCHAR(50),  -- EBITDA, Revenue, Profit
  target_value DECIMAL,
  payment_if_hit DECIMAL,
  probability DECIMAL,  -- 0.0-1.0

  created_at TIMESTAMP
);
```

#### Frontend Components

```javascript
// DealAnalysis.js - Main component
<div>
  <h2>Deal Analysis & Offer Evaluation</h2>

  <OfferForm onAddOffer={handleAddOffer} />

  <div className="offers-list">
    {offers.map(offer => (
      <OfferCard
        key={offer.id}
        offer={offer}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    ))}
  </div>

  {offers.length > 1 && (
    <OfferComparison offers={offers} />
  )}
</div>

// OfferCard.js
<card>
  <h3>Offer from {offer.buyerName || 'Buyer'}</h3>

  <MetricRow label="Purchase Price" value={offer.purchasePrice} />
  <MetricRow label="Cash at Closing" value={offer.cashAtClosing} />
  <MetricRow label="Earnout" value={offer.earnoutAmount} />

  <Divider />

  <MetricRow
    label="Net Proceeds (After Taxes)"
    value={offer.afterTaxProceeds}
    highlight={true}
  />

  <RiskAssessment score={offer.dealRiskScore} />

  <button onClick={onEdit}>Edit</button>
  <button onClick={onDelete}>Delete</button>
</card>

// OfferComparison.js
<table>
  <thead>
    <tr>
      <th>Metric</th>
      {offers.map(o => <th key={o.id}>Offer {offers.indexOf(o) + 1}</th>)}
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Purchase Price</td>
      {offers.map(o => <td key={o.id}>{o.purchasePrice}</td>)}
    </tr>
    <tr>
      <td>Net Proceeds</td>
      {offers.map(o => <td key={o.id} className="highlight">{o.netProceeds}</td>)}
    </tr>
    <tr>
      <td>After-Tax Proceeds</td>
      {offers.map(o => <td key={o.id} className="highlight">{o.afterTaxProceeds}</td>)}
    </tr>
    <tr>
      <td>Deal Risk Score</td>
      {offers.map(o => <td key={o.id}>{o.dealRiskScore}/100</td>)}
    </tr>
  </tbody>
</table>
```

### Testing Strategy

**Unit Tests:**
- Net proceeds calculation with various inputs
- Tax calculation accuracy
- Earnout PV calculation
- IRR calculation
- Edge cases (100% earnout, seller financing only)

**Integration Tests:**
- Save multiple offers
- Compare offers
- Update offer and recalculate

**Validation Tests:**
- Prevent invalid deal structures
- Warn on unusual terms
- Validate tax assumptions

### Success Criteria

✅ All financial calculations accurate
✅ Support multiple offer comparison
✅ Earnout probability weighting works
✅ Tax calculations follow realistic assumptions
✅ Clear risk indicators for deal structures
✅ Export comparison to PDF

---

## Development Roadmap

### Week 2 Timeline (36 hours total)

#### Days 1-2: PDF Report Generation (14 hours)
- [ ] Design HTML templates
- [ ] Set up Puppeteer/PDF library
- [ ] Implement backend service
- [ ] Create API endpoint
- [ ] Frontend export button
- [ ] Test PDF generation
- [ ] Handle edge cases

#### Days 3-4: Working Capital Calculator (10 hours)
- [ ] Database migration
- [ ] Backend calculation service
- [ ] API endpoints (CRUD + calculate)
- [ ] Frontend form component
- [ ] Results display component
- [ ] Integration with valuation
- [ ] Testing

#### Days 5: Deal Analysis Module (12 hours)
- [ ] Database schema
- [ ] Backend calculation service
- [ ] Multiple offer comparison logic
- [ ] API endpoints
- [ ] Offer form component
- [ ] Comparison component
- [ ] Risk assessment logic
- [ ] Testing

#### Remaining: Buffer & Polish (varies)
- Bug fixes
- Performance optimization
- UI/UX refinement

---

## Technology Decisions

### PDF Generation
**Option 1: Puppeteer (Recommended)**
- Pros: Full control, responsive design, headless Chrome
- Cons: Resource intensive, needs system resources
- Cost: Free (open source)

**Option 2: PDFKit**
- Pros: Lightweight, pure JS
- Cons: Limited styling control
- Cost: Free (open source)

**Decision: Puppeteer** - Better quality, more control, worth the resources

### Template Engine
**Option 1: Handlebars (Recommended)**
- Pros: Simple, familiar syntax, good for HTML
- Cons: Not as powerful as others
- Cost: Free

**Option 2: EJS**
- Pros: Full JS capability
- Cons: Overkill for templates
- Cost: Free

**Decision: Handlebars** - Perfect balance of simplicity and power

---

## Success Metrics

| Feature | KPI | Target |
|---------|-----|--------|
| PDF Reports | Generation time | < 3 seconds |
| | File size | < 2MB |
| | Download success rate | 100% |
| Working Capital | Calculation accuracy | ± 0.01% |
| | User engagement | 60%+ use it |
| Deal Analysis | Comparison clarity | 4/5 rating |
| | Accuracy | 100% calculations |
| | Load time | < 500ms for 3 offers |

---

## Dependencies to Add

```json
{
  "puppeteer": "^19.0.0",
  "handlebars": "^4.7.7",
  "express-async-errors": "^3.1.1",
  "sharp": "^0.32.0"
}
```

**Frontend (if not present):**
```json
{
  "react-csv": "^2.2.2",
  "recharts": "^2.5.0"
}
```

---

## Risk Mitigation

### PDF Generation Risk
**Risk**: Puppeteer crashes or timeout
**Mitigation**: Implement queue system, timeout handling, fallback to HTML download

### Calculation Risk
**Risk**: Complex financial formulas have errors
**Mitigation**: Extensive unit tests, validation against known values, expert review

### Performance Risk
**Risk**: Three new features = slower app
**Mitigation**: Lazy loading, code splitting, background processing for PDFs

---

## Next Steps

1. **Review this plan** with stakeholder
2. **Choose priority** if not all can be done
3. **Assign tasks** if team involved
4. **Set up** development environment
5. **Begin** with PDF generation (highest value, lowest complexity)

---

## Estimated Velocity

Based on Week 1 performance:
- **Actual**: 8 hours completed → 103 tests + 2 test files
- **Projected**: 36 hours for 3 complete features
- **Buffer**: Yes, included

**Week 2 is achievable if:**
- ✅ No blockers from Week 1 issues
- ✅ Developer experience with JavaScript
- ✅ Can focus full-time

---

## Questions to Answer

Before starting Week 2:

1. **Prioritize**: All 3 features or just top 2?
2. **Report Tiers**: All 3 template types or just standard?
3. **Earnouts**: How complex should earnout scenarios be?
4. **Testing**: Continue 100% coverage or relax to 90%?
5. **Timeline**: Flexible or hard end-of-week deadline?

---

*Ready to dive into Week 2? Let me know which feature to start with!*
