/**
 * VAC (Value Acceleration Calculator) Engine
 *
 * Implements the complete VAC calculation logic with 7 layers:
 * 1. Risk Score Computation (14 questions, 1-5 scale each)
 * 2. Normalized Earnings & EBITDA
 * 3. EBITDA Multiple Selection
 * 4. Current Enterprise Value
 * 5. Value Acceleration (3 levers: Size, Efficiency, Multiple)
 * 6. Probability Distribution & Wealth Gap Projection
 *
 * Accuracy requirement: ±0.01% deviation from Excel baseline
 */

// =============================================================================
// LAYER 1: RISK SCORE COMPUTATION
// =============================================================================

/**
 * Risk Score Categories
 */
const RISK_CATEGORIES = {
  HIGH: { min: 1, max: 23, label: 'High Risk', description: 'Risky acquisition' },
  MEDIUM: { min: 24, max: 46, label: 'Medium Risk', description: 'Typical business' },
  LOW: { min: 47, max: 70, label: 'Low Risk', description: 'Premium business' }
};

/**
 * Q1: Fiscal Year End
 * Purpose: Predictable financial reporting
 * @param {string} fiscalYearEnd - "yes" or "no"
 * @returns {number} Score (1 or 5)
 */
function scoreQ1FiscalYearEnd(fiscalYearEnd) {
  if (!fiscalYearEnd) return 1;
  return fiscalYearEnd.toLowerCase() === 'yes' ? 5 : 1;
}

/**
 * Q2: Incorporated
 * Purpose: Legal structure / transferability
 * @param {string} incorporated - "yes" or "no"
 * @returns {number} Score (1 or 5)
 */
function scoreQ2Incorporated(incorporated) {
  if (!incorporated) return 1;
  return incorporated.toLowerCase() === 'yes' ? 5 : 1;
}

/**
 * Q3: Profit Last Year
 * Purpose: Basic profitability baseline
 * @param {string} profitLastYear - "yes" or "no"
 * @returns {number} Score (1 or 5)
 */
function scoreQ3ProfitLastYear(profitLastYear) {
  if (!profitLastYear) return 1;
  return profitLastYear.toLowerCase() === 'yes' ? 5 : 1;
}

/**
 * Q4: Profit in Last 6 Months (Performance Trend)
 * Purpose: Recent momentum & trend
 * @param {string} lastSixMonthPerformance - Performance category
 * @returns {number} Score (-3 to 5)
 */
function scoreQ4LastSixMonthPerformance(lastSixMonthPerformance) {
  if (!lastSixMonthPerformance) return 1;

  const normalized = lastSixMonthPerformance.toLowerCase().trim();

  if (normalized.includes('10%') && normalized.includes('growth')) return 5;
  if (normalized.includes('modest') && normalized.includes('growth')) return 4;
  if (normalized === 'flat' || normalized.includes('flat')) return 3;
  if (normalized === 'declining' || normalized.includes('declining')) return -3;

  return 1;
}

/**
 * Q5: Clean Accountant-Generated Financials
 * Purpose: Data quality & verification capability
 * @param {string} cleanFinancialYears - Years of clean financials
 * @returns {number} Score (1 to 5)
 */
function scoreQ5CleanFinancialYears(cleanFinancialYears) {
  if (!cleanFinancialYears) return 1;

  const normalized = cleanFinancialYears.toLowerCase().trim();

  // Check for none/zero first to avoid false matches
  if (normalized === 'none' || normalized === '0' || normalized === 'zero') return 1;

  if (normalized.includes('5+') || normalized.includes('5 years') || normalized.includes('five')) return 5;
  if (normalized.includes('3+') || normalized.includes('3 years') || normalized.includes('three')) return 4;
  // Check for 1-2 years pattern more carefully
  if (normalized.includes('1-2') || normalized.includes('1 year') || normalized.includes('2 year') ||
      normalized === '1' || normalized === '2' || normalized === 'one' || normalized === 'two') return 3;

  return 1;
}

/**
 * Q6: Has General Manager
 * Purpose: Owner dependency / scalability
 * @param {string} hasGeneralManager - "yes" or "no"
 * @returns {number} Score (1 or 5)
 */
function scoreQ6HasGeneralManager(hasGeneralManager) {
  if (!hasGeneralManager) return 1;
  return hasGeneralManager.toLowerCase() === 'yes' ? 5 : 1;
}

/**
 * Q7: Project-Based Revenue
 * Purpose: Revenue predictability
 * @param {string} projectBased - "yes", "no", or "between"
 * @returns {number} Score (1, 3, or 5)
 */
function scoreQ7ProjectBased(projectBased) {
  if (!projectBased) return 1;

  const normalized = projectBased.toLowerCase().trim();

  if (normalized === 'no') return 5;
  if (normalized === 'between' || normalized.includes('between') || normalized.includes('partial')) return 3;

  return 1; // "yes" or other = project-based = less predictable
}

/**
 * Q8: Largest Customer Concentration
 * Purpose: Customer concentration risk
 * Note: Excel has overlapping ranges - must match exactly
 * @param {string} largestCustomerPercent - Percentage range
 * @returns {number} Score (1 to 5)
 */
function scoreQ8LargestCustomerPercent(largestCustomerPercent) {
  if (!largestCustomerPercent) return 1;

  const normalized = largestCustomerPercent.toLowerCase().trim();

  // Check for <10% first (best case)
  if (normalized.includes('<10') || normalized.includes('under 10') || normalized.includes('less than 10')) return 5;

  // Check for 5-15% range
  if (normalized.includes('5-15') || normalized.includes('5%-15%') || normalized.includes('5% to 15%')) return 4;

  // Check for "under 5%" (also good)
  if (normalized.includes('<5') || normalized.includes('under 5') || normalized.includes('less than 5')) return 4;

  // Check for 15-25% range
  if (normalized.includes('15-25') || normalized.includes('15%-25%') || normalized.includes('15% to 25%')) return 3;

  // Higher concentration = more risk
  return 1;
}

/**
 * Q9: Owner Hours Per Week
 * Purpose: Owner dependency / business scalability
 * @param {string|number} ownerHours - Hours per week
 * @returns {number} Score (1 to 5)
 */
function scoreQ9OwnerHours(ownerHours) {
  if (ownerHours === null || ownerHours === undefined) return 1;

  // Handle string input
  let hours = ownerHours;
  if (typeof ownerHours === 'string') {
    const str = ownerHours.toLowerCase().trim();

    // Handle "<X" patterns (meaning less than X)
    if (str.startsWith('<')) {
      const match = str.match(/\d+/);
      if (match) {
        const threshold = parseInt(match[0], 10);
        // "<10" means under 10, so score as if hours = threshold - 1
        if (threshold <= 10) return 5;
        if (threshold <= 20) return 4;
        if (threshold <= 30) return 3;
        return 1;
      }
    }

    // Extract first number from string like "10-20" or "15 hours"
    const match = str.match(/\d+/);
    hours = match ? parseInt(match[0], 10) : 30;
  }

  if (hours < 10) return 5;
  if (hours < 20) return 4;
  if (hours < 30) return 3;

  return 1; // 30+ hours = high owner dependency
}

/**
 * Q10: Lease Years Remaining
 * Purpose: Location/operational stability
 * @param {string} leaseYearsRemaining - Years remaining or ownership status
 * @returns {number} Score (1, 4, or 5)
 */
function scoreQ10LeaseYearsRemaining(leaseYearsRemaining) {
  if (!leaseYearsRemaining) return 1;

  const normalized = leaseYearsRemaining.toLowerCase().trim();

  // Best cases: long lease or owned building
  if (normalized.includes('over 10') || normalized.includes('10+') || normalized.includes('building owned') || normalized.includes('own')) {
    return 5;
  }

  // Good case: 5-10 years
  if (normalized.includes('5-10') || normalized.includes('between 5') || normalized.includes('5 to 10')) {
    return 4;
  }

  return 1; // Short lease = risk
}

/**
 * Q11: Company Age
 * Purpose: Longevity / market validation
 * @param {string} businessAge - Age category
 * @returns {number} Score (1, 4, or 5)
 */
function scoreQ11BusinessAge(businessAge) {
  if (!businessAge) return 1;

  const normalized = businessAge.toLowerCase().trim();

  // Extract years if numeric
  const yearsMatch = normalized.match(/(\d+)/);
  if (yearsMatch) {
    const years = parseInt(yearsMatch[1], 10);
    if (years >= 25) return 5;
    if (years >= 15) return 4;
    return 1;
  }

  // Check text patterns
  if (normalized.includes('over 25') || normalized.includes('25+') || normalized.includes('25 years')) return 5;
  if (normalized.includes('over 15') || normalized.includes('15+') || normalized.includes('15 years')) return 4;

  return 1;
}

/**
 * Q12: Operating System / Technology
 * Purpose: Operational maturity & scalability
 * @param {string} operatingSystem - System type
 * @returns {number} Score (1, 3, or 5)
 */
function scoreQ12OperatingSystem(operatingSystem) {
  if (!operatingSystem) return 1;

  const normalized = operatingSystem.toLowerCase().trim();

  if (normalized.includes('cloud') && normalized.includes('erp')) return 5;
  if (normalized.includes('erp')) return 5;
  if (normalized.includes('customized') && normalized.includes('crm')) return 3;
  if (normalized.includes('crm')) return 3;

  return 1; // Basic or no system
}

/**
 * Q13: Payment Terms / Revenue Model
 * Purpose: Cash flow predictability
 * @param {string} customerPaymentTerms - Payment terms
 * @returns {number} Score (1 to 5)
 */
function scoreQ13CustomerPaymentTerms(customerPaymentTerms) {
  if (!customerPaymentTerms) return 1;

  const normalized = customerPaymentTerms.toLowerCase().trim();

  if (normalized.includes('contracted') && normalized.includes('recurring')) return 5;
  if (normalized.includes('recurring') && normalized.includes('monthly')) return 5;
  if (normalized.includes('30') && (normalized.includes('60') || normalized.includes('day'))) return 4;
  if (normalized.includes('30 day') || normalized.includes('net 30')) return 4;
  if (normalized.includes('60') && normalized.includes('90')) return 3;
  if (normalized.includes('60 day') || normalized.includes('net 60')) return 3;

  return 1; // Long terms or unpredictable
}

/**
 * Q14: Single Points of Failure (SPOF)
 * Purpose: Operational redundancy / risk
 * @param {number} numberOfSPOFs - Count of SPOFs
 * @returns {number} Score (1 to 5)
 */
function scoreQ14NumberOfSPOFs(numberOfSPOFs) {
  if (numberOfSPOFs === null || numberOfSPOFs === undefined) return 1;

  const spofs = typeof numberOfSPOFs === 'string' ? parseInt(numberOfSPOFs, 10) : numberOfSPOFs;

  if (isNaN(spofs) || spofs >= 6) return 1;
  if (spofs === 0) return 5;
  if (spofs === 1) return 4;
  if (spofs >= 2 && spofs <= 3) return 3;
  if (spofs >= 4 && spofs <= 5) return 2;

  return 1;
}

/**
 * Calculate total risk score from all 14 questions
 * @param {Object} answers - Object containing all answer fields
 * @returns {Object} Risk score result with score, category, and breakdown
 */
function calculateRiskScore(answers) {
  // Calculate individual question scores
  const scores = {
    q1_fiscalYearEnd: scoreQ1FiscalYearEnd(answers.fiscalYearEnd),
    q2_incorporated: scoreQ2Incorporated(answers.incorporated),
    q3_profitLastYear: scoreQ3ProfitLastYear(answers.profitLastYear),
    q4_lastSixMonthPerformance: scoreQ4LastSixMonthPerformance(answers.lastSixMonthPerformance),
    q5_cleanFinancialYears: scoreQ5CleanFinancialYears(answers.cleanFinancialYears),
    q6_hasGeneralManager: scoreQ6HasGeneralManager(answers.hasGeneralManager),
    q7_projectBased: scoreQ7ProjectBased(answers.projectBased),
    q8_largestCustomerPercent: scoreQ8LargestCustomerPercent(answers.largestCustomerPercent),
    q9_ownerHours: scoreQ9OwnerHours(answers.ownerHours),
    q10_leaseYearsRemaining: scoreQ10LeaseYearsRemaining(answers.leaseYearsRemaining),
    q11_businessAge: scoreQ11BusinessAge(answers.businessAge),
    q12_operatingSystem: scoreQ12OperatingSystem(answers.operatingSystem),
    q13_customerPaymentTerms: scoreQ13CustomerPaymentTerms(answers.customerPaymentTerms),
    q14_numberOfSPOFs: scoreQ14NumberOfSPOFs(answers.numberOfSPOFs)
  };

  // Sum all scores
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

  // Determine risk category
  let riskCategory;
  if (totalScore <= RISK_CATEGORIES.HIGH.max) {
    riskCategory = 'HIGH';
  } else if (totalScore <= RISK_CATEGORIES.MEDIUM.max) {
    riskCategory = 'MEDIUM';
  } else {
    riskCategory = 'LOW';
  }

  return {
    riskScore: totalScore,
    riskCategory,
    riskLabel: RISK_CATEGORIES[riskCategory].label,
    riskDescription: RISK_CATEGORIES[riskCategory].description,
    breakdown: scores,
    maxPossibleScore: 70,
    minPossibleScore: 1, // Theoretical minimum with Q4 at -3 and others at 1 = -3 + 13 = 10, but spec says 1
    answeredQuestions: Object.keys(answers).length,
    totalQuestions: 14
  };
}

/**
 * Validate that all required risk questions are answered
 * @param {Object} answers - Object containing answer fields
 * @returns {Object} Validation result with isValid flag and missing fields
 */
function validateRiskAnswers(answers) {
  const requiredFields = [
    'fiscalYearEnd',
    'incorporated',
    'profitLastYear',
    'lastSixMonthPerformance',
    'cleanFinancialYears',
    'hasGeneralManager',
    'projectBased',
    'largestCustomerPercent',
    'ownerHours',
    'leaseYearsRemaining',
    'businessAge',
    'operatingSystem',
    'customerPaymentTerms',
    'numberOfSPOFs'
  ];

  const missingFields = requiredFields.filter(field => {
    const value = answers[field];
    return value === null || value === undefined || value === '';
  });

  return {
    isValid: missingFields.length === 0,
    missingFields,
    providedFields: requiredFields.filter(f => !missingFields.includes(f)),
    totalRequired: requiredFields.length
  };
}

// =============================================================================
// LAYER 2: EBITDA CALCULATION
// =============================================================================

/**
 * Baseline margin constants (used when detailed financials are not provided)
 * These are industry-standard defaults per VAC specification
 */
const BASELINE_MARGINS = {
  pretaxProfit: 0.075,      // 7.5% pre-tax profit margin
  depreciation: 0.01,       // 1% of revenue for D&A
  interest: 0.01,           // 1% of revenue for interest
  discretionary: 0.02       // 2% of revenue for discretionary spending
};

/**
 * Parse currency value from string or number
 * Handles formats like "$1,000,000", "1000000", "$1M", etc.
 * @param {string|number} value - The value to parse
 * @returns {number} Parsed numeric value
 */
function parseCurrency(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;

  // Remove currency symbols, commas, and whitespace
  let cleaned = String(value).replace(/[$,\s]/g, '').trim();

  // Handle shorthand notation (1M, 1K, etc.)
  const multipliers = { 'k': 1000, 'm': 1000000, 'b': 1000000000 };
  const match = cleaned.match(/^(-?\d+\.?\d*)\s*([kmb])?$/i);

  if (match) {
    const num = parseFloat(match[1]);
    const suffix = match[2] ? match[2].toLowerCase() : null;
    return suffix ? num * multipliers[suffix] : num;
  }

  return parseFloat(cleaned) || 0;
}

/**
 * Calculate EBITDA using the baseline method
 * Used when detailed financial data is not provided
 *
 * @param {number} revenue - Annual revenue
 * @param {Object} customMargins - Optional custom margins to override defaults
 * @returns {Object} Baseline EBITDA breakdown
 */
function calculateBaselineEBITDA(revenue, customMargins = {}) {
  const margins = { ...BASELINE_MARGINS, ...customMargins };
  const rev = parseCurrency(revenue);

  const pretaxProfit = rev * margins.pretaxProfit;
  const depreciation = rev * margins.depreciation;
  const interest = rev * margins.interest;
  const discretionary = rev * margins.discretionary;

  const ebitda = pretaxProfit + depreciation + interest + discretionary;

  return {
    method: 'baseline',
    revenue: rev,
    components: {
      pretaxProfit,
      depreciation,
      interest,
      discretionary
    },
    marginsUsed: margins,
    ebitda,
    ebitdaMargin: rev > 0 ? ebitda / rev : 0
  };
}

/**
 * Calculate EBITDA using actual financial data
 *
 * @param {Object} financials - Financial data object
 * @param {number} financials.pretaxProfit - Pre-tax profit (net profit before taxes)
 * @param {number} financials.depreciation - Depreciation & amortization
 * @param {number} financials.interest - Interest expense (long-term)
 * @param {number} financials.discretionary - Owner discretionary spending
 * @param {number} financials.revenue - Annual revenue (for margin calculation)
 * @returns {Object} Actual EBITDA breakdown
 */
function calculateActualEBITDA(financials) {
  const pretaxProfit = parseCurrency(financials.pretaxProfit);
  const depreciation = parseCurrency(financials.depreciation);
  const interest = parseCurrency(financials.interest);
  const discretionary = parseCurrency(financials.discretionary || 0);
  const revenue = parseCurrency(financials.revenue);

  const ebitda = pretaxProfit + depreciation + interest + discretionary;

  return {
    method: 'actual',
    revenue,
    components: {
      pretaxProfit,
      depreciation,
      interest,
      discretionary
    },
    ebitda,
    ebitdaMargin: revenue > 0 ? ebitda / revenue : 0
  };
}

/**
 * Apply normalization adjustments to EBITDA
 * Adjusts for owner salary and rent that are above/below market rate
 *
 * @param {number} baseEbitda - The base EBITDA before adjustments
 * @param {Object} adjustments - Adjustment values
 * @param {number} adjustments.ownerSalaryAdj - Owner salary adjustment (positive if below market, negative if above)
 * @param {number} adjustments.rentAdj - Rent adjustment (positive if below market, negative if above)
 * @returns {Object} Adjusted EBITDA with breakdown
 */
function applyEBITDAAdjustments(baseEbitda, adjustments = {}) {
  const ownerSalaryAdj = parseCurrency(adjustments.ownerSalaryAdj || 0);
  const rentAdj = parseCurrency(adjustments.rentAdj || 0);

  const totalAdjustments = ownerSalaryAdj + rentAdj;
  const adjustedEbitda = baseEbitda + totalAdjustments;

  return {
    baseEbitda,
    adjustments: {
      ownerSalaryAdj,
      rentAdj,
      total: totalAdjustments
    },
    adjustedEbitda
  };
}

/**
 * Main EBITDA calculation function
 * Automatically selects baseline or actual method based on data availability
 *
 * @param {Object} data - Input data
 * @param {number} data.revenue - Annual revenue (required)
 * @param {number} data.pretaxProfit - Pre-tax profit (optional, triggers actual method)
 * @param {number} data.depreciation - D&A (optional)
 * @param {number} data.interest - Interest expense (optional)
 * @param {number} data.discretionary - Discretionary spending (optional)
 * @param {number} data.ownerSalaryAdj - Owner salary normalization adjustment
 * @param {number} data.rentAdj - Rent normalization adjustment
 * @param {boolean} data.useBaseline - Force baseline method even if data provided
 * @returns {Object} Complete EBITDA calculation result
 */
function calculateEBITDA(data) {
  const revenue = parseCurrency(data.revenue);

  if (revenue <= 0) {
    return {
      error: 'Revenue must be greater than zero',
      isValid: false,
      revenue: 0,
      ebitda: 0,
      adjustedEbitda: 0,
      ebitdaMargin: 0
    };
  }

  // Determine which method to use
  const hasDetailedFinancials = !data.useBaseline && (
    data.pretaxProfit !== null &&
    data.pretaxProfit !== undefined &&
    data.pretaxProfit !== ''
  );

  let baseResult;

  if (hasDetailedFinancials) {
    // Use actual financial data
    baseResult = calculateActualEBITDA({
      revenue: data.revenue,
      pretaxProfit: data.pretaxProfit,
      depreciation: data.depreciation || 0,
      interest: data.interest || 0,
      discretionary: data.discretionary || 0
    });
  } else {
    // Use baseline method
    baseResult = calculateBaselineEBITDA(revenue, data.customMargins);
  }

  // Apply adjustments
  const adjustedResult = applyEBITDAAdjustments(baseResult.ebitda, {
    ownerSalaryAdj: data.ownerSalaryAdj,
    rentAdj: data.rentAdj
  });

  // Calculate final margin
  const ebitdaMargin = revenue > 0 ? adjustedResult.adjustedEbitda / revenue : 0;

  return {
    isValid: true,
    method: baseResult.method,
    revenue,
    components: baseResult.components,
    marginsUsed: baseResult.marginsUsed || null,
    ebitda: baseResult.ebitda,
    adjustments: adjustedResult.adjustments,
    adjustedEbitda: adjustedResult.adjustedEbitda,
    ebitdaMargin: baseResult.ebitdaMargin,
    adjustedEbitdaMargin: ebitdaMargin
  };
}

/**
 * Validate EBITDA input data
 * @param {Object} data - Input data to validate
 * @returns {Object} Validation result
 */
function validateEBITDAInputs(data) {
  const errors = [];
  const warnings = [];

  // Revenue is required
  const revenue = parseCurrency(data.revenue);
  if (!data.revenue && data.revenue !== 0) {
    errors.push('Revenue is required');
  } else if (revenue <= 0) {
    errors.push('Revenue must be greater than zero');
  }

  // If using actual method, check for reasonable values
  if (data.pretaxProfit !== undefined) {
    const pretax = parseCurrency(data.pretaxProfit);
    const pretaxMargin = revenue > 0 ? pretax / revenue : 0;

    if (pretaxMargin < -0.5) {
      warnings.push('Pre-tax profit margin is very negative (< -50%). Verify data accuracy.');
    }
    if (pretaxMargin > 0.5) {
      warnings.push('Pre-tax profit margin is unusually high (> 50%). Verify data accuracy.');
    }
  }

  // Check for negative adjustments that might indicate data entry errors
  if (data.ownerSalaryAdj) {
    const adj = parseCurrency(data.ownerSalaryAdj);
    if (Math.abs(adj) > revenue * 0.3) {
      warnings.push('Owner salary adjustment is more than 30% of revenue. Verify this is correct.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasWarnings: warnings.length > 0
  };
}

// =============================================================================
// LAYER 2B: SIZE SCORE CALCULATION
// =============================================================================

/**
 * Size Score breakpoints - maps EBITDA to a score (0-30)
 * Based on Data Page from Excel specification
 * Configurable table for easy updates
 */
const SIZE_SCORE_TABLE = [
  { maxEbitda: 100000, score: 0 },
  { maxEbitda: 250000, score: 1 },
  { maxEbitda: 500000, score: 3 },
  { maxEbitda: 750000, score: 5 },
  { maxEbitda: 1000000, score: 10 },
  { maxEbitda: 2000000, score: 12 },
  { maxEbitda: 5000000, score: 20 },
  { maxEbitda: 10000000, score: 25 },
  { maxEbitda: Infinity, score: 30 }
];

/**
 * Calculate Size Score based on EBITDA
 * Maps EBITDA to a score (0-30) using breakpoints
 *
 * @param {number} ebitda - Adjusted EBITDA
 * @returns {Object} Size score result
 */
function calculateSizeScore(ebitda) {
  const ebitdaValue = parseCurrency(ebitda);

  let score = 0;
  let bracket = null;

  for (let i = 0; i < SIZE_SCORE_TABLE.length; i++) {
    if (ebitdaValue < SIZE_SCORE_TABLE[i].maxEbitda) {
      score = SIZE_SCORE_TABLE[i].score;
      bracket = {
        min: i > 0 ? SIZE_SCORE_TABLE[i - 1].maxEbitda : 0,
        max: SIZE_SCORE_TABLE[i].maxEbitda
      };
      break;
    }
  }

  return {
    ebitda: ebitdaValue,
    sizeScore: score,
    maxScore: 30,
    bracket,
    description: getSizeScoreDescription(score)
  };
}

/**
 * Get description for size score
 */
function getSizeScoreDescription(score) {
  if (score <= 1) return 'Very Small Business';
  if (score <= 5) return 'Small Business';
  if (score <= 12) return 'Growing Business';
  if (score <= 20) return 'Mid-Market Business';
  if (score <= 25) return 'Large Mid-Market';
  return 'Premium Size Business';
}

// =============================================================================
// LAYER 2C: CURRENT & FORECASTED P&L MODULE
// =============================================================================

/**
 * Calculate Current P&L (Profit & Loss) breakdown
 *
 * @param {Object} params - P&L parameters
 * @param {number} params.revenue - Current annual revenue
 * @param {number} params.cogs - Cost of goods sold (optional, can be derived)
 * @param {number} params.cogsPercent - COGS as % of revenue (alternative to cogs)
 * @param {number} params.ebitda - Adjusted EBITDA
 * @returns {Object} Current P&L breakdown with margins
 */
function calculateCurrentPL(params) {
  const revenue = parseCurrency(params.revenue);
  const ebitda = parseCurrency(params.ebitda);

  // COGS can be provided as amount or percentage
  let cogs;
  if (params.cogs !== undefined && params.cogs !== null) {
    cogs = parseCurrency(params.cogs);
  } else if (params.cogsPercent !== undefined && params.cogsPercent !== null) {
    cogs = revenue * parseCurrency(params.cogsPercent);
  } else {
    // Estimate COGS: Revenue - EBITDA - typical overhead
    // Assuming operating expenses are roughly 15% of revenue
    cogs = Math.max(0, revenue - ebitda - (revenue * 0.15));
  }

  const grossProfit = revenue - cogs;
  const profit = ebitda; // For simplicity, profit approximates EBITDA

  return {
    revenue,
    cogs,
    grossProfit,
    profit,
    ebitda,
    margins: {
      revenue: 1.0,
      cogsPercent: revenue > 0 ? cogs / revenue : 0,
      grossMargin: revenue > 0 ? grossProfit / revenue : 0,
      profitMargin: revenue > 0 ? profit / revenue : 0,
      ebitdaMargin: revenue > 0 ? ebitda / revenue : 0
    }
  };
}

/**
 * Calculate Forecasted P&L after improvements
 *
 * @param {Object} params - Forecast parameters
 * @param {Object} params.currentPL - Current P&L from calculateCurrentPL
 * @param {number} params.revenueGrowth - Revenue growth rate (e.g., 0.10 for 10%)
 * @param {number} params.improvedCogsPercent - Improved COGS % (after efficiency gains)
 * @param {number} params.improvedEbitdaMargin - Improved EBITDA margin
 * @param {number} params.improvedMultiple - Improved EBITDA multiple
 * @returns {Object} Forecasted P&L with projections
 */
function calculateForecastedPL(params) {
  const { currentPL, revenueGrowth = 0, improvedCogsPercent, improvedEbitdaMargin, improvedMultiple } = params;

  // Forecast revenue (can include growth or stay same)
  const forecastRevenue = currentPL.revenue * (1 + parseCurrency(revenueGrowth));

  // Use improved COGS % or default to current
  const forecastCogsPercent = improvedCogsPercent !== undefined
    ? parseCurrency(improvedCogsPercent)
    : currentPL.margins.cogsPercent;
  const forecastCogs = forecastRevenue * forecastCogsPercent;

  // Forecast profit
  const forecastGrossProfit = forecastRevenue - forecastCogs;
  const forecastProfitMargin = forecastGrossProfit / forecastRevenue;

  // Use improved EBITDA margin or default to current
  const forecastEbitdaMargin = improvedEbitdaMargin !== undefined
    ? parseCurrency(improvedEbitdaMargin)
    : currentPL.margins.ebitdaMargin;
  const forecastEbitda = forecastRevenue * forecastEbitdaMargin;

  // Calculate forecast sale price
  const multiple = parseCurrency(improvedMultiple) || 4.0;
  const forecastSalePrice = forecastEbitda * multiple;

  // Calculate uplift vs current
  const currentSalePrice = currentPL.ebitda * multiple;
  const salePriceGrowthPercent = currentSalePrice > 0
    ? (forecastSalePrice - currentSalePrice) / currentSalePrice
    : 0;
  const salePriceIncrease = forecastSalePrice - currentSalePrice;

  return {
    revenue: forecastRevenue,
    cogs: forecastCogs,
    grossProfit: forecastGrossProfit,
    profit: forecastGrossProfit,
    ebitda: forecastEbitda,
    margins: {
      revenue: 1.0,
      cogsPercent: forecastCogsPercent,
      grossMargin: forecastRevenue > 0 ? forecastGrossProfit / forecastRevenue : 0,
      profitMargin: forecastProfitMargin,
      ebitdaMargin: forecastEbitdaMargin
    },
    salePrice: {
      multiple,
      forecastValue: forecastSalePrice,
      currentValue: currentSalePrice,
      increase: salePriceIncrease,
      growthPercent: salePriceGrowthPercent
    }
  };
}

/**
 * Calculate complete P&L comparison (Current vs Forecasted)
 */
function calculatePLComparison(params) {
  const currentPL = calculateCurrentPL({
    revenue: params.revenue,
    cogs: params.cogs,
    cogsPercent: params.cogsPercent,
    ebitda: params.ebitda
  });

  const forecastedPL = calculateForecastedPL({
    currentPL,
    revenueGrowth: params.revenueGrowth,
    improvedCogsPercent: params.improvedCogsPercent,
    improvedEbitdaMargin: params.improvedEbitdaMargin,
    improvedMultiple: params.improvedMultiple
  });

  return {
    current: currentPL,
    forecasted: forecastedPL,
    comparison: {
      revenueChange: forecastedPL.revenue - currentPL.revenue,
      revenueChangePercent: currentPL.revenue > 0
        ? (forecastedPL.revenue - currentPL.revenue) / currentPL.revenue
        : 0,
      ebitdaChange: forecastedPL.ebitda - currentPL.ebitda,
      ebitdaChangePercent: currentPL.ebitda > 0
        ? (forecastedPL.ebitda - currentPL.ebitda) / currentPL.ebitda
        : 0,
      marginImprovement: forecastedPL.margins.ebitdaMargin - currentPL.margins.ebitdaMargin
    }
  };
}

// =============================================================================
// LAYER 3: MULTIPLE SELECTION
// =============================================================================

/**
 * Common EBITDA multiples by business type
 * These are median values for typical small-to-mid market businesses
 */
const COMMON_MULTIPLES = {
  small: { min: 2.0, median: 3.0, max: 4.0, label: 'Small Business (<$1M revenue)' },
  medium: { min: 3.0, median: 4.0, max: 5.0, label: 'Medium Business ($1M-$10M revenue)' },
  large: { min: 4.0, median: 5.0, max: 7.0, label: 'Large Business ($10M+ revenue)' },
  default: { min: 3.0, median: 4.0, max: 5.0, label: 'Default Multiple Range' }
};

/**
 * Multiple types for selection
 */
const MULTIPLE_TYPES = {
  CUSTOM: 'custom',
  COMMON: 'common',
  INDUSTRY: 'industry'
};

/**
 * Select the appropriate multiple based on type and inputs
 *
 * @param {Object} options - Multiple selection options
 * @param {string} options.multipleType - 'custom', 'common', or 'industry'
 * @param {number} options.customMultiple - Custom multiple value (if type is custom)
 * @param {string} options.businessSize - 'small', 'medium', or 'large' (if type is common)
 * @param {number} options.industryMultiple - Industry-specific multiple (if type is industry)
 * @param {number} options.riskScore - Risk score for potential adjustment
 * @param {boolean} options.applyRiskWeighting - Whether to adjust multiple by risk
 * @returns {Object} Selected multiple with details
 */
function selectMultiple(options) {
  const {
    multipleType = MULTIPLE_TYPES.COMMON,
    customMultiple,
    businessSize = 'medium',
    industryMultiple,
    riskScore,
    applyRiskWeighting = false
  } = options;

  let baseMultiple;
  let source;
  let range;

  // Select base multiple by type
  switch (multipleType) {
    case MULTIPLE_TYPES.CUSTOM:
      if (!customMultiple || customMultiple <= 0) {
        return {
          error: 'Custom multiple must be provided and greater than zero',
          isValid: false
        };
      }
      baseMultiple = parseCurrency(customMultiple);
      source = 'custom';
      range = { min: baseMultiple, median: baseMultiple, max: baseMultiple };
      break;

    case MULTIPLE_TYPES.INDUSTRY:
      if (!industryMultiple || industryMultiple <= 0) {
        // Fall back to common multiples if no industry data
        const commonData = COMMON_MULTIPLES[businessSize] || COMMON_MULTIPLES.default;
        baseMultiple = commonData.median;
        source = 'common (industry fallback)';
        range = commonData;
      } else {
        baseMultiple = parseCurrency(industryMultiple);
        source = 'industry';
        range = { min: baseMultiple * 0.8, median: baseMultiple, max: baseMultiple * 1.2 };
      }
      break;

    case MULTIPLE_TYPES.COMMON:
    default:
      const commonData = COMMON_MULTIPLES[businessSize] || COMMON_MULTIPLES.default;
      baseMultiple = commonData.median;
      source = 'common';
      range = commonData;
      break;
  }

  // Apply risk weighting if enabled
  let adjustedMultiple = baseMultiple;
  let riskAdjustment = 0;

  if (applyRiskWeighting && riskScore !== undefined) {
    // Risk score 1-70: Higher score = lower risk = higher multiple
    // Adjustment range: -20% to +20% based on risk score
    // Score 35 (middle) = no adjustment
    // Score 70 (best) = +20%
    // Score 1 (worst) = -20%
    const riskFactor = (riskScore - 35) / 35; // -1 to +1
    riskAdjustment = baseMultiple * riskFactor * 0.20; // ±20% max
    adjustedMultiple = baseMultiple + riskAdjustment;
  }

  return {
    isValid: true,
    multipleType,
    source,
    baseMultiple,
    riskAdjustment,
    adjustedMultiple,
    multipleUsed: adjustedMultiple,
    range
  };
}

// =============================================================================
// LAYER 4: CURRENT ENTERPRISE VALUE
// =============================================================================

/**
 * Calculate Current Enterprise Value
 *
 * @param {number} ebitda - Adjusted EBITDA
 * @param {number} multiple - EBITDA multiple to use
 * @returns {Object} Current value calculation result
 */
function calculateCurrentValue(ebitda, multiple) {
  const ebitdaValue = parseCurrency(ebitda);
  const multipleValue = parseCurrency(multiple);

  if (ebitdaValue <= 0) {
    return {
      isValid: false,
      error: 'EBITDA must be greater than zero',
      currentValue: 0
    };
  }

  if (multipleValue <= 0) {
    return {
      isValid: false,
      error: 'Multiple must be greater than zero',
      currentValue: 0
    };
  }

  const currentValue = ebitdaValue * multipleValue;

  return {
    isValid: true,
    ebitda: ebitdaValue,
    multiple: multipleValue,
    currentValue
  };
}

// =============================================================================
// LAYER 5: VALUE ACCELERATION (3 LEVERS)
// =============================================================================

/**
 * Calculate Size Lever impact (revenue growth)
 *
 * @param {Object} params - Size lever parameters
 * @param {number} params.currentRevenue - Current annual revenue
 * @param {number} params.currentEBITDA - Current adjusted EBITDA
 * @param {number} params.currentValue - Current enterprise value
 * @param {number} params.multiple - EBITDA multiple
 * @param {number} params.targetGrowthRate - Target growth rate (e.g., 0.10 for 10%)
 * @param {number} params.ebitdaMargin - EBITDA margin (for calculating new EBITDA)
 * @returns {Object} Size lever calculation result
 */
function calculateSizeLever(params) {
  const {
    currentRevenue,
    currentEBITDA,
    currentValue,
    multiple,
    targetGrowthRate = 0,
    ebitdaMargin
  } = params;

  const revenue = parseCurrency(currentRevenue);
  const ebitda = parseCurrency(currentEBITDA);
  const value = parseCurrency(currentValue);
  const mult = parseCurrency(multiple);
  const growthRate = parseCurrency(targetGrowthRate);
  const margin = ebitdaMargin || (revenue > 0 ? ebitda / revenue : 0);

  // Calculate new values after growth
  const newRevenue = revenue * (1 + growthRate);
  const newEBITDA = newRevenue * margin;
  const newValue = newEBITDA * mult;

  // Calculate value created
  const valueCreated = newValue - value;
  const percentIncrease = value > 0 ? valueCreated / value : 0;

  return {
    lever: 'size',
    description: 'Revenue Growth',
    inputs: {
      currentRevenue: revenue,
      currentEBITDA: ebitda,
      currentValue: value,
      multiple: mult,
      targetGrowthRate: growthRate,
      ebitdaMargin: margin
    },
    outputs: {
      newRevenue,
      newEBITDA,
      newValue,
      valueCreated,
      percentIncrease
    }
  };
}

/**
 * Calculate Efficiency Lever impact (margin improvement)
 *
 * @param {Object} params - Efficiency lever parameters
 * @param {number} params.currentRevenue - Current annual revenue
 * @param {number} params.currentEBITDA - Current adjusted EBITDA
 * @param {number} params.currentValue - Current enterprise value
 * @param {number} params.multiple - EBITDA multiple
 * @param {number} params.targetEfficiencyGain - Target efficiency gain in dollars or as margin improvement
 * @param {boolean} params.isPercentage - If true, targetEfficiencyGain is treated as margin improvement %
 * @returns {Object} Efficiency lever calculation result
 */
function calculateEfficiencyLever(params) {
  const {
    currentRevenue,
    currentEBITDA,
    currentValue,
    multiple,
    targetEfficiencyGain = 0,
    isPercentage = false
  } = params;

  const revenue = parseCurrency(currentRevenue);
  const ebitda = parseCurrency(currentEBITDA);
  const value = parseCurrency(currentValue);
  const mult = parseCurrency(multiple);

  // Calculate efficiency gain
  let efficiencyGainDollars;
  if (isPercentage) {
    // targetEfficiencyGain is a margin improvement (e.g., 0.02 for 2% margin improvement)
    efficiencyGainDollars = revenue * parseCurrency(targetEfficiencyGain);
  } else {
    // targetEfficiencyGain is a dollar amount
    efficiencyGainDollars = parseCurrency(targetEfficiencyGain);
  }

  // Calculate new values (revenue stays constant)
  const newEBITDA = ebitda + efficiencyGainDollars;
  const newValue = newEBITDA * mult;

  // Calculate value created
  const valueCreated = newValue - value;
  const percentIncrease = value > 0 ? valueCreated / value : 0;

  return {
    lever: 'efficiency',
    description: 'Margin Improvement',
    inputs: {
      currentRevenue: revenue,
      currentEBITDA: ebitda,
      currentValue: value,
      multiple: mult,
      targetEfficiencyGain: efficiencyGainDollars,
      isPercentage
    },
    outputs: {
      newRevenue: revenue, // Revenue stays same
      newEBITDA,
      newValue,
      valueCreated,
      percentIncrease
    }
  };
}

/**
 * Calculate Multiple Lever impact (risk reduction / multiple improvement)
 *
 * @param {Object} params - Multiple lever parameters
 * @param {number} params.currentEBITDA - Current adjusted EBITDA
 * @param {number} params.currentValue - Current enterprise value
 * @param {number} params.currentMultiple - Current EBITDA multiple
 * @param {number} params.targetMultipleIncrease - Target multiple increase (e.g., 0.10 for 10% increase)
 * @returns {Object} Multiple lever calculation result
 */
function calculateMultipleLever(params) {
  const {
    currentEBITDA,
    currentValue,
    currentMultiple,
    targetMultipleIncrease = 0
  } = params;

  const ebitda = parseCurrency(currentEBITDA);
  const value = parseCurrency(currentValue);
  const mult = parseCurrency(currentMultiple);
  const increaseRate = parseCurrency(targetMultipleIncrease);

  // Calculate new multiple
  const newMultiple = mult * (1 + increaseRate);
  const newValue = ebitda * newMultiple;

  // Calculate value created
  const valueCreated = newValue - value;
  const percentIncrease = value > 0 ? valueCreated / value : 0;

  return {
    lever: 'multiple',
    description: 'Multiple/Risk Improvement',
    inputs: {
      currentEBITDA: ebitda,
      currentValue: value,
      currentMultiple: mult,
      targetMultipleIncrease: increaseRate
    },
    outputs: {
      newMultiple,
      newValue,
      valueCreated,
      percentIncrease
    }
  };
}

/**
 * Calculate all three value acceleration levers
 *
 * @param {Object} params - All lever parameters
 * @returns {Object} Combined value acceleration results
 */
function calculateValueAcceleration(params) {
  const {
    currentRevenue,
    currentEBITDA,
    currentValue,
    multiple,
    ebitdaMargin,
    targetGrowthRate = 0,
    targetEfficiencyGain = 0,
    efficiencyIsPercentage = false,
    targetMultipleIncrease = 0
  } = params;

  // Calculate each lever
  const sizeLever = calculateSizeLever({
    currentRevenue,
    currentEBITDA,
    currentValue,
    multiple,
    targetGrowthRate,
    ebitdaMargin
  });

  const efficiencyLever = calculateEfficiencyLever({
    currentRevenue,
    currentEBITDA,
    currentValue,
    multiple,
    targetEfficiencyGain,
    isPercentage: efficiencyIsPercentage
  });

  const multipleLever = calculateMultipleLever({
    currentEBITDA,
    currentValue,
    currentMultiple: multiple,
    targetMultipleIncrease
  });

  // Calculate combined effect (all three levers applied together)
  const revenue = parseCurrency(currentRevenue);
  const ebitda = parseCurrency(currentEBITDA);
  const value = parseCurrency(currentValue);
  const mult = parseCurrency(multiple);
  const margin = ebitdaMargin || (revenue > 0 ? ebitda / revenue : 0);

  // Apply all three levers
  const newRevenue = revenue * (1 + parseCurrency(targetGrowthRate));
  const effGain = efficiencyIsPercentage
    ? newRevenue * parseCurrency(targetEfficiencyGain)
    : parseCurrency(targetEfficiencyGain);
  const newEBITDA = (newRevenue * margin) + effGain;
  const newMultiple = mult * (1 + parseCurrency(targetMultipleIncrease));
  const combinedNewValue = newEBITDA * newMultiple;

  const totalValueCreated = combinedNewValue - value;
  const totalPercentIncrease = value > 0 ? totalValueCreated / value : 0;

  return {
    currentValue: value,
    size: {
      value: sizeLever.outputs.valueCreated,
      percent: sizeLever.outputs.percentIncrease,
      newValue: sizeLever.outputs.newValue
    },
    efficiency: {
      value: efficiencyLever.outputs.valueCreated,
      percent: efficiencyLever.outputs.percentIncrease,
      newValue: efficiencyLever.outputs.newValue
    },
    multiple: {
      value: multipleLever.outputs.valueCreated,
      percent: multipleLever.outputs.percentIncrease,
      newValue: multipleLever.outputs.newValue
    },
    combined: {
      newRevenue,
      newEBITDA,
      newMultiple,
      newValue: combinedNewValue,
      totalValueCreated,
      totalPercentIncrease
    },
    details: {
      sizeLever,
      efficiencyLever,
      multipleLever
    }
  };
}

// =============================================================================
// LAYER 6: PROBABILITY DISTRIBUTION
// =============================================================================

/**
 * Standard deviation bands for probability distribution
 * Based on normal distribution probabilities
 */
const PROBABILITY_BANDS = [
  { stdDev: -2, probability: 0.10, label: 'Very Low' },
  { stdDev: -1, probability: 0.20, label: 'Low' },
  { stdDev: 0, probability: 0.40, label: 'Most Likely' },
  { stdDev: 1, probability: 0.20, label: 'High' },
  { stdDev: 2, probability: 0.10, label: 'Very High' }
];

/**
 * Calculate probability distribution of valuation
 *
 * @param {Object} params - Distribution parameters
 * @param {number} params.ebitda - Adjusted EBITDA
 * @param {number} params.meanMultiple - Mean/median multiple
 * @param {number} params.stdDevRange - Standard deviation range (default 0.5 = 50% of mean)
 * @returns {Object} Probability distribution result
 */
function calculateProbabilityDistribution(params) {
  const {
    ebitda,
    meanMultiple,
    stdDevRange = 0.5
  } = params;

  const ebitdaValue = parseCurrency(ebitda);
  const mean = parseCurrency(meanMultiple);
  const stdDev = mean * stdDevRange / 2; // Half the range for 2 std devs

  const distribution = PROBABILITY_BANDS.map(band => {
    const multiple = mean + (band.stdDev * stdDev);
    const mvicValue = ebitdaValue * multiple;

    return {
      stdDev: band.stdDev,
      label: band.label,
      multiple: Math.max(0, multiple), // Multiple can't be negative
      mvicValue: Math.max(0, mvicValue),
      probability: band.probability
    };
  });

  // Calculate expected value (weighted average)
  const expectedValue = distribution.reduce((sum, band) => {
    return sum + (band.mvicValue * band.probability);
  }, 0);

  // Verify probabilities sum to 1
  const totalProbability = distribution.reduce((sum, band) => sum + band.probability, 0);

  return {
    ebitda: ebitdaValue,
    meanMultiple: mean,
    stdDevRange,
    distribution,
    expectedValue,
    totalProbability,
    lowValue: distribution[0].mvicValue,
    highValue: distribution[distribution.length - 1].mvicValue,
    mostLikelyValue: distribution.find(b => b.stdDev === 0)?.mvicValue || expectedValue
  };
}

// =============================================================================
// LAYER 7: WEALTH GAP CALCULATOR (Enhanced 5-Step)
// =============================================================================

/**
 * Default constants for wealth gap calculations
 */
const WEALTH_GAP_DEFAULTS = {
  portfolioReturn: 0.075,      // 7.5% annual return on investment portfolio
  feeTaxRate: 0.10,            // 10% for professional fees and taxes
  ownershipPercent: 1.0,       // 100% ownership by default
  growthRate: 0.05,            // 5% annual growth
  profitMargin: 0.10,          // 10% profit margin
  multiple: 4.0                // 4x EBITDA multiple
};

/**
 * Step 1: Calculate Current Scenario (Income & Assets)
 *
 * @param {Object} params - Current scenario parameters
 * @param {number} params.dividends - Annual dividends from business
 * @param {number} params.wages - Annual wages/salary from business
 * @param {number} params.personalExpensesCovered - Personal expenses paid by business
 * @param {number} params.otherPassiveIncome - Other passive income sources
 * @param {number} params.liquidAssets - Cash and liquid investments
 * @param {number} params.nonMortgageDebt - Non-mortgage debt (credit cards, loans)
 * @returns {Object} Current scenario summary
 */
function calculateCurrentScenario(params) {
  const dividends = parseCurrency(params.dividends || 0);
  const wages = parseCurrency(params.wages || 0);
  const personalExpensesCovered = parseCurrency(params.personalExpensesCovered || 0);
  const otherPassiveIncome = parseCurrency(params.otherPassiveIncome || 0);
  const liquidAssets = parseCurrency(params.liquidAssets || 0);
  const nonMortgageDebt = parseCurrency(params.nonMortgageDebt || 0);

  const totalCurrentIncome = dividends + wages + personalExpensesCovered + otherPassiveIncome;
  const netAvailableAssets = liquidAssets - nonMortgageDebt;

  return {
    income: {
      dividends,
      wages,
      personalExpensesCovered,
      otherPassiveIncome,
      total: totalCurrentIncome
    },
    assets: {
      liquidAssets,
      nonMortgageDebt,
      netAvailable: netAvailableAssets
    }
  };
}

/**
 * Step 2: Define Exit Goals
 *
 * @param {Object} params - Exit goal parameters
 * @param {number} params.desiredAnnualIncome - Desired post-sale annual income
 * @param {number} params.exitTimelineYears - Desired exit timeline in years
 * @returns {Object} Exit goals
 */
function defineExitGoals(params) {
  return {
    desiredAnnualIncome: parseCurrency(params.desiredAnnualIncome || 0),
    exitTimelineYears: parseCurrency(params.exitTimelineYears || 5)
  };
}

/**
 * Step 3: Calculate Wealth Gap
 *
 * @param {Object} params - Wealth gap parameters
 * @param {Object} params.currentScenario - From calculateCurrentScenario
 * @param {Object} params.exitGoals - From defineExitGoals
 * @param {number} params.portfolioReturn - Expected portfolio return (default 7.5%)
 * @returns {Object} Wealth gap calculation
 */
function calculateWealthGapStep3(params) {
  const { currentScenario, exitGoals, portfolioReturn = WEALTH_GAP_DEFAULTS.portfolioReturn } = params;

  // Replacement income = Desired income - Other passive income
  const replacementIncomeRequired = exitGoals.desiredAnnualIncome - currentScenario.income.otherPassiveIncome;

  // Required portfolio size = Replacement income / Portfolio return
  const requiredPortfolioSize = portfolioReturn > 0
    ? replacementIncomeRequired / portfolioReturn
    : 0;

  // Wealth gap = Required portfolio - Net available assets
  const wealthGap = requiredPortfolioSize - currentScenario.assets.netAvailable;

  return {
    replacementIncomeRequired,
    portfolioReturn,
    requiredPortfolioSize,
    currentNetAssets: currentScenario.assets.netAvailable,
    wealthGap: Math.max(0, wealthGap), // Can't be negative
    isFunded: wealthGap <= 0,
    fundingPercentage: requiredPortfolioSize > 0
      ? Math.min(1, currentScenario.assets.netAvailable / requiredPortfolioSize)
      : 1
  };
}

/**
 * Step 4: Calculate Required Business Sale Price
 *
 * @param {Object} params - Sale price calculation parameters
 * @param {number} params.wealthGap - From Step 3
 * @param {number} params.ownershipPercent - Ownership percentage (default 100%)
 * @param {number} params.longTermDebt - Long-term business debt to be paid off
 * @param {number} params.feeTaxRate - Professional fees and taxes rate (default 10%)
 * @param {number} params.targetMargin - Target profit/EBITDA margin
 * @param {number} params.targetMultiple - Target EBITDA multiple
 * @returns {Object} Required sale price calculation
 */
function calculateRequiredSalePrice(params) {
  const {
    wealthGap,
    ownershipPercent = WEALTH_GAP_DEFAULTS.ownershipPercent,
    longTermDebt = 0,
    feeTaxRate = WEALTH_GAP_DEFAULTS.feeTaxRate,
    targetMargin = WEALTH_GAP_DEFAULTS.profitMargin,
    targetMultiple = WEALTH_GAP_DEFAULTS.multiple
  } = params;

  const gap = parseCurrency(wealthGap);
  const ownership = parseCurrency(ownershipPercent);
  const debt = parseCurrency(longTermDebt);
  const feeRate = parseCurrency(feeTaxRate);
  const margin = parseCurrency(targetMargin);
  const multiple = parseCurrency(targetMultiple);

  // Net proceeds needed = Wealth gap + (Ownership % * Long-term debt)
  const netProceedsNeeded = gap + (ownership * debt);

  // Gross proceeds = Net proceeds * (1 + Fee/Tax rate)
  const grossProceedsNeeded = netProceedsNeeded * (1 + feeRate);

  // Required sale price = Gross proceeds / (Target margin * Target multiple)
  // This is the business sale price needed to generate required EBITDA
  const impliedEbitdaNeeded = margin > 0 && multiple > 0
    ? grossProceedsNeeded / multiple
    : 0;
  const impliedRevenueNeeded = margin > 0
    ? impliedEbitdaNeeded / margin
    : 0;
  const requiredSalePrice = impliedEbitdaNeeded * multiple;

  return {
    inputs: {
      wealthGap: gap,
      ownershipPercent: ownership,
      longTermDebt: debt,
      feeTaxRate: feeRate,
      targetMargin: margin,
      targetMultiple: multiple
    },
    netProceedsNeeded,
    grossProceedsNeeded,
    impliedEbitdaNeeded,
    impliedRevenueNeeded,
    requiredSalePrice
  };
}

/**
 * Step 5: Calculate Exit Planning Timeline
 *
 * @param {Object} params - Exit planning parameters
 * @param {number} params.currentRevenue - Current annual revenue
 * @param {number} params.currentEBITDA - Current EBITDA
 * @param {number} params.currentValue - Current business value
 * @param {number} params.targetSalePrice - Target sale price from Step 4
 * @param {number} params.growthRate - Annual growth rate (default 5%)
 * @param {number} params.targetMargin - Target profit margin (default 10%)
 * @param {number} params.targetMultiple - Target EBITDA multiple (default 4x)
 * @param {boolean} params.useVACData - Whether to use VAC-derived values
 * @param {number} params.vacGrowthRate - VAC-derived growth rate
 * @param {number} params.vacProfitMargin - VAC-derived profit margin
 * @param {number} params.yearsToProject - Years to project (default 10)
 * @returns {Object} Exit planning timeline
 */
function calculateExitPlanning(params) {
  const {
    currentRevenue,
    currentEBITDA,
    currentValue,
    targetSalePrice,
    growthRate = WEALTH_GAP_DEFAULTS.growthRate,
    targetMargin = WEALTH_GAP_DEFAULTS.profitMargin,
    targetMultiple = WEALTH_GAP_DEFAULTS.multiple,
    useVACData = false,
    vacGrowthRate,
    vacProfitMargin,
    yearsToProject = 10
  } = params;

  const revenue0 = parseCurrency(currentRevenue);
  const ebitda0 = parseCurrency(currentEBITDA);
  const value0 = parseCurrency(currentValue);
  const target = parseCurrency(targetSalePrice);

  // Use VAC data if available and selected
  const effectiveGrowthRate = useVACData && vacGrowthRate !== undefined
    ? parseCurrency(vacGrowthRate)
    : parseCurrency(growthRate);
  const effectiveMargin = useVACData && vacProfitMargin !== undefined
    ? parseCurrency(vacProfitMargin)
    : parseCurrency(targetMargin);
  const mult = parseCurrency(targetMultiple);

  // Calculate years to exit using the formula from spec:
  // N24 = -1 * ( LN(L28/L33) / LN(1 / (1 + growth)) )
  // Simplified: yearsToExit = ln(target/current) / ln(1 + growth)
  let yearsToExit = null;
  const targetEbitda = mult > 0 ? target / mult : 0;

  if (target > 0 && value0 > 0) {
    if (value0 >= target) {
      yearsToExit = 0;
    } else if (effectiveGrowthRate <= 0) {
      yearsToExit = Infinity;
    } else {
      // Formula: years = ln(targetEBITDA / currentEBITDA) / ln(1 + growth)
      yearsToExit = Math.log(target / value0) / Math.log(1 + effectiveGrowthRate);
    }
  }

  // Generate year-by-year projection table
  const projection = [];
  let projRevenue = revenue0;
  let projEbitda = ebitda0;
  let projValue = value0;

  for (let year = 0; year <= Math.min(yearsToProject, Math.ceil(yearsToExit || yearsToProject)); year++) {
    if (year > 0) {
      projRevenue = projRevenue * (1 + effectiveGrowthRate);
      projEbitda = projRevenue * effectiveMargin;
      projValue = projEbitda * mult;
    }

    projection.push({
      year,
      revenue: Math.round(projRevenue),
      ebitda: Math.round(projEbitda),
      value: Math.round(projValue),
      gapToTarget: Math.round(target - projValue),
      percentOfTarget: target > 0 ? projValue / target : 0,
      isTargetReached: projValue >= target
    });

    if (projValue >= target) break;
  }

  // Goal situation summary
  const goalSituation = {
    targetRevenue: effectiveMargin > 0 ? Math.round(targetEbitda / effectiveMargin) : 0,
    targetEbitda: Math.round(targetEbitda),
    targetValue: Math.round(target),
    multiple: mult
  };

  return {
    inputs: {
      currentRevenue: revenue0,
      currentEBITDA: ebitda0,
      currentValue: value0,
      targetSalePrice: target,
      growthRate: effectiveGrowthRate,
      targetMargin: effectiveMargin,
      targetMultiple: mult,
      useVACData
    },
    yearsToExit: yearsToExit !== null ? Math.round(yearsToExit * 10) / 10 : null,
    goalSituation,
    projection
  };
}

/**
 * Complete Wealth Gap Calculator - All 5 Steps
 *
 * @param {Object} params - All wealth gap parameters
 * @returns {Object} Complete wealth gap analysis
 */
function calculateWealthGapComplete(params) {
  // Step 1: Current Scenario
  const currentScenario = calculateCurrentScenario({
    dividends: params.dividends,
    wages: params.wages,
    personalExpensesCovered: params.personalExpensesCovered,
    otherPassiveIncome: params.otherPassiveIncome,
    liquidAssets: params.liquidAssets,
    nonMortgageDebt: params.nonMortgageDebt
  });

  // Step 2: Exit Goals
  const exitGoals = defineExitGoals({
    desiredAnnualIncome: params.desiredAnnualIncome,
    exitTimelineYears: params.exitTimelineYears
  });

  // Step 3: Wealth Gap
  const wealthGapCalc = calculateWealthGapStep3({
    currentScenario,
    exitGoals,
    portfolioReturn: params.portfolioReturn
  });

  // Step 4: Required Sale Price
  const salePriceCalc = calculateRequiredSalePrice({
    wealthGap: wealthGapCalc.wealthGap,
    ownershipPercent: params.ownershipPercent,
    longTermDebt: params.longTermDebt,
    feeTaxRate: params.feeTaxRate,
    targetMargin: params.targetMargin,
    targetMultiple: params.targetMultiple
  });

  // Step 5: Exit Planning
  const exitPlanning = calculateExitPlanning({
    currentRevenue: params.currentRevenue,
    currentEBITDA: params.currentEBITDA,
    currentValue: params.currentValue,
    targetSalePrice: salePriceCalc.requiredSalePrice,
    growthRate: params.growthRate,
    targetMargin: params.targetMargin,
    targetMultiple: params.targetMultiple,
    useVACData: params.useVACData,
    vacGrowthRate: params.vacGrowthRate,
    vacProfitMargin: params.vacProfitMargin,
    yearsToProject: params.yearsToProject
  });

  return {
    step1_currentScenario: currentScenario,
    step2_exitGoals: exitGoals,
    step3_wealthGap: wealthGapCalc,
    step4_requiredSalePrice: salePriceCalc,
    step5_exitPlanning: exitPlanning,
    summary: {
      currentAnnualIncome: currentScenario.income.total,
      desiredAnnualIncome: exitGoals.desiredAnnualIncome,
      incomeGap: exitGoals.desiredAnnualIncome - currentScenario.income.total,
      wealthGap: wealthGapCalc.wealthGap,
      requiredSalePrice: salePriceCalc.requiredSalePrice,
      currentBusinessValue: params.currentValue,
      valueGap: salePriceCalc.requiredSalePrice - parseCurrency(params.currentValue),
      yearsToExit: exitPlanning.yearsToExit,
      isFeasible: exitPlanning.yearsToExit !== Infinity && exitPlanning.yearsToExit !== null
    }
  };
}

/**
 * Simple wealth gap calculation (backward compatible)
 * Use calculateWealthGapComplete for full 5-step analysis
 *
 * @param {Object} params - Wealth gap parameters
 * @param {number} params.initialRevenue - Starting revenue
 * @param {number} params.initialEBITDA - Starting EBITDA
 * @param {number} params.growthRate - Annual growth rate (e.g., 0.05 for 5%)
 * @param {number} params.ebitdaMargin - EBITDA margin
 * @param {number} params.multiple - EBITDA multiple
 * @param {number} params.targetValue - Target sale price/value (optional)
 * @param {number} params.yearsToProject - Number of years to project (default 10)
 * @returns {Object} Wealth gap projection result
 */
function calculateWealthGap(params) {
  const {
    initialRevenue,
    initialEBITDA,
    growthRate = 0.05,
    ebitdaMargin,
    multiple,
    targetValue,
    yearsToProject = 10
  } = params;

  const revenue0 = parseCurrency(initialRevenue);
  const ebitda0 = parseCurrency(initialEBITDA);
  const growth = parseCurrency(growthRate);
  const mult = parseCurrency(multiple);
  const target = parseCurrency(targetValue);

  // Calculate margin from initial values if not provided
  const margin = ebitdaMargin || (revenue0 > 0 ? ebitda0 / revenue0 : 0);

  // Generate yearly projections
  const yearlyTable = [];
  let currentRevenue = revenue0;

  for (let year = 0; year <= yearsToProject; year++) {
    const revenue = year === 0 ? revenue0 : currentRevenue * (1 + growth);
    const ebitda = revenue * margin;
    const salePrice = ebitda * mult;

    yearlyTable.push({
      year,
      revenue: Math.round(revenue),
      ebitda: Math.round(ebitda),
      salePrice: Math.round(salePrice)
    });

    currentRevenue = revenue;
  }

  // Calculate years to reach target (if target provided)
  let yearsToExit = null;
  if (target > 0) {
    const currentValue = ebitda0 * mult;
    if (currentValue >= target) {
      yearsToExit = 0; // Already at target
    } else if (growth <= 0) {
      yearsToExit = Infinity; // Can never reach target with no growth
    } else {
      // Formula: years = ln(target/current) / ln(1 + growth)
      yearsToExit = Math.log(target / currentValue) / Math.log(1 + growth);
      yearsToExit = Math.ceil(yearsToExit); // Round up to whole years
    }
  }

  // Calculate gap from current to target
  const currentValue = ebitda0 * mult;
  const wealthGap = target > 0 ? target - currentValue : null;
  const gapPercentage = target > 0 && currentValue > 0 ? wealthGap / currentValue : null;

  return {
    initialRevenue: revenue0,
    initialEBITDA: ebitda0,
    growthRate: growth,
    ebitdaMargin: margin,
    multiple: mult,
    currentValue,
    targetValue: target || null,
    wealthGap,
    gapPercentage,
    yearsToExit,
    yearlyTable
  };
}

// =============================================================================
// MASTER VAC CALCULATION FUNCTION
// =============================================================================

/**
 * Perform complete VAC (Value Acceleration Calculator) analysis
 *
 * @param {Object} inputs - All VAC inputs
 * @returns {Object} Complete VAC analysis result
 */
function calculateVAC(inputs) {
  const {
    // Risk assessment answers
    riskAnswers,

    // Financial data
    revenue,
    pretaxProfit,
    depreciation,
    interest,
    discretionary,
    ownerSalaryAdj,
    rentAdj,
    useBaseline,

    // Multiple selection
    multipleType,
    customMultiple,
    businessSize,
    industryMultiple,
    applyRiskWeighting,

    // Value acceleration targets
    targetGrowthRate,
    targetEfficiencyGain,
    efficiencyIsPercentage,
    targetMultipleIncrease,

    // Wealth gap
    targetValue,
    yearsToProject
  } = inputs;

  // Step 1: Calculate Risk Score
  const riskResult = calculateRiskScore(riskAnswers || {});

  // Step 2: Calculate EBITDA
  const ebitdaResult = calculateEBITDA({
    revenue,
    pretaxProfit,
    depreciation,
    interest,
    discretionary,
    ownerSalaryAdj,
    rentAdj,
    useBaseline
  });

  if (!ebitdaResult.isValid) {
    return {
      isValid: false,
      error: ebitdaResult.error,
      riskScore: riskResult
    };
  }

  // Step 3: Select Multiple
  const multipleResult = selectMultiple({
    multipleType,
    customMultiple,
    businessSize,
    industryMultiple,
    riskScore: riskResult.riskScore,
    applyRiskWeighting
  });

  if (!multipleResult.isValid) {
    return {
      isValid: false,
      error: multipleResult.error,
      riskScore: riskResult,
      ebitda: ebitdaResult
    };
  }

  // Step 4: Calculate Current Value
  const valueResult = calculateCurrentValue(
    ebitdaResult.adjustedEbitda,
    multipleResult.multipleUsed
  );

  if (!valueResult.isValid) {
    return {
      isValid: false,
      error: valueResult.error,
      riskScore: riskResult,
      ebitda: ebitdaResult,
      multiple: multipleResult
    };
  }

  // Step 5: Calculate Value Acceleration
  const vacResult = calculateValueAcceleration({
    currentRevenue: ebitdaResult.revenue,
    currentEBITDA: ebitdaResult.adjustedEbitda,
    currentValue: valueResult.currentValue,
    multiple: multipleResult.multipleUsed,
    ebitdaMargin: ebitdaResult.adjustedEbitdaMargin,
    targetGrowthRate,
    targetEfficiencyGain,
    efficiencyIsPercentage,
    targetMultipleIncrease
  });

  // Step 6: Calculate Probability Distribution
  const probabilityResult = calculateProbabilityDistribution({
    ebitda: ebitdaResult.adjustedEbitda,
    meanMultiple: multipleResult.multipleUsed
  });

  // Step 7: Calculate Wealth Gap
  const wealthGapResult = calculateWealthGap({
    initialRevenue: ebitdaResult.revenue,
    initialEBITDA: ebitdaResult.adjustedEbitda,
    growthRate: targetGrowthRate || 0.05,
    ebitdaMargin: ebitdaResult.adjustedEbitdaMargin,
    multiple: multipleResult.multipleUsed,
    targetValue,
    yearsToProject
  });

  // Compile final result
  return {
    isValid: true,

    // Layer 1: Risk
    riskScore: riskResult.riskScore,
    riskCategory: riskResult.riskCategory,
    riskLabel: riskResult.riskLabel,
    riskBreakdown: riskResult.breakdown,

    // Layer 2: EBITDA
    ebitda: ebitdaResult.ebitda,
    adjustedEbitda: ebitdaResult.adjustedEbitda,
    ebitdaMargin: ebitdaResult.ebitdaMargin,
    adjustedEbitdaMargin: ebitdaResult.adjustedEbitdaMargin,
    ebitdaMethod: ebitdaResult.method,
    ebitdaComponents: ebitdaResult.components,
    ebitdaAdjustments: ebitdaResult.adjustments,

    // Layer 3: Multiple
    multipleUsed: multipleResult.multipleUsed,
    multipleSource: multipleResult.source,
    multipleRange: multipleResult.range,

    // Layer 4: Current Value
    currentValue: valueResult.currentValue,

    // Layer 5: Value Acceleration
    uplift: {
      size: vacResult.size,
      efficiency: vacResult.efficiency,
      multiple: vacResult.multiple,
      totalIncrease: vacResult.combined.totalValueCreated,
      newTotalValue: vacResult.combined.newValue
    },

    // Layer 6: Probability Distribution
    probabilityDistribution: probabilityResult.distribution,
    expectedValue: probabilityResult.expectedValue,
    valuationRange: {
      low: probabilityResult.lowValue,
      mostLikely: probabilityResult.mostLikelyValue,
      high: probabilityResult.highValue
    },

    // Layer 7: Wealth Gap
    wealthGap: {
      currentValue: wealthGapResult.currentValue,
      targetValue: wealthGapResult.targetValue,
      gap: wealthGapResult.wealthGap,
      gapPercentage: wealthGapResult.gapPercentage,
      yearsToExit: wealthGapResult.yearsToExit,
      yearlyTable: wealthGapResult.yearlyTable
    },

    // Metadata
    calculatedAt: new Date().toISOString()
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Risk Score Functions
  calculateRiskScore,
  validateRiskAnswers,

  // EBITDA Functions
  calculateEBITDA,
  calculateBaselineEBITDA,
  calculateActualEBITDA,
  applyEBITDAAdjustments,
  validateEBITDAInputs,
  parseCurrency,

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

  // Wealth Gap (Original - backward compatible)
  calculateWealthGap,

  // Wealth Gap Enhanced 5-Step (NEW)
  calculateCurrentScenario,
  defineExitGoals,
  calculateWealthGapStep3,
  calculateRequiredSalePrice,
  calculateExitPlanning,
  calculateWealthGapComplete,
  WEALTH_GAP_DEFAULTS,

  // Master VAC Function
  calculateVAC,

  // Individual Question Scorers (for testing)
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

  // Constants
  RISK_CATEGORIES,
  BASELINE_MARGINS
};
