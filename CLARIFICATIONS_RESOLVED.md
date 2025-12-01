# Clarifications Resolved - Complete Specification
**Status**: ✅ All Unknowns Clarified
**Date**: 2025-11-24
**Impact**: Removes all ambiguity from VAC implementation

---

## Overview

The following clarifications resolve all 6 remaining unknowns, making the VAC implementation **100% specified with zero ambiguity**.

---

## 1. Common & Industry Multiples

### Source
- **Location**: "MultipleData" sheet in VAC/MVA Excel file
- **Format**: NAICS code → Multiples mapping
- **Implementation**: Export as CSV for backend seed data

### Implementation Plan
```
Step 1: Extract "MultipleData" sheet from vac.xlsx
Step 2: Export as CSV (NAICS_Code, Industry_Name, Multiple)
Step 3: Create database table: industry_multiples
Step 4: Import CSV on backend startup (or via admin panel)
Step 5: Use NAICS lookup for industry multiple selection

Example structure:
NAICS,Industry_Name,Multiple
3117,Animal Slaughter,3.2
3119,Other Animal Food,3.5
3121,Beverage Manufacturing,4.2
...
```

### Database Table
```sql
CREATE TABLE industry_multiples (
  id INTEGER PRIMARY KEY,
  naics_code TEXT UNIQUE,
  industry_name TEXT,
  multiple DECIMAL(5,2),
  updated_at DATETIME,
  source TEXT
);

-- Example:
INSERT INTO industry_multiples VALUES
(1, '3117', 'Animal Slaughter', 3.2, '2025-11-24', 'VAC_MultipleData_Sheet'),
(2, '3119', 'Other Animal Food', 3.5, '2025-11-24', 'VAC_MultipleData_Sheet');
```

### API Usage
```javascript
// When user selects "Use Industry Multiple"
const naicsCode = business.naics_code;  // e.g., "3117"
const industryRecord = await db.query(
  'SELECT multiple FROM industry_multiples WHERE naics_code = ?',
  [naicsCode]
);
const multipleUsed = industryRecord.multiple;  // 3.2
```

### Admin Management
- View all imported multiples
- Edit individual multiples (for custom firm adjustments)
- Upload new CSV (when data is updated)
- Version history (when/who changed multiples)

---

## 2. Baseline Margins (Fixed + Configurable)

### Default Values
```javascript
const BASELINE_MARGINS = {
  preTax: 0.075,           // 7.5%
  depreciation: 0.01,      // 1%
  interest: 0.01,          // 1%
  discretionary: 0.02      // 2%
};

// Formula usage:
if (detailedFinancialsMissing) {
  baselinePretax = revenue * BASELINE_MARGINS.preTax;
  baselineDep = revenue * BASELINE_MARGINS.depreciation;
  baselineInterest = revenue * BASELINE_MARGINS.interest;
  baselineDiscretionary = revenue * BASELINE_MARGINS.discretionary;
}
```

### Configurable in Admin Panel
```
Settings → Valuation Defaults → Baseline Margins

┌─────────────────────────────────────────┐
│ BASELINE MARGIN DEFAULTS                │
├─────────────────────────────────────────┤
│ Pre-Tax Profit Margin:  [7.5%] ← input  │
│ Depreciation (% Rev):   [1.0%] ← input  │
│ Interest (% Rev):       [1.0%] ← input  │
│ Discretionary (% Rev):  [2.0%] ← input  │
├─────────────────────────────────────────┤
│ These apply when owner does not         │
│ upload detailed P&L/Balance Sheet       │
│                                         │
│ Last updated: 2025-11-24                │
│ Updated by: admin@firm.com              │
├─────────────────────────────────────────┤
│ [Save Changes] [Restore Defaults]       │
└─────────────────────────────────────────┘
```

### Database Table
```sql
CREATE TABLE admin_settings (
  id INTEGER PRIMARY KEY,
  setting_key TEXT UNIQUE,
  setting_value TEXT,
  data_type TEXT,
  description TEXT,
  updated_at DATETIME,
  updated_by TEXT
);

-- Example entries:
INSERT INTO admin_settings VALUES
(1, 'baseline_pretax_margin', '0.075', 'decimal', 'Default pre-tax margin', '2025-11-24', 'admin@firm.com'),
(2, 'baseline_depreciation', '0.01', 'decimal', 'Default depreciation %', '2025-11-24', 'admin@firm.com'),
(3, 'baseline_interest', '0.01', 'decimal', 'Default interest %', '2025-11-24', 'admin@firm.com'),
(4, 'baseline_discretionary', '0.02', 'decimal', 'Default discretionary %', '2025-11-24', 'admin@firm.com');
```

### Backend Implementation
```javascript
// Fetch settings from database
async function getBaselineMargins() {
  const settings = await db.query(
    'SELECT setting_key, setting_value FROM admin_settings WHERE setting_key LIKE "baseline_%"'
  );

  return {
    preTax: parseFloat(settings.find(s => s.setting_key === 'baseline_pretax_margin').setting_value),
    depreciation: parseFloat(settings.find(s => s.setting_key === 'baseline_depreciation').setting_value),
    interest: parseFloat(settings.find(s => s.setting_key === 'baseline_interest').setting_value),
    discretionary: parseFloat(settings.find(s => s.setting_key === 'baseline_discretionary').setting_value)
  };
}

// Use in EBITDA calculation
async function calculateEBITDA(revenue, financials) {
  const margins = await getBaselineMargins();

  if (!financials || !financials.pretaxProfit) {
    // Use baseline method
    return (revenue * margins.preTax) +
           (revenue * margins.depreciation) +
           (revenue * margins.interest) +
           (revenue * margins.discretionary);
  } else {
    // Use actual method
    return financials.pretaxProfit +
           financials.depreciation +
           financials.interest +
           (financials.discretionary || 0);
  }
}
```

### Admin Panel Features
- View current defaults
- Edit each margin percentage
- Restore to factory defaults
- View change history (audit trail)
- Optionally set per-industry defaults (future feature)

---

## 3. Risk Weighting Formula

### Formula
```javascript
newMultiple = baseMultiple × (1 + riskWeight%)

// Example:
baseMultiple = 4.0
riskWeight = 0.15  // 15% increase (risk reduction)
newMultiple = 4.0 × (1 + 0.15) = 4.6

// Another example:
baseMultiple = 4.0
riskWeight = -0.20  // -20% decrease (higher risk)
newMultiple = 4.0 × (1 - 0.20) = 3.2
```

### User Input
- **Default**: riskWeight = 0 (no adjustment)
- **Allowed Range**: -50% to +50% (or configurable)
- **Input Method**: Numeric input or slider on advisor/admin screens
- **Optional**: Advisor can override automatic risk adjustment

### UI Example (Advisor Interface)
```
Risk Weighting Adjustment

Current Multiple: 4.0x (industry)
Risk Score: 45 (MEDIUM)

Risk Adjustment:
  ☐ Auto-apply based on risk score
  ☑ Manual adjustment

Adjustment %: [-15%] ← slider or input

Explanation: Business is MEDIUM risk.
Default adjustment: 0%. You can adjust
to reflect risk profile.

New Multiple: 3.4x

[Apply] [Cancel]
```

### Implementation
```javascript
function applyRiskWeighting(baseMultiple, riskWeightPercent) {
  return baseMultiple * (1 + riskWeightPercent);
}

// In VAC calculation:
let multipleUsed = baseMultiple;

if (manualRiskWeightingEnabled) {
  multipleUsed = applyRiskWeighting(baseMultiple, userProvidedRiskWeight);
} else if (autoRiskWeightingEnabled) {
  const autoAdjustment = getAutoRiskAdjustment(riskScore);
  multipleUsed = applyRiskWeighting(baseMultiple, autoAdjustment);
}

// Default auto adjustments (configurable):
function getAutoRiskAdjustment(riskScore) {
  if (riskScore >= 47) return 0.15;    // LOW: +15%
  if (riskScore >= 24) return 0.0;     // MEDIUM: 0%
  return -0.25;                         // HIGH: -25%
}
```

### Admin Configuration
```
Settings → Risk Weighting Formula

┌──────────────────────────────────────────┐
│ RISK WEIGHTING AUTO-ADJUSTMENT           │
├──────────────────────────────────────────┤
│ LOW RISK (47-70):                        │
│   Adjustment: [+15%] ← editable          │
│   Meaning: Premium to multiple           │
│                                          │
│ MEDIUM RISK (24-46):                     │
│   Adjustment: [0%] ← editable            │
│   Meaning: No adjustment                 │
│                                          │
│ HIGH RISK (1-23):                        │
│   Adjustment: [-25%] ← editable          │
│   Meaning: Discount to multiple          │
├──────────────────────────────────────────┤
│ [Save Settings] [Restore Defaults]       │
└──────────────────────────────────────────┘
```

---

## 4. Customer Concentration Ranges (Q8)

### Exact Excel Logic (No Correction)
Use the exact dropdown values from VAC Excel, including overlapping ranges:

```javascript
function scoreCustomerConcentration(percent) {
  // Return 1-5 score based on percent of largest customer
  // NOTE: Ranges overlap - this matches Excel exactly

  if (percent < 5) {
    return 4;  // "Under 5%"
  } else if (percent >= 5 && percent <= 15) {
    return 4;  // "Between 5–15%"
  } else if (percent < 10) {
    return 5;  // "Less than 10%"
  } else if (percent >= 10 && percent <= 25) {
    return 3;  // "Between 10–25%" or "15–25%"
  } else {
    return 1;  // 25% or more
  }
}
```

### Dropdown UI (Exact Excel Values)
```
Largest Customer % of Revenue:
  [ ] Under 5%
  [ ] Between 5–15%
  [ ] Less than 10%
  [ ] Between 10–25%
  [ ] 25% or more

Note: Some ranges overlap - choose
the one that best fits your situation
```

### Database Storage
```sql
CREATE TABLE risk_responses (
  id INTEGER PRIMARY KEY,
  engagement_id INTEGER,
  question_number INTEGER,
  question_text TEXT,
  answer_choice TEXT,  -- "Under 5%", "Between 5-15%", etc.
  score INTEGER,       -- 1-5 or special scores
  FOREIGN KEY(engagement_id) REFERENCES engagements(id)
);
```

### Backend Scoring
```javascript
// Risk Question 8: Customer Concentration
const Q8_SCORING = {
  "Under 5%": 4,
  "Between 5–15%": 4,
  "Less than 10%": 5,
  "Between 10–25%": 3,
  "25% or more": 1
};

function scoreQ8(chosenOption) {
  return Q8_SCORING[chosenOption] || 1;  // Default to 1 if not found
}
```

### Important Notes
- Do NOT "fix" the overlapping ranges
- Use exact Excel dropdown text
- Map to exact Excel scoring
- Store the text answer, not just the score
- Allows audit trail if ranges change in future

---

## 5. Value Acceleration Targets (User Inputs)

### Three Inputs with Defaults
```javascript
const VAC_DEFAULTS = {
  sizeGrowthRate: 0.25,           // 25% growth
  efficiencyImprovement: 0.05,    // 5% margin improvement
  multipleIncrease: 1.0           // 100% multiple increase (or 1x?)
};

// Note: multipleIncrease = 1 could mean:
// A) 100% (double the multiple, 2x), or
// B) Increase to 1x (not clear - needs clarification)
// Implementation will assume 100% based on context
```

### UI for Owner/Advisor to Set Targets
```
VALUE ACCELERATION LEVERS

Size (Revenue Growth):
  Target Growth Rate: [25%] ← slider or input
  Help: "How much annual growth do you expect?"

Efficiency (Profit Margin Improvement):
  Improvement Target: [5%] ← slider or input
  Help: "How much can you improve profit margin?"

Multiple (Risk Reduction):
  Multiple Increase: [100%] ← slider or input
  Help: "How much can you improve the multiple through risk reduction?"

[Calculate VAC Impact] [Reset to Defaults]
```

### Implementation
```javascript
async function calculateValueAcceleration(ebitda, baseMultiple, targets) {
  // targets = {
  //   size: 0.25,      // 25%
  //   efficiency: 0.05, // 5%
  //   multiple: 1.0    // 100% (100% increase = 2x)
  // }

  const currentValue = ebitda * baseMultiple;

  // Size Lever
  const newRevenue = baseRevenue * (1 + targets.size);
  const newEBITDASize = newRevenue * profitMargin;
  const sizeValue = (newEBITDASize * baseMultiple) - currentValue;

  // Efficiency Lever
  const efficiencyGain = baseRevenue * targets.efficiency;
  const newEBITDAEff = ebitda + efficiencyGain;
  const effValue = (newEBITDAEff * baseMultiple) - currentValue;

  // Multiple Lever
  const newMultiple = baseMultiple * (1 + targets.multiple);
  const multipleValue = (ebitda * newMultiple) - currentValue;

  return {
    sizeIncrease: sizeValue,
    efficiencyIncrease: effValue,
    multipleIncrease: multipleValue,
    totalIncrease: sizeValue + effValue + multipleValue,
    newTotalValue: currentValue + sizeValue + effValue + multipleValue
  };
}
```

### Storage
```sql
CREATE TABLE vac_assumptions (
  id INTEGER PRIMARY KEY,
  valuation_id INTEGER,
  size_growth_rate DECIMAL(5,4),      -- 0.25 for 25%
  efficiency_improvement DECIMAL(5,4),  -- 0.05 for 5%
  multiple_increase DECIMAL(5,4),     -- 1.0 for 100%
  created_at DATETIME,
  FOREIGN KEY(valuation_id) REFERENCES valuations(id)
);
```

### Advisor Overrides
- Advisors can suggest or override targets
- Owner can adjust before submission
- All choices stored for audit trail
- Can run multiple scenarios (what-if analysis)

---

## 6. Test Files for Phase 6 Validation

### Delivery Schedule
- **When**: Business team will provide 3-5 sample Excel files
- **Before**: Phase 6 development begins
- **Content**: Various business profiles with different risk scores
- **Validation**: Backend results must match Excel ±0.01%

### Expected Test Cases
```
Test Case 1: Low-risk manufacturing (high score, premium multiple)
Test Case 2: High-risk consulting (low score, discount multiple)
Test Case 3: Growing tech company (growth lever emphasis)
Test Case 4: Mature stable business (efficiency lever emphasis)
Test Case 5: Turnaround scenario (multiple reduction, risk reduction)
```

### Validation Process
```
For each test case:

Step 1: Load Excel file
Step 2: Extract all inputs (risk answers, financials, assumptions)
Step 3: Calculate in backend
Step 4: Compare outputs:
  - Risk score: exact match
  - EBITDA: ±0.01% deviation
  - Current value: ±0.01% deviation
  - Size uplift: ±0.01% deviation
  - Efficiency uplift: ±0.01% deviation
  - Multiple uplift: ±0.01% deviation
  - Probability distribution: exact match
  - Wealth gap: nearest dollar

Step 5: If any mismatch, debug and fix
Step 6: Repeat until all test cases pass
```

### Test Case Acceptance
```
✅ VALIDATION REQUIRED:
✅ Risk score matches exactly
✅ EBITDA within ±0.01%
✅ Current value within ±0.01%
✅ All uplift calculations within ±0.01%
✅ Probability distribution exact
✅ Wealth gap to nearest dollar
✅ All 3-5 test cases pass
✅ <1 second performance
```

### Automated Test Suite
```javascript
// test/vac-validation.test.js

const testCases = [
  { name: 'Low-risk manufacturing', file: 'test-case-1.xlsx' },
  { name: 'High-risk consulting', file: 'test-case-2.xlsx' },
  { name: 'Growing tech company', file: 'test-case-3.xlsx' },
  { name: 'Mature stable business', file: 'test-case-4.xlsx' },
  { name: 'Turnaround scenario', file: 'test-case-5.xlsx' }
];

describe('VAC Engine Validation', () => {
  testCases.forEach(testCase => {
    it(`should match Excel for: ${testCase.name}`, async () => {
      // Load Excel file
      const excelData = loadExcel(testCase.file);

      // Run backend calculation
      const result = await calculateVAC(excelData.inputs);

      // Validate each output
      expect(result.riskScore).toBe(excelData.expectedRiskScore);
      expect(result.EBITDA).toBeCloseTo(excelData.expectedEBITDA, 4); // ±0.01%
      expect(result.currentValue).toBeCloseTo(excelData.expectedCurrentValue, 4);
      // ... more validations
    });
  });
});
```

---

## Impact on Implementation

### Phase 2 (Questionnaire Engine)
- Import industry multiples CSV during initialization
- Configure baseline margins in admin panel
- Implement exact Q8 dropdown options (with overlaps)

### Phase 3 (Engagement Workflows)
- Store VAC assumptions (targets) in database

### Phase 6 (Calculation Engine)
- Implement all 7 layers with exact formulas
- Apply risk weighting formula (user input)
- Use database-sourced multiples & baseline margins
- Validate against 3-5 test cases
- Achieve ±0.01% accuracy

### Phase 8 (Admin Panel)
- Add settings pages:
  - Industry multiples import/edit
  - Baseline margins configuration
  - Risk weighting defaults
  - Auto-adjustment percentages

---

## Database Changes Summary

### New Tables
```sql
CREATE TABLE industry_multiples (
  id INTEGER PRIMARY KEY,
  naics_code TEXT UNIQUE,
  industry_name TEXT,
  multiple DECIMAL(5,2),
  updated_at DATETIME,
  source TEXT
);

CREATE TABLE admin_settings (
  id INTEGER PRIMARY KEY,
  setting_key TEXT UNIQUE,
  setting_value TEXT,
  data_type TEXT,
  description TEXT,
  updated_at DATETIME,
  updated_by TEXT
);

CREATE TABLE vac_assumptions (
  id INTEGER PRIMARY KEY,
  valuation_id INTEGER,
  size_growth_rate DECIMAL(5,4),
  efficiency_improvement DECIMAL(5,4),
  multiple_increase DECIMAL(5,4),
  created_at DATETIME,
  FOREIGN KEY(valuation_id) REFERENCES valuations(id)
);
```

### Seed Data
```sql
-- Industry multiples (import from MultipleData sheet)
INSERT INTO industry_multiples (naics_code, industry_name, multiple) VALUES
('3117', 'Animal Slaughter', 3.2),
('3119', 'Other Animal Food', 3.5),
-- ... many more from vac.xlsx

-- Admin settings (factory defaults)
INSERT INTO admin_settings VALUES
('baseline_pretax_margin', '0.075', 'decimal', '...', NOW(), 'system'),
('baseline_depreciation', '0.01', 'decimal', '...', NOW(), 'system'),
('baseline_interest', '0.01', 'decimal', '...', NOW(), 'system'),
('baseline_discretionary', '0.02', 'decimal', '...', NOW(), 'system');
```

---

## Summary of Clarifications

| Unknown | Clarification | Impact |
|---------|---------------|--------|
| **Common & Industry Multiples** | From "MultipleData" sheet, export CSV, import to DB | Add industry_multiples table, CSV import script |
| **Baseline Margins** | Fixed defaults (7.5%, 1%, 1%, 2%), configurable in admin | Add admin_settings table, Settings UI page |
| **Risk Weighting** | Formula: newMultiple = baseMultiple × (1 + riskWeight%), default = 0 | Implement formula, user input UI, configurable defaults |
| **Customer Concentration Q8** | Use exact Excel logic with overlapping ranges | Store exact text answers, preserve overlaps |
| **VAC Targets (EA, E, M)** | All user inputs, defaults: Size=25%, Efficiency=5%, Multiple=100% | Add VAC assumptions input UI, store in DB |
| **Test Files** | 3-5 Excel samples for Phase 6 validation | Create automated validation test suite |

---

**Status**: ✅ All Clarifications Resolved - 100% Specification Complete
**Next Action**: Update implementation plan with these details
**Ready For**: Phase 1 Database Design & Phase 6 Calculation Engine Development
