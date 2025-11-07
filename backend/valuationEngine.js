// Industry benchmarks for various metrics
const INDUSTRY_BENCHMARKS = {
  tech: {
    ebitdaMultiple: 12,
    revenueMultiple: 5,
    profitMargin: 0.25,
    growthRate: 0.20,
    customerRetention: 0.90
  },
  retail: {
    ebitdaMultiple: 6,
    revenueMultiple: 1.5,
    profitMargin: 0.08,
    growthRate: 0.05,
    customerRetention: 0.75
  },
  services: {
    ebitdaMultiple: 7,
    revenueMultiple: 2,
    profitMargin: 0.15,
    growthRate: 0.10,
    customerRetention: 0.85
  },
  manufacturing: {
    ebitdaMultiple: 8,
    revenueMultiple: 1.8,
    profitMargin: 0.12,
    growthRate: 0.08,
    customerRetention: 0.80
  },
  default: {
    ebitdaMultiple: 8,
    revenueMultiple: 2,
    profitMargin: 0.12,
    growthRate: 0.10,
    customerRetention: 0.82
  }
};

function getBenchmarks(industry) {
  return INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS.default;
}

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
  const result = {
    companyName,
    industry,
    calculationDate: new Date().toISOString(),
    baseValuation: 0,
    finalValuation: 0,
    adjustments: [],
    drivers: [],
    gaps: [],
    suggestions: []
  };

  // Base valuation using EBITDA multiple
  let valuation = ebitda * benchmarks.ebitdaMultiple;
  result.baseValuation = valuation;
  result.drivers.push({
    key: 'ebitda_multiple',
    label: `EBITDA (${formatCurrency(ebitda)}) × ${benchmarks.ebitdaMultiple}× multiple`,
    impact: valuation,
    type: 'base'
  });

  // Adjustment 1: Growth Rate
  const growthAdjustment = growthRate > benchmarks.growthRate
    ? valuation * (growthRate - benchmarks.growthRate) * 0.5
    : -valuation * (benchmarks.growthRate - growthRate) * 0.3;

  if (growthAdjustment > 0) {
    result.drivers.push({
      key: 'growth_rate',
      label: `Strong growth (${(growthRate * 100).toFixed(1)}% vs industry ${(benchmarks.growthRate * 100).toFixed(1)}%)`,
      impact: growthAdjustment,
      type: 'positive'
    });
    valuation += growthAdjustment;
  } else {
    result.gaps.push({
      key: 'growth_rate',
      label: `Growth Rate`,
      current: (growthRate * 100).toFixed(1) + '%',
      benchmark: (benchmarks.growthRate * 100).toFixed(1) + '%',
      gap: ((growthRate - benchmarks.growthRate) * 100).toFixed(1) + '%',
      impact: growthAdjustment
    });
    valuation += growthAdjustment;
  }

  // Adjustment 2: Profit Margin
  const marginAdjustment = profitMargin > benchmarks.profitMargin
    ? valuation * (profitMargin - benchmarks.profitMargin) * 0.4
    : -valuation * (benchmarks.profitMargin - profitMargin) * 0.3;

  if (marginAdjustment > 0) {
    result.drivers.push({
      key: 'profit_margin',
      label: `Strong profit margin (${(profitMargin * 100).toFixed(1)}% vs industry ${(benchmarks.profitMargin * 100).toFixed(1)}%)`,
      impact: marginAdjustment,
      type: 'positive'
    });
    valuation += marginAdjustment;
  } else {
    result.gaps.push({
      key: 'profit_margin',
      label: `Profit Margin`,
      current: (profitMargin * 100).toFixed(1) + '%',
      benchmark: (benchmarks.profitMargin * 100).toFixed(1) + '%',
      gap: ((profitMargin - benchmarks.profitMargin) * 100).toFixed(1) + '%',
      impact: marginAdjustment
    });
    valuation += marginAdjustment;
  }

  // Adjustment 3: Customer Retention
  const retentionAdjustment = customerRetention > benchmarks.customerRetention
    ? valuation * (customerRetention - benchmarks.customerRetention) * 0.3
    : -valuation * (benchmarks.customerRetention - customerRetention) * 0.25;

  if (retentionAdjustment > 0) {
    result.drivers.push({
      key: 'customer_retention',
      label: `Excellent customer retention (${(customerRetention * 100).toFixed(1)}%)`,
      impact: retentionAdjustment,
      type: 'positive'
    });
    valuation += retentionAdjustment;
  } else {
    result.gaps.push({
      key: 'customer_retention',
      label: `Customer Retention`,
      current: (customerRetention * 100).toFixed(1) + '%',
      benchmark: (benchmarks.customerRetention * 100).toFixed(1) + '%',
      gap: ((customerRetention - benchmarks.customerRetention) * 100).toFixed(1) + '%',
      impact: retentionAdjustment
    });
    valuation += retentionAdjustment;
  }

  // Adjustment 4: Customer Concentration Risk
  if (topCustomerConcentration > 0.3) {
    const concentrationPenalty = -valuation * (topCustomerConcentration - 0.3) * 0.5;
    result.gaps.push({
      key: 'customer_concentration',
      label: `Customer Concentration Risk`,
      current: (topCustomerConcentration * 100).toFixed(1) + '%',
      benchmark: '30%',
      gap: ((topCustomerConcentration - 0.3) * 100).toFixed(1) + '%',
      impact: concentrationPenalty
    });
    valuation += concentrationPenalty;
  }

  // Adjustment 5: Debt Level
  if (debtLevel > 0.5) {
    const debtPenalty = -valuation * (debtLevel - 0.5) * 0.4;
    result.gaps.push({
      key: 'debt_level',
      label: `High Debt Level`,
      current: (debtLevel * 100).toFixed(1) + '%',
      benchmark: '50%',
      gap: ((debtLevel - 0.5) * 100).toFixed(1) + '%',
      impact: debtPenalty
    });
    valuation += debtPenalty;
  }

  // Apply completed improvements adjustment
  let improvementBonus = 0;
  completedImprovements.forEach(improvement => {
    const gap = result.gaps.find(g => g.key === improvement);
    if (gap) {
      // Completing an improvement reduces the negative impact
      improvementBonus -= gap.impact * 0.5; // Partial recovery
    }
  });

  if (improvementBonus > 0) {
    result.drivers.push({
      key: 'completed_improvements',
      label: `Improvements completed (${completedImprovements.length})`,
      impact: improvementBonus,
      type: 'improvement'
    });
    valuation += improvementBonus;
  }

  result.finalValuation = Math.max(annualRevenue * 0.5, Math.round(valuation));

  // Generate suggestions based on gaps
  if (result.gaps.length > 0) {
    result.gaps.forEach(gap => {
      let suggestion = '';
      switch (gap.key) {
        case 'growth_rate':
          suggestion = 'Increase revenue growth through new market expansion, product development, or marketing initiatives';
          break;
        case 'profit_margin':
          suggestion = 'Improve profit margins by optimizing operations, reducing costs, or increasing pricing';
          break;
        case 'customer_retention':
          suggestion = 'Enhance customer retention through better customer service, loyalty programs, or product improvements';
          break;
        case 'customer_concentration':
          suggestion = 'Diversify customer base to reduce dependence on top customers and improve stability';
          break;
        case 'debt_level':
          suggestion = 'Reduce debt levels to improve financial health and increase valuation multiple';
          break;
        default:
          suggestion = 'Address this gap to improve valuation';
      }
      result.suggestions.push({
        key: gap.key,
        title: gap.label,
        description: suggestion,
        completed: completedImprovements.includes(gap.key)
      });
    });
  }

  // Add some positive action suggestions for drivers
  if (result.drivers.length > 1) {
    result.suggestions.push({
      key: 'maintain_strengths',
      title: 'Maintain Your Strengths',
      description: 'Continue investing in the areas that are above industry benchmarks to maintain competitive advantage',
      completed: false
    });
  }

  return result;
}

function formatCurrency(value) {
  return `$${(value / 1000000).toFixed(1)}M`;
}

module.exports = {
  calculateValuation,
  getBenchmarks,
  INDUSTRY_BENCHMARKS
};
