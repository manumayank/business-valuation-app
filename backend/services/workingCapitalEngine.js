/**
 * Working Capital Analysis Engine
 * Calculates and analyzes working capital metrics, benchmarks, and optimization opportunities
 */

// Industry benchmarks (DSO, DIO, DPO, CCC, WC% of Revenue)
const INDUSTRY_BENCHMARKS = {
  tech: {
    dso: 45,
    dio: 30,
    dpo: 38,
    ccc: 37,
    wcPercentage: 0.08,
    description: 'Technology & Software'
  },
  manufacturing: {
    dso: 50,
    dio: 65,
    dpo: 40,
    ccc: 75,
    wcPercentage: 0.15,
    description: 'Manufacturing & Industrial'
  },
  retail: {
    dso: 20,
    dio: 45,
    dpo: 35,
    ccc: 30,
    wcPercentage: 0.12,
    description: 'Retail & Wholesale'
  },
  healthcare: {
    dso: 60,
    dio: 25,
    dpo: 30,
    ccc: 55,
    wcPercentage: 0.10,
    description: 'Healthcare & Pharmaceuticals'
  },
  finance: {
    dso: 30,
    dio: 0,
    dpo: 20,
    ccc: 10,
    wcPercentage: 0.05,
    description: 'Financial Services'
  },
  services: {
    dso: 35,
    dio: 0,
    dpo: 25,
    ccc: 10,
    wcPercentage: 0.06,
    description: 'Professional Services'
  },
  ecommerce: {
    dso: 15,
    dio: 50,
    dpo: 40,
    ccc: 25,
    wcPercentage: 0.14,
    description: 'E-commerce & Online'
  }
};

/**
 * Calculate Days Sales Outstanding (DSO)
 * Measures time to collect receivables
 * Formula: (Accounts Receivable / Revenue) × 365
 */
function calculateDSO(accountsReceivable, annualRevenue) {
  if (annualRevenue === 0) return 0;
  return Math.round((accountsReceivable / annualRevenue) * 365 * 10) / 10;
}

/**
 * Calculate Days Inventory Outstanding (DIO)
 * Measures inventory turnover
 * Formula: (Inventory / COGS) × 365
 */
function calculateDIO(inventory, cogs) {
  if (cogs === 0) return 0;
  return Math.round((inventory / cogs) * 365 * 10) / 10;
}

/**
 * Calculate Days Payable Outstanding (DPO)
 * Measures time to pay suppliers
 * Formula: (Accounts Payable / COGS) × 365
 */
function calculateDPO(accountsPayable, cogs) {
  if (cogs === 0) return 0;
  return Math.round((accountsPayable / cogs) * 365 * 10) / 10;
}

/**
 * Calculate Cash Conversion Cycle (CCC)
 * Formula: DSO + DIO - DPO
 * Negative is ideal (paid after selling)
 */
function calculateCCC(dso, dio, dpo) {
  return Math.round((dso + dio - dpo) * 10) / 10;
}

/**
 * Calculate Working Capital as % of Revenue
 */
function calculateWCPercentage(currentAssets, currentLiabilities, annualRevenue) {
  if (annualRevenue === 0) return 0;
  const wc = currentAssets - currentLiabilities;
  return Math.round((wc / annualRevenue) * 1000) / 1000;
}

/**
 * Get industry benchmarks for a given industry
 */
function getBenchmarks(industry) {
  return INDUSTRY_BENCHMARKS[industry.toLowerCase()] || INDUSTRY_BENCHMARKS.services;
}

/**
 * Calculate gap between actual and benchmark (negative is better)
 */
function calculateGap(actual, benchmark, metricType = 'standard') {
  // For DPO and positive metrics, higher is better
  if (metricType === 'payables' || metricType === 'wcPercentage') {
    return Math.round((actual - benchmark) * 10) / 10;
  }
  // For DSO, DIO, CCC, lower is better
  return Math.round((benchmark - actual) * 10) / 10;
}

/**
 * Generate working capital optimization recommendations
 */
function generateRecommendations(metrics, benchmarks, inputData) {
  const recommendations = [];

  // DSO recommendations
  if (metrics.dso.gap < -5) {
    recommendations.push({
      key: 'improve_collections',
      title: 'Accelerate Customer Collections',
      description: `Your DSO of ${metrics.dso.value} days is ${Math.abs(metrics.dso.gap)} days above industry average (${benchmarks.dso}). Implement early payment discounts or stricter collection policies.`,
      priority: 'high',
      effort: 'medium',
      timeline: '1-3 months',
      impact: Math.round(inputData.accountsReceivable * (metrics.dso.value - benchmarks.dso) / 365),
      category: 'collections'
    });
  }

  // DIO recommendations
  if (metrics.dio.gap < -5 && inputData.inventory > 0) {
    recommendations.push({
      key: 'optimize_inventory',
      title: 'Optimize Inventory Management',
      description: `Your DIO of ${metrics.dio.value} days is ${Math.abs(metrics.dio.gap)} days above industry average (${benchmarks.dio}). Implement just-in-time inventory, improve demand forecasting, or optimize stock levels.`,
      priority: 'high',
      effort: 'medium',
      timeline: '2-4 months',
      impact: Math.round(inputData.inventory * (metrics.dio.value - benchmarks.dio) / 365),
      category: 'inventory'
    });
  }

  // DPO recommendations
  if (metrics.dpo.gap > 5 && inputData.accountsPayable > 0) {
    recommendations.push({
      key: 'extend_payables',
      title: 'Negotiate Extended Payment Terms',
      description: `Your DPO of ${metrics.dpo.value} days is ${metrics.dpo.gap} days below industry average (${benchmarks.dpo}). Negotiate longer payment terms with suppliers to improve cash flow.`,
      priority: 'medium',
      effort: 'low',
      timeline: '1-2 months',
      impact: Math.round(inputData.accountsPayable * (benchmarks.dpo - metrics.dpo.value) / 365),
      category: 'payables'
    });
  }

  // Working capital percentage recommendations
  if (metrics.wcPercentage.gap > 0.02) {
    recommendations.push({
      key: 'reduce_working_capital',
      title: 'Reduce Overall Working Capital Requirements',
      description: `Your working capital is ${(metrics.wcPercentage.value * 100).toFixed(2)}% of revenue, versus industry average of ${(benchmarks.wcPercentage * 100).toFixed(2)}%. Focus on collections, inventory, and payables optimization.`,
      priority: 'high',
      effort: 'high',
      timeline: '3-6 months',
      impact: Math.round(inputData.annualRevenue * (metrics.wcPercentage.value - benchmarks.wcPercentage)),
      category: 'overall'
    });
  }

  // Positive drivers
  if (metrics.dso.gap > 0) {
    recommendations.push({
      key: 'strong_collections',
      title: 'Strong Collection Performance',
      description: `Your DSO of ${metrics.dso.value} days is better than industry average. Your fast collection process is a competitive advantage.`,
      priority: 'info',
      effort: 'none',
      timeline: 'maintain',
      impact: 0,
      category: 'strength'
    });
  }

  if (metrics.dpo.gap < -5 && inputData.accountsPayable > 0) {
    recommendations.push({
      key: 'strong_supplier_leverage',
      title: 'Strong Supplier Payment Terms',
      description: `Your DPO of ${metrics.dpo.value} days is better than industry average. You're maintaining good cash position with suppliers.`,
      priority: 'info',
      effort: 'none',
      timeline: 'maintain',
      impact: 0,
      category: 'strength'
    });
  }

  return recommendations;
}

/**
 * Calculate cash released or needed by optimizing to industry benchmarks
 */
function calculateOptimizationImpact(metrics, benchmarks, inputData) {
  const dsoImprovement = Math.round(inputData.accountsReceivable * (metrics.dso.value - benchmarks.dso) / 365);
  const dioImprovement = inputData.inventory > 0 ? Math.round(inputData.inventory * (metrics.dio.value - benchmarks.dio) / 365) : 0;
  const dpoImprovement = inputData.accountsPayable > 0 ? Math.round(inputData.accountsPayable * (benchmarks.dpo - metrics.dpo.value) / 365) : 0;

  const totalCashReleased = dsoImprovement + dioImprovement + dpoImprovement;
  const optimizedCCC = calculateCCC(benchmarks.dso, benchmarks.dio, benchmarks.dpo);

  return {
    currentCCC: metrics.ccc.value,
    optimizedCCC: optimizedCCC,
    improvementDays: Math.round((metrics.ccc.value - optimizedCCC) * 10) / 10,
    improvementPercent: metrics.ccc.value === 0 ? 0 : Math.round((metrics.ccc.value - optimizedCCC) / metrics.ccc.value * 100 * 100) / 100,
    dsoImprovement: dsoImprovement,
    dioImprovement: dioImprovement,
    dpoImprovement: dpoImprovement,
    totalCashReleased: totalCashReleased,
    totalCashReleasedAbsolute: Math.abs(totalCashReleased)
  };
}

/**
 * Calculate risk assessment score based on working capital metrics
 */
function assessRisk(metrics, benchmarks) {
  let riskScore = 50; // Start at neutral (50)
  const factors = {};

  // DSO risk (higher DSO = higher risk, more cash tied up)
  const dsoRiskFactor = Math.min(metrics.dso.value / benchmarks.dso, 2);
  const dsoRisk = 40 + (dsoRiskFactor - 1) * 40; // 40-80 range
  factors.collectionRisk = { score: Math.round(dsoRisk), factor: 'high_dso' };
  riskScore += (dsoRisk - 50) * 0.25;

  // DIO risk (higher DIO = higher risk, obsolescence, cash tied up)
  const dioRiskFactor = Math.min(metrics.dio.value / benchmarks.dio, 2);
  const dioRisk = 40 + (dioRiskFactor - 1) * 40; // 40-80 range
  factors.inventoryRisk = { score: Math.round(dioRisk), factor: 'high_dio' };
  riskScore += (dioRisk - 50) * 0.25;

  // DPO risk (lower DPO = higher risk, not using supplier credit effectively)
  const dpoDifference = benchmarks.dpo - metrics.dpo.value;
  const dpoRisk = 50 + Math.max(dpoDifference, -30) * 0.5; // Penalize low DPO
  factors.payablesRisk = { score: Math.round(dpoRisk), factor: 'low_dpo' };
  riskScore += (dpoRisk - 50) * 0.15;

  // CCC risk (higher CCC = higher financial stress)
  const cccRiskFactor = Math.min(Math.abs(metrics.ccc.value) / benchmarks.ccc, 2);
  const cccRisk = 40 + (cccRiskFactor - 1) * 40;
  factors.cashFlowRisk = { score: Math.round(cccRisk), factor: 'high_ccc' };
  riskScore += (cccRisk - 50) * 0.35;

  riskScore = Math.max(30, Math.min(riskScore, 95)); // Cap between 30-95

  // Determine grade
  let grade = 'F';
  if (riskScore <= 40) grade = 'A';
  else if (riskScore <= 50) grade = 'B';
  else if (riskScore <= 60) grade = 'C';
  else if (riskScore <= 75) grade = 'D';

  return {
    score: Math.round(riskScore),
    grade: grade,
    factors: factors,
    assessment: getWorkingCapitalRiskAssessment(Math.round(riskScore), grade)
  };
}

/**
 * Get text assessment for working capital risk score
 */
function getWorkingCapitalRiskAssessment(score, grade) {
  if (grade === 'A') {
    return 'Excellent working capital management. Very low financial risk.';
  } else if (grade === 'B') {
    return 'Good working capital management. Low financial risk.';
  } else if (grade === 'C') {
    return 'Adequate working capital management. Moderate financial risk.';
  } else if (grade === 'D') {
    return 'Concerning working capital metrics. Elevated financial risk.';
  } else {
    return 'Poor working capital management. High financial risk.';
  }
}

/**
 * Main function: Analyze working capital
 */
function analyzeWorkingCapital(inputData) {
  // Validate required fields
  if (!inputData || typeof inputData !== 'object') {
    throw new Error('Input data must be an object');
  }

  const required = [
    'accountsReceivable',
    'inventory',
    'accountsPayable',
    'costOfGoodsSold',
    'annualRevenue',
    'totalCurrentAssets',
    'totalCurrentLiabilities',
    'industry'
  ];

  for (const field of required) {
    if (inputData[field] === undefined || inputData[field] === null) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate numeric values
  const numericFields = [
    'accountsReceivable',
    'inventory',
    'accountsPayable',
    'costOfGoodsSold',
    'annualRevenue',
    'totalCurrentAssets',
    'totalCurrentLiabilities'
  ];

  for (const field of numericFields) {
    if (typeof inputData[field] !== 'number' || inputData[field] < 0) {
      throw new Error(`${field} must be a non-negative number`);
    }
  }

  // Get benchmarks
  const benchmarks = getBenchmarks(inputData.industry);

  // Calculate metrics
  const dso = calculateDSO(inputData.accountsReceivable, inputData.annualRevenue);
  const dio = calculateDIO(inputData.inventory, inputData.costOfGoodsSold);
  const dpo = calculateDPO(inputData.accountsPayable, inputData.costOfGoodsSold);
  const ccc = calculateCCC(dso, dio, dpo);
  const wcPercentage = calculateWCPercentage(inputData.totalCurrentAssets, inputData.totalCurrentLiabilities, inputData.annualRevenue);

  // Calculate gaps (benchmark - actual, so positive gap means underperforming)
  const metrics = {
    dso: {
      value: dso,
      benchmark: benchmarks.dso,
      gap: calculateGap(dso, benchmarks.dso, 'standard'),
      description: 'Days to collect from customers'
    },
    dio: {
      value: dio,
      benchmark: benchmarks.dio,
      gap: calculateGap(dio, benchmarks.dio, 'standard'),
      description: 'Days inventory sits before sale'
    },
    dpo: {
      value: dpo,
      benchmark: benchmarks.dpo,
      gap: calculateGap(dpo, benchmarks.dpo, 'payables'),
      description: 'Days to pay suppliers'
    },
    ccc: {
      value: ccc,
      benchmark: benchmarks.ccc,
      gap: calculateGap(ccc, benchmarks.ccc, 'standard'),
      description: 'Cash conversion cycle'
    },
    wcPercentage: {
      value: wcPercentage,
      benchmark: benchmarks.wcPercentage,
      gap: calculateGap(wcPercentage, benchmarks.wcPercentage, 'wcPercentage'),
      description: 'Working capital as % of revenue'
    }
  };

  // Generate recommendations
  const recommendations = generateRecommendations(metrics, benchmarks, inputData);

  // Calculate optimization impact
  const optimizationImpact = calculateOptimizationImpact(metrics, benchmarks, inputData);

  // Risk assessment
  const riskAssessment = assessRisk(metrics, benchmarks);

  // Calculate impact on valuation (positive percentage improvement)
  const valuationImpact = {
    currentCCC: metrics.ccc.value,
    benchmarkCCC: benchmarks.ccc,
    improvementPercent: optimizationImpact.improvementPercent,
    estimatedValuationLift: Math.round(optimizationImpact.totalCashReleased * 2.5), // 2.5x multiple on released cash
    description: optimizationImpact.totalCashReleased > 0
      ? `Optimizing working capital could free up $${optimizationImpact.totalCashReleasedAbsolute.toLocaleString()} in cash (${Math.round(optimizationImpact.totalCashReleasedAbsolute / inputData.annualRevenue * 100)}% of revenue), potentially increasing valuation by $${Math.round(optimizationImpact.totalCashReleased * 2.5).toLocaleString()}.`
      : 'Your working capital is already well-optimized compared to industry benchmarks.'
  };

  return {
    metrics,
    benchmarks,
    recommendations,
    optimizationImpact,
    riskAssessment,
    valuationImpact,
    industry: inputData.industry,
    calculationDate: new Date().toISOString()
  };
}

module.exports = {
  analyzeWorkingCapital,
  calculateDSO,
  calculateDIO,
  calculateDPO,
  calculateCCC,
  calculateWCPercentage,
  calculateGap,
  getBenchmarks,
  generateRecommendations,
  calculateOptimizationImpact,
  assessRisk,
  getWorkingCapitalRiskAssessment,
  INDUSTRY_BENCHMARKS
};
