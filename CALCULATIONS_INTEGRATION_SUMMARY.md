# Calculations Integration Summary
**Status**: Updated Planning with Calculation Specifications
**Date**: 2025-11-24
**Impact**: Significantly more detailed than initial VAC spec

---

## What Changed

The **calculations.txt** file provided exact formulas from the Excel vac.xls sheet. This fundamentally refines the VAC engine from conceptual to production-ready specification.

### Previous vs. Current Understanding

| Aspect | Initial Plan | Calculations.txt | Impact |
|--------|--------------|------------------|--------|
| **Risk Questions** | 15 questions (generic) | **14 specific questions** with exact scoring | More precise, must match Excel |
| **Risk Scoring** | 0-100 scale | **1-70 scale** (sum of 14 questions) | Different risk categories |
| **EBITDA Calculation** | Simple formula | **Two methods**: baseline (if no financials) vs. actual | More sophisticated, handles missing data |
| **Value Acceleration** | 3 levers mentioned | **3 levers fully specified** with exact formulas | Complex calculations, must match Excel ±0.01% |
| **Probability Distribution** | Conceptual | **5-band distribution** with specific probabilities [0.1,0.2,0.4,0.2,0.1] | Bell curve visualization |
| **Wealth Gap** | Mentioned | **Full logarithmic formula** with yearly projections | Can project years to target value |
| **Output Structure** | Basic fields | **30+ fields** in detailed response structure | Comprehensive API response |
| **Accuracy Required** | Not specified | **±0.01% deviation** from Excel | Strict validation required |

---

## 7 Calculation Layers (Now Fully Specified)

### Layer 1: Risk Score (14 Questions)
✅ **NOW SPECIFIED**: Exact scoring for each of 14 risk questions
- Fiscal year end
- Incorporated status
- Profit last year
- Profit last 6 months
- Clean accountant financials (years)
- Has general manager
- Project-based revenue
- Largest customer concentration
- Owner hours per week
- Lease years remaining
- Company age
- Operating system/technology
- Payment terms
- Number of SPOFs

**Output**: Risk score 1-70 (higher = lower risk)

---

### Layer 2: Earnings Analysis
✅ **NOW SPECIFIED**: Baseline vs. actual method
- If detailed financials missing: use baseline margins (7.5% pre-tax, 1% D&A, 1% interest)
- If detailed financials available: use actual + adjustments
- Add owner salary adjustment + rent adjustment
- Calculate EBITDA margin

**Output**: EBITDA, EBITDA margin

---

### Layer 3: Multiple Selection
✅ **NOW SPECIFIED**: Three methods
1. Custom multiple (free-form input)
2. Common multiples (pre-defined list - needs clarification)
3. Industry multiple (by NAICS code - needs benchmark data)
4. Optional risk weighting (discount/premium based on risk score)

**Output**: Multiple used (2.0x - 10.0x typical range)

---

### Layer 4: Current Value
✅ **FULLY SPECIFIED**:
```
currentValue = EBITDA × multipleUsed
```

**Output**: Current enterprise value (baseline)

---

### Layer 5: Value Acceleration (3 Levers)
✅ **NOW FULLY SPECIFIED**: Each lever independently calculated

**Lever 1 - Size** (Revenue growth):
- Input: Target growth rate (e.g., 25% growth)
- Calculate: New revenue, new EBITDA, new value at same multiple
- Output: Dollar increase + percent increase in valuation

**Lever 2 - Efficiency** (Margin improvement):
- Input: Target margin improvement (e.g., 2% improvement)
- Calculate: Efficiency gain in EBITDA, new value at same multiple
- Output: Dollar increase + percent increase in valuation

**Lever 3 - Multiple** (Risk reduction):
- Input: Target multiple increase (e.g., 25% increase)
- Calculate: New multiple, new value at improved multiple
- Output: Dollar increase + percent increase in valuation

**Combined**: Total potential if all 3 levers applied

**Output**: Size uplift, Efficiency uplift, Multiple uplift, Combined total

---

### Layer 6: Probability Distribution
✅ **NOW FULLY SPECIFIED**: 5-band bell curve
- Standard deviations: -2, -1, 0, +1, +2
- Probabilities: [0.1, 0.2, 0.4, 0.2, 0.1]
- Each band shows: multiple, MVIC value, probability
- Aggregate: Expected value (weighted average)

**Output**: Distribution array + expected value

---

### Layer 7: Wealth Gap / Exit Projection
✅ **NOW FULLY SPECIFIED**: Logarithmic formula
- Input: Target value, growth rate, margin, multiple, years to project
- Output: Yearly table (year, revenue, EBITDA, sale price)
- Calculates: Years to reach target (yearsToExit formula)

**Output**: Yearly projections + years to target

---

## API Response Structure (Now Detailed)

The backend must return **30+ fields** in this exact structure:

```javascript
{
  // Risk & Fundamentals
  riskScore,           // 1-70
  riskCategory,        // HIGH, MEDIUM, LOW

  // Earnings
  EBITDA,
  EBITDA_margin,

  // Multiple
  multipleUsed,
  multipleType,

  // Current Value
  currentValue,

  // Value Acceleration
  uplift: {
    size: { description, targetGrowthRate, newRevenue, newEBITDA, newValue, value, percent },
    efficiency: { description, targetImprovement, efficiencyGain, newEBITDA, newValue, value, percent },
    multiple: { description, targetMultipleIncrease, newMultiple, newValue, value, percent },
    totalIncrease,
    totalIncreasePercent,
    newTotalValue
  },

  // Probability Distribution
  probabilityDistribution: [
    { stdDev, multiple, mvicValue, probability, percentile }
  ],
  expectedValue,

  // Wealth Gap
  wealthGap: {
    targetValue,
    currentValue,
    yearsToExit,
    assumedGrowthRate,
    assumedMargin,
    yearlyTable: [
      { year, revenue, EBITDA, salePrice, progressToTarget }
    ]
  }
}
```

---

## Critical Implementation Details

### Exact Formulas (From calculations.txt)

#### Risk Score
```
riskScore = Q1 + Q2 + Q3 + Q4 + Q5 + Q6 + Q7 + Q8 + Q9 + Q10 + Q11 + Q12 + Q13 + Q14
Range: 1-70
```

#### EBITDA
```
if (detailedFinancialsMissing):
  EBITDA = (revenue × 0.075) + (revenue × 0.01) + (revenue × 0.01) + discretionary
else:
  EBITDA = pretaxProfit + depreciation + interest + discretionary

EBITDA_adjusted = EBITDA + ownerSalaryAdj + rentAdj
```

#### Current Value
```
currentValue = EBITDA_adjusted × multipleUsed
```

#### Size Lever
```
newRevenue = baseRevenue × (1 + EA)
newEBITDA = newRevenue × profitMargin
valueCreatedSize = (newEBITDA × multipleUsed) - currentValue
```

#### Efficiency Lever
```
efficiencyGain = baseRevenue × E
newEBITDA = baseEBITDA + efficiencyGain
valueCreatedEfficiency = (newEBITDA × multipleUsed) - currentValue
```

#### Multiple Lever
```
newMultiple = baseMultiple + (baseMultiple × M)
valueCreatedMultiple = (newMultiple × baseEBITDA) - currentValue
```

#### Years to Exit
```
yearsToExit = LN(targetValue / currentValue) / LN(1 + growthRate)
```

---

## Validation Requirements

**Accuracy Standard**: ±0.01% deviation from Excel
This is **very strict** - must validate with test cases

**Test Cases Needed**:
- [ ] Business with high risk, low valuation
- [ ] Business with low risk, high valuation
- [ ] Business with baseline financials (no detailed data)
- [ ] Business with detailed P&L/Balance Sheet
- [ ] Extreme growth scenario (100%+ growth)
- [ ] Margin improvement scenario (5%+ improvement)
- [ ] Multiple increase scenario (risk reduction)
- [ ] Combined scenario (all 3 levers)

**Critical Success**: Backend output must match Excel to ±0.01%

---

## Integration with Previous Planning Docs

### How Calculations.txt Refines the Plan

**1. VAC_QUESTIONNAIRE_SPECIFICATION.md**
- **Was**: Generic 15 risk questions
- **Now**: Exact 14 questions with specific scoring per calculations.txt
- **Action**: Update Risk Analysis section with exact question wording & scoring

**2. IMPLEMENTATION_PLAN_VAC_MVA.md - Phase 6**
- **Was**: General "valuation calculation engine"
- **Now**: Highly specific 7-layer calculation with exact formulas
- **Action**: Replace Phase 6 description with VAC_CALCULATION_ENGINE_SPECIFICATION.md content

**3. Database Schema**
- **Added**: Fields for all 14 risk question responses
- **Added**: Fields for uplift calculations (size, efficiency, multiple)
- **Added**: Probability distribution storage
- **Added**: Wealth gap projection data

**4. API Specification**
- **Changed**: POST /api/valuations response structure (30+ fields now)
- **Changed**: Input validation (14 specific questions, exact mappings)
- **Changed**: Output structure (matches exact API response spec)

---

## Questions Answered by Calculations.txt

✅ **What are the 14 risk questions?** - Fully specified
✅ **How is risk scored?** - Exact 1-5 point mapping per question
✅ **How is EBITDA calculated?** - Two methods specified (baseline vs. actual)
✅ **How are value levers calculated?** - Exact formulas provided
✅ **What's the probability distribution?** - 5-band bell curve specified
✅ **How to project wealth gap?** - Logarithmic formula provided

## Questions Still Needing Clarification

❓ **Common Multiples**: Where do they come from? Pre-defined list by industry? By business size?
❓ **Industry Multiples**: Complete NAICS mapping with multiples?
❓ **Baseline Margins**: Are 7.5% pre-tax, 1% D&A, 1% interest fixed forever? Or update-able by admin?
❓ **Risk Weighting**: Exact discount/premium percentages? (Currently unclear if 0.75, 1.0, 1.15 or different)
❓ **Customer Concentration Q8**: Ranges overlap ("5-15%" and "Under 5%") - which is correct?
❓ **Value Acceleration Targets (EA, E, M)**: Pre-defined? Owner input? Advisor-suggested?
❓ **Test Cases**: When will sample Excel files be provided for validation?

---

## Updated Timeline Impact

**Phase 6 Complexity**: Increased significantly
- **Before**: "Implement valuation calculation"
- **Now**: Implement 7 specific calculation layers with ±0.01% accuracy requirement

**Estimated Additional Work**:
- +1 week for detailed implementation (now 4-5 weeks total)
- +1 week for validation testing against Excel
- +2-3 days for documentation of edge cases

**Revised Phase 6**: 4-5 weeks → **5-6 weeks**

**Total Plan Timeline**: 26 weeks → **26-27 weeks** (minimal impact)

---

## Updated Success Criteria for Phase 6

### Previous Criteria
- ✅ Full VAC calculation working
- ✅ Risk scoring working
- ✅ Value drivers identified
- ✅ Improvement suggestions generated

### Updated Criteria (Per Calculations.txt)
- ✅ All 14 risk questions implemented with exact scoring
- ✅ EBITDA calculation (baseline + actual method) working
- ✅ Multiple selection (custom/common/industry) working
- ✅ Current value calculated correctly
- ✅ Size lever calculation matches Excel ±0.01%
- ✅ Efficiency lever calculation matches Excel ±0.01%
- ✅ Multiple lever calculation matches Excel ±0.01%
- ✅ Probability distribution (5-band) generating correctly
- ✅ Expected value calculation correct
- ✅ Wealth gap projection (years to exit) accurate
- ✅ API response structure matches spec exactly
- ✅ All test cases pass (when provided)
- ✅ <1 second performance per calculation
- ✅ 95% code coverage on calculation logic
- ✅ Documented all 14 risk question mappings
- ✅ Documented all 7 calculation layers
- ✅ Edge cases documented (missing data, extreme values, etc.)

---

## New Document Files Created

1. **VAC_CALCULATION_ENGINE_SPECIFICATION.md** (New)
   - Complete technical specification of VAC engine
   - All 7 calculation layers with exact formulas
   - API response structure
   - Validation requirements
   - Implementation checklist

2. **CALCULATIONS_INTEGRATION_SUMMARY.md** (This document)
   - Summary of what calculations.txt changed
   - Integration with existing planning docs
   - Updated timeline and success criteria
   - Questions still needing clarification

---

## Action Items

### Immediate (This Week)
1. **Review** VAC_CALCULATION_ENGINE_SPECIFICATION.md
2. **Confirm** all 14 risk question mappings (especially Q8 with overlapping ranges)
3. **Provide** test Excel files for validation
4. **Clarify** unknown questions (common multiples, baseline margins, risk weighting %)

### For Phase 2 (Questionnaire Engine)
- Implement exact 14 risk questions with specified scoring
- Validate dropdown options match Excel exactly

### For Phase 6 (Calculation Engine)
- Implement all 7 layers per VAC_CALCULATION_ENGINE_SPECIFICATION.md
- Create test suite with Excel validation
- Achieve ±0.01% accuracy tolerance
- Document all edge cases and assumptions

### For Phase 7 (Reports)
- Display all 30+ output fields from API response
- Show probability distribution as chart
- Display wealth gap table with yearly projections
- Include risk score and category interpretation

---

## Summary

The **calculations.txt** file transformed the VAC specification from **conceptual to production-ready**.

### What We Now Have
✅ Exact 14 risk questions with scoring
✅ Exact EBITDA calculation logic (2 methods)
✅ Exact formulas for all 3 value levers
✅ Exact probability distribution formula
✅ Exact wealth gap / years to exit formula
✅ Exact API response structure (30+ fields)
✅ Strict validation requirement (±0.01%)

### What We Still Need
❓ Confirmation of 14 risk question mappings
❓ Test Excel files for validation
❓ Clarification on unknowns (multiples, baseline margins, weighting)
❓ Complete benchmark data (NAICS × multiples)

### Impact on Implementation
- More precise, less ambiguity
- Harder to implement (must match Excel exactly)
- More time for testing/validation
- Phase 6 timeline: +1 week
- Overall plan: minimal impact (26→27 weeks)

---

**Status**: ✅ Calculations Integrated into Plan
**Next Action**: Review unknowns, provide test cases
**Owner**: Product Team (clarifications), Dev Team (implementation)
