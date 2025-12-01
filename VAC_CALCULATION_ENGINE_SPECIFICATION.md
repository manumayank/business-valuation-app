# VAC Calculation Engine - Detailed Technical Specification
**Status**: Technical Specification (from calculations.txt)
**Priority**: CRITICAL - Phase 6 Deliverable
**Accuracy Required**: ±0.01% deviation from Excel baseline
**Source**: calculations.txt extracted from vac.xlsx

---

## Executive Summary

This document defines the **exact formulas and logic** required to implement the Value Acceleration Calculator (VAC) backend engine. All calculations must match Excel behavior within ±0.01% accuracy tolerance.

The VAC engine has **6 distinct calculation layers**:
1. Risk Score Computation (14 questions, 1-5 scale each)
2. Normalized Earnings & EBITDA
3. EBITDA Multiple Selection
4. Current Enterprise Value
5. Value Acceleration (3 levers: Size, Efficiency, Multiple)
6. Probability Distribution & Wealth Gap Projection

---

## Layer 1: Risk Score Computation

**Purpose**: Generate risk profile (1-70 scale) that affects multiple selection and discount/premium

**Input**: 14 risk questions from Step 1 of questionnaire

### Q1: Fiscal Year End
```
Input: fiscalYearEnd (Yes/No)
Scoring:
  if "yes" → 5 points
  else → 1 point
Purpose: Predictable financial reporting
```

### Q2: Incorporated
```
Input: incorporated (Yes/No)
Scoring:
  if "yes" → 5 points
  else → 1 point
Purpose: Legal structure / transferability
```

### Q3: Profit Last Year
```
Input: profitLastYear (Yes/No)
Scoring:
  if "yes" → 5 points
  else → 1 point
Purpose: Basic profitability baseline
```

### Q4: Profit in Last 6 Months
```
Input: lastSixMonthPerformance (dropdown)
Scoring:
  if "10%+ YOY Steady Growth" → 5 points
  else if "Modest YOY Steady Growth" → 4 points
  else if "Flat" → 3 points
  else if "Declining" → -3 points
  else → 1 point
Purpose: Recent momentum & trend
```

### Q5: Clean Accountant-Generated Financials
```
Input: cleanFinancialYears (dropdown)
Scoring:
  if "5+ years" → 5 points
  if "3+ years" → 4 points
  if "1–2 years" → 3 points
  else → 1 point
Purpose: Data quality & verification capability
```

### Q6: Has General Manager
```
Input: hasGeneralManager (Yes/No)
Scoring:
  if "yes" → 5 points
  else → 1 point
Purpose: Owner dependency / scalability
```

### Q7: Project-Based Revenue
```
Input: projectBased (dropdown)
Scoring:
  if "No" → 5 points
  if "Between" → 3 points
  else → 1 point
Purpose: Revenue predictability
```

### Q8: Largest Customer Concentration
```
Input: largestCustomerPercent (dropdown)
Scoring:
  if "<10%" → 5 points
  if "5–15%" → 4 points
  if "Under 5%" → 4 points
  if "15–25%" → 3 points
  else → 1 point
Purpose: Customer concentration risk
Note: Ranges seem overlapping - must match Excel exactly
```

### Q9: Owner Hours Per Week
```
Input: ownerHours (dropdown, number of hours)
Scoring:
  if "<10" hours → 5 points
  if "<20" hours → 4 points
  if "<30" hours → 3 points
  else (30+) → 1 point
Purpose: Owner dependency / business scalability
```

### Q10: Lease Years Remaining
```
Input: leaseYearsRemaining (dropdown)
Scoring:
  if "Over 10 years" OR "Building Owned" → 5 points
  if "Between 5–10 years" → 4 points
  else → 1 point
Purpose: Location/operational stability
```

### Q11: Company Age
```
Input: businessAge (dropdown)
Scoring:
  if "Over 25 years" → 5 points
  if "Over 15 years" → 4 points
  else → 1 point
Purpose: Longevity / market validation
```

### Q12: Operating System / Technology
```
Input: operatingSystem (dropdown)
Scoring:
  if "Cloud-based ERP" → 5 points
  if "Customized CRM" → 3 points
  else → 1 point
Purpose: Operational maturity & scalability
```

### Q13: Payment Terms / Revenue Model
```
Input: customerPaymentTerms (dropdown)
Scoring:
  if "Contracted Recurring Monthly" → 5 points
  if "30–60 day terms" → 4 points
  if "60–90 day terms" → 3 points
  else → 1 point
Purpose: Cash flow predictability
```

### Q14: Single Points of Failure (SPOF)
```
Input: numberOfSPOFs (integer count)
Scoring:
  if spofs == 0 → 5 points
  if spofs == 1 → 4 points
  if spofs in [2,3] → 3 points
  if spofs in [4,5] → 2 points
  else (6+) → 1 point
Purpose: Operational redundancy / risk
```

### Risk Score Total
```
Formula:
riskScore = Q1 + Q2 + Q3 + Q4 + Q5 + Q6 + Q7 + Q8 + Q9 + Q10 + Q11 + Q12 + Q13 + Q14

Range: 1 (highest risk) to 70 (lowest risk)

Risk Categories:
  - 1-23: High Risk (risky acquisition)
  - 24-46: Medium Risk (typical business)
  - 47-70: Low Risk (premium business)
```

**Critical**: All 14 questions must have answers to calculate risk score. Missing answers = validation error.

---

## Layer 2: Earnings Analysis & EBITDA Calculation

**Purpose**: Normalize earnings to arrive at sustainable EBITDA for valuation

**Inputs from Step 2**:
```
revenue (annual, top line)
pretaxProfit (net profit before taxes)
depreciation (D&A for year)
interest (long-term interest expense)
discretionarySpending (owner discretionary items)
ownerSalaryAdj (adjustment for above/below market salary)
rentAdj (adjustment for above/below market rent)
```

### Baseline Margin Constants
These are fixed defaults used if owner financial data is not provided:
```
revenueMargin = 1.0 (100% of revenue)
pretaxMargin = 0.075 (7.5% typical pre-tax profit)
depreciation = 0.01 (1% of revenue typical D&A)
interest = 0.01 (1% of revenue typical interest)
discretionarySpending = 0.02 (2% of revenue discretionary)
```

### Baseline Calculations (If Financial Data Missing)
```
baselineRevenue = revenue × 1.0
baselinePretax = revenue × 0.075
baselineDep = revenue × 0.01
baselineInterest = revenue × 0.01
baselineDiscretionary = revenue × 0.02
```

### EBITDA Calculation Logic
**Excel condition**:
```
IF(ISBLANK(H30),  // If detailed financials missing
    baselineRevenue + baselinePretax + baselineDep + baselineInterest + discretionary,
    pretaxProfit + depreciation + interest + discretionary
)
```

**Backend logic**:
```javascript
if (detailedFinancialsMissing) {
  // Use baseline method
  EBITDA = baselinePretax + baselineDep + baselineInterest + discretionarySpending

} else {
  // Use actual financials
  EBITDA = pretaxProfit + depreciation + interest + discretionarySpending
}

// Apply adjustments
EBITDA_adjusted = EBITDA + ownerSalaryAdj + rentAdj
```

### EBITDA Margin
```
if (revenue == 0):
  EBITDA_margin = 0
else:
  EBITDA_margin = EBITDA_adjusted / revenue
```

**Critical**: EBITDA must include owner salary and rent normalization to show true earning power.

---

## Layer 3: EBITDA Multiple Selection

**Purpose**: Choose appropriate earnings multiple based on method (custom, common, or industry)

**Inputs**:
```
multipleType (custom / common / industry)
customMultiple (if custom selected)
baseMultipleCommon (median of common multiples)
baseMultipleIndustry (median of industry multiples by NAICS)
riskWeighting (on/off boolean)
```

### Multiple Selection Logic
```javascript
let multipleUsed;

if (multipleType === "Use Custom Multiple") {
  multipleUsed = customMultiple
}
else if (multipleType === "Use Common Multiples") {
  multipleUsed = baseMultipleCommon  // Pre-defined common multiples
}
else {  // "Use Industry Multiple"
  multipleUsed = baseMultipleIndustry  // Look up by NAICS code
}
```

### Risk-Weighted Multiple (Optional)
```
If riskWeighting == ON:
  Risk Score Categories:
    - 1-23 (High Risk): multipleUsed × 0.75  (25% discount)
    - 24-46 (Medium): multipleUsed × 1.0   (no change)
    - 47-70 (Low Risk): multipleUsed × 1.15  (15% premium)
```

**Note**: Exact risk weighting formula needs clarification from business team.

---

## Layer 4: Current Enterprise Value

**Purpose**: Calculate baseline business valuation with selected multiple

### Current Value Calculation
```javascript
currentValue = EBITDA_adjusted × multipleUsed

// Example:
// EBITDA = $500,000
// Multiple = 4.0x
// Current Value = $2,000,000
```

This is the **baseline valuation** before any value acceleration.

---

## Layer 5: Value Acceleration Calculations

**Purpose**: Show potential value creation through 3 levers

### Overview
VAC shows how business can create value through:
1. **Size Lever**: Revenue growth (EA = growth rate %)
2. **Efficiency Lever**: Profit margin improvement (E = efficiency improvement %)
3. **Multiple Lever**: Risk reduction / multiple improvement (M = multiple increase %)

Each lever independently shows value creation, then combined for total uplift potential.

### 5.1: Size Lever (Revenue Growth)

**Input**:
```
targetSizeGrowthRate (EA) = % annual revenue growth target
```

**Assumptions**:
```
- COGS and expenses scale with revenue
- Profit margin remains constant
- Multiple stays the same
```

**Calculations**:
```javascript
newRevenue = baseRevenue × (1 + EA)

// COGS and expenses scale proportionally
newExpenses = baseExpenses × (1 + EA)

// Profit grows with revenue
newProfit = newRevenue - newExpenses

// Adjusted EBITDA grows
newAdjEBITDA = newProfit × profitMargin

// New valuation at same multiple
sizeAdjustedValue = newAdjEBITDA × multipleUsed

// Value created
valueCreatedSize = sizeAdjustedValue - currentValue
valueCreatedSizePercent = valueCreatedSize / currentValue

// Example:
// Revenue: $1M, EBITDA: $100K, Multiple: 4x, Current Value: $400K
// Growth: 20% → New Revenue: $1.2M, New EBITDA: $120K
// New Value: $480K
// Value Created: $80K (20% increase)
```

### 5.2: Efficiency Lever (Profit Margin Improvement)

**Input**:
```
targetEfficiencyImprovement (E) = improvement in profit margin (%)
```

**Assumptions**:
```
- Revenue stays constant
- EBITDA margin improves (reduce costs, increase prices)
- Multiple stays the same
```

**Calculations**:
```javascript
// Revenue unchanged
efficiencyGain = baseRevenue × E

// New EBITDA includes efficiency gain
newAdjEBITDA = baseEBITDA + efficiencyGain

// New valuation at same multiple
effAdjustedValue = newAdjEBITDA × multipleUsed

// Value created
valueCreatedEfficiency = effAdjustedValue - currentValue
valueCreatedEfficiencyPercent = valueCreatedEfficiency / currentValue

// Example:
// Revenue: $1M, EBITDA: $100K, Multiple: 4x, Current Value: $400K
// Efficiency improvement: 2% (margin improvement)
// Efficiency gain: $20K new EBITDA
// New EBITDA: $120K
// New Value: $480K
// Value Created: $80K (20% increase)
```

### 5.3: Multiple Lever (Risk Reduction)

**Input**:
```
targetMultipleIncrease (M) = % increase in EBITDA multiple
```

**Assumptions**:
```
- EBITDA stays constant
- Multiple improves (lower risk, better quality)
- Revenue/profit unchanged
```

**Calculations**:
```javascript
// New multiple (increased by M%)
newMultiple = baseMultiple + (baseMultiple × M)

// EBITDA unchanged
// New valuation with improved multiple
riskAdjustedValue = newMultiple × baseEBITDA

// Value created
valueCreatedMultiple = riskAdjustedValue - currentValue
valueCreatedMultiplePercent = valueCreatedMultiple / currentValue

// Example:
// EBITDA: $100K, Multiple: 4.0x, Current Value: $400K
// Multiple improvement: 25% (risk reduction)
// New Multiple: 5.0x
// New Value: $500K
// Value Created: $100K (25% increase)
```

### Combined Value Acceleration
```javascript
// Total potential uplift (if all 3 levers applied simultaneously)
totalUpliftValue = valueCreatedSize + valueCreatedEfficiency + valueCreatedMultiple
totalUpliftPercent = totalUpliftValue / currentValue
newTotalValue = currentValue + totalUpliftValue

// Note: In real scenario, levers may interact (e.g., higher growth
// with better margins) but VAC shows them independently
```

---

## Layer 6: Probability Distribution Analysis

**Purpose**: Show valuation distribution across market conditions (standard deviation bands)

**Excel Method**: Distributes EBITDA multiples along standard deviation increments

### Probability Distribution Calculation
```javascript
// Generate distribution bands
// Mean = baseMultiple
// StdDev = (maxMultiple - minMultiple) / 4

// For each SD step:
const distribution = [];
const probabilities = [0.1, 0.2, 0.4, 0.2, 0.1];  // Bell curve
const sdSteps = [-2, -1, 0, 1, 2];  // Standard deviations

for (let i = 0; i < sdSteps.length; i++) {
  const stdDevStep = sdSteps[i];
  const multiple = meanMultiple + (stdDevStep * stdDev);
  const mvicValue = EBITDA × multiple;
  const probability = probabilities[i];

  distribution.push({
    stdDev: stdDevStep,
    multiple: multiple,
    mvicValue: mvicValue,
    probability: probability
  });
}

// Aggregate Expected Value
expectedValue = Σ (probability_i × mvicValue_i)

// Example output:
// [
//   {stdDev: -2, multiple: 2.5, mvicValue: $250K, probability: 0.1},
//   {stdDev: -1, multiple: 3.25, mvicValue: $325K, probability: 0.2},
//   {stdDev: 0, multiple: 4.0, mvicValue: $400K, probability: 0.4},
//   {stdDev: 1, multiple: 4.75, mvicValue: $475K, probability: 0.2},
//   {stdDev: 2, multiple: 5.5, mvicValue: $550K, probability: 0.1}
// ]
// expectedValue = $400K
```

**Interpretation**: Shows likely valuation range (what buyer might pay depending on market conditions)

---

## Layer 7: Wealth Gap Calculator

**Purpose**: Project years to reach target valuation given growth and margin assumptions

**Inputs**:
```
growthRate (annual % growth)
profitMargin (EBITDA margin %)
multiple (EBITDA multiple)
yearsToExit (projection period, e.g., 5-10 years)
initialRevenue (starting revenue)
initialEBITDA (starting EBITDA)
targetValue (desired exit valuation)
```

### Yearly Projections
```javascript
for (let year = 0; year <= yearsToExit; year++) {

  // Project revenue with compound growth
  revenue[year] = initialRevenue × Math.pow(1 + growthRate, year)

  // Project EBITDA with consistent margin
  ebitda[year] = revenue[year] × profitMargin

  // Project sale price at multiple
  salePrice[year] = ebitda[year] × multiple
}

// Resulting table:
// Year 0: Rev=$1M, EBITDA=$100K, SalePrice=$400K
// Year 1: Rev=$1.2M, EBITDA=$120K, SalePrice=$480K
// Year 2: Rev=$1.44M, EBITDA=$144K, SalePrice=$576K
// Year 3: Rev=$1.73M, EBITDA=$173K, SalePrice=$691K
// Year 4: Rev=$2.07M, EBITDA=$207K, SalePrice=$829K
// Year 5: Rev=$2.49M, EBITDA=$249K, SalePrice=$995K
```

### Years to Reach Target
```javascript
// Excel formula (logarithmic):
yearsToExit = -1 × ( LN(targetValue / currentValue) / LN(1 / (1 + growthRate)) )

// Simplified:
yearsToExit = LN(targetValue / currentValue) / LN(1 + growthRate)

// Example:
// Current Value: $400K
// Target Value: $1M (2.5x growth)
// Growth Rate: 15%
// yearsToExit = LN(1M/400K) / LN(1.15) = LN(2.5) / LN(1.15)
//            = 0.916 / 0.1398 = 6.55 years
```

---

## API Response Structure

**Backend must return this exact structure**:

```javascript
{
  // Risk Analysis Result
  riskScore: 45,  // 1-70 scale
  riskCategory: "MEDIUM",  // HIGH, MEDIUM, LOW

  // Earnings Summary
  EBITDA: 125000,
  EBITDA_margin: 0.125,  // 12.5%

  // Multiple Information
  multipleUsed: 4.0,
  multipleType: "industry",  // custom, common, industry

  // Current Valuation
  currentValue: 500000,

  // Value Acceleration Levers
  uplift: {
    size: {
      description: "Revenue growth to $1.5M",
      targetGrowthRate: 0.25,  // 25%
      newRevenue: 1500000,
      newEBITDA: 187500,
      newValue: 750000,
      value: 250000,
      percent: 0.50  // 50% increase
    },

    efficiency: {
      description: "Improve margin from 12.5% to 15%",
      targetImprovement: 0.025,
      efficiencyGain: 50000,
      newEBITDA: 175000,
      newValue: 700000,
      value: 200000,
      percent: 0.40  // 40% increase
    },

    multiple: {
      description: "Risk reduction - multiple 4x to 5x",
      targetMultipleIncrease: 0.25,  // 25%
      newMultiple: 5.0,
      newValue: 625000,
      value: 125000,
      percent: 0.25  // 25% increase
    },

    // Combined (if all levers applied)
    totalIncrease: 575000,  // $500K → $1.075M
    totalIncreasePercent: 1.15,  // 115% increase
    newTotalValue: 1075000
  },

  // Probability Distribution
  probabilityDistribution: [
    {
      stdDev: -2,
      multiple: 2.5,
      mvicValue: 312500,
      probability: 0.1,
      percentile: "10th"
    },
    {
      stdDev: -1,
      multiple: 3.25,
      mvicValue: 406250,
      probability: 0.2,
      percentile: "30th"
    },
    {
      stdDev: 0,
      multiple: 4.0,
      mvicValue: 500000,
      probability: 0.4,
      percentile: "50th (median)"
    },
    {
      stdDev: 1,
      multiple: 4.75,
      mvicValue: 593750,
      probability: 0.2,
      percentile: "70th"
    },
    {
      stdDev: 2,
      multiple: 5.5,
      mvicValue: 687500,
      probability: 0.1,
      percentile: "90th"
    }
  ],
  expectedValue: 500000,

  // Wealth Gap / Exit Projection
  wealthGap: {
    targetValue: 1000000,
    currentValue: 500000,
    yearsToExit: 6.55,
    assumedGrowthRate: 0.15,
    assumedMargin: 0.125,
    yearlyTable: [
      {
        year: 0,
        revenue: 1000000,
        EBITDA: 125000,
        salePrice: 500000,
        progressToTarget: 0.50  // 50% of way to target
      },
      {
        year: 1,
        revenue: 1150000,
        EBITDA: 143750,
        salePrice: 575000,
        progressToTarget: 0.575
      },
      // ... years 2-6
      {
        year: 6,
        revenue: 2313060,
        EBITDA: 289132,
        salePrice: 1156530,
        progressToTarget: 1.157  // Exceeds target
      }
    ]
  }
}
```

---

## Validation Requirements

**Accuracy Standards** (must match Excel):
- ✅ Risk score: **Exact match** (integer)
- ✅ EBITDA: **±0.01% deviation**
- ✅ Current Value: **±0.01% deviation**
- ✅ Uplift calculations: **±0.01% deviation**
- ✅ Distribution multiples: **Exact match**
- ✅ Wealth gap: **Nearest dollar**

**Test Cases Required**:
The business will provide sample Excel files with test data.
Backend must produce identical outputs within tolerance.

**Implementation Checklist**:
- [ ] All 14 risk questions scoring implemented
- [ ] EBITDA calculation (baseline vs. actual) working
- [ ] Multiple selection logic (custom/common/industry) working
- [ ] Current value calculation correct
- [ ] Size lever calculations correct
- [ ] Efficiency lever calculations correct
- [ ] Multiple lever calculations correct
- [ ] Probability distribution generating correct bands
- [ ] Expected value calculation correct
- [ ] Wealth gap / years to exit calculation correct
- [ ] API response structure matches spec
- [ ] Test cases pass with <±0.01% tolerance
- [ ] Documented all dropdown → score mappings
- [ ] Documented all formulas for future maintenance

---

## Implementation Notes

### Data Types
- Use **double precision floating point** (64-bit) for all calculations
- Risk scores can be integers
- Currency values should round to nearest cent ($0.01)

### Input Sanitization
- Strip commas from numeric input (e.g., "$1,000,000" → 1000000)
- Validate dropdown values against exact Excel categories
- Handle missing values gracefully (use baseline method)

### Deterministic Output
- No randomization in calculations
- Same inputs = same outputs always
- Support batch recalculation if assumptions change

### Performance
- Single valuation should calculate in <1 second
- Probability distribution (5 bands) instant
- Wealth gap table (10 years) instant

### Batch Processing
- Support uploading CSV with multiple businesses
- Recalculate all with formula changes
- Export results to CSV

---

## Critical Questions for Business Team

1. **Multiple Selection**: Where do "common multiples" come from? Pre-defined list? Industry averages?
2. **Risk Weighting Formula**: Exact discount/premium percentages for each risk category?
3. **Baseline Margins**: Are 7.5% pre-tax, 1% D&A, 1% interest fixed? Or industry-dependent?
4. **Customer Concentration Q8**: The ranges overlap ("5-15%" and "Under 5%"). What's the correct mapping?
5. **Value Acceleration Targets**: Who sets EA, E, M values? Owner? Advisor? Pre-defined?
6. **Probability Distribution**: Always 5 bands with [0.1, 0.2, 0.4, 0.2, 0.1] probabilities? Or configurable?
7. **Wealth Gap Period**: Always 10 years? Or configurable?
8. **Test Excel Files**: When will sample XLSX test cases be provided for validation?

---

## Integration with Implementation Plan

### Phase 6 Deliverable
This specification defines the **complete VAC calculation engine** for Phase 6 of IMPLEMENTATION_PLAN_VAC_MVA.md.

**Acceptance Criteria**:
- ✅ All calculations implemented exactly per this spec
- ✅ Test cases pass with <±0.01% tolerance
- ✅ API response structure matches spec
- ✅ Performance <1 second per calculation
- ✅ 95% code coverage on calculation logic
- ✅ Documented edge cases and error handling

**Related Deliverables**:
- Phase 2: Questionnaire engine (collects 14 risk questions)
- Phase 2: Step 2 financial data (EBITDA inputs)
- Phase 3: Multiple selection UI (custom/common/industry)
- Phase 5: Advisor override capability (change assumptions)
- Phase 6: Value acceleration levers UI (EA, E, M inputs)
- Phase 6: This calculation engine
- Phase 7: Report generation (displays all outputs)

---

**Status**: ✅ Technical Specification Complete
**Owner**: Development Team
**Next Action**: Obtain test Excel files for validation
**Priority**: Critical - Core feature
