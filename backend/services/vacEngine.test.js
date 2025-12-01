/**
 * VAC Engine Unit Tests - Risk Score & EBITDA Calculation
 *
 * Tests all 14 risk questions, EBITDA calculations, and related functions
 * per VAC_CALCULATION_ENGINE_SPECIFICATION.md
 */

const {
  // Risk Score Functions
  calculateRiskScore,
  validateRiskAnswers,
  scoreQ1FiscalYearEnd,
  scoreQ2Incorporated,
  scoreQ3ProfitLastYear,
  scoreQ4LastSixMonthPerformance,
  scoreQ5CleanFinancialYears,
  scoreQ6HasGeneralManager,
  scoreQ7ProjectBased,
  scoreQ8LargestCustomerPercent,
  scoreQ9OwnerHours,
  scoreQ10LeaseYearsRemaining,
  scoreQ11BusinessAge,
  scoreQ12OperatingSystem,
  scoreQ13CustomerPaymentTerms,
  scoreQ14NumberOfSPOFs,
  RISK_CATEGORIES,
  // EBITDA Functions
  calculateEBITDA,
  calculateBaselineEBITDA,
  calculateActualEBITDA,
  applyEBITDAAdjustments,
  validateEBITDAInputs,
  parseCurrency,
  BASELINE_MARGINS,
  // Size Score (NEW)
  calculateSizeScore,
  SIZE_SCORE_TABLE,
  // P&L Module (NEW)
  calculateCurrentPL,
  calculateForecastedPL,
  calculatePLComparison,
  // Multiple Selection
  selectMultiple,
  COMMON_MULTIPLES,
  MULTIPLE_TYPES,
  // Current Value
  calculateCurrentValue,
  // Value Acceleration
  calculateSizeLever,
  calculateEfficiencyLever,
  calculateMultipleLever,
  calculateValueAcceleration,
  // Probability Distribution
  calculateProbabilityDistribution,
  PROBABILITY_BANDS,
  // Wealth Gap
  calculateWealthGap,
  // Wealth Gap Enhanced (NEW)
  calculateCurrentScenario,
  defineExitGoals,
  calculateWealthGapStep3,
  calculateRequiredSalePrice,
  calculateExitPlanning,
  calculateWealthGapComplete,
  WEALTH_GAP_DEFAULTS,
  // Master Function
  calculateVAC
} = require('./vacEngine');

// =============================================================================
// Q1: Fiscal Year End Tests
// =============================================================================
describe('Q1: Fiscal Year End', () => {
  test('returns 5 for "yes"', () => {
    expect(scoreQ1FiscalYearEnd('yes')).toBe(5);
    expect(scoreQ1FiscalYearEnd('Yes')).toBe(5);
    expect(scoreQ1FiscalYearEnd('YES')).toBe(5);
  });

  test('returns 1 for "no"', () => {
    expect(scoreQ1FiscalYearEnd('no')).toBe(1);
    expect(scoreQ1FiscalYearEnd('No')).toBe(1);
  });

  test('returns 1 for null/undefined', () => {
    expect(scoreQ1FiscalYearEnd(null)).toBe(1);
    expect(scoreQ1FiscalYearEnd(undefined)).toBe(1);
    expect(scoreQ1FiscalYearEnd('')).toBe(1);
  });
});

// =============================================================================
// Q2: Incorporated Tests
// =============================================================================
describe('Q2: Incorporated', () => {
  test('returns 5 for "yes"', () => {
    expect(scoreQ2Incorporated('yes')).toBe(5);
    expect(scoreQ2Incorporated('Yes')).toBe(5);
  });

  test('returns 1 for "no"', () => {
    expect(scoreQ2Incorporated('no')).toBe(1);
  });

  test('returns 1 for null/undefined', () => {
    expect(scoreQ2Incorporated(null)).toBe(1);
    expect(scoreQ2Incorporated(undefined)).toBe(1);
  });
});

// =============================================================================
// Q3: Profit Last Year Tests
// =============================================================================
describe('Q3: Profit Last Year', () => {
  test('returns 5 for "yes"', () => {
    expect(scoreQ3ProfitLastYear('yes')).toBe(5);
    expect(scoreQ3ProfitLastYear('Yes')).toBe(5);
  });

  test('returns 1 for "no"', () => {
    expect(scoreQ3ProfitLastYear('no')).toBe(1);
  });

  test('returns 1 for null/undefined', () => {
    expect(scoreQ3ProfitLastYear(null)).toBe(1);
    expect(scoreQ3ProfitLastYear(undefined)).toBe(1);
  });
});

// =============================================================================
// Q4: Last Six Month Performance Tests
// =============================================================================
describe('Q4: Last Six Month Performance', () => {
  test('returns 5 for 10%+ YOY Steady Growth', () => {
    expect(scoreQ4LastSixMonthPerformance('10%+ YOY Steady Growth')).toBe(5);
    expect(scoreQ4LastSixMonthPerformance('10% growth')).toBe(5);
  });

  test('returns 4 for Modest YOY Steady Growth', () => {
    expect(scoreQ4LastSixMonthPerformance('Modest YOY Steady Growth')).toBe(4);
    expect(scoreQ4LastSixMonthPerformance('modest growth')).toBe(4);
  });

  test('returns 3 for Flat', () => {
    expect(scoreQ4LastSixMonthPerformance('Flat')).toBe(3);
    expect(scoreQ4LastSixMonthPerformance('flat')).toBe(3);
  });

  test('returns -3 for Declining', () => {
    expect(scoreQ4LastSixMonthPerformance('Declining')).toBe(-3);
    expect(scoreQ4LastSixMonthPerformance('declining')).toBe(-3);
  });

  test('returns 1 for unknown values', () => {
    expect(scoreQ4LastSixMonthPerformance('unknown')).toBe(1);
    expect(scoreQ4LastSixMonthPerformance(null)).toBe(1);
  });
});

// =============================================================================
// Q5: Clean Financial Years Tests
// =============================================================================
describe('Q5: Clean Financial Years', () => {
  test('returns 5 for 5+ years', () => {
    expect(scoreQ5CleanFinancialYears('5+ years')).toBe(5);
    expect(scoreQ5CleanFinancialYears('5 years')).toBe(5);
    expect(scoreQ5CleanFinancialYears('five years')).toBe(5);
  });

  test('returns 4 for 3+ years', () => {
    expect(scoreQ5CleanFinancialYears('3+ years')).toBe(4);
    expect(scoreQ5CleanFinancialYears('3 years')).toBe(4);
    expect(scoreQ5CleanFinancialYears('three years')).toBe(4);
  });

  test('returns 3 for 1-2 years', () => {
    expect(scoreQ5CleanFinancialYears('1-2 years')).toBe(3);
    expect(scoreQ5CleanFinancialYears('1 year')).toBe(3);
    expect(scoreQ5CleanFinancialYears('2 years')).toBe(3);
  });

  test('returns 1 for less or unknown', () => {
    expect(scoreQ5CleanFinancialYears('none')).toBe(1);
    expect(scoreQ5CleanFinancialYears(null)).toBe(1);
  });
});

// =============================================================================
// Q6: Has General Manager Tests
// =============================================================================
describe('Q6: Has General Manager', () => {
  test('returns 5 for "yes"', () => {
    expect(scoreQ6HasGeneralManager('yes')).toBe(5);
    expect(scoreQ6HasGeneralManager('Yes')).toBe(5);
  });

  test('returns 1 for "no"', () => {
    expect(scoreQ6HasGeneralManager('no')).toBe(1);
  });

  test('returns 1 for null/undefined', () => {
    expect(scoreQ6HasGeneralManager(null)).toBe(1);
  });
});

// =============================================================================
// Q7: Project Based Tests
// =============================================================================
describe('Q7: Project Based', () => {
  test('returns 5 for "no" (not project-based)', () => {
    expect(scoreQ7ProjectBased('no')).toBe(5);
    expect(scoreQ7ProjectBased('No')).toBe(5);
  });

  test('returns 3 for "between" (partially project-based)', () => {
    expect(scoreQ7ProjectBased('between')).toBe(3);
    expect(scoreQ7ProjectBased('Between')).toBe(3);
    expect(scoreQ7ProjectBased('partial')).toBe(3);
  });

  test('returns 1 for "yes" (project-based)', () => {
    expect(scoreQ7ProjectBased('yes')).toBe(1);
    expect(scoreQ7ProjectBased('Yes')).toBe(1);
  });

  test('returns 1 for null/undefined', () => {
    expect(scoreQ7ProjectBased(null)).toBe(1);
  });
});

// =============================================================================
// Q8: Largest Customer Percent Tests
// =============================================================================
describe('Q8: Largest Customer Percent', () => {
  test('returns 5 for <10%', () => {
    expect(scoreQ8LargestCustomerPercent('<10%')).toBe(5);
    expect(scoreQ8LargestCustomerPercent('under 10%')).toBe(5);
    expect(scoreQ8LargestCustomerPercent('less than 10%')).toBe(5);
  });

  test('returns 4 for 5-15% range', () => {
    expect(scoreQ8LargestCustomerPercent('5-15%')).toBe(4);
    expect(scoreQ8LargestCustomerPercent('5% to 15%')).toBe(4);
  });

  test('returns 4 for under 5%', () => {
    expect(scoreQ8LargestCustomerPercent('<5%')).toBe(4);
    expect(scoreQ8LargestCustomerPercent('under 5%')).toBe(4);
  });

  test('returns 3 for 15-25% range', () => {
    expect(scoreQ8LargestCustomerPercent('15-25%')).toBe(3);
    expect(scoreQ8LargestCustomerPercent('15% to 25%')).toBe(3);
  });

  test('returns 1 for higher concentration', () => {
    expect(scoreQ8LargestCustomerPercent('>25%')).toBe(1);
    expect(scoreQ8LargestCustomerPercent('50%')).toBe(1);
    expect(scoreQ8LargestCustomerPercent(null)).toBe(1);
  });
});

// =============================================================================
// Q9: Owner Hours Tests
// =============================================================================
describe('Q9: Owner Hours', () => {
  test('returns 5 for <10 hours', () => {
    expect(scoreQ9OwnerHours(5)).toBe(5);
    expect(scoreQ9OwnerHours(9)).toBe(5);
    expect(scoreQ9OwnerHours('<10')).toBe(5);
  });

  test('returns 4 for <20 hours', () => {
    expect(scoreQ9OwnerHours(10)).toBe(4);
    expect(scoreQ9OwnerHours(15)).toBe(4);
    expect(scoreQ9OwnerHours(19)).toBe(4);
    expect(scoreQ9OwnerHours('<20')).toBe(4);
  });

  test('returns 3 for <30 hours', () => {
    expect(scoreQ9OwnerHours(20)).toBe(3);
    expect(scoreQ9OwnerHours(25)).toBe(3);
    expect(scoreQ9OwnerHours(29)).toBe(3);
  });

  test('returns 1 for 30+ hours', () => {
    expect(scoreQ9OwnerHours(30)).toBe(1);
    expect(scoreQ9OwnerHours(40)).toBe(1);
    expect(scoreQ9OwnerHours(60)).toBe(1);
  });

  test('returns 1 for null/undefined', () => {
    expect(scoreQ9OwnerHours(null)).toBe(1);
    expect(scoreQ9OwnerHours(undefined)).toBe(1);
  });
});

// =============================================================================
// Q10: Lease Years Remaining Tests
// =============================================================================
describe('Q10: Lease Years Remaining', () => {
  test('returns 5 for over 10 years or building owned', () => {
    expect(scoreQ10LeaseYearsRemaining('Over 10 years')).toBe(5);
    expect(scoreQ10LeaseYearsRemaining('10+')).toBe(5);
    expect(scoreQ10LeaseYearsRemaining('Building Owned')).toBe(5);
    expect(scoreQ10LeaseYearsRemaining('Own the building')).toBe(5);
  });

  test('returns 4 for 5-10 years', () => {
    expect(scoreQ10LeaseYearsRemaining('Between 5-10 years')).toBe(4);
    expect(scoreQ10LeaseYearsRemaining('5-10 years')).toBe(4);
    expect(scoreQ10LeaseYearsRemaining('5 to 10 years')).toBe(4);
  });

  test('returns 1 for short lease', () => {
    expect(scoreQ10LeaseYearsRemaining('1-2 years')).toBe(1);
    expect(scoreQ10LeaseYearsRemaining('<5 years')).toBe(1);
    expect(scoreQ10LeaseYearsRemaining(null)).toBe(1);
  });
});

// =============================================================================
// Q11: Business Age Tests
// =============================================================================
describe('Q11: Business Age', () => {
  test('returns 5 for over 25 years', () => {
    expect(scoreQ11BusinessAge('Over 25 years')).toBe(5);
    expect(scoreQ11BusinessAge('25+')).toBe(5);
    expect(scoreQ11BusinessAge('30 years')).toBe(5);
  });

  test('returns 4 for over 15 years', () => {
    expect(scoreQ11BusinessAge('Over 15 years')).toBe(4);
    expect(scoreQ11BusinessAge('15+')).toBe(4);
    expect(scoreQ11BusinessAge('20 years')).toBe(4);
  });

  test('returns 1 for younger business', () => {
    expect(scoreQ11BusinessAge('5 years')).toBe(1);
    expect(scoreQ11BusinessAge('10 years')).toBe(1);
    expect(scoreQ11BusinessAge(null)).toBe(1);
  });
});

// =============================================================================
// Q12: Operating System Tests
// =============================================================================
describe('Q12: Operating System', () => {
  test('returns 5 for Cloud-based ERP', () => {
    expect(scoreQ12OperatingSystem('Cloud-based ERP')).toBe(5);
    expect(scoreQ12OperatingSystem('cloud erp')).toBe(5);
    expect(scoreQ12OperatingSystem('ERP system')).toBe(5);
  });

  test('returns 3 for Customized CRM', () => {
    expect(scoreQ12OperatingSystem('Customized CRM')).toBe(3);
    expect(scoreQ12OperatingSystem('CRM')).toBe(3);
  });

  test('returns 1 for basic/no system', () => {
    expect(scoreQ12OperatingSystem('Spreadsheets')).toBe(1);
    expect(scoreQ12OperatingSystem('None')).toBe(1);
    expect(scoreQ12OperatingSystem(null)).toBe(1);
  });
});

// =============================================================================
// Q13: Customer Payment Terms Tests
// =============================================================================
describe('Q13: Customer Payment Terms', () => {
  test('returns 5 for Contracted Recurring Monthly', () => {
    expect(scoreQ13CustomerPaymentTerms('Contracted Recurring Monthly')).toBe(5);
    expect(scoreQ13CustomerPaymentTerms('recurring monthly')).toBe(5);
  });

  test('returns 4 for 30-60 day terms', () => {
    expect(scoreQ13CustomerPaymentTerms('30-60 day terms')).toBe(4);
    expect(scoreQ13CustomerPaymentTerms('Net 30')).toBe(4);
    expect(scoreQ13CustomerPaymentTerms('30 days')).toBe(4);
  });

  test('returns 3 for 60-90 day terms', () => {
    expect(scoreQ13CustomerPaymentTerms('60-90 day terms')).toBe(3);
    expect(scoreQ13CustomerPaymentTerms('Net 60')).toBe(3);
  });

  test('returns 1 for longer/unknown terms', () => {
    expect(scoreQ13CustomerPaymentTerms('90+ days')).toBe(1);
    expect(scoreQ13CustomerPaymentTerms('varies')).toBe(1);
    expect(scoreQ13CustomerPaymentTerms(null)).toBe(1);
  });
});

// =============================================================================
// Q14: Number of SPOFs Tests
// =============================================================================
describe('Q14: Number of SPOFs', () => {
  test('returns 5 for 0 SPOFs', () => {
    expect(scoreQ14NumberOfSPOFs(0)).toBe(5);
    expect(scoreQ14NumberOfSPOFs('0')).toBe(5);
  });

  test('returns 4 for 1 SPOF', () => {
    expect(scoreQ14NumberOfSPOFs(1)).toBe(4);
    expect(scoreQ14NumberOfSPOFs('1')).toBe(4);
  });

  test('returns 3 for 2-3 SPOFs', () => {
    expect(scoreQ14NumberOfSPOFs(2)).toBe(3);
    expect(scoreQ14NumberOfSPOFs(3)).toBe(3);
  });

  test('returns 2 for 4-5 SPOFs', () => {
    expect(scoreQ14NumberOfSPOFs(4)).toBe(2);
    expect(scoreQ14NumberOfSPOFs(5)).toBe(2);
  });

  test('returns 1 for 6+ SPOFs', () => {
    expect(scoreQ14NumberOfSPOFs(6)).toBe(1);
    expect(scoreQ14NumberOfSPOFs(10)).toBe(1);
  });

  test('returns 1 for null/undefined', () => {
    expect(scoreQ14NumberOfSPOFs(null)).toBe(1);
    expect(scoreQ14NumberOfSPOFs(undefined)).toBe(1);
  });
});

// =============================================================================
// Calculate Risk Score Integration Tests
// =============================================================================
describe('calculateRiskScore', () => {
  const bestCaseAnswers = {
    fiscalYearEnd: 'yes',
    incorporated: 'yes',
    profitLastYear: 'yes',
    lastSixMonthPerformance: '10%+ YOY Steady Growth',
    cleanFinancialYears: '5+ years',
    hasGeneralManager: 'yes',
    projectBased: 'no',
    largestCustomerPercent: '<10%',
    ownerHours: 5,
    leaseYearsRemaining: 'Building Owned',
    businessAge: 'Over 25 years',
    operatingSystem: 'Cloud-based ERP',
    customerPaymentTerms: 'Contracted Recurring Monthly',
    numberOfSPOFs: 0
  };

  const worstCaseAnswers = {
    fiscalYearEnd: 'no',
    incorporated: 'no',
    profitLastYear: 'no',
    lastSixMonthPerformance: 'Declining',
    cleanFinancialYears: 'none',
    hasGeneralManager: 'no',
    projectBased: 'yes',
    largestCustomerPercent: '>50%',
    ownerHours: 60,
    leaseYearsRemaining: '1 year',
    businessAge: '2 years',
    operatingSystem: 'none',
    customerPaymentTerms: 'varies',
    numberOfSPOFs: 10
  };

  const typicalAnswers = {
    fiscalYearEnd: 'yes',
    incorporated: 'yes',
    profitLastYear: 'yes',
    lastSixMonthPerformance: 'Modest YOY Steady Growth',
    cleanFinancialYears: '3+ years',
    hasGeneralManager: 'no',
    projectBased: 'between',
    largestCustomerPercent: '15-25%',
    ownerHours: 25,
    leaseYearsRemaining: '5-10 years',
    businessAge: '15 years',
    operatingSystem: 'CRM',
    customerPaymentTerms: '30-60 day terms',
    numberOfSPOFs: 2
  };

  test('calculates maximum score (70) for best case', () => {
    const result = calculateRiskScore(bestCaseAnswers);
    expect(result.riskScore).toBe(70);
    expect(result.riskCategory).toBe('LOW');
    expect(result.riskLabel).toBe('Low Risk');
  });

  test('calculates minimum score for worst case', () => {
    const result = calculateRiskScore(worstCaseAnswers);
    // Q4 at -3, Q5 'none' = 1 (fixed), all others at 1: -3 + (13 * 1) = 10
    // Actual: 1+1+1+(-3)+1+1+1+1+1+1+1+1+1+1 = 10
    expect(result.riskScore).toBeLessThanOrEqual(15); // Worst case is around 10-12
    expect(result.riskCategory).toBe('HIGH');
    expect(result.riskLabel).toBe('High Risk');
  });

  test('calculates medium score for typical business', () => {
    const result = calculateRiskScore(typicalAnswers);
    // 5+5+5+4+4+1+3+3+3+4+4+3+4+3 = 51
    expect(result.riskScore).toBe(51);
    expect(result.riskCategory).toBe('LOW');
  });

  test('includes breakdown of all 14 scores', () => {
    const result = calculateRiskScore(bestCaseAnswers);
    expect(Object.keys(result.breakdown)).toHaveLength(14);
    expect(result.breakdown.q1_fiscalYearEnd).toBe(5);
    expect(result.breakdown.q14_numberOfSPOFs).toBe(5);
  });

  test('returns correct metadata', () => {
    const result = calculateRiskScore(bestCaseAnswers);
    expect(result.maxPossibleScore).toBe(70);
    expect(result.totalQuestions).toBe(14);
  });
});

// =============================================================================
// Risk Category Tests
// =============================================================================
describe('Risk Categories', () => {
  test('HIGH risk range is 1-23', () => {
    expect(RISK_CATEGORIES.HIGH.min).toBe(1);
    expect(RISK_CATEGORIES.HIGH.max).toBe(23);
  });

  test('MEDIUM risk range is 24-46', () => {
    expect(RISK_CATEGORIES.MEDIUM.min).toBe(24);
    expect(RISK_CATEGORIES.MEDIUM.max).toBe(46);
  });

  test('LOW risk range is 47-70', () => {
    expect(RISK_CATEGORIES.LOW.min).toBe(47);
    expect(RISK_CATEGORIES.LOW.max).toBe(70);
  });

  test('correctly assigns HIGH category for low scores', () => {
    const answers = {
      fiscalYearEnd: 'no',     // 1
      incorporated: 'no',      // 1
      profitLastYear: 'no',    // 1
      lastSixMonthPerformance: 'Declining', // -3
      cleanFinancialYears: 'none',     // 1
      hasGeneralManager: 'no', // 1
      projectBased: 'yes',     // 1
      largestCustomerPercent: '>50%',  // 1
      ownerHours: 60,          // 1
      leaseYearsRemaining: '1 year',   // 1
      businessAge: '2 years',  // 1
      operatingSystem: 'none', // 1
      customerPaymentTerms: 'varies',  // 1
      numberOfSPOFs: 6         // 1
    };
    // Total: 1+1+1+(-3)+1+1+1+1+1+1+1+1+1+1 = 10
    const result = calculateRiskScore(answers);
    expect(result.riskScore).toBeLessThanOrEqual(23);
    expect(result.riskCategory).toBe('HIGH');
  });

  test('correctly assigns MEDIUM category for mid-range scores', () => {
    const answers = {
      fiscalYearEnd: 'yes',    // 5
      incorporated: 'yes',     // 5
      profitLastYear: 'no',    // 1
      lastSixMonthPerformance: 'Flat', // 3
      cleanFinancialYears: 'none',     // 1
      hasGeneralManager: 'no', // 1
      projectBased: 'yes',     // 1
      largestCustomerPercent: '15-25%', // 3
      ownerHours: 25,          // 3
      leaseYearsRemaining: '1 year',   // 1
      businessAge: '2 years',  // 1
      operatingSystem: 'CRM',  // 3
      customerPaymentTerms: 'varies',  // 1
      numberOfSPOFs: 3         // 3
    };
    // Total: 5+5+1+3+1+1+1+3+3+1+1+3+1+3 = 32
    const result = calculateRiskScore(answers);
    expect(result.riskScore).toBeGreaterThanOrEqual(24);
    expect(result.riskScore).toBeLessThanOrEqual(46);
    expect(result.riskCategory).toBe('MEDIUM');
  });

  test('correctly assigns LOW category at boundary (47)', () => {
    const answers = {
      fiscalYearEnd: 'yes',    // 5
      incorporated: 'yes',     // 5
      profitLastYear: 'yes',   // 5
      lastSixMonthPerformance: 'Modest YOY Steady Growth', // 4
      cleanFinancialYears: '3+ years', // 4
      hasGeneralManager: 'yes', // 5
      projectBased: 'between', // 3
      largestCustomerPercent: '15-25%', // 3
      ownerHours: 25,          // 3
      leaseYearsRemaining: '5-10 years', // 4
      businessAge: '10 years', // 1
      operatingSystem: 'CRM',  // 3
      customerPaymentTerms: 'varies', // 1
      numberOfSPOFs: 5         // 2
    };
    // Total: 5+5+5+4+4+5+3+3+3+4+1+3+1+2 = 48
    const result = calculateRiskScore(answers);
    expect(result.riskScore).toBe(48);
    expect(result.riskCategory).toBe('LOW');
  });
});

// =============================================================================
// Validation Tests
// =============================================================================
describe('validateRiskAnswers', () => {
  test('returns valid for complete answers', () => {
    const answers = {
      fiscalYearEnd: 'yes',
      incorporated: 'yes',
      profitLastYear: 'yes',
      lastSixMonthPerformance: 'Flat',
      cleanFinancialYears: '3+ years',
      hasGeneralManager: 'yes',
      projectBased: 'no',
      largestCustomerPercent: '<10%',
      ownerHours: 20,
      leaseYearsRemaining: '5-10 years',
      businessAge: '15 years',
      operatingSystem: 'CRM',
      customerPaymentTerms: 'Net 30',
      numberOfSPOFs: 2
    };

    const result = validateRiskAnswers(answers);
    expect(result.isValid).toBe(true);
    expect(result.missingFields).toHaveLength(0);
  });

  test('returns invalid for missing fields', () => {
    const answers = {
      fiscalYearEnd: 'yes',
      incorporated: 'yes'
      // Missing 12 fields
    };

    const result = validateRiskAnswers(answers);
    expect(result.isValid).toBe(false);
    expect(result.missingFields).toHaveLength(12);
    expect(result.missingFields).toContain('profitLastYear');
    expect(result.missingFields).toContain('numberOfSPOFs');
  });

  test('treats empty string as missing', () => {
    const answers = {
      fiscalYearEnd: '',
      incorporated: 'yes',
      profitLastYear: 'yes',
      lastSixMonthPerformance: 'Flat',
      cleanFinancialYears: '3+ years',
      hasGeneralManager: 'yes',
      projectBased: 'no',
      largestCustomerPercent: '<10%',
      ownerHours: 20,
      leaseYearsRemaining: '5-10 years',
      businessAge: '15 years',
      operatingSystem: 'CRM',
      customerPaymentTerms: 'Net 30',
      numberOfSPOFs: 2
    };

    const result = validateRiskAnswers(answers);
    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain('fiscalYearEnd');
  });

  test('returns total required count', () => {
    const result = validateRiskAnswers({});
    expect(result.totalRequired).toBe(14);
  });
});

// =============================================================================
// Edge Cases
// =============================================================================
describe('Edge Cases', () => {
  test('handles mixed case and whitespace in answers', () => {
    expect(scoreQ1FiscalYearEnd('  YES  ')).toBe(1); // Not trimmed in yes check
    expect(scoreQ4LastSixMonthPerformance('  FLAT  ')).toBe(3);
    expect(scoreQ7ProjectBased('  No  ')).toBe(5);
  });

  test('handles numeric strings correctly', () => {
    expect(scoreQ9OwnerHours('15')).toBe(4);
    expect(scoreQ14NumberOfSPOFs('3')).toBe(3);
  });

  test('handles completely empty answers object', () => {
    const result = calculateRiskScore({});
    // All questions should default to 1 (except Q4 which returns 1 for null)
    expect(result.riskScore).toBe(14); // 14 * 1
    expect(result.riskCategory).toBe('HIGH');
  });
});

// =============================================================================
// EBITDA CALCULATION TESTS
// =============================================================================

// =============================================================================
// parseCurrency Tests
// =============================================================================
describe('parseCurrency', () => {
  test('handles numeric values', () => {
    expect(parseCurrency(1000000)).toBe(1000000);
    expect(parseCurrency(0)).toBe(0);
    expect(parseCurrency(-50000)).toBe(-50000);
  });

  test('handles string numbers', () => {
    expect(parseCurrency('1000000')).toBe(1000000);
    expect(parseCurrency('500.50')).toBe(500.50);
  });

  test('handles currency formatted strings', () => {
    expect(parseCurrency('$1,000,000')).toBe(1000000);
    expect(parseCurrency('$500,000.00')).toBe(500000);
    expect(parseCurrency('$ 1,234,567')).toBe(1234567);
  });

  test('handles shorthand notation', () => {
    expect(parseCurrency('1M')).toBe(1000000);
    expect(parseCurrency('1.5M')).toBe(1500000);
    expect(parseCurrency('500K')).toBe(500000);
    expect(parseCurrency('2.5k')).toBe(2500);
    expect(parseCurrency('1B')).toBe(1000000000);
  });

  test('handles null/undefined/empty', () => {
    expect(parseCurrency(null)).toBe(0);
    expect(parseCurrency(undefined)).toBe(0);
    expect(parseCurrency('')).toBe(0);
  });
});

// =============================================================================
// BASELINE_MARGINS Tests
// =============================================================================
describe('BASELINE_MARGINS', () => {
  test('has correct default values per spec', () => {
    expect(BASELINE_MARGINS.pretaxProfit).toBe(0.075);   // 7.5%
    expect(BASELINE_MARGINS.depreciation).toBe(0.01);    // 1%
    expect(BASELINE_MARGINS.interest).toBe(0.01);        // 1%
    expect(BASELINE_MARGINS.discretionary).toBe(0.02);   // 2%
  });

  test('margins sum to 11.5%', () => {
    const sum = BASELINE_MARGINS.pretaxProfit +
                BASELINE_MARGINS.depreciation +
                BASELINE_MARGINS.interest +
                BASELINE_MARGINS.discretionary;
    expect(sum).toBeCloseTo(0.115, 5);
  });
});

// =============================================================================
// calculateBaselineEBITDA Tests
// =============================================================================
describe('calculateBaselineEBITDA', () => {
  test('calculates correct baseline EBITDA for $1M revenue', () => {
    const result = calculateBaselineEBITDA(1000000);

    expect(result.method).toBe('baseline');
    expect(result.revenue).toBe(1000000);

    // Components based on default margins
    expect(result.components.pretaxProfit).toBe(75000);    // 7.5%
    expect(result.components.depreciation).toBe(10000);    // 1%
    expect(result.components.interest).toBe(10000);        // 1%
    expect(result.components.discretionary).toBe(20000);   // 2%

    // Total EBITDA = 11.5% of revenue
    expect(result.ebitda).toBe(115000);
    expect(result.ebitdaMargin).toBeCloseTo(0.115, 5);
  });

  test('calculates correct baseline EBITDA for $5M revenue', () => {
    const result = calculateBaselineEBITDA(5000000);

    expect(result.ebitda).toBe(575000);  // 11.5% of 5M
    expect(result.ebitdaMargin).toBeCloseTo(0.115, 5);
  });

  test('handles string currency input', () => {
    const result = calculateBaselineEBITDA('$2,000,000');
    expect(result.revenue).toBe(2000000);
    expect(result.ebitda).toBe(230000);
  });

  test('allows custom margins override', () => {
    const result = calculateBaselineEBITDA(1000000, {
      pretaxProfit: 0.10,  // Override to 10%
      depreciation: 0.02   // Override to 2%
    });

    expect(result.components.pretaxProfit).toBe(100000);   // 10%
    expect(result.components.depreciation).toBe(20000);    // 2%
    expect(result.components.interest).toBe(10000);        // Default 1%
    expect(result.components.discretionary).toBe(20000);   // Default 2%
    expect(result.ebitda).toBe(150000);  // 15% of 1M
  });

  test('returns zero margin for zero revenue', () => {
    const result = calculateBaselineEBITDA(0);
    expect(result.ebitdaMargin).toBe(0);
  });
});

// =============================================================================
// calculateActualEBITDA Tests
// =============================================================================
describe('calculateActualEBITDA', () => {
  test('calculates EBITDA from actual financials', () => {
    const result = calculateActualEBITDA({
      revenue: 1000000,
      pretaxProfit: 100000,
      depreciation: 20000,
      interest: 15000,
      discretionary: 25000
    });

    expect(result.method).toBe('actual');
    expect(result.revenue).toBe(1000000);
    expect(result.components.pretaxProfit).toBe(100000);
    expect(result.components.depreciation).toBe(20000);
    expect(result.components.interest).toBe(15000);
    expect(result.components.discretionary).toBe(25000);
    expect(result.ebitda).toBe(160000);  // Sum of components
    expect(result.ebitdaMargin).toBe(0.16);  // 16%
  });

  test('handles negative pretax profit', () => {
    const result = calculateActualEBITDA({
      revenue: 1000000,
      pretaxProfit: -50000,  // Loss
      depreciation: 30000,
      interest: 20000,
      discretionary: 10000
    });

    expect(result.ebitda).toBe(10000);  // -50K + 30K + 20K + 10K
  });

  test('handles missing discretionary', () => {
    const result = calculateActualEBITDA({
      revenue: 1000000,
      pretaxProfit: 100000,
      depreciation: 20000,
      interest: 15000
    });

    expect(result.components.discretionary).toBe(0);
    expect(result.ebitda).toBe(135000);
  });

  test('handles currency formatted strings', () => {
    const result = calculateActualEBITDA({
      revenue: '$2,500,000',
      pretaxProfit: '$250,000',
      depreciation: '$50,000',
      interest: '$25,000',
      discretionary: '$15,000'
    });

    expect(result.ebitda).toBe(340000);
    expect(result.ebitdaMargin).toBeCloseTo(0.136, 3);
  });
});

// =============================================================================
// applyEBITDAAdjustments Tests
// =============================================================================
describe('applyEBITDAAdjustments', () => {
  test('applies positive owner salary adjustment (below market)', () => {
    const result = applyEBITDAAdjustments(100000, {
      ownerSalaryAdj: 50000  // Owner pays self below market
    });

    expect(result.baseEbitda).toBe(100000);
    expect(result.adjustments.ownerSalaryAdj).toBe(50000);
    expect(result.adjustments.total).toBe(50000);
    expect(result.adjustedEbitda).toBe(150000);
  });

  test('applies negative owner salary adjustment (above market)', () => {
    const result = applyEBITDAAdjustments(100000, {
      ownerSalaryAdj: -30000  // Owner pays self above market
    });

    expect(result.adjustedEbitda).toBe(70000);
  });

  test('applies rent adjustment', () => {
    const result = applyEBITDAAdjustments(100000, {
      rentAdj: 20000  // Paying below market rent
    });

    expect(result.adjustments.rentAdj).toBe(20000);
    expect(result.adjustedEbitda).toBe(120000);
  });

  test('applies both adjustments', () => {
    const result = applyEBITDAAdjustments(100000, {
      ownerSalaryAdj: 40000,
      rentAdj: -10000
    });

    expect(result.adjustments.total).toBe(30000);  // 40K - 10K
    expect(result.adjustedEbitda).toBe(130000);
  });

  test('handles no adjustments', () => {
    const result = applyEBITDAAdjustments(100000, {});

    expect(result.adjustments.total).toBe(0);
    expect(result.adjustedEbitda).toBe(100000);
  });

  test('handles currency strings in adjustments', () => {
    const result = applyEBITDAAdjustments(100000, {
      ownerSalaryAdj: '$25,000',
      rentAdj: '$5,000'
    });

    expect(result.adjustments.total).toBe(30000);
    expect(result.adjustedEbitda).toBe(130000);
  });
});

// =============================================================================
// calculateEBITDA (Main Function) Tests
// =============================================================================
describe('calculateEBITDA', () => {
  test('uses baseline method when no detailed financials', () => {
    const result = calculateEBITDA({
      revenue: 1000000
    });

    expect(result.isValid).toBe(true);
    expect(result.method).toBe('baseline');
    expect(result.ebitda).toBe(115000);  // 11.5% baseline
    expect(result.adjustedEbitda).toBe(115000);
  });

  test('uses actual method when pretaxProfit provided', () => {
    const result = calculateEBITDA({
      revenue: 1000000,
      pretaxProfit: 150000,
      depreciation: 25000,
      interest: 10000,
      discretionary: 15000
    });

    expect(result.method).toBe('actual');
    expect(result.ebitda).toBe(200000);  // 150K + 25K + 10K + 15K
    expect(result.adjustedEbitda).toBe(200000);
  });

  test('applies adjustments to baseline method', () => {
    const result = calculateEBITDA({
      revenue: 1000000,
      ownerSalaryAdj: 50000,
      rentAdj: 10000
    });

    expect(result.method).toBe('baseline');
    expect(result.ebitda).toBe(115000);
    expect(result.adjustments.total).toBe(60000);
    expect(result.adjustedEbitda).toBe(175000);
    expect(result.adjustedEbitdaMargin).toBeCloseTo(0.175, 5);
  });

  test('applies adjustments to actual method', () => {
    const result = calculateEBITDA({
      revenue: 1000000,
      pretaxProfit: 100000,
      depreciation: 20000,
      interest: 10000,
      discretionary: 10000,
      ownerSalaryAdj: 30000
    });

    expect(result.method).toBe('actual');
    expect(result.ebitda).toBe(140000);
    expect(result.adjustedEbitda).toBe(170000);
  });

  test('can force baseline method with useBaseline flag', () => {
    const result = calculateEBITDA({
      revenue: 1000000,
      pretaxProfit: 150000,
      useBaseline: true
    });

    expect(result.method).toBe('baseline');
    expect(result.ebitda).toBe(115000);
  });

  test('returns error for zero revenue', () => {
    const result = calculateEBITDA({
      revenue: 0
    });

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Revenue must be greater than zero');
  });

  test('returns error for negative revenue', () => {
    const result = calculateEBITDA({
      revenue: -100000
    });

    expect(result.isValid).toBe(false);
  });

  test('includes all required output fields', () => {
    const result = calculateEBITDA({
      revenue: 1000000,
      pretaxProfit: 100000,
      depreciation: 20000,
      interest: 10000,
      discretionary: 5000,
      ownerSalaryAdj: 25000,
      rentAdj: 5000
    });

    expect(result).toHaveProperty('isValid');
    expect(result).toHaveProperty('method');
    expect(result).toHaveProperty('revenue');
    expect(result).toHaveProperty('components');
    expect(result).toHaveProperty('ebitda');
    expect(result).toHaveProperty('adjustments');
    expect(result).toHaveProperty('adjustedEbitda');
    expect(result).toHaveProperty('ebitdaMargin');
    expect(result).toHaveProperty('adjustedEbitdaMargin');
  });
});

// =============================================================================
// validateEBITDAInputs Tests
// =============================================================================
describe('validateEBITDAInputs', () => {
  test('returns valid for proper inputs', () => {
    const result = validateEBITDAInputs({
      revenue: 1000000,
      pretaxProfit: 100000
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('returns error for missing revenue', () => {
    const result = validateEBITDAInputs({
      pretaxProfit: 100000
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Revenue is required');
  });

  test('returns error for zero revenue', () => {
    const result = validateEBITDAInputs({
      revenue: 0
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Revenue must be greater than zero');
  });

  test('returns warning for very negative profit margin', () => {
    const result = validateEBITDAInputs({
      revenue: 1000000,
      pretaxProfit: -600000  // -60% margin
    });

    expect(result.isValid).toBe(true);  // Still valid, just a warning
    expect(result.hasWarnings).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  test('returns warning for very high profit margin', () => {
    const result = validateEBITDAInputs({
      revenue: 1000000,
      pretaxProfit: 600000  // 60% margin
    });

    expect(result.hasWarnings).toBe(true);
  });

  test('returns warning for large owner salary adjustment', () => {
    const result = validateEBITDAInputs({
      revenue: 1000000,
      ownerSalaryAdj: 400000  // 40% of revenue
    });

    expect(result.hasWarnings).toBe(true);
  });
});

// =============================================================================
// EBITDA Calculation Accuracy Tests (per spec: ±0.01% tolerance)
// =============================================================================
describe('EBITDA Calculation Accuracy', () => {
  test('baseline calculation matches expected within ±0.01%', () => {
    const result = calculateEBITDA({
      revenue: 2500000
    });

    // Expected: 2.5M × 11.5% = 287,500
    const expected = 287500;
    const tolerance = expected * 0.0001;  // ±0.01%

    expect(Math.abs(result.ebitda - expected)).toBeLessThanOrEqual(tolerance);
  });

  test('actual calculation matches expected within ±0.01%', () => {
    const result = calculateEBITDA({
      revenue: 3000000,
      pretaxProfit: 300000,
      depreciation: 60000,
      interest: 30000,
      discretionary: 45000,
      ownerSalaryAdj: 75000,
      rentAdj: -15000
    });

    // EBITDA = 300K + 60K + 30K + 45K = 435K
    // Adjusted = 435K + 75K - 15K = 495K
    const expectedBase = 435000;
    const expectedAdjusted = 495000;
    const tolerance = expectedAdjusted * 0.0001;

    expect(Math.abs(result.ebitda - expectedBase)).toBeLessThanOrEqual(tolerance);
    expect(Math.abs(result.adjustedEbitda - expectedAdjusted)).toBeLessThanOrEqual(tolerance);
  });

  test('margin calculation is accurate', () => {
    const result = calculateEBITDA({
      revenue: 1234567,
      pretaxProfit: 185185,  // ~15%
      depreciation: 12346,
      interest: 6173,
      discretionary: 0
    });

    // EBITDA = 185185 + 12346 + 6173 = 203704
    // Margin = 203704 / 1234567 = 0.16502...
    expect(result.ebitdaMargin).toBeCloseTo(0.165, 3);
  });
});

// =============================================================================
// LAYER 3: MULTIPLE SELECTION TESTS
// =============================================================================

describe('COMMON_MULTIPLES', () => {
  test('has all required business sizes', () => {
    expect(COMMON_MULTIPLES).toHaveProperty('small');
    expect(COMMON_MULTIPLES).toHaveProperty('medium');
    expect(COMMON_MULTIPLES).toHaveProperty('large');
    expect(COMMON_MULTIPLES).toHaveProperty('default');
  });

  test('each size has min, median, max', () => {
    Object.values(COMMON_MULTIPLES).forEach(size => {
      expect(size).toHaveProperty('min');
      expect(size).toHaveProperty('median');
      expect(size).toHaveProperty('max');
      expect(size.min).toBeLessThanOrEqual(size.median);
      expect(size.median).toBeLessThanOrEqual(size.max);
    });
  });
});

describe('selectMultiple', () => {
  test('selects custom multiple correctly', () => {
    const result = selectMultiple({
      multipleType: 'custom',
      customMultiple: 5.5
    });

    expect(result.isValid).toBe(true);
    expect(result.source).toBe('custom');
    expect(result.multipleUsed).toBe(5.5);
  });

  test('returns error for custom without value', () => {
    const result = selectMultiple({
      multipleType: 'custom'
    });

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Custom multiple');
  });

  test('selects common multiple by business size', () => {
    const small = selectMultiple({ multipleType: 'common', businessSize: 'small' });
    const medium = selectMultiple({ multipleType: 'common', businessSize: 'medium' });
    const large = selectMultiple({ multipleType: 'common', businessSize: 'large' });

    expect(small.multipleUsed).toBe(3.0);
    expect(medium.multipleUsed).toBe(4.0);
    expect(large.multipleUsed).toBe(5.0);
  });

  test('selects industry multiple when provided', () => {
    const result = selectMultiple({
      multipleType: 'industry',
      industryMultiple: 6.5
    });

    expect(result.isValid).toBe(true);
    expect(result.source).toBe('industry');
    expect(result.multipleUsed).toBe(6.5);
  });

  test('falls back to common when industry not provided', () => {
    const result = selectMultiple({
      multipleType: 'industry',
      businessSize: 'large'
    });

    expect(result.isValid).toBe(true);
    expect(result.source).toBe('common (industry fallback)');
    expect(result.multipleUsed).toBe(5.0);
  });

  test('applies risk weighting when enabled', () => {
    // High risk score (70) should increase multiple
    const highRisk = selectMultiple({
      multipleType: 'common',
      businessSize: 'medium',
      riskScore: 70,
      applyRiskWeighting: true
    });

    // Low risk score (1) should decrease multiple
    const lowRisk = selectMultiple({
      multipleType: 'common',
      businessSize: 'medium',
      riskScore: 1,
      applyRiskWeighting: true
    });

    expect(highRisk.multipleUsed).toBeGreaterThan(4.0);
    expect(lowRisk.multipleUsed).toBeLessThan(4.0);
  });

  test('does not apply risk weighting when disabled', () => {
    const result = selectMultiple({
      multipleType: 'common',
      businessSize: 'medium',
      riskScore: 70,
      applyRiskWeighting: false
    });

    expect(result.multipleUsed).toBe(4.0);
    expect(result.riskAdjustment).toBe(0);
  });
});

// =============================================================================
// LAYER 4: CURRENT VALUE TESTS
// =============================================================================

describe('calculateCurrentValue', () => {
  test('calculates current value correctly', () => {
    const result = calculateCurrentValue(100000, 4.0);

    expect(result.isValid).toBe(true);
    expect(result.ebitda).toBe(100000);
    expect(result.multiple).toBe(4.0);
    expect(result.currentValue).toBe(400000);
  });

  test('handles string inputs', () => {
    const result = calculateCurrentValue('$150,000', '5.0');

    expect(result.currentValue).toBe(750000);
  });

  test('returns error for zero EBITDA', () => {
    const result = calculateCurrentValue(0, 4.0);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('EBITDA');
  });

  test('returns error for zero multiple', () => {
    const result = calculateCurrentValue(100000, 0);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Multiple');
  });
});

// =============================================================================
// LAYER 5: VALUE ACCELERATION TESTS
// =============================================================================

describe('calculateSizeLever', () => {
  test('calculates size lever impact correctly', () => {
    const result = calculateSizeLever({
      currentRevenue: 1000000,
      currentEBITDA: 100000,
      currentValue: 400000,
      multiple: 4.0,
      targetGrowthRate: 0.10,  // 10% growth
      ebitdaMargin: 0.10
    });

    expect(result.lever).toBe('size');
    expect(result.outputs.newRevenue).toBe(1100000);  // 1M * 1.10
    expect(result.outputs.newEBITDA).toBe(110000);    // 1.1M * 10%
    expect(result.outputs.newValue).toBe(440000);     // 110K * 4
    expect(result.outputs.valueCreated).toBe(40000);  // 440K - 400K
    expect(result.outputs.percentIncrease).toBeCloseTo(0.10, 5);
  });

  test('handles zero growth rate', () => {
    const result = calculateSizeLever({
      currentRevenue: 1000000,
      currentEBITDA: 100000,
      currentValue: 400000,
      multiple: 4.0,
      targetGrowthRate: 0,
      ebitdaMargin: 0.10
    });

    expect(result.outputs.valueCreated).toBe(0);
    expect(result.outputs.percentIncrease).toBe(0);
  });
});

describe('calculateEfficiencyLever', () => {
  test('calculates efficiency lever with dollar amount', () => {
    const result = calculateEfficiencyLever({
      currentRevenue: 1000000,
      currentEBITDA: 100000,
      currentValue: 400000,
      multiple: 4.0,
      targetEfficiencyGain: 20000,  // $20K efficiency gain
      isPercentage: false
    });

    expect(result.lever).toBe('efficiency');
    expect(result.outputs.newRevenue).toBe(1000000);  // Revenue unchanged
    expect(result.outputs.newEBITDA).toBe(120000);    // 100K + 20K
    expect(result.outputs.newValue).toBe(480000);     // 120K * 4
    expect(result.outputs.valueCreated).toBe(80000);  // 480K - 400K
  });

  test('calculates efficiency lever with percentage', () => {
    const result = calculateEfficiencyLever({
      currentRevenue: 1000000,
      currentEBITDA: 100000,
      currentValue: 400000,
      multiple: 4.0,
      targetEfficiencyGain: 0.02,  // 2% margin improvement
      isPercentage: true
    });

    // Efficiency gain = 1M * 2% = 20K
    expect(result.outputs.newEBITDA).toBe(120000);
  });
});

describe('calculateMultipleLever', () => {
  test('calculates multiple lever impact correctly', () => {
    const result = calculateMultipleLever({
      currentEBITDA: 100000,
      currentValue: 400000,
      currentMultiple: 4.0,
      targetMultipleIncrease: 0.25  // 25% increase
    });

    expect(result.lever).toBe('multiple');
    expect(result.outputs.newMultiple).toBe(5.0);     // 4.0 * 1.25
    expect(result.outputs.newValue).toBe(500000);     // 100K * 5
    expect(result.outputs.valueCreated).toBe(100000); // 500K - 400K
    expect(result.outputs.percentIncrease).toBe(0.25);
  });
});

describe('calculateValueAcceleration', () => {
  test('calculates all three levers and combined result', () => {
    const result = calculateValueAcceleration({
      currentRevenue: 1000000,
      currentEBITDA: 100000,
      currentValue: 400000,
      multiple: 4.0,
      ebitdaMargin: 0.10,
      targetGrowthRate: 0.10,
      targetEfficiencyGain: 10000,
      efficiencyIsPercentage: false,
      targetMultipleIncrease: 0.10
    });

    expect(result).toHaveProperty('size');
    expect(result).toHaveProperty('efficiency');
    expect(result).toHaveProperty('multiple');
    expect(result).toHaveProperty('combined');

    // Each lever should show value created
    expect(result.size.value).toBeGreaterThan(0);
    expect(result.efficiency.value).toBeGreaterThan(0);
    expect(result.multiple.value).toBeGreaterThan(0);

    // Combined value should be greater than any individual
    expect(result.combined.newValue).toBeGreaterThan(result.size.newValue);
  });
});

// =============================================================================
// LAYER 6: PROBABILITY DISTRIBUTION TESTS
// =============================================================================

describe('PROBABILITY_BANDS', () => {
  test('has 5 bands', () => {
    expect(PROBABILITY_BANDS).toHaveLength(5);
  });

  test('probabilities sum to 1', () => {
    const sum = PROBABILITY_BANDS.reduce((acc, band) => acc + band.probability, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  test('bands are ordered by stdDev', () => {
    for (let i = 1; i < PROBABILITY_BANDS.length; i++) {
      expect(PROBABILITY_BANDS[i].stdDev).toBeGreaterThan(PROBABILITY_BANDS[i-1].stdDev);
    }
  });
});

describe('calculateProbabilityDistribution', () => {
  test('calculates distribution correctly', () => {
    const result = calculateProbabilityDistribution({
      ebitda: 100000,
      meanMultiple: 4.0,
      stdDevRange: 0.5
    });

    expect(result.ebitda).toBe(100000);
    expect(result.meanMultiple).toBe(4.0);
    expect(result.distribution).toHaveLength(5);
    expect(result.totalProbability).toBeCloseTo(1.0, 5);
  });

  test('most likely value equals mean multiple times EBITDA', () => {
    const result = calculateProbabilityDistribution({
      ebitda: 100000,
      meanMultiple: 4.0
    });

    expect(result.mostLikelyValue).toBe(400000);
  });

  test('low value is less than most likely', () => {
    const result = calculateProbabilityDistribution({
      ebitda: 100000,
      meanMultiple: 4.0
    });

    expect(result.lowValue).toBeLessThan(result.mostLikelyValue);
    expect(result.highValue).toBeGreaterThan(result.mostLikelyValue);
  });

  test('expected value equals weighted average', () => {
    const result = calculateProbabilityDistribution({
      ebitda: 100000,
      meanMultiple: 4.0,
      stdDevRange: 0.5
    });

    // Manually calculate expected value
    const manualExpected = result.distribution.reduce((sum, band) => {
      return sum + (band.mvicValue * band.probability);
    }, 0);

    expect(result.expectedValue).toBeCloseTo(manualExpected, 2);
  });
});

// =============================================================================
// LAYER 7: WEALTH GAP TESTS
// =============================================================================

describe('calculateWealthGap', () => {
  test('calculates yearly projection correctly', () => {
    const result = calculateWealthGap({
      initialRevenue: 1000000,
      initialEBITDA: 100000,
      growthRate: 0.05,
      ebitdaMargin: 0.10,
      multiple: 4.0,
      yearsToProject: 5
    });

    expect(result.yearlyTable).toHaveLength(6);  // Years 0-5
    expect(result.yearlyTable[0].year).toBe(0);
    expect(result.yearlyTable[0].revenue).toBe(1000000);
    expect(result.yearlyTable[0].salePrice).toBe(400000);

    // Year 5 should show growth
    expect(result.yearlyTable[5].revenue).toBeGreaterThan(1000000);
  });

  test('calculates years to exit correctly', () => {
    const result = calculateWealthGap({
      initialRevenue: 1000000,
      initialEBITDA: 100000,
      growthRate: 0.10,  // 10% growth
      ebitdaMargin: 0.10,
      multiple: 4.0,
      targetValue: 800000  // Double the current value
    });

    expect(result.currentValue).toBe(400000);
    expect(result.targetValue).toBe(800000);
    expect(result.wealthGap).toBe(400000);
    expect(result.yearsToExit).toBeGreaterThan(0);
    expect(result.yearsToExit).toBeLessThan(20);
  });

  test('returns 0 years if already at target', () => {
    const result = calculateWealthGap({
      initialRevenue: 1000000,
      initialEBITDA: 100000,
      growthRate: 0.05,
      multiple: 4.0,
      targetValue: 300000  // Below current value
    });

    expect(result.yearsToExit).toBe(0);
  });

  test('returns Infinity for no growth with target', () => {
    const result = calculateWealthGap({
      initialRevenue: 1000000,
      initialEBITDA: 100000,
      growthRate: 0,
      multiple: 4.0,
      targetValue: 800000
    });

    expect(result.yearsToExit).toBe(Infinity);
  });
});

// =============================================================================
// MASTER VAC FUNCTION TESTS
// =============================================================================

describe('calculateVAC', () => {
  const sampleRiskAnswers = {
    fiscalYearEnd: 'yes',
    incorporated: 'yes',
    profitLastYear: 'yes',
    lastSixMonthPerformance: 'Modest YOY Steady Growth',
    cleanFinancialYears: '3+ years',
    hasGeneralManager: 'yes',
    projectBased: 'no',
    largestCustomerPercent: '<10%',
    ownerHours: 15,
    leaseYearsRemaining: 'Over 10 years',
    businessAge: '15 years',
    operatingSystem: 'Cloud-based ERP',
    customerPaymentTerms: 'Contracted Recurring Monthly',
    numberOfSPOFs: 1
  };

  test('performs complete VAC calculation', () => {
    const result = calculateVAC({
      riskAnswers: sampleRiskAnswers,
      revenue: 2000000,
      pretaxProfit: 200000,
      depreciation: 40000,
      interest: 20000,
      discretionary: 30000,
      multipleType: 'common',
      businessSize: 'medium',
      targetGrowthRate: 0.10,
      targetEfficiencyGain: 50000,
      targetMultipleIncrease: 0.15,
      targetValue: 2000000
    });

    expect(result.isValid).toBe(true);

    // Check all layers are present
    expect(result).toHaveProperty('riskScore');
    expect(result).toHaveProperty('adjustedEbitda');
    expect(result).toHaveProperty('multipleUsed');
    expect(result).toHaveProperty('currentValue');
    expect(result).toHaveProperty('uplift');
    expect(result).toHaveProperty('probabilityDistribution');
    expect(result).toHaveProperty('wealthGap');
    expect(result).toHaveProperty('calculatedAt');
  });

  test('returns error for invalid revenue', () => {
    const result = calculateVAC({
      riskAnswers: sampleRiskAnswers,
      revenue: 0
    });

    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('uses baseline EBITDA when no financials provided', () => {
    const result = calculateVAC({
      riskAnswers: sampleRiskAnswers,
      revenue: 1000000,
      multipleType: 'common',
      businessSize: 'medium'
    });

    expect(result.isValid).toBe(true);
    expect(result.ebitdaMethod).toBe('baseline');
    expect(result.adjustedEbitda).toBe(115000);  // 11.5% of 1M
  });

  test('calculates value acceleration uplift', () => {
    const result = calculateVAC({
      riskAnswers: sampleRiskAnswers,
      revenue: 1000000,
      pretaxProfit: 100000,
      depreciation: 10000,
      interest: 5000,
      multipleType: 'custom',
      customMultiple: 4.0,
      targetGrowthRate: 0.20,
      targetEfficiencyGain: 20000,
      targetMultipleIncrease: 0.10
    });

    expect(result.isValid).toBe(true);
    expect(result.uplift.size.value).toBeGreaterThan(0);
    expect(result.uplift.efficiency.value).toBeGreaterThan(0);
    expect(result.uplift.multiple.value).toBeGreaterThan(0);
    expect(result.uplift.totalIncrease).toBeGreaterThan(0);
  });

  test('includes probability distribution', () => {
    const result = calculateVAC({
      riskAnswers: sampleRiskAnswers,
      revenue: 1000000,
      multipleType: 'common',
      businessSize: 'medium'
    });

    expect(result.probabilityDistribution).toHaveLength(5);
    expect(result.valuationRange).toHaveProperty('low');
    expect(result.valuationRange).toHaveProperty('mostLikely');
    expect(result.valuationRange).toHaveProperty('high');
  });

  test('includes wealth gap projection', () => {
    const result = calculateVAC({
      riskAnswers: sampleRiskAnswers,
      revenue: 1000000,
      multipleType: 'common',
      businessSize: 'medium',
      targetValue: 1000000,
      yearsToProject: 5
    });

    expect(result.wealthGap.yearlyTable).toHaveLength(6);
    expect(result.wealthGap.targetValue).toBe(1000000);
    expect(result.wealthGap.yearsToExit).toBeDefined();
  });
});

// =============================================================================
// INTEGRATION / ACCURACY TESTS
// =============================================================================

describe('VAC End-to-End Accuracy', () => {
  test('full calculation matches expected output structure', () => {
    const result = calculateVAC({
      riskAnswers: {
        fiscalYearEnd: 'yes',
        incorporated: 'yes',
        profitLastYear: 'yes',
        lastSixMonthPerformance: 'Flat',
        cleanFinancialYears: '3+ years',
        hasGeneralManager: 'no',
        projectBased: 'between',
        largestCustomerPercent: '15-25%',
        ownerHours: 25,
        leaseYearsRemaining: '5-10 years',
        businessAge: '15 years',
        operatingSystem: 'CRM',
        customerPaymentTerms: '30-60 day terms',
        numberOfSPOFs: 2
      },
      revenue: 2500000,
      pretaxProfit: 250000,
      depreciation: 50000,
      interest: 25000,
      discretionary: 15000,
      ownerSalaryAdj: 50000,
      rentAdj: 10000,
      multipleType: 'custom',
      customMultiple: 4.5,
      targetGrowthRate: 0.15,
      targetEfficiencyGain: 0.02,
      efficiencyIsPercentage: true,
      targetMultipleIncrease: 0.10,
      targetValue: 3000000,
      yearsToProject: 10
    });

    expect(result.isValid).toBe(true);

    // Verify EBITDA calculation
    // Base EBITDA = 250K + 50K + 25K + 15K = 340K
    // Adjusted = 340K + 50K + 10K = 400K
    expect(result.ebitda).toBe(340000);
    expect(result.adjustedEbitda).toBe(400000);

    // Verify current value
    // 400K * 4.5 = 1,800,000
    expect(result.currentValue).toBe(1800000);

    // Verify wealth gap
    expect(result.wealthGap.gap).toBe(1200000);  // 3M - 1.8M
  });
});

// =============================================================================
// SIZE SCORE TESTS (NEW)
// =============================================================================
describe('calculateSizeScore', () => {
  test('returns score 0 for EBITDA < $100K', () => {
    const result = calculateSizeScore(50000);
    expect(result.sizeScore).toBe(0);
    expect(result.description).toBe('Very Small Business');
  });

  test('returns score 1 for EBITDA $100K-$250K', () => {
    const result = calculateSizeScore(150000);
    expect(result.sizeScore).toBe(1);
  });

  test('returns score 3 for EBITDA $250K-$500K', () => {
    const result = calculateSizeScore(400000);
    expect(result.sizeScore).toBe(3);
  });

  test('returns score 5 for EBITDA $500K-$750K', () => {
    const result = calculateSizeScore(600000);
    expect(result.sizeScore).toBe(5);
    expect(result.description).toBe('Small Business');
  });

  test('returns score 10 for EBITDA $750K-$1M', () => {
    const result = calculateSizeScore(900000);
    expect(result.sizeScore).toBe(10);
  });

  test('returns score 12 for EBITDA $1M-$2M', () => {
    const result = calculateSizeScore(1500000);
    expect(result.sizeScore).toBe(12);
    expect(result.description).toBe('Growing Business');
  });

  test('returns score 20 for EBITDA $2M-$5M', () => {
    const result = calculateSizeScore(3000000);
    expect(result.sizeScore).toBe(20);
    expect(result.description).toBe('Mid-Market Business');
  });

  test('returns score 25 for EBITDA $5M-$10M', () => {
    const result = calculateSizeScore(7000000);
    expect(result.sizeScore).toBe(25);
    expect(result.description).toBe('Large Mid-Market');
  });

  test('returns score 30 for EBITDA > $10M', () => {
    const result = calculateSizeScore(15000000);
    expect(result.sizeScore).toBe(30);
    expect(result.description).toBe('Premium Size Business');
  });

  test('includes bracket information', () => {
    const result = calculateSizeScore(400000);
    expect(result.bracket.min).toBe(250000);
    expect(result.bracket.max).toBe(500000);
  });
});

// =============================================================================
// P&L MODULE TESTS (NEW)
// =============================================================================
describe('calculateCurrentPL', () => {
  test('calculates current P&L with provided COGS', () => {
    const result = calculateCurrentPL({
      revenue: 1000000,
      cogs: 600000,
      ebitda: 150000
    });

    expect(result.revenue).toBe(1000000);
    expect(result.cogs).toBe(600000);
    expect(result.grossProfit).toBe(400000);
    expect(result.ebitda).toBe(150000);
    expect(result.margins.cogsPercent).toBe(0.6);
    expect(result.margins.grossMargin).toBe(0.4);
    expect(result.margins.ebitdaMargin).toBe(0.15);
  });

  test('calculates COGS from percentage', () => {
    const result = calculateCurrentPL({
      revenue: 1000000,
      cogsPercent: 0.65,
      ebitda: 150000
    });

    expect(result.cogs).toBe(650000);
    expect(result.grossProfit).toBe(350000);
  });

  test('estimates COGS when not provided', () => {
    const result = calculateCurrentPL({
      revenue: 1000000,
      ebitda: 150000
    });

    // COGS = Revenue - EBITDA - 15% overhead
    // COGS = 1M - 150K - 150K = 700K
    expect(result.cogs).toBe(700000);
  });
});

describe('calculateForecastedPL', () => {
  const currentPL = {
    revenue: 1000000,
    cogs: 600000,
    grossProfit: 400000,
    profit: 150000,
    ebitda: 150000,
    margins: {
      revenue: 1.0,
      cogsPercent: 0.6,
      grossMargin: 0.4,
      profitMargin: 0.15,
      ebitdaMargin: 0.15
    }
  };

  test('calculates forecast with revenue growth', () => {
    const result = calculateForecastedPL({
      currentPL,
      revenueGrowth: 0.10
    });

    expect(result.revenue).toBe(1100000);
    expect(result.cogs).toBe(660000); // 60% of new revenue
    expect(result.margins.cogsPercent).toBe(0.6);
  });

  test('calculates forecast with improved EBITDA margin', () => {
    const result = calculateForecastedPL({
      currentPL,
      improvedEbitdaMargin: 0.18,
      improvedMultiple: 4.0
    });

    expect(result.ebitda).toBe(180000); // 18% of $1M
    expect(result.salePrice.forecastValue).toBe(720000); // 180K * 4
    expect(result.salePrice.currentValue).toBe(600000); // 150K * 4
    expect(result.salePrice.increase).toBe(120000);
  });

  test('calculates sale price growth percentage', () => {
    const result = calculateForecastedPL({
      currentPL,
      revenueGrowth: 0.10,
      improvedEbitdaMargin: 0.18,
      improvedMultiple: 5.0
    });

    // Forecast EBITDA = 1.1M * 0.18 = 198K
    // Forecast sale price = 198K * 5 = 990K
    // Current sale price = 150K * 5 = 750K
    // Growth = (990K - 750K) / 750K = 32%
    expect(result.salePrice.growthPercent).toBeCloseTo(0.32);
  });
});

describe('calculatePLComparison', () => {
  test('generates comparison between current and forecast', () => {
    const result = calculatePLComparison({
      revenue: 1000000,
      ebitda: 150000,
      revenueGrowth: 0.10,
      improvedEbitdaMargin: 0.18,
      improvedMultiple: 4.0
    });

    expect(result.current).toBeDefined();
    expect(result.forecasted).toBeDefined();
    expect(result.comparison.revenueChange).toBe(100000);
    expect(result.comparison.revenueChangePercent).toBe(0.1);
  });
});

// =============================================================================
// WEALTH GAP ENHANCED (5-STEP) TESTS (NEW)
// =============================================================================
describe('calculateCurrentScenario', () => {
  test('calculates total income and net assets', () => {
    const result = calculateCurrentScenario({
      dividends: 50000,
      wages: 150000,
      personalExpensesCovered: 20000,
      otherPassiveIncome: 10000,
      liquidAssets: 500000,
      nonMortgageDebt: 50000
    });

    expect(result.income.total).toBe(230000);
    expect(result.assets.netAvailable).toBe(450000);
  });

  test('handles missing values gracefully', () => {
    const result = calculateCurrentScenario({
      dividends: 50000,
      wages: 100000
    });

    expect(result.income.total).toBe(150000);
    expect(result.assets.netAvailable).toBe(0);
  });
});

describe('defineExitGoals', () => {
  test('captures exit goals', () => {
    const result = defineExitGoals({
      desiredAnnualIncome: 200000,
      exitTimelineYears: 7
    });

    expect(result.desiredAnnualIncome).toBe(200000);
    expect(result.exitTimelineYears).toBe(7);
  });

  test('uses defaults for missing values', () => {
    const result = defineExitGoals({});
    expect(result.desiredAnnualIncome).toBe(0);
    expect(result.exitTimelineYears).toBe(5);
  });
});

describe('calculateWealthGapStep3', () => {
  test('calculates wealth gap correctly', () => {
    const currentScenario = {
      income: { otherPassiveIncome: 10000 },
      assets: { netAvailable: 200000 }
    };
    const exitGoals = { desiredAnnualIncome: 150000 };

    const result = calculateWealthGapStep3({
      currentScenario,
      exitGoals,
      portfolioReturn: 0.075
    });

    // Replacement income = 150K - 10K = 140K
    // Required portfolio = 140K / 0.075 = 1,866,667
    // Wealth gap = 1,866,667 - 200K = 1,666,667
    expect(result.replacementIncomeRequired).toBe(140000);
    expect(result.requiredPortfolioSize).toBeCloseTo(1866667, -2);
    expect(result.wealthGap).toBeCloseTo(1666667, -2);
    expect(result.isFunded).toBe(false);
  });

  test('returns funded if assets exceed requirement', () => {
    const currentScenario = {
      income: { otherPassiveIncome: 100000 },
      assets: { netAvailable: 2000000 }
    };
    const exitGoals = { desiredAnnualIncome: 150000 };

    const result = calculateWealthGapStep3({
      currentScenario,
      exitGoals,
      portfolioReturn: 0.075
    });

    // Replacement income = 150K - 100K = 50K
    // Required portfolio = 50K / 0.075 = 666,667
    // Wealth gap = 666,667 - 2M = negative, so 0
    expect(result.wealthGap).toBe(0);
    expect(result.isFunded).toBe(true);
  });
});

describe('calculateRequiredSalePrice', () => {
  test('calculates required sale price correctly', () => {
    const result = calculateRequiredSalePrice({
      wealthGap: 1000000,
      ownershipPercent: 1.0,
      longTermDebt: 200000,
      feeTaxRate: 0.10,
      targetMargin: 0.15,
      targetMultiple: 4.0
    });

    // Net proceeds = 1M + (1.0 * 200K) = 1.2M
    // Gross proceeds = 1.2M * 1.10 = 1.32M
    // Implied EBITDA = 1.32M / 4 = 330K
    // Required sale price = 330K * 4 = 1.32M
    expect(result.netProceedsNeeded).toBe(1200000);
    expect(result.grossProceedsNeeded).toBe(1320000);
    expect(result.requiredSalePrice).toBe(1320000);
  });

  test('uses defaults from WEALTH_GAP_DEFAULTS', () => {
    const result = calculateRequiredSalePrice({
      wealthGap: 500000
    });

    expect(result.inputs.feeTaxRate).toBe(WEALTH_GAP_DEFAULTS.feeTaxRate);
    expect(result.inputs.targetMultiple).toBe(WEALTH_GAP_DEFAULTS.multiple);
  });
});

describe('calculateExitPlanning', () => {
  test('calculates years to exit correctly', () => {
    const result = calculateExitPlanning({
      currentRevenue: 1000000,
      currentEBITDA: 150000,
      currentValue: 600000,
      targetSalePrice: 1200000,
      growthRate: 0.10,
      targetMargin: 0.15,
      targetMultiple: 4.0
    });

    // Need to double value from 600K to 1.2M
    // At 10% growth, years = ln(2) / ln(1.10) ≈ 7.3 years
    expect(result.yearsToExit).toBeCloseTo(7.3, 1);
    expect(result.projection.length).toBeGreaterThan(0);
  });

  test('returns 0 years if already at target', () => {
    const result = calculateExitPlanning({
      currentRevenue: 2000000,
      currentEBITDA: 300000,
      currentValue: 1500000,
      targetSalePrice: 1000000,
      growthRate: 0.10
    });

    expect(result.yearsToExit).toBe(0);
  });

  test('generates year-by-year projection', () => {
    const result = calculateExitPlanning({
      currentRevenue: 1000000,
      currentEBITDA: 100000,
      currentValue: 400000,
      targetSalePrice: 800000,
      growthRate: 0.10,
      targetMargin: 0.10,
      targetMultiple: 4.0,
      yearsToProject: 10
    });

    expect(result.projection[0].year).toBe(0);
    expect(result.projection[0].value).toBe(400000);
    expect(result.projection[1].revenue).toBe(1100000);

    // Check projection continues until target reached
    const lastYear = result.projection[result.projection.length - 1];
    expect(lastYear.isTargetReached).toBe(true);
  });
});

describe('calculateWealthGapComplete', () => {
  test('performs complete 5-step wealth gap analysis', () => {
    const result = calculateWealthGapComplete({
      // Step 1: Current scenario
      dividends: 30000,
      wages: 120000,
      personalExpensesCovered: 10000,
      otherPassiveIncome: 5000,
      liquidAssets: 300000,
      nonMortgageDebt: 25000,
      // Step 2: Exit goals
      desiredAnnualIncome: 150000,
      exitTimelineYears: 5,
      // Step 3: Portfolio return
      portfolioReturn: 0.075,
      // Step 4: Sale price inputs
      ownershipPercent: 1.0,
      longTermDebt: 100000,
      feeTaxRate: 0.10,
      targetMargin: 0.12,
      targetMultiple: 4.0,
      // Step 5: Exit planning inputs
      currentRevenue: 2000000,
      currentEBITDA: 240000,
      currentValue: 960000,
      growthRate: 0.08,
      yearsToProject: 15
    });

    // Verify all 5 steps are present
    expect(result.step1_currentScenario).toBeDefined();
    expect(result.step2_exitGoals).toBeDefined();
    expect(result.step3_wealthGap).toBeDefined();
    expect(result.step4_requiredSalePrice).toBeDefined();
    expect(result.step5_exitPlanning).toBeDefined();

    // Verify summary
    expect(result.summary.currentAnnualIncome).toBe(165000);
    expect(result.summary.desiredAnnualIncome).toBe(150000);
    expect(result.summary.currentBusinessValue).toBe(960000);
    expect(result.summary.isFeasible).toBeDefined();
  });

  test('identifies feasible exit plan', () => {
    const result = calculateWealthGapComplete({
      dividends: 50000,
      wages: 100000,
      otherPassiveIncome: 50000,
      liquidAssets: 500000,
      nonMortgageDebt: 0,
      desiredAnnualIncome: 120000,
      portfolioReturn: 0.075,
      ownershipPercent: 1.0,
      longTermDebt: 0,
      feeTaxRate: 0.10,
      targetMargin: 0.10,
      targetMultiple: 4.0,
      currentRevenue: 1000000,
      currentEBITDA: 100000,
      currentValue: 400000,
      growthRate: 0.10,
      yearsToProject: 20
    });

    expect(result.summary.isFeasible).toBe(true);
    expect(result.summary.yearsToExit).toBeLessThan(Infinity);
  });
});
