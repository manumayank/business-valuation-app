/**
 * Deal Analysis Engine
 * Comprehensive M&A deal evaluation and financial analysis
 */

// Industry deal multiples reference data
const INDUSTRY_MULTIPLES = {
  tech: {
    avgEV_EBITDA: 12.5,
    avgP_E: 28,
    avgP_S: 4.2,
    synergiesRange: { min: 5, max: 25 },
    description: 'Technology & Software'
  },
  manufacturing: {
    avgEV_EBITDA: 8.5,
    avgP_E: 15,
    avgP_S: 1.8,
    synergiesRange: { min: 10, max: 30 },
    description: 'Manufacturing & Industrial'
  },
  retail: {
    avgEV_EBITDA: 7.0,
    avgP_E: 14,
    avgP_S: 1.2,
    synergiesRange: { min: 8, max: 20 },
    description: 'Retail & Wholesale'
  },
  healthcare: {
    avgEV_EBITDA: 10.5,
    avgP_E: 20,
    avgP_S: 3.5,
    synergiesRange: { min: 5, max: 15 },
    description: 'Healthcare & Pharmaceuticals'
  },
  finance: {
    avgEV_EBITDA: 9.0,
    avgP_E: 16,
    avgP_S: 2.5,
    synergiesRange: { min: 10, max: 25 },
    description: 'Financial Services'
  },
  services: {
    avgEV_EBITDA: 7.5,
    avgP_E: 13,
    avgP_S: 1.5,
    synergiesRange: { min: 10, max: 30 },
    description: 'Professional Services'
  },
  ecommerce: {
    avgEV_EBITDA: 11.0,
    avgP_E: 25,
    avgP_S: 3.8,
    synergiesRange: { min: 8, max: 22 },
    description: 'E-commerce & Online'
  }
};

/**
 * Calculate price valuation assessment
 * Compare offered price to fair value range
 */
function calculatePriceAssessment(offeredPrice, fairValueLow, fairValueHigh) {
  const midpoint = (fairValueLow + fairValueHigh) / 2;
  const absolutePremium = offeredPrice - midpoint;
  const percentagePremium = (absolutePremium / midpoint) * 100;

  const isWithinRange = offeredPrice >= fairValueLow && offeredPrice <= fairValueHigh;
  const assessment = !isWithinRange
    ? (offeredPrice > fairValueHigh ? 'overpriced' : 'underpriced')
    : 'fair';

  return {
    offeredPrice,
    fairValue: midpoint,
    fairValueRange: { low: fairValueLow, high: fairValueHigh },
    premium: {
      absolute: Math.round(absolutePremium),
      percentage: Math.round(percentagePremium * 10) / 10
    },
    assessment,
    withinFairRange: isWithinRange
  };
}

/**
 * Calculate multiple analysis (EV/EBITDA, P/E, P/S)
 */
function calculateMultipleAnalysis(offeredPrice, targetEBITDA, targetProfit, targetRevenue, industry) {
  const multiples = INDUSTRY_MULTIPLES[industry.toLowerCase()] || INDUSTRY_MULTIPLES.services;

  // EV/EBITDA multiple
  const ev_ebitda_offered = targetEBITDA > 0 ? offeredPrice / targetEBITDA : 0;
  const ev_ebitda_gap = ev_ebitda_offered - multiples.avgEV_EBITDA;
  const ev_ebitda_assessment = ev_ebitda_gap > 1.5 ? 'high' : ev_ebitda_gap > 0.5 ? 'moderate' : 'fair';

  // P/E multiple
  const price_earnings = targetProfit > 0 ? offeredPrice / targetProfit : 0;
  const pe_gap = price_earnings - multiples.avgP_E;
  const pe_assessment = pe_gap > 2 ? 'high' : pe_gap > 1 ? 'moderate' : 'fair';

  // Price to Sales multiple
  const price_sales = targetRevenue > 0 ? offeredPrice / targetRevenue : 0;
  const ps_gap = price_sales - multiples.avgP_S;
  const ps_assessment = ps_gap > 0.3 ? 'high' : ps_gap > 0.1 ? 'moderate' : 'fair';

  return {
    ev_ebitda: {
      offered: Math.round(ev_ebitda_offered * 10) / 10,
      industry: multiples.avgEV_EBITDA,
      gap: Math.round(ev_ebitda_gap * 10) / 10,
      assessment: ev_ebitda_assessment
    },
    price_earnings: {
      offered: Math.round(price_earnings * 10) / 10,
      industry: multiples.avgP_E,
      gap: Math.round(pe_gap * 10) / 10,
      assessment: pe_assessment
    },
    price_sales: {
      offered: Math.round(price_sales * 10) / 10,
      industry: multiples.avgP_S,
      gap: Math.round(ps_gap * 10) / 10,
      assessment: ps_assessment
    },
    overallMultipleAssessment: [ev_ebitda_assessment, pe_assessment, ps_assessment].includes('high') ? 'expensive' : 'reasonable'
  };
}

/**
 * Calculate ROI and payback period
 */
function calculateROI(offeredPrice, targetEBITDA, synergies, integrationTimelineMonths = 12) {
  const annualCashFlow = targetEBITDA + (synergies * 0.8); // 80% of synergies realized
  const expectedROI = (annualCashFlow / offeredPrice);
  const paybackPeriodYears = offeredPrice / (annualCashFlow > 0 ? annualCashFlow : 1);

  // NPV calculation (simple approach with 10% discount rate)
  const discountRate = 0.10;
  let npv = -offeredPrice;
  for (let year = 1; year <= 5; year++) {
    npv += annualCashFlow / Math.pow(1 + discountRate, year);
  }

  // IRR estimation (simplified)
  const irr = expectedROI > 0 ? expectedROI - (0.05 * integrationTimelineMonths / 12) : 0;

  return {
    annualCashFlow: Math.round(annualCashFlow),
    expectedROI: Math.max(0, Math.round(expectedROI * 1000) / 1000),
    expectedROIPercent: Math.max(0, Math.round(expectedROI * 100 * 10) / 10),
    paybackPeriod: Math.round(paybackPeriodYears * 10) / 10,
    npv: Math.round(npv),
    irr: Math.max(0, Math.round(irr * 1000) / 1000),
    irrPercent: Math.max(0, Math.round(irr * 100 * 10) / 10),
    roiAssessment: expectedROI > 0.25 ? 'excellent' : expectedROI > 0.15 ? 'good' : expectedROI > 0.10 ? 'acceptable' : 'poor'
  };
}

/**
 * Calculate synergies
 */
function calculateSynergies(
  revenuesynergiesInput,
  costsynergiesInput,
  targetEBITDA,
  offeredPrice
) {
  const synergies = {
    revenue: {
      crossSelling: revenuesynergiesInput?.crossSelling || 0,
      marketExpansion: revenuesynergiesInput?.marketExpansion || 0,
      productExpansion: revenuesynergiesInput?.productExpansion || 0,
      other: revenuesynergiesInput?.other || 0,
      total: 0
    },
    cost: {
      operationalEfficiency: costsynergiesInput?.operationalEfficiency || 0,
      overheadReduction: costsynergiesInput?.overheadReduction || 0,
      rnd: costsynergiesInput?.rnd || 0,
      other: costsynergiesInput?.other || 0,
      total: 0
    },
    financial: {
      taxBenefits: Math.round(offeredPrice * 0.01), // 1% tax benefit assumption
      total: 0
    },
    totalSynergies: 0,
    synergiesAsPercentOfPrice: 0,
    synergiesAsPercentOfEBITDA: 0
  };

  // Calculate totals
  synergies.revenue.total = Object.values(synergies.revenue).slice(0, -1).reduce((a, b) => a + b, 0);
  synergies.cost.total = Object.values(synergies.cost).slice(0, -1).reduce((a, b) => a + b, 0);
  synergies.financial.total = synergies.financial.taxBenefits;

  synergies.totalSynergies = synergies.revenue.total + synergies.cost.total + synergies.financial.total;
  synergies.synergiesAsPercentOfPrice = offeredPrice > 0 ? (synergies.totalSynergies / offeredPrice * 100) : 0;
  synergies.synergiesAsPercentOfEBITDA = targetEBITDA > 0 ? (synergies.totalSynergies / targetEBITDA) : 0;

  return synergies;
}

/**
 * Assess deal risks
 */
function assessDealRisks(
  integrationComplexity,
  culturalFitRating,
  customerConcentration,
  industryType,
  targetDebt,
  offeredPrice
) {
  // Apply defaults
  integrationComplexity = integrationComplexity !== undefined ? integrationComplexity : 5;
  culturalFitRating = culturalFitRating !== undefined ? culturalFitRating : 5;
  customerConcentration = customerConcentration !== undefined ? customerConcentration : 0.3;
  industryType = industryType || 'services';
  targetDebt = targetDebt || 0;
  offeredPrice = offeredPrice || 1000000;
  let riskScore = 50; // Start at neutral
  const factors = {};

  // Integration complexity risk (1-10 → risk factor)
  const integrationRisk = 40 + (integrationComplexity - 1) * 4;
  factors.integrationComplexity = {
    score: Math.round(integrationComplexity * 10),
    riskFactor: 'integration_complexity'
  };
  riskScore += (integrationRisk - 50) * 0.25;

  // Cultural fit risk (higher is better, so invert)
  const culturalRisk = 70 - (culturalFitRating * 4);
  factors.culturalFit = {
    score: Math.round(culturalFitRating * 10),
    riskFactor: 'cultural_misalignment'
  };
  riskScore += (culturalRisk - 50) * 0.20;

  // Customer retention risk
  const customerRetentionRisk = 40 + (customerConcentration * 100);
  factors.customerRetention = {
    score: Math.round((1 - customerConcentration) * 100),
    riskFactor: 'customer_concentration'
  };
  riskScore += (customerRetentionRisk - 50) * 0.20;

  // Competitive response risk
  const competitiveRisk = 50;
  factors.competitiveResponse = {
    score: 50,
    riskFactor: 'competitive_response'
  };
  riskScore += (competitiveRisk - 50) * 0.15;

  // Regulatory/compliance risk (varies by industry)
  const industryRegulatoryRisk = {
    'healthcare': 70,
    'finance': 65,
    'manufacturing': 45,
    'retail': 40,
    'tech': 35,
    'services': 40,
    'ecommerce': 35
  };
  const regulatoryRisk = industryRegulatoryRisk[industryType.toLowerCase()] || 45;
  factors.regulatory = {
    score: 100 - regulatoryRisk,
    riskFactor: 'regulatory_compliance'
  };
  riskScore += (regulatoryRisk - 50) * 0.20;

  // Debt risk
  const debtRisk = 50 + Math.min(targetDebt / offeredPrice * 100, 50);
  factors.debtRisk = {
    score: Math.round(debtRisk),
    riskFactor: 'target_debt_levels'
  };
  riskScore += (debtRisk - 50) * 0.10;

  riskScore = Math.max(30, Math.min(riskScore, 95)); // Cap between 30-95

  // Determine grade
  let grade = 'F';
  if (riskScore <= 40) grade = 'A';
  else if (riskScore <= 50) grade = 'B';
  else if (riskScore <= 60) grade = 'C';
  else if (riskScore <= 75) grade = 'D';

  return {
    integrationComplexity,
    culturalFitRating,
    overallRiskScore: Math.round(riskScore),
    riskGrade: grade,
    factors,
    assessment: getRiskAssessment(Math.round(riskScore), grade)
  };
}

/**
 * Get text assessment for deal risk score
 */
function getRiskAssessment(score, grade) {
  if (grade === 'A') {
    return 'Excellent deal with minimal risk. Strong fit and well-priced.';
  } else if (grade === 'B') {
    return 'Good deal with manageable risks. Some integration challenges to plan for.';
  } else if (grade === 'C') {
    return 'Moderate risk deal. Requires careful planning and strong integration management.';
  } else if (grade === 'D') {
    return 'High-risk deal. Significant challenges identified. Proceed only with detailed mitigation plan.';
  } else {
    return 'Very high-risk deal. Major concerns identified. Requires expert review before proceeding.';
  }
}

/**
 * Calculate deal scorecard with weighted scoring
 */
function calculateDealScorecard(priceAssessment, multipleAnalysis, roiAnalysis, synergies, riskAssessment, offeredPrice, fairValue) {
  // Pricing Score (1-10)
  let pricingScore = 5;
  if (priceAssessment.assessment === 'underpriced') pricingScore = 9;
  else if (priceAssessment.assessment === 'fair') pricingScore = 7;
  else if (priceAssessment.premium.percentage > 20) pricingScore = 3;
  else pricingScore = 5;

  // ROI Score (1-10)
  let roiScore = 10;
  if (roiAnalysis.expectedROIPercent < 10) roiScore = 3;
  else if (roiAnalysis.expectedROIPercent < 15) roiScore = 5;
  else if (roiAnalysis.expectedROIPercent < 25) roiScore = 7;
  else roiScore = 9;

  // Synergy Score (1-10)
  const synergyScore = Math.min(10, Math.round((synergies.synergiesAsPercentOfPrice / 3) + 2));

  // Risk Score (inverse - lower risk is higher score)
  const riskScore = 10 - Math.round(riskAssessment.overallRiskScore / 10);

  // Weighted overall score
  const weights = {
    pricing: 0.25,
    roi: 0.30,
    synergies: 0.20,
    risk: 0.25
  };

  const overallScore = (pricingScore * weights.pricing +
                       roiScore * weights.roi +
                       synergyScore * weights.synergies +
                       riskScore * weights.risk);

  // Recommendation logic
  let recommendation = 'pass';
  let recommendationLevel = 'Pass';

  if (overallScore >= 8) {
    recommendation = 'strong_buy';
    recommendationLevel = 'Strong Buy';
  } else if (overallScore >= 6.5) {
    recommendation = 'buy';
    recommendationLevel = 'Buy';
  } else if (overallScore >= 5) {
    recommendation = 'hold';
    recommendationLevel = 'Hold';
  }

  const rationale = generateScoreRationale(priceAssessment, roiAnalysis, synergies, riskAssessment, recommendationLevel);

  return {
    pricingScore: Math.round(pricingScore * 10) / 10,
    roiScore: Math.round(roiScore * 10) / 10,
    synergyScore: Math.round(synergyScore * 10) / 10,
    riskScore: Math.round(riskScore * 10) / 10,
    overallScore: Math.round(overallScore * 100) / 100,
    recommendation,
    recommendationLevel,
    rationale
  };
}

/**
 * Generate scorecard rationale
 */
function generateScoreRationale(priceAssessment, roiAnalysis, synergies, riskAssessment, recommendation) {
  const reasons = [];

  if (priceAssessment.assessment === 'underpriced') {
    reasons.push(`Price is attractive at ${Math.abs(priceAssessment.premium.percentage)}% below fair value.`);
  } else if (priceAssessment.assessment === 'fair') {
    reasons.push(`Price is within fair value range with ${priceAssessment.premium.percentage}% premium.`);
  } else {
    reasons.push(`Price is elevated at ${priceAssessment.premium.percentage}% above fair value.`);
  }

  if (roiAnalysis.expectedROIPercent > 20) {
    reasons.push(`Strong ROI potential of ${roiAnalysis.expectedROIPercent}% annually.`);
  } else if (roiAnalysis.expectedROIPercent > 10) {
    reasons.push(`Reasonable ROI of ${roiAnalysis.expectedROIPercent}% annually.`);
  } else {
    reasons.push(`Lower ROI of ${roiAnalysis.expectedROIPercent}% may not justify acquisition risk.`);
  }

  if (synergies.totalSynergies > 0) {
    reasons.push(`Synergies of $${(synergies.totalSynergies / 1000000).toFixed(1)}M identified (${synergies.synergiesAsPercentOfPrice.toFixed(1)}% of price).`);
  }

  if (riskAssessment.riskGrade === 'A' || riskAssessment.riskGrade === 'B') {
    reasons.push(`Deal risk is manageable with proper planning.`);
  } else {
    reasons.push(`Significant risks require mitigation strategy.`);
  }

  return reasons.join(' ');
}

/**
 * Generate negotiation guidance
 */
function generateNegotiationGuidance(offeredPrice, fairValueRange, synergies, roiAnalysis) {
  const suggestedBid = Math.round(fairValueRange.low + ((fairValueRange.high - fairValueRange.low) * 0.4));
  const walkAwayPrice = Math.round(fairValueRange.high * 1.15);
  const synergiesLeverageAmount = Math.round(synergies.totalSynergies * 0.3);

  const leverPoints = [];
  if (synergies.revenue.crossSelling > 0) {
    leverPoints.push(`Cross-selling opportunities worth $${(synergies.revenue.crossSelling / 1000000).toFixed(1)}M`);
  }
  if (synergies.cost.operationalEfficiency > 0) {
    leverPoints.push(`Operational efficiency gains of $${(synergies.cost.operationalEfficiency / 1000000).toFixed(1)}M`);
  }
  if (roiAnalysis.npv > 0) {
    leverPoints.push(`Positive NPV of $${(roiAnalysis.npv / 1000000).toFixed(1)}M`);
  }

  return {
    fairValueRange,
    currentOffer: offeredPrice,
    suggestedBid,
    suggestedBidRationale: `Target represents ${Math.round((suggestedBid / fairValueRange.low - 1) * 100)}% premium to low fair value`,
    walkAwayPrice,
    walkAwayRationale: `Beyond this price, deal returns diminish significantly`,
    negotiationMargin: {
      between: suggestedBid,
      and: walkAwayPrice
    },
    keyLeverPoints: leverPoints.slice(0, 3),
    negotiationTips: [
      'Quantify synergies early in discussions',
      'Use market comparables to benchmark valuation',
      'Ensure earnout provisions protect against synergy shortfalls',
      'Structure deal to phase payments based on synergy realization'
    ]
  };
}

/**
 * Main function: Analyze a deal
 */
function analyzeDeal(inputData) {
  // Validate required fields
  if (!inputData || typeof inputData !== 'object') {
    throw new Error('Input data must be an object');
  }

  const required = [
    'offeredPrice',
    'targetEBITDA',
    'targetProfit',
    'targetRevenue',
    'industry'
  ];

  for (const field of required) {
    if (inputData[field] === undefined || inputData[field] === null) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Calculate fair value (using EBITDA multiple approach)
  const multiples = INDUSTRY_MULTIPLES[inputData.industry.toLowerCase()] || INDUSTRY_MULTIPLES.services;
  const fairValue = inputData.targetEBITDA * multiples.avgEV_EBITDA;
  const fairValueRange = {
    low: Math.round(fairValue * 0.9),
    high: Math.round(fairValue * 1.1)
  };

  // Calculate all metrics
  const priceAssessment = calculatePriceAssessment(
    inputData.offeredPrice,
    fairValueRange.low,
    fairValueRange.high
  );

  const multipleAnalysis = calculateMultipleAnalysis(
    inputData.offeredPrice,
    inputData.targetEBITDA,
    inputData.targetProfit,
    inputData.targetRevenue,
    inputData.industry
  );

  const totalSynergies = (inputData.revenueSynergies?.total || 0) +
                        (inputData.costSynergies?.total || 0);

  const roiAnalysis = calculateROI(
    inputData.offeredPrice,
    inputData.targetEBITDA,
    totalSynergies,
    inputData.integrationTimelineMonths || 12
  );

  const synergies = calculateSynergies(
    inputData.revenueSynergies,
    inputData.costSynergies,
    inputData.targetEBITDA,
    inputData.offeredPrice
  );

  const riskAssessment = assessDealRisks(
    inputData.integrationComplexity !== undefined ? inputData.integrationComplexity : 5,
    inputData.culturalFitRating !== undefined ? inputData.culturalFitRating : 5,
    inputData.customerConcentration !== undefined ? inputData.customerConcentration : 0.3,
    inputData.industry || 'services',
    inputData.targetDebt || 0,
    inputData.offeredPrice || 0
  );

  const dealScorecard = calculateDealScorecard(
    priceAssessment,
    multipleAnalysis,
    roiAnalysis,
    synergies,
    riskAssessment,
    inputData.offeredPrice,
    fairValue
  );

  const negotiationGuidance = generateNegotiationGuidance(
    inputData.offeredPrice,
    fairValueRange,
    synergies,
    roiAnalysis
  );

  return {
    dealMetrics: priceAssessment,
    multipleAnalysis,
    roiAnalysis,
    synergies,
    riskAssessment,
    dealScorecard,
    negotiationGuidance,
    analysisDate: new Date().toISOString(),
    targetIndustry: inputData.industry
  };
}

/**
 * Generate deal scenarios (best/base/worst case)
 */
function generateDealScenarios(baseAnalysis, inputData) {
  // Generate bullish and bearish scenarios
  const createScenarioData = (multiplier, isOptimistic = false) => {
    return {
      ...inputData,
      revenueSynergies: {
        crossSelling: (inputData.revenueSynergies?.crossSelling || 0) * multiplier,
        marketExpansion: (inputData.revenueSynergies?.marketExpansion || 0) * multiplier,
        productExpansion: (inputData.revenueSynergies?.productExpansion || 0) * multiplier,
        other: (inputData.revenueSynergies?.other || 0) * multiplier,
        total: (inputData.revenueSynergies?.total || 0) * multiplier
      },
      costSynergies: {
        operationalEfficiency: (inputData.costSynergies?.operationalEfficiency || 0) * multiplier,
        overheadReduction: (inputData.costSynergies?.overheadReduction || 0) * multiplier,
        rnd: (inputData.costSynergies?.rnd || 0) * multiplier,
        other: (inputData.costSynergies?.other || 0) * multiplier,
        total: (inputData.costSynergies?.total || 0) * multiplier
      },
      integrationTimelineMonths: isOptimistic
        ? Math.round((inputData.integrationTimelineMonths || 12) * 0.75)
        : Math.round((inputData.integrationTimelineMonths || 12) * 1.25)
    };
  };

  const scenarios = {
    base: {
      name: 'Base Case',
      description: 'Most likely scenario based on current assumptions',
      multiplier: 1.0,
      analysis: analyzeDeal(inputData)
    },
    bullish: {
      name: 'Bullish Case',
      description: 'Higher synergies and faster integration',
      multiplier: 1.25,
      analysis: analyzeDeal(createScenarioData(1.25, true))
    },
    bearish: {
      name: 'Bearish Case',
      description: 'Lower synergies and slower integration',
      multiplier: 0.75,
      analysis: analyzeDeal(createScenarioData(0.75, false))
    }
  };

  return scenarios;
}

module.exports = {
  analyzeDeal,
  generateDealScenarios,
  calculatePriceAssessment,
  calculateMultipleAnalysis,
  calculateROI,
  calculateSynergies,
  assessDealRisks,
  calculateDealScorecard,
  generateNegotiationGuidance,
  INDUSTRY_MULTIPLES
};
