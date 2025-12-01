# VAC Questionnaire Specification
**Status**: Planning/Specification Phase
**Purpose**: Detailed question set for implementation
**Source**: improvements.txt + Excel file analysis needed

---

## Overview

The VAC (Value Acceleration Calculator) questionnaire is structured in 4 distinct sections:
1. **Pre-Call Owner Questions** (Discovery)
2. **STEP 1: Risk Analysis** (15+ questions)
3. **STEP 2: Earnings Analysis** (6 questions + calculations)
4. **STEP 3: EBITDA Multiples & Settings** (4 settings, advisor-visible)

Plus a supporting section: **Documents & Financials**

---

## Section A: Pre-Call Owner Questions (Discovery)

**Display**: Owner/Advisor mixed
**Purpose**: Context setting before deep dive
**Count**: 2 questions
**UI Pattern**: Simple text input, conversation starter

| # | Question | Field Type | Required | Visible To | Purpose |
|---|----------|-----------|----------|-----------|---------|
| 1 | Why is this important to you? | Text area | Yes | Advisor only (notes) | Understand owner's motivation |
| 2 | Is there anything particular you want to achieve from our call today? | Text area | No | Advisor only (notes) | Set call objectives |

**Notes**:
- Stored as part of engagement metadata
- Shows up in engagement summary/reports
- Advisor can view these during call prep
- Not used in calculations

---

## Section B: STEP 1 - Risk Analysis & Sellability

**Display**: Owner-visible
**Purpose**: Assess business risk profile, factors affecting valuation
**Count**: 15 questions
**UI Pattern**: Mix of dropdowns, radio buttons, numeric inputs
**Scoring**: Answers map to risk score (low/medium/high) which affects multiples

### B1: Business Fundamentals

| # | Question | Field Type | Options | Required | Notes |
|---|----------|-----------|---------|----------|-------|
| B1.1 | When is your fiscal year end? | Date picker | MM-DD | Yes | Used for financial data alignment |
| B1.2 | Is your business incorporated? | Radio | Yes / No | Yes | Affects legal structure analysis |
| B1.3 | How long has your company been running? | Dropdown | <1yr / 1-2 / 2-5 / 5-10 / 10+ | Yes | Affects maturity/stability score |
| B1.4 | What best describes your business operating system? | Dropdown | Ad-hoc / Basic processes / Documented processes / Automated systems | Yes | Operational maturity |

### B2: Profitability & Cash Flow

| # | Question | Field Type | Options | Required | Notes |
|---|----------|-----------|---------|----------|-------|
| B2.1 | Did your company report profit last year? | Radio | Yes / No | Yes | Core profitability indicator |
| B2.2 | Did your company make profit in the last six months? | Radio | Yes / No / Not sure | Yes | Recent profitability trend |
| B2.3 | What was your financial trend over the last five years? | Dropdown | Strong growth / Modest growth / Flat / Declining / Inconsistent | Yes | Growth trajectory |
| B2.4 | How many years of clean accountant-generated financials do you have? | Numeric | 0-10 | Yes | Data quality/reliability |

### B3: Operations & Management

| # | Question | Field Type | Options | Required | Notes |
|---|----------|-----------|---------|----------|-------|
| B3.1 | Do you have a general manager that runs the business? | Radio | Yes / No / Partial | Yes | Owner dependency |
| B3.2 | How many hours a week do you work "IN" the business? | Numeric (0-168) | Hours | Yes | Owner time commitment |
| B3.3 | Is your business project-based? | Radio | Yes / No / Mostly | Yes | Revenue predictability |
| B3.4 | How do your customers pay you? | Dropdown | Cash on delivery / 30 days / 60+ days / Mixed | Yes | Cash flow timing |

### B4: Customer & Supply Concentration

| # | Question | Field Type | Options | Required | Notes |
|---|----------|-----------|---------|----------|-------|
| B4.1 | What percent of sales does your largest customer represent? | Numeric (0-100) | % | Yes | Customer concentration risk |
| B4.2 | How much time is left on your lease, including renewal periods? | Dropdown | <1yr / 1-3 / 3-5 / 5-10 / 10+ / Own building | Yes | Location stability |

### B5: Single Points of Failure (SPOF) - Advisor Only

| # | Question | Field Type | Options | Required | Notes |
|---|----------|-----------|---------|----------|-------|
| B5.1 | Number of single points of failure (SPOF)? | Numeric | Count | Advisor | Classified from helper list below |

**SPOF Categories** (Advisor helper checklist):
- Key personnel (owner, sole salesman, CTO, etc.)
- Customer concentration (largest customer >20%)
- Supply chain dependency (single supplier)
- IT/Systems (custom software, proprietary systems)
- Licenses/Permits (required for operation)
- Contracts (major customer/supplier contracts expiring)
- Location/Lease (critical to business)
- Technology (obsolete if not maintained)
- Market dependency (trends affecting business)

### B6: Seller Motivation

| # | Question | Field Type | Options | Required | Notes |
|---|----------|-----------|---------|----------|-------|
| B6.1 | What do you need to sell your business for? Please explain. | Text area | Free text | Yes | Informs valuation target + deal structure |

---

## Section C: STEP 2 - Earnings Analysis (Quick Financial Snapshot)

**Display**: Owner-visible
**Purpose**: Quick earnings-based valuation without full financial documents
**Count**: 6 core questions + 2 conditional adjustments
**UI Pattern**: Numeric input (currency)
**Integration**: Auto-reconciles with uploaded P&L/Balance Sheet

### C1: Revenue & Earnings (Last 12 Months)

| # | Question | Field Type | Currency | Required | Notes |
|---|----------|-----------|----------|----------|-------|
| C1.1 | What was your top line revenue last year? | Numeric | USD/CAD | Yes | Annual revenue = Top line |
| C1.2 | What was your pre-tax profit last year? | Numeric | USD/CAD | Yes | Pre-tax income (bottom line) |

### C2: EBITDA Adjustments

| # | Question | Field Type | Currency | Required | Notes |
|---|----------|-----------|----------|----------|-------|
| C2.1 | What was your amortization/depreciation last year? | Numeric | USD/CAD | Yes | A&D add-back for EBITDA |
| C2.2 | What was your long-term interest expense last year? | Numeric | USD/CAD | Yes | Interest add-back for EBITDA |
| C2.3 | What was your discretionary spending last year? | Numeric | USD/CAD | No | Owner discretionary add-back (travel, charity, etc.) |

**Calculated Field**:
```
EBITDA = Pre-tax Profit + Amortization + Depreciation + Interest Expense + Discretionary Spending
```

### C3: Earnings Normalization (Conditional)

| # | Question | Field Type | Options | Required | Notes |
|---|----------|-----------|----------|----------|-------|
| C3.1 | Do you pay yourself a salary above or below market rate? | Dropdown | Market rate / Below market / Above market | Yes | Will adjust normalized earnings |
| C3.1a | If above/below, what adjustment should be made? | Numeric | $ | Conditional | Owner salary normalization |
| C3.2 | Does your company pay market rate rent to yourself or the holdco? | Radio | Yes / No | Yes | Rent normalization |
| C3.2a | If no, what is the annual rent adjustment? | Numeric | $ | Conditional | Rent normalization |

**Calculated Fields**:
```
Adjusted EBITDA = EBITDA + Salary Adjustment + Rent Adjustment
Normalized Earnings = Adjusted EBITDA
```

---

## Section D: STEP 3 - EBITDA Multiples & Settings

**Display**: Advisor-only (hidden from owner or behind "Advanced Settings")
**Purpose**: Set valuation method assumptions
**Count**: 4 settings
**UI Pattern**: Numeric input (multiples), radio buttons, text
**Defaults**: Driven by industry (NAICS), geography, risk score

### D1: Valuation Method Selection

| # | Question | Field Type | Options | Required | Notes |
|---|----------|-----------|----------|----------|-------|
| D1.1 | What valuation method would you like to use? | Dropdown | EBITDA Multiple / Revenue Multiple / Seller Discretionary Earnings (SDE) | Yes | Primary approach |
| D1.2 | What multiple would you like to apply? | Numeric | 2.0 - 10.0 | Yes | Can be default based on industry |

### D2: Risk Adjustments

| # | Question | Field Type | Options | Required | Notes |
|---|----------|-----------|----------|----------|-------|
| D2.1 | Would you like risk weighting on or off? | Radio | On / Off | Yes | Apply discount/premium based on risk score |
| D2.1a | If on, specify adjustment %: | Numeric | -30% to +20% | Conditional | Manual override of formula-based adjustment |

### D3: Geography & Market

| # | Question | Field Type | Options | Required | Notes |
|---|----------|-----------|----------|----------|-------|
| D3.1 | Is the company Canadian? | Radio | Yes / No | Yes | Affects multiple selection (Canadian discount?) |
| D3.2 | What is the company's primary market/geography? | Dropdown | Canada / USA / International | No | For future multi-geography support |

### D4: Custom Inputs

| # | Question | Field Type | Options | Required | Notes |
|---|----------|-----------|----------|----------|-------|
| D4.1 | Custom Multiple (free-form numeric input) | Numeric | 0.0 - 20.0 | No | Override if different from preset |
| D4.2 | Any special assumptions or adjustments? | Text area | Free text | No | Advisor notes on methodology |

---

## Section E: Documents & Financials Checklist

**Display**: Owner-visible with explanation
**Purpose**: Gather deep financial data for full MVA/MPSP
**Count**: 7 document types, 15+ files expected
**UI Pattern**: Drag & drop upload, status badges, explanatory text

### E1: Required Documents

| Type | Required | File Types | Years | Purpose | Advisor Notes |
|------|----------|-----------|-------|---------|---------------|
| P&L / Income Statements | Yes | PDF, Excel | 3-5 + YTD | Revenue, costs, profitability trends | Reconcile with Q C1.1 & C1.2 |
| Balance Sheets | Yes | PDF, Excel | 3-5 | Assets, liabilities, equity trends | Working capital, asset approach |
| Tax Returns (Business) | Yes | PDF | 3-5 | Verified earnings, adjustments | IRS verification of profitability |

### E2: Highly Recommended Documents

| Type | Required | File Types | Years | Purpose | Advisor Notes |
|------|----------|-----------|-------|---------|---------------|
| AR/AP Aging Reports | Recommended | PDF, Excel | Current | Customer/supplier concentration, terms | SPOF analysis, working capital |
| Fixed Asset / FF&E List | Recommended | PDF, Excel | Current | Equipment, vehicles, intangibles | Asset approach, CBP equipment |
| Tax Returns (Personal) | Conditional | PDF | 3 years | Owner income (for small main-street deals) | Verify owner draws |

### E3: Supporting Documents

| Type | Required | File Types | Notes | Purpose | Advisor Notes |
|------|----------|-----------|-------|---------|---------------|
| Bank Statements | Optional | PDF, CSV | 3-6 months | Cash flow verification | Reality check on profitability |
| Forecasts / Budgets | Optional | PDF, Excel | Next 1-3 years | Future growth assumptions | Valuation upside case |

---

## Calculation Logic & Formulas

### Step 1: Risk Scoring

Based on answers in Section B, calculate risk score (0-100, where higher = riskier):

```
Risk Score = Base(50) + Adjustments

Adjustments:
+ Profitability:
  - No profit last year: +15 points
  - No profit last 6 months: +10 points

+ Trend:
  - Declining: +15 points
  - Flat: +5 points
  - Strong growth: -10 points

+ Owner Dependency:
  - <20 hrs/wk in business: -10 points (good, scalable)
  - 40-60 hrs/wk in business: 0 points
  - >60 hrs/wk in business: +10 points (depends on owner)
  - No general manager: +15 points

+ Customer Concentration:
  - >40% from single customer: +20 points
  - 20-40%: +10 points

+ SPOFs:
  - 0-1 SPOF: 0 points
  - 2-3 SPOFs: +10 points
  - 4+ SPOFs: +20 points

+ Data Quality:
  - <2 yrs clean financials: +10 points
  - 2-5 yrs: +5 points
  - 5+ yrs: 0 points

Final Risk Score = Sum of above (capped 0-100)
Risk Category:
  - 0-30: Low Risk (premium multiple)
  - 31-70: Medium Risk (standard multiple)
  - 71-100: High Risk (discounted multiple)
```

### Step 2: Valuation Calculation

```
Base Valuation = Adjusted EBITDA (from Section C) × Multiple (from Section D)

Risk Adjustment:
  IF Risk Weighting ON:
    IF Risk = Low: Valuation × 1.05 to 1.15 (premium)
    IF Risk = Medium: Valuation × 1.0 (no change)
    IF Risk = High: Valuation × 0.75 to 0.90 (discount)

Final Valuation Range:
  Low = Base × 0.85
  Mid = Base × 1.0
  High = Base × 1.15
```

### Step 3: Benchmark Comparison

Compare against industry benchmarks (from external data):

```
Industry EBITDA Multiple (by NAICS):
  - Manufacturing: 4.5-6.0x
  - Service: 3.0-4.5x
  - Retail: 2.5-3.5x
  - Wholesale: 3.0-4.0x
  - Technology: 6.0-8.0x
  [etc.]

User's Multiple vs Industry:
  IF User Multiple < Industry Low: "Below industry average - valuation discount"
  IF User Multiple > Industry High: "Above industry average - justified by growth/quality"

Profit Margin Benchmark:
  Compare user's: Pre-tax profit / Revenue vs Industry standard
  Flag if >5% below benchmark
```

### Step 4: Value Drivers & Gaps

**Value Drivers** (Positive factors):
```
IF Revenue Growth > 15% YoY: "Strong revenue growth" → +5-10% uplift potential
IF Profit Margin > Industry Avg: "Above-average profitability" → +3-5% uplift potential
IF Low SPOF count: "Scalable operations" → +5% uplift potential
IF <10 hrs/week owner time: "Owner not critical" → +5% uplift potential
IF Recurring revenue: "Predictable revenue" → +5-10% uplift potential
```

**Gaps** (Areas to improve):
```
IF Profit < 0: "Not currently profitable" → -10-20% valuation impact
IF High customer concentration: "Customer concentration risk" → -5-15% valuation impact
IF Declining trend: "Revenue decline" → -5-10% valuation impact
IF Owner-dependent: "Owner-dependent" → -5-20% valuation impact
IF High SPOFs: "Operational risk" → -5-15% valuation impact
IF Below-market multiple: "Below peer multiples" → Gap to close
```

### Step 5: Improvement Suggestions

Generate list of actionable improvements:

```
Improvement = {
  id: "unique_id",
  title: string,
  description: string,
  estimated_value_impact: "$X - $Y increase in valuation",
  priority: "high" | "medium" | "low",
  effort: "quick_win" | "medium_term" | "long_term",
  category: "profitability" | "scalability" | "risk_reduction" | "growth",
  action_steps: string[],
  success_metrics: string[]
}

Examples:
{
  id: "reduce_customer_concentration",
  title: "Diversify customer base",
  description: "Your largest customer is 45% of sales. Reduce to <20%",
  estimated_value_impact: "$500K - $750K increase",
  priority: "high",
  effort: "long_term",
  category: "risk_reduction",
  action_steps: [
    "Develop sales plan to add 5 new customers",
    "Target customers similar in size to largest",
    "Set quarterly targets"
  ],
  success_metrics: [
    "Largest customer drops to <20% of revenue",
    "New customers contribute $X monthly"
  ]
}

{
  id: "improve_profitability",
  title: "Increase profit margin",
  description: "Current margin 8%, industry average 12%. Close the 4% gap",
  estimated_value_impact: "$300K - $500K increase",
  priority: "high",
  effort: "medium_term",
  category: "profitability",
  action_steps: [
    "Review cost structure",
    "Implement lean manufacturing/operations",
    "Renegotiate supplier contracts",
    "Review pricing strategy"
  ],
  success_metrics: [
    "Profit margin reaches 11-12%",
    "EBITDA increases $X annually"
  ]
}
```

---

## Data Storage & Retrieval

### Database Tables Required

1. **questionnaire_responses**
   ```
   - id
   - engagement_id (FK)
   - question_id (FK)
   - answer (value)
   - answer_type (text, numeric, select, etc.)
   - owner_answer (for tracking overrides)
   - advisor_override (override value if different)
   - advisor_notes (why override)
   - updated_at
   - updated_by (user_id)
   ```

2. **risk_scores**
   ```
   - id
   - valuation_id (FK)
   - raw_score (0-100)
   - risk_category (low/medium/high)
   - score_breakdown (JSON with each factor)
   - calculated_at
   ```

3. **valuations**
   ```
   - id
   - engagement_id (FK)
   - base_ebitda (calculated)
   - adjusted_ebitda (after normalizations)
   - multiple_used (number)
   - risk_adjustment (%)
   - base_valuation (EBITDA × Multiple)
   - final_valuation_low (range)
   - final_valuation_mid (range)
   - final_valuation_high (range)
   - value_drivers (JSON array)
   - gaps (JSON array)
   - improvement_suggestions (JSON array)
   - created_at
   - created_by (user_id)
   ```

---

## Admin Configuration

### Default Multiple Settings (By Industry - NAICS)

```
{
  "11": { "name": "Agriculture", "multiple": 3.5, "margin": 0.08 },
  "21": { "name": "Mining", "multiple": 4.0, "margin": 0.12 },
  "22": { "name": "Utilities", "multiple": 5.5, "margin": 0.15 },
  "23": { "name": "Construction", "multiple": 3.0, "margin": 0.10 },
  "31-33": { "name": "Manufacturing", "multiple": 5.0, "margin": 0.10 },
  "42": { "name": "Wholesale Trade", "multiple": 3.5, "margin": 0.05 },
  "44-45": { "name": "Retail Trade", "multiple": 2.8, "margin": 0.03 },
  "48-49": { "name": "Transportation", "multiple": 3.8, "margin": 0.08 },
  "51": { "name": "Information", "multiple": 6.5, "margin": 0.20 },
  "52": { "name": "Finance", "multiple": 4.5, "margin": 0.25 },
  "53": { "name": "Real Estate", "multiple": 4.0, "margin": 0.40 },
  "54": { "name": "Professional Services", "multiple": 4.0, "margin": 0.20 },
  "55": { "name": "Management", "multiple": 5.0, "margin": 0.15 },
  "56": { "name": "Admin Services", "multiple": 3.5, "margin": 0.10 },
  "61": { "name": "Education", "multiple": 3.0, "margin": 0.15 },
  "62": { "name": "Healthcare", "multiple": 4.5, "margin": 0.10 },
  "71": { "name": "Arts/Entertainment", "multiple": 2.5, "margin": 0.05 },
  "72": { "name": "Food Service", "multiple": 2.8, "margin": 0.04 },
  "81": { "name": "Other Services", "multiple": 3.0, "margin": 0.10 }
}
```

### Risk Adjustment Formula (Configurable)

```
Risk_Discount_Multiplier = {
  low_risk: 1.05 to 1.15,     // Premium
  medium_risk: 1.0,            // No change
  high_risk: 0.75 to 0.90     // Discount
}

Admin can configure:
- Exact percentages per risk category
- Weights for each risk factor
- Bonus/penalty for specific SPOFs
- Weighting formula (linear, exponential, etc.)
```

---

## Implementation Notes

### Missing Information (To Be Clarified)

1. **Excel Files Content**
   - Need to analyze vac.xlsx for exact question wording
   - Need to analyze mva-master.xlsx for detailed calculations
   - Need benchmark data sources (where do industry multiples come from?)

2. **Report Layouts**
   - Exact format for VAC one-pager
   - Specific sections in CBP, MVA, MPSP reports
   - How improvements are presented in reports
   - Specific terminology & branding

3. **Financial Calculations**
   - Exact normalization adjustments beyond basic EBITDA
   - How depreciation is handled (add-back?  recapture?)
   - Treatment of one-time/extraordinary items
   - Revenue recognition method (cash vs accrual)

4. **Benchmarking**
   - Industry multiple source (S&P, Pratt's, internal data?)
   - Margin benchmarks by industry
   - How to handle non-standard industries
   - Frequency of benchmark updates

---

**Status**: ✅ Specification Complete - Ready for Excel File Analysis & Clarification
**Next**: Extract exact questions from vac.xlsx, confirm formulas with business team
