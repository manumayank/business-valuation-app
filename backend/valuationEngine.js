/**
 * Enhanced Business Valuation Engine
 *
 * Features:
 * - Multiple valuation methods (EBITDA, Revenue, DCF)
 * - Comprehensive risk scoring (5 categories)
 * - Industry benchmarks
 * - Value drivers and gaps analysis
 * - Improvement suggestions
 */

// ============ ENHANCED INDUSTRY BENCHMARKS ============

const INDUSTRY_BENCHMARKS = {
  tech: {
    name: 'Technology / Software',
    ebitdaMultiple: { min: 10, avg: 12, max: 15 },
    revenueMultiple: { min: 3, avg: 5, max: 8 },
    profitMargin: 0.25,
    growthRate: 0.20,
    customerRetention: 0.90,
    debtToRevenue: 0.30,
    riskScore: 70
  },
  retail: {
    name: 'Retail / E-Commerce',
    ebitdaMultiple: { min: 4, avg: 6, max: 8 },
    revenueMultiple: { min: 0.5, avg: 1.5, max: 2.5 },
    profitMargin: 0.08,
    growthRate: 0.05,
    customerRetention: 0.75,
    debtToRevenue: 0.40,
    riskScore: 55
  },
  services: {
    name: 'Professional Services',
    ebitdaMultiple: { min: 5, avg: 7, max: 9 },
    revenueMultiple: { min: 1, avg: 2, max: 3 },
    profitMargin: 0.15,
    growthRate: 0.10,
    customerRetention: 0.85,
    debtToRevenue: 0.35,
    riskScore: 60
  },
  manufacturing: {
    name: 'Manufacturing',
    ebitdaMultiple: { min: 6, avg: 8, max: 10 },
    revenueMultiple: { min: 0.8, avg: 1.8, max: 2.5 },
    profitMargin: 0.12,
    growthRate: 0.08,
    customerRetention: 0.80,
    debtToRevenue: 0.45,
    riskScore: 50
  },
  healthcare: {
    name: 'Healthcare / Medical',
    ebitdaMultiple: { min: 8, avg: 10, max: 12 },
    revenueMultiple: { min: 2, avg: 3, max: 4 },
    profitMargin: 0.20,
    growthRate: 0.12,
    customerRetention: 0.95,
    debtToRevenue: 0.25,
    riskScore: 65
  },
  finance: {
    name: 'Financial Services',
    ebitdaMultiple: { min: 7, avg: 10, max: 12 },
    revenueMultiple: { min: 2, avg: 3, max: 4 },
    profitMargin: 0.30,
    growthRate: 0.15,
    customerRetention: 0.92,
    debtToRevenue: 0.20,
    riskScore: 62
  },
  default: {
    name: 'General Business',
    ebitdaMultiple: { min: 6, avg: 8, max: 10 },
    revenueMultiple: { min: 1, avg: 2, max: 3 },
    profitMargin: 0.12,
    growthRate: 0.10,
    customerRetention: 0.82,
    debtToRevenue: 0.35,
    riskScore: 58
  }
};

/**
 * Get benchmarks for an industry
 */
function getBenchmarks(industry) {
  return INDUSTRY_BENCHMARKS[industry?.toLowerCase()] || INDUSTRY_BENCHMARKS.default;
}

/**
 * Calculate Risk Score (0-100)
 * 5 categories: Financial, Operational, Market, Management, Compliance
 */
function calculateRiskScore(inputs, benchmarks) {
  const {
    annualRevenue,
    ebitda,
    profitMargin,
    debtLevel,
    growthRate,
    yearsInBusiness,
    employees,
    customerRetention,
    topCustomerConcentration
  } = inputs;

  // 1. FINANCIAL RISK (0-25 points)
  let financialRisk = 0;
  const profitMarginGap = Math.abs(benchmarks.profitMargin - profitMargin);
  financialRisk += Math.min(profitMarginGap * 50, 10); // Margin impact (0-10)

  const debtRisk = debtLevel > 0.5 ? (debtLevel - 0.5) * 30 : 0;
  financialRisk += Math.min(debtRisk, 8); // Debt impact (0-8)

  const cashFlowRisk = ebitda < (annualRevenue * 0.10) ? 7 : 0;
  financialRisk += cashFlowRisk; // Cash flow impact (0-7)

  // 2. OPERATIONAL RISK (0-25 points)
  let operationalRisk = 0;
  const employeeScaleRisk = employees < 5 ? 8 : employees > 200 ? 5 : 2;
  operationalRisk += employeeScaleRisk;

  const concentrationRisk = topCustomerConcentration > 0.3
    ? (topCustomerConcentration - 0.3) * 40
    : 0;
  operationalRisk += Math.min(concentrationRisk, 12);

  const scaleRisk = annualRevenue < 500000 ? 8 : 2;
  operationalRisk += scaleRisk;

  const historyRisk = yearsInBusiness < 2 ? 3 : 0;
  operationalRisk += historyRisk;

  // 3. MARKET RISK (0-20 points)
  let marketRisk = 0;
  const growthGap = benchmarks.growthRate - growthRate;
  marketRisk += Math.max(growthGap * 50, 0);
  marketRisk += Math.min(marketRisk, 20);

  // 4. MANAGEMENT RISK (0-20 points)
  let managementRisk = 0;
  // Estimate based on company age and size
  managementRisk += yearsInBusiness < 3 ? 10 : 3;
  managementRisk += employees < 3 ? 7 : 0;
  managementRisk = Math.min(managementRisk, 20);

  // 5. COMPLIANCE/REGULATORY RISK (0-10 points)
  let complianceRisk = Math.min(Math.abs(profitMarginGap) * 20, 10);

  const totalRisk = financialRisk + operationalRisk + marketRisk + managementRisk + complianceRisk;

  return {
    overallScore: Math.round(totalRisk),
    grade: getRiskGrade(totalRisk),
    categories: {
      financial: Math.round(Math.min(financialRisk, 25)),
      operational: Math.round(Math.min(operationalRisk, 25)),
      market: Math.round(Math.min(marketRisk, 20)),
      management: Math.round(Math.min(managementRisk, 20)),
      compliance: Math.round(Math.min(complianceRisk, 10))
    }
  };
}

/**
 * Get risk grade based on score (A-F)
 */
function getRiskGrade(score) {
  if (score < 20) return 'A';
  if (score < 40) return 'B';
  if (score < 60) return 'C';
  if (score < 80) return 'D';
  return 'F';
}

/**
 * Calculate EBITDA Multiple Valuation
 */
function calculateEBITDAValuation(ebitda, multiple) {
  return Math.round(ebitda * multiple);
}

/**
 * Calculate Revenue Multiple Valuation
 */
function calculateRevenueValuation(revenue, multiple) {
  return Math.round(revenue * multiple);
}

/**
 * Calculate DCF (Discounted Cash Flow) Valuation
 * Simplified DCF for 5-year projection
 */
function calculateDCFValuation(inputs, benchmarks, riskScore) {
  const {
    ebitda,
    annualRevenue,
    growthRate,
    profitMargin
  } = inputs;

  // Estimate free cash flow as EBITDA minus taxes (simplified)
  const taxRate = 0.25; // Assume 25% tax rate
  const initialFCF = ebitda * (1 - taxRate);

  // Project 5-year cash flows
  let totalPV = 0;
  let projectedFCF = initialFCF;

  // Discount rate based on risk score (higher risk = higher discount rate)
  // Range: 8% (low risk) to 20% (high risk)
  const discountRate = 0.08 + (riskScore.overallScore / 100) * 0.12;

  for (let year = 1; year <= 5; year++) {
    // Growth rate decreases in later years
    const yearGrowth = growthRate * (1 - (year - 1) * 0.05);
    projectedFCF *= (1 + yearGrowth);

    // Discount to present value
    const pv = projectedFCF / Math.pow(1 + discountRate, year);
    totalPV += pv;
  }

  // Terminal value (perpetuity growth model)
  const terminalGrowth = 0.03; // Conservative 3% perpetual growth
  const terminalValue = (projectedFCF * (1 + terminalGrowth)) / (discountRate - terminalGrowth);
  const terminalPV = terminalValue / Math.pow(1 + discountRate, 5);

  return Math.round(totalPV + terminalPV);
}

/**
 * Main valuation calculation function
 */
function calculateValuation(inputs, completedImprovements = []) {
  const {
    companyName,
    industry,
    annualRevenue,
    ebitda,
    yearsInBusiness,
    employees,
    growthRate,
    profitMargin,
    customerRetention,
    topCustomerConcentration,
    debtLevel
  } = inputs;

  const benchmarks = getBenchmarks(industry);

  // Calculate risk score
  const riskScore = calculateRiskScore(inputs, benchmarks);

  // Calculate all three valuation methods
  const ebitdaMultiple = benchmarks.ebitdaMultiple.avg;
  const revenueMultiple = benchmarks.revenueMultiple.avg;

  const ebitdaValuation = calculateEBITDAValuation(ebitda, ebitdaMultiple);
  const revenueValuation = calculateRevenueValuation(annualRevenue, revenueMultiple);
  const dcfValuation = calculateDCFValuation(inputs, benchmarks, riskScore);

  // Determine recommended valuation (weighted average)
  const recommendedValuation = Math.round(
    ebitdaValuation * 0.5 +
    revenueValuation * 0.25 +
    dcfValuation * 0.25
  );

  // Initialize result object
  const result = {
    companyName,
    industry: benchmarks.name,
    calculationDate: new Date().toISOString(),

    // Valuation Methods
    valuationMethods: {
      ebitda: {
        method: 'EBITDA Multiple',
        value: ebitdaValuation,
        multiple: ebitdaMultiple,
        baseMetric: ebitda,
        description: `EBITDA (${formatCurrency(ebitda)}) × ${ebitdaMultiple}x multiple`
      },
      revenue: {
        method: 'Revenue Multiple',
        value: revenueValuation,
        multiple: revenueMultiple,
        baseMetric: annualRevenue,
        description: `Revenue (${formatCurrency(annualRevenue)}) × ${revenueMultiple}x multiple`
      },
      dcf: {
        method: 'Discounted Cash Flow',
        value: dcfValuation,
        description: '5-year DCF projection with terminal value'
      }
    },

    recommendedValuation,
    valuationRange: {
      low: Math.round(Math.min(ebitdaValuation, revenueValuation, dcfValuation) * 0.9),
      high: Math.round(Math.max(ebitdaValuation, revenueValuation, dcfValuation) * 1.1)
    },

    // Risk Analysis
    riskAnalysis: riskScore,

    // Value Drivers and Gaps
    drivers: [],
    gaps: [],
    suggestions: []
  };

  // ANALYZE VALUE DRIVERS
  // Driver 1: EBITDA strength
  if (ebitda > (annualRevenue * 0.15)) {
    result.drivers.push({
      key: 'strong_ebitda',
      label: 'Strong EBITDA',
      description: `EBITDA at ${(ebitda / annualRevenue * 100).toFixed(1)}% of revenue (healthy cash generation)`,
      impact: Math.round(recommendedValuation * 0.05)
    });
  }

  // Driver 2: Growth Rate
  if (growthRate > benchmarks.growthRate) {
    const growthPremium = (growthRate - benchmarks.growthRate) * 100;
    result.drivers.push({
      key: 'growth_rate',
      label: 'Above-Average Growth',
      description: `${(growthRate * 100).toFixed(1)}% growth vs ${(benchmarks.growthRate * 100).toFixed(1)}% industry average (+${growthPremium.toFixed(1)}%)`,
      impact: Math.round(recommendedValuation * 0.08)
    });
  }

  // Driver 3: Profit Margin
  if (profitMargin > benchmarks.profitMargin) {
    const marginPremium = (profitMargin - benchmarks.profitMargin) * 100;
    result.drivers.push({
      key: 'profit_margin',
      label: 'Superior Profit Margin',
      description: `${(profitMargin * 100).toFixed(1)}% margin vs ${(benchmarks.profitMargin * 100).toFixed(1)}% industry average (+${marginPremium.toFixed(1)}%)`,
      impact: Math.round(recommendedValuation * 0.06)
    });
  }

  // Driver 4: Customer Retention
  if (customerRetention > benchmarks.customerRetention) {
    const retentionPremium = (customerRetention - benchmarks.customerRetention) * 100;
    result.drivers.push({
      key: 'customer_retention',
      label: 'Strong Customer Loyalty',
      description: `${(customerRetention * 100).toFixed(1)}% retention rate (+${retentionPremium.toFixed(1)}% vs industry)`,
      impact: Math.round(recommendedValuation * 0.04)
    });
  }

  // Driver 5: Low Debt
  if (debtLevel < 0.3) {
    result.drivers.push({
      key: 'low_debt',
      label: 'Strong Financial Position',
      description: `Low debt level (${(debtLevel * 100).toFixed(1)}%) provides financial stability`,
      impact: Math.round(recommendedValuation * 0.05)
    });
  }

  // ANALYZE PERFORMANCE GAPS
  // Gap 1: Growth Rate
  if (growthRate < benchmarks.growthRate) {
    result.gaps.push({
      key: 'growth_rate',
      label: 'Growth Rate Below Benchmark',
      current: (growthRate * 100).toFixed(1) + '%',
      benchmark: (benchmarks.growthRate * 100).toFixed(1) + '%',
      gap: ((growthRate - benchmarks.growthRate) * 100).toFixed(1) + '%',
      impact: -Math.round(recommendedValuation * 0.08)
    });
  }

  // Gap 2: Profit Margin
  if (profitMargin < benchmarks.profitMargin) {
    result.gaps.push({
      key: 'profit_margin',
      label: 'Profit Margin Below Benchmark',
      current: (profitMargin * 100).toFixed(1) + '%',
      benchmark: (benchmarks.profitMargin * 100).toFixed(1) + '%',
      gap: ((profitMargin - benchmarks.profitMargin) * 100).toFixed(1) + '%',
      impact: -Math.round(recommendedValuation * 0.06)
    });
  }

  // Gap 3: Customer Retention
  if (customerRetention < benchmarks.customerRetention) {
    result.gaps.push({
      key: 'customer_retention',
      label: 'Customer Retention Below Benchmark',
      current: (customerRetention * 100).toFixed(1) + '%',
      benchmark: (benchmarks.customerRetention * 100).toFixed(1) + '%',
      gap: ((customerRetention - benchmarks.customerRetention) * 100).toFixed(1) + '%',
      impact: -Math.round(recommendedValuation * 0.04)
    });
  }

  // Gap 4: Customer Concentration
  if (topCustomerConcentration > 0.3) {
    result.gaps.push({
      key: 'customer_concentration',
      label: 'High Customer Concentration Risk',
      current: (topCustomerConcentration * 100).toFixed(1) + '%',
      benchmark: '30%',
      gap: ((topCustomerConcentration - 0.3) * 100).toFixed(1) + '%',
      impact: -Math.round(recommendedValuation * 0.05)
    });
  }

  // Gap 5: Debt Level
  if (debtLevel > 0.5) {
    result.gaps.push({
      key: 'debt_level',
      label: 'High Debt Level',
      current: (debtLevel * 100).toFixed(1) + '%',
      benchmark: '50%',
      gap: ((debtLevel - 0.5) * 100).toFixed(1) + '%',
      impact: -Math.round(recommendedValuation * 0.06)
    });
  }

  // Gap 6: Weak EBITDA
  if (ebitda < (annualRevenue * 0.10)) {
    result.gaps.push({
      key: 'weak_ebitda',
      label: 'Weak Cash Generation',
      current: (ebitda / annualRevenue * 100).toFixed(1) + '%',
      benchmark: '10%',
      gap: ((ebitda / annualRevenue - 0.10) * 100).toFixed(1) + '%',
      impact: -Math.round(recommendedValuation * 0.07)
    });
  }

  // GENERATE IMPROVEMENT SUGGESTIONS
  result.gaps.forEach(gap => {
    let suggestion = '';
    let priority = 'medium';

    switch (gap.key) {
      case 'growth_rate':
        suggestion = 'Expand into new markets, develop new products, or increase marketing investment to accelerate growth';
        priority = 'high';
        break;
      case 'profit_margin':
        suggestion = 'Optimize operations, reduce costs, improve pricing strategy, or increase value-added services';
        priority = 'high';
        break;
      case 'customer_retention':
        suggestion = 'Implement customer loyalty programs, improve service quality, and enhance customer experience';
        priority = 'medium';
        break;
      case 'customer_concentration':
        suggestion = 'Actively develop new customer relationships and diversify your customer base to reduce risk';
        priority = 'high';
        break;
      case 'debt_level':
        suggestion = 'Refinance debt, pay down high-interest loans, or use cash flow to reduce total debt burden';
        priority = 'high';
        break;
      case 'weak_ebitda':
        suggestion = 'Improve operational efficiency, negotiate better vendor rates, and focus on revenue growth';
        priority = 'high';
        break;
      default:
        suggestion = 'Address this gap to improve valuation';
    }

    result.suggestions.push({
      key: gap.key,
      title: gap.label,
      description: suggestion,
      impact: gap.impact,
      priority,
      completed: completedImprovements.includes(gap.key)
    });
  });

  // Add positive action suggestions
  if (result.drivers.length > 0) {
    result.suggestions.push({
      key: 'maintain_strengths',
      title: 'Maintain Your Competitive Advantages',
      description: 'Continue investing in the areas where you outperform industry benchmarks to maintain competitive advantage',
      impact: 0,
      priority: 'medium',
      completed: false
    });
  }

  return result;
}

/**
 * Format currency for display
 */
function formatCurrency(value) {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value}`;
}

module.exports = {
  calculateValuation,
  calculateRiskScore,
  getRiskGrade,
  calculateEBITDAValuation,
  calculateRevenueValuation,
  calculateDCFValuation,
  getBenchmarks,
  INDUSTRY_BENCHMARKS
};
