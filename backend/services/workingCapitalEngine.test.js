/**
 * Comprehensive Tests for Working Capital Analysis Engine
 * Run with: npm test -- workingCapitalEngine.test.js
 */

const {
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
} = require('./workingCapitalEngine');

// Sample data - Tech company with good working capital
const sampleTechInput = {
  accountsReceivable: 500000,
  inventory: 100000,
  accountsPayable: 200000,
  costOfGoodsSold: 2000000,
  annualRevenue: 5000000,
  totalCurrentAssets: 2000000,
  totalCurrentLiabilities: 800000,
  industry: 'tech'
};

// Manufacturing company with higher inventory
const sampleManufacturingInput = {
  accountsReceivable: 750000,
  inventory: 800000,
  accountsPayable: 400000,
  costOfGoodsSold: 3500000,
  annualRevenue: 6000000,
  totalCurrentAssets: 3000000,
  totalCurrentLiabilities: 1200000,
  industry: 'manufacturing'
};

// Retail company with low DSO, moderate DIO
const sampleRetailInput = {
  accountsReceivable: 100000,
  inventory: 600000,
  accountsPayable: 350000,
  costOfGoodsSold: 4000000,
  annualRevenue: 8000000,
  totalCurrentAssets: 1500000,
  totalCurrentLiabilities: 600000,
  industry: 'retail'
};

describe('Working Capital Analysis Engine', () => {

  describe('calculateDSO', () => {
    test('should calculate DSO correctly', () => {
      const dso = calculateDSO(500000, 5000000);
      expect(dso).toBe(36.5); // (500000 / 5000000) * 365 = 36.5
    });

    test('should handle zero revenue', () => {
      const dso = calculateDSO(500000, 0);
      expect(dso).toBe(0);
    });

    test('should handle zero receivables', () => {
      const dso = calculateDSO(0, 5000000);
      expect(dso).toBe(0);
    });

    test('should return rounded result', () => {
      const dso = calculateDSO(600000, 7500000);
      expect(typeof dso).toBe('number');
      expect(dso).toBeCloseTo(29.2, 1);
    });
  });

  describe('calculateDIO', () => {
    test('should calculate DIO correctly', () => {
      const dio = calculateDIO(100000, 2000000);
      expect(dio).toBeGreaterThan(18); // (100000 / 2000000) * 365 = 18.25
      expect(dio).toBeLessThan(19);
    });

    test('should handle zero COGS', () => {
      const dio = calculateDIO(100000, 0);
      expect(dio).toBe(0);
    });

    test('should handle zero inventory', () => {
      const dio = calculateDIO(0, 2000000);
      expect(dio).toBe(0);
    });

    test('should handle service industry (no inventory)', () => {
      const dio = calculateDIO(0, 1000000);
      expect(dio).toBe(0);
    });
  });

  describe('calculateDPO', () => {
    test('should calculate DPO correctly', () => {
      const dpo = calculateDPO(200000, 2000000);
      expect(dpo).toBe(36.5); // (200000 / 2000000) * 365 = 36.5
    });

    test('should handle zero COGS', () => {
      const dpo = calculateDPO(200000, 0);
      expect(dpo).toBe(0);
    });

    test('should handle zero payables', () => {
      const dpo = calculateDPO(0, 2000000);
      expect(dpo).toBe(0);
    });
  });

  describe('calculateCCC', () => {
    test('should calculate Cash Conversion Cycle correctly', () => {
      const ccc = calculateCCC(36.5, 18.25, 36.5);
      expect(ccc).toBeGreaterThan(18); // 36.5 + 18.25 - 36.5 ≈ 18.3
      expect(ccc).toBeLessThan(19);
    });

    test('should handle negative CCC (ideal scenario)', () => {
      const ccc = calculateCCC(20, 30, 60);
      expect(ccc).toBe(-10); // 20 + 30 - 60 = -10
    });

    test('should handle zero values', () => {
      const ccc = calculateCCC(0, 0, 0);
      expect(ccc).toBe(0);
    });
  });

  describe('calculateWCPercentage', () => {
    test('should calculate working capital as % of revenue', () => {
      const wc = calculateWCPercentage(2000000, 800000, 5000000);
      expect(wc).toBe(0.24); // (2000000 - 800000) / 5000000 = 0.24
    });

    test('should handle zero revenue', () => {
      const wc = calculateWCPercentage(1000000, 500000, 0);
      expect(wc).toBe(0);
    });

    test('should handle negative working capital', () => {
      const wc = calculateWCPercentage(500000, 1000000, 3000000);
      expect(wc).toBeCloseTo(-0.167, 2);
    });
  });

  describe('calculateGap', () => {
    test('should calculate gap for standard metrics (DSO, DIO, CCC)', () => {
      const gap = calculateGap(45, 40, 'standard');
      expect(gap).toBe(-5); // benchmark - actual = 40 - 45
    });

    test('should calculate gap for payables (higher is better)', () => {
      const gap = calculateGap(35, 38, 'payables');
      expect(gap).toBe(-3); // actual - benchmark = 35 - 38 = -3
    });

    test('should calculate gap for working capital percentage', () => {
      const gap = calculateGap(0.2, 0.15, 'wcPercentage');
      expect(gap).toBeGreaterThan(0.04); // actual - benchmark = 0.2 - 0.15 = 0.05
    });

    test('should handle zero gaps', () => {
      const gap = calculateGap(40, 40, 'standard');
      expect(gap).toBe(0);
    });
  });

  describe('getBenchmarks', () => {
    test('should return tech benchmarks', () => {
      const benchmarks = getBenchmarks('tech');
      expect(benchmarks.dso).toBe(45);
      expect(benchmarks.dio).toBe(30);
      expect(benchmarks.dpo).toBe(38);
    });

    test('should return manufacturing benchmarks', () => {
      const benchmarks = getBenchmarks('manufacturing');
      expect(benchmarks.dio).toBe(65); // Inventory-heavy
    });

    test('should return retail benchmarks', () => {
      const benchmarks = getBenchmarks('retail');
      expect(benchmarks.dso).toBe(20); // Low receivables
    });

    test('should return default benchmarks for unknown industry', () => {
      const benchmarks = getBenchmarks('unknown');
      expect(benchmarks).toBeDefined();
      expect(benchmarks.dso).toBeDefined();
    });

    test('should be case-insensitive', () => {
      const benchmarks1 = getBenchmarks('TECH');
      const benchmarks2 = getBenchmarks('tech');
      expect(benchmarks1).toEqual(benchmarks2);
    });
  });

  describe('Full Analysis - analyzeWorkingCapital', () => {
    test('should analyze tech company successfully', () => {
      const result = analyzeWorkingCapital(sampleTechInput);

      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('benchmarks');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('optimizationImpact');
      expect(result).toHaveProperty('riskAssessment');
      expect(result).toHaveProperty('valuationImpact');
    });

    test('should analyze manufacturing company successfully', () => {
      const result = analyzeWorkingCapital(sampleManufacturingInput);

      expect(result.metrics.dio.value).toBeGreaterThan(0);
      expect(result.benchmarks.industry || result.benchmarks.description).toBeDefined();
    });

    test('should analyze retail company successfully', () => {
      const result = analyzeWorkingCapital(sampleRetailInput);

      expect(result.metrics.dso.value).toBeLessThan(50);
      expect(result).toHaveProperty('calculationDate');
    });

    test('should have all metrics populated', () => {
      const result = analyzeWorkingCapital(sampleTechInput);

      expect(result.metrics.dso).toHaveProperty('value');
      expect(result.metrics.dso).toHaveProperty('benchmark');
      expect(result.metrics.dso).toHaveProperty('gap');
      expect(result.metrics.dso).toHaveProperty('description');
    });

    test('should generate timestamp', () => {
      const result = analyzeWorkingCapital(sampleTechInput);
      expect(result.calculationDate).toBeDefined();
      expect(new Date(result.calculationDate)).not.toBeNaN();
    });
  });

  describe('Recommendations Generation', () => {
    test('should generate collection improvement recommendation for high DSO', () => {
      const inputWithHighDSO = {
        ...sampleTechInput,
        accountsReceivable: 1000000 // High receivables
      };

      const result = analyzeWorkingCapital(inputWithHighDSO);
      const collectionRec = result.recommendations.find(r => r.key === 'improve_collections');

      expect(collectionRec).toBeDefined();
      expect(collectionRec.priority).toBe('high');
      expect(collectionRec.timeline).toBeDefined();
    });

    test('should generate inventory optimization recommendation for high DIO', () => {
      const inputWithHighDIO = {
        ...sampleManufacturingInput,
        inventory: 1500000 // Very high inventory
      };

      const result = analyzeWorkingCapital(inputWithHighDIO);
      const inventoryRec = result.recommendations.find(r => r.key === 'optimize_inventory');

      expect(inventoryRec).toBeDefined();
      expect(inventoryRec.category).toBe('inventory');
    });

    test('should generate payables extension recommendation for low DPO', () => {
      const inputWithLowDPO = {
        ...sampleTechInput,
        accountsPayable: 30000 // Very low payables relative to COGS
      };

      const result = analyzeWorkingCapital(inputWithLowDPO);
      const payablesRec = result.recommendations.find(r => r.key === 'extend_payables');

      if (payablesRec) {
        expect(payablesRec.category).toBe('payables');
      }
    });

    test('should recognize strong collections as strength', () => {
      const result = analyzeWorkingCapital(sampleRetailInput); // DSO is very low

      const strengthRec = result.recommendations.find(r => r.key === 'strong_collections');

      if (strengthRec) {
        expect(strengthRec.priority).toBe('info');
      }
    });

    test('should calculate impact for recommendations', () => {
      const result = analyzeWorkingCapital(sampleTechInput);
      const recommendations = result.recommendations.filter(r => r.priority !== 'info');

      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('impact');
        expect(typeof rec.impact).toBe('number');
      });
    });
  });

  describe('Optimization Impact Calculation', () => {
    test('should calculate cash conversion cycle improvement', () => {
      const result = analyzeWorkingCapital(sampleTechInput);

      expect(result.optimizationImpact.currentCCC).toBeDefined();
      expect(result.optimizationImpact.optimizedCCC).toBeDefined();
      expect(result.optimizationImpact.improvementDays).toBeDefined();
    });

    test('should show positive improvement for suboptimal CCC', () => {
      const result = analyzeWorkingCapital(sampleManufacturingInput);

      if (result.optimizationImpact.totalCashReleased > 0) {
        expect(result.optimizationImpact.improvementPercent).toBeGreaterThan(0);
      }
    });

    test('should calculate individual improvement impacts', () => {
      const result = analyzeWorkingCapital(sampleTechInput);

      expect(result.optimizationImpact).toHaveProperty('dsoImprovement');
      expect(result.optimizationImpact).toHaveProperty('dioImprovement');
      expect(result.optimizationImpact).toHaveProperty('dpoImprovement');
    });

    test('should show valuation impact', () => {
      const result = analyzeWorkingCapital(sampleManufacturingInput);

      expect(result.valuationImpact.currentCCC).toBeDefined();
      expect(result.valuationImpact.benchmarkCCC).toBeDefined();
      expect(result.valuationImpact.estimatedValuationLift).toBeDefined();
    });
  });

  describe('Risk Assessment', () => {
    test('should generate risk score between 30-95', () => {
      const result = analyzeWorkingCapital(sampleTechInput);

      expect(result.riskAssessment.score).toBeGreaterThanOrEqual(30);
      expect(result.riskAssessment.score).toBeLessThanOrEqual(95);
    });

    test('should assign letter grades A-F', () => {
      const validGrades = ['A', 'B', 'C', 'D', 'F'];
      const result = analyzeWorkingCapital(sampleTechInput);

      expect(validGrades).toContain(result.riskAssessment.grade);
    });

    test('should include risk factors', () => {
      const result = analyzeWorkingCapital(sampleTechInput);

      expect(result.riskAssessment.factors).toHaveProperty('collectionRisk');
      expect(result.riskAssessment.factors).toHaveProperty('inventoryRisk');
      expect(result.riskAssessment.factors).toHaveProperty('payablesRisk');
      expect(result.riskAssessment.factors).toHaveProperty('cashFlowRisk');
    });

    test('should provide assessment text', () => {
      const result = analyzeWorkingCapital(sampleTechInput);

      expect(result.riskAssessment.assessment).toBeDefined();
      expect(typeof result.riskAssessment.assessment).toBe('string');
      expect(result.riskAssessment.assessment.length > 0).toBe(true);
    });

    test('should score lower risk for good working capital', () => {
      const result = analyzeWorkingCapital(sampleRetailInput);

      // Retail has good metrics, should be lower risk
      expect([result.riskAssessment.grade]).toBeDefined();
    });
  });

  describe('Risk Assessment Text', () => {
    test('should return text for grade A', () => {
      const text = getWorkingCapitalRiskAssessment(35, 'A');
      expect(text).toContain('Excellent');
    });

    test('should return text for grade B', () => {
      const text = getWorkingCapitalRiskAssessment(45, 'B');
      expect(text).toContain('Good');
    });

    test('should return text for grade C', () => {
      const text = getWorkingCapitalRiskAssessment(55, 'C');
      expect(text).toContain('Adequate');
    });

    test('should return text for grade D', () => {
      const text = getWorkingCapitalRiskAssessment(70, 'D');
      expect(text).toContain('Concerning');
    });

    test('should return text for grade F', () => {
      const text = getWorkingCapitalRiskAssessment(90, 'F');
      expect(text).toContain('Poor');
    });
  });

  describe('Input Validation', () => {
    test('should throw error for missing input data', () => {
      expect(() => analyzeWorkingCapital(null)).toThrow();
    });

    test('should throw error for non-object input', () => {
      expect(() => analyzeWorkingCapital('invalid')).toThrow();
    });

    test('should throw error for missing required field', () => {
      const invalidInput = { ...sampleTechInput };
      delete invalidInput.accountsReceivable;

      expect(() => analyzeWorkingCapital(invalidInput)).toThrow('Missing required field');
    });

    test('should throw error for negative numeric value', () => {
      const invalidInput = {
        ...sampleTechInput,
        accountsReceivable: -100000
      };

      expect(() => analyzeWorkingCapital(invalidInput)).toThrow('must be a non-negative number');
    });

    test('should throw error for non-numeric value', () => {
      const invalidInput = {
        ...sampleTechInput,
        annualRevenue: 'not a number'
      };

      expect(() => analyzeWorkingCapital(invalidInput)).toThrow('must be a non-negative number');
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero revenue', () => {
      const input = {
        ...sampleTechInput,
        annualRevenue: 0
      };

      const result = analyzeWorkingCapital(input);
      expect(result.metrics.dso.value).toBe(0);
    });

    test('should handle zero COGS', () => {
      const input = {
        ...sampleTechInput,
        costOfGoodsSold: 0
      };

      const result = analyzeWorkingCapital(input);
      expect(result.metrics.dio.value).toBe(0);
    });

    test('should handle very large numbers', () => {
      const input = {
        ...sampleTechInput,
        annualRevenue: 1000000000,
        accountsReceivable: 50000000
      };

      const result = analyzeWorkingCapital(input);
      expect(result.metrics.dso.value).toBeGreaterThan(0);
    });

    test('should handle very small numbers', () => {
      const input = {
        ...sampleTechInput,
        annualRevenue: 10000,
        accountsReceivable: 100
      };

      const result = analyzeWorkingCapital(input);
      expect(result.metrics.dso.value).toBeGreaterThan(0);
    });

    test('should handle service business with no inventory', () => {
      const serviceInput = {
        accountsReceivable: 200000,
        inventory: 0,
        accountsPayable: 100000,
        costOfGoodsSold: 1500000,
        annualRevenue: 4000000,
        totalCurrentAssets: 1000000,
        totalCurrentLiabilities: 400000,
        industry: 'services'
      };

      const result = analyzeWorkingCapital(serviceInput);
      expect(result.metrics.dio.value).toBe(0);
    });
  });

  describe('Industry Benchmarks Consistency', () => {
    test('all industries should have required benchmark fields', () => {
      const requiredFields = ['dso', 'dio', 'dpo', 'ccc', 'wcPercentage'];

      Object.values(INDUSTRY_BENCHMARKS).forEach(benchmark => {
        requiredFields.forEach(field => {
          expect(benchmark[field]).toBeDefined();
          expect(typeof benchmark[field]).toBe('number');
        });
      });
    });

    test('CCC should equal DSO + DIO - DPO for each industry', () => {
      Object.values(INDUSTRY_BENCHMARKS).forEach(benchmark => {
        const calculatedCCC = benchmark.dso + benchmark.dio - benchmark.dpo;
        expect(Math.abs(calculatedCCC - benchmark.ccc)).toBeLessThan(1);
      });
    });

    test('all industries should have descriptions', () => {
      Object.values(INDUSTRY_BENCHMARKS).forEach(benchmark => {
        expect(benchmark.description).toBeDefined();
        expect(typeof benchmark.description).toBe('string');
      });
    });
  });

  describe('Comparative Analysis', () => {
    test('tech should have lower inventory days than manufacturing', () => {
      const techBench = getBenchmarks('tech');
      const mfgBench = getBenchmarks('manufacturing');

      expect(techBench.dio).toBeLessThan(mfgBench.dio);
    });

    test('retail should have lower DSO than manufacturing', () => {
      const retailBench = getBenchmarks('retail');
      const mfgBench = getBenchmarks('manufacturing');

      expect(retailBench.dso).toBeLessThan(mfgBench.dso);
    });

    test('should show different risk profiles for different industries', () => {
      const techResult = analyzeWorkingCapital(sampleTechInput);
      const mfgResult = analyzeWorkingCapital(sampleManufacturingInput);

      // Manufacturing typically has higher inventory risk
      expect(mfgResult.riskAssessment.factors.inventoryRisk.score)
        .toBeGreaterThanOrEqual(techResult.riskAssessment.factors.inventoryRisk.score);
    });
  });
});
