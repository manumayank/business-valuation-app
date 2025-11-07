/**
 * Unit tests for valuationEngine
 * Run with: npm test
 */

const { calculateValuation } = require('./valuationEngine');

// Sample test data
const sampleInputs = {
  companyName: 'Tech Startup Inc',
  industry: 'tech',
  annualRevenue: 5000000,
  ebitda: 1500000,
  yearsInBusiness: 4,
  employees: 25,
  growthRate: 0.35,  // 35%
  profitMargin: 0.25, // 25%
  customerRetention: 0.92, // 92%
  topCustomerConcentration: 0.15, // 15%
  debtLevel: 0.25 // 25%
};

describe('Valuation Engine', () => {
  test('calculates base valuation correctly', () => {
    const result = calculateValuation(sampleInputs);

    // Expected: EBITDA (1.5M) * Tech multiple (12x) = 18M base
    expect(result.baseValuation).toBe(18000000);
  });

  test('returns structured result object', () => {
    const result = calculateValuation(sampleInputs);

    expect(result).toHaveProperty('companyName');
    expect(result).toHaveProperty('industry');
    expect(result).toHaveProperty('baseValuation');
    expect(result).toHaveProperty('finalValuation');
    expect(result).toHaveProperty('drivers');
    expect(result).toHaveProperty('gaps');
    expect(result).toHaveProperty('suggestions');
  });

  test('applies positive growth rate adjustment', () => {
    const result = calculateValuation(sampleInputs);

    // Growth rate (35%) is above tech benchmark (20%), should add positive adjustment
    const growthDriver = result.drivers.find(d => d.key === 'growth_rate');
    expect(growthDriver).toBeDefined();
    expect(growthDriver.impact).toBeGreaterThan(0);
  });

  test('applies negative growth rate adjustment when below benchmark', () => {
    const lowGrowthInputs = { ...sampleInputs, growthRate: 0.10 };
    const result = calculateValuation(lowGrowthInputs);

    // Growth rate (10%) is below tech benchmark (20%), should create a gap
    const growthGap = result.gaps.find(g => g.key === 'growth_rate');
    expect(growthGap).toBeDefined();
    expect(growthGap.impact).toBeLessThan(0);
  });

  test('detects customer concentration risk', () => {
    const highConcentrationInputs = { ...sampleInputs, topCustomerConcentration: 0.45 };
    const result = calculateValuation(highConcentrationInputs);

    const concentrationGap = result.gaps.find(g => g.key === 'customer_concentration');
    expect(concentrationGap).toBeDefined();
    expect(concentrationGap.impact).toBeLessThan(0);
  });

  test('detects high debt level risk', () => {
    const highDebtInputs = { ...sampleInputs, debtLevel: 0.75 };
    const result = calculateValuation(highDebtInputs);

    const debtGap = result.gaps.find(g => g.key === 'debt_level');
    expect(debtGap).toBeDefined();
    expect(debtGap.impact).toBeLessThan(0);
  });

  test('generates improvement suggestions for gaps', () => {
    const result = calculateValuation(sampleInputs);

    expect(result.suggestions).toBeDefined();
    expect(Array.isArray(result.suggestions)).toBe(true);

    // Each suggestion should have required properties
    result.suggestions.forEach(suggestion => {
      expect(suggestion).toHaveProperty('key');
      expect(suggestion).toHaveProperty('title');
      expect(suggestion).toHaveProperty('description');
      expect(suggestion).toHaveProperty('completed');
    });
  });

  test('handles completed improvements', () => {
    const completedImprovements = ['growth_rate'];
    const result = calculateValuation(sampleInputs, completedImprovements);

    // When an improvement is completed, it should be marked as such
    const completedSuggestion = result.suggestions.find(
      s => s.key === 'growth_rate' && s.completed
    );
    expect(completedSuggestion).toBeDefined();
  });

  test('calculates different valuations for different industries', () => {
    const techInputs = { ...sampleInputs, industry: 'tech' };
    const retailInputs = { ...sampleInputs, industry: 'retail' };

    const techResult = calculateValuation(techInputs);
    const retailResult = calculateValuation(retailInputs);

    // Tech should have higher valuation due to higher EBITDA multiple
    expect(techResult.baseValuation).toBeGreaterThan(retailResult.baseValuation);
  });

  test('ensures final valuation is minimum 50% of annual revenue', () => {
    const inputs = {
      ...sampleInputs,
      ebitda: 100000, // Very low EBITDA
      annualRevenue: 1000000
    };

    const result = calculateValuation(inputs);

    // Final valuation should be at least 50% of annual revenue
    expect(result.finalValuation).toBeGreaterThanOrEqual(inputs.annualRevenue * 0.5);
  });

  test('returns calculated date', () => {
    const result = calculateValuation(sampleInputs);

    expect(result.calculationDate).toBeDefined();
    expect(new Date(result.calculationDate)).toBeInstanceOf(Date);
  });

  test('handles edge case of 0% growth rate', () => {
    const noGrowthInputs = { ...sampleInputs, growthRate: 0 };
    const result = calculateValuation(noGrowthInputs);

    expect(result.finalValuation).toBeGreaterThan(0);
    expect(result.drivers).toBeDefined();
    expect(result.gaps).toBeDefined();
  });

  test('handles edge case of 100% customer retention', () => {
    const perfectRetentionInputs = { ...sampleInputs, customerRetention: 1.0 };
    const result = calculateValuation(perfectRetentionInputs);

    expect(result.finalValuation).toBeGreaterThan(0);
    const retentionDriver = result.drivers.find(d => d.key === 'customer_retention');
    expect(retentionDriver).toBeDefined();
  });
});

// Run tests: npm test
// Or manually with Jest if installed
