/**
 * Deal Analysis Engine Tests
 * Comprehensive test suite for deal analysis calculations
 */

const {
  analyzeDeal,
  generateDealScenarios,
  calculatePriceAssessment,
  calculateMultipleAnalysis,
  calculateROI,
  calculateSynergies,
  assessDealRisks,
  calculateDealScorecard,
  generateNegotiationGuidance
} = require('./dealAnalysisEngine');

describe('Deal Analysis Engine', () => {
  // Sample data for testing
  const sampleInputData = {
    offeredPrice: 10000000,
    targetEBITDA: 1200000,
    targetProfit: 800000,
    targetRevenue: 8000000,
    targetDebt: 1000000,
    industry: 'tech',
    integrationComplexity: 6,
    culturalFitRating: 7,
    customerConcentration: 0.25,
    integrationTimelineMonths: 12,
    revenueSynergies: {
      crossSelling: 300000,
      marketExpansion: 500000,
      productExpansion: 0,
      other: 0,
      total: 800000
    },
    costSynergies: {
      operationalEfficiency: 200000,
      overheadReduction: 150000,
      rnd: 0,
      other: 0,
      total: 350000
    }
  };

  describe('analyzeDeal', () => {
    test('should analyze a complete deal', () => {
      const analysis = analyzeDeal(sampleInputData);

      expect(analysis).toHaveProperty('dealMetrics');
      expect(analysis).toHaveProperty('multipleAnalysis');
      expect(analysis).toHaveProperty('roiAnalysis');
      expect(analysis).toHaveProperty('synergies');
      expect(analysis).toHaveProperty('riskAssessment');
      expect(analysis).toHaveProperty('dealScorecard');
      expect(analysis).toHaveProperty('negotiationGuidance');
    });

    test('should throw error when required fields are missing', () => {
      const incompleteData = { offeredPrice: 10000000 };
      expect(() => analyzeDeal(incompleteData)).toThrow();
    });

    test('should handle different industries', () => {
      const techData = { ...sampleInputData, industry: 'tech' };
      const manufactData = { ...sampleInputData, industry: 'manufacturing' };

      const techAnalysis = analyzeDeal(techData);
      const manufactAnalysis = analyzeDeal(manufactData);

      expect(techAnalysis.dealMetrics.premium.percentage).not.toEqual(
        manufactAnalysis.dealMetrics.premium.percentage
      );
    });
  });

  describe('Price Assessment', () => {
    test('should identify underpriced deals', () => {
      const assessment = calculatePriceAssessment(8000000, 8500000, 10000000);
      expect(assessment.assessment).toBe('underpriced');
      expect(assessment.premium.percentage).toBeLessThan(0);
    });

    test('should identify fairly priced deals', () => {
      const assessment = calculatePriceAssessment(9000000, 8500000, 10000000);
      expect(assessment.assessment).toBe('fair');
      expect(assessment.withinFairRange).toBe(true);
    });

    test('should identify overpriced deals', () => {
      const assessment = calculatePriceAssessment(12000000, 8500000, 10000000);
      expect(assessment.assessment).toBe('overpriced');
      expect(assessment.premium.percentage).toBeGreaterThan(0);
    });

    test('should calculate premium correctly', () => {
      const assessment = calculatePriceAssessment(11000000, 8500000, 10000000);
      const expectedPremium = ((11000000 - 9250000) / 9250000) * 100;
      expect(assessment.premium.percentage).toBeCloseTo(expectedPremium, 0);
    });
  });

  describe('Multiple Analysis', () => {
    test('should calculate EV/EBITDA multiple', () => {
      const multiples = calculateMultipleAnalysis(10000000, 1200000, 800000, 8000000, 'tech');
      expect(multiples.ev_ebitda.offered).toBeCloseTo(10000000 / 1200000, 1);
      expect(multiples.ev_ebitda).toHaveProperty('industry');
      expect(multiples.ev_ebitda).toHaveProperty('assessment');
    });

    test('should calculate P/E multiple', () => {
      const multiples = calculateMultipleAnalysis(10000000, 1200000, 800000, 8000000, 'tech');
      expect(multiples.price_earnings.offered).toBeCloseTo(10000000 / 800000, 1);
    });

    test('should calculate Price to Sales ratio', () => {
      const multiples = calculateMultipleAnalysis(10000000, 1200000, 800000, 8000000, 'tech');
      expect(multiples.price_sales.offered).toBeCloseTo(10000000 / 8000000, 0);
    });

    test('should assess multiples as expensive or reasonable', () => {
      const multiples = calculateMultipleAnalysis(10000000, 1200000, 800000, 8000000, 'tech');
      expect(['expensive', 'reasonable']).toContain(multiples.overallMultipleAssessment);
    });
  });

  describe('ROI Analysis', () => {
    test('should calculate positive ROI', () => {
      const roi = calculateROI(10000000, 1200000, 500000, 12);
      expect(roi.expectedROI).toBeGreaterThan(0);
      expect(roi.expectedROIPercent).toBeGreaterThan(0);
    });

    test('should calculate payback period', () => {
      const roi = calculateROI(10000000, 1200000, 500000, 12);
      expect(roi.paybackPeriod).toBeGreaterThan(0);
      expect(typeof roi.paybackPeriod).toBe('number');
    });

    test('should calculate NPV', () => {
      const roi = calculateROI(10000000, 1200000, 500000, 12);
      expect(roi.npv).toBeDefined();
      expect(typeof roi.npv).toBe('number');
    });

    test('should calculate IRR', () => {
      const roi = calculateROI(10000000, 1200000, 500000, 12);
      expect(roi.irr).toBeDefined();
      expect(roi.irr).toBeGreaterThanOrEqual(0);
    });

    test('should assess ROI quality', () => {
      const roi = calculateROI(10000000, 1200000, 500000, 12);
      expect(['excellent', 'good', 'acceptable', 'poor']).toContain(roi.roiAssessment);
    });

    test('should handle zero EBITDA gracefully', () => {
      const roi = calculateROI(10000000, 0, 500000, 12);
      expect(roi.expectedROI).toBeGreaterThanOrEqual(0);
      expect(roi.paybackPeriod).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Synergy Calculation', () => {
    test('should calculate total revenue synergies', () => {
      const synergies = calculateSynergies(
        { crossSelling: 300000, marketExpansion: 500000 },
        { operationalEfficiency: 200000 },
        1200000,
        10000000
      );
      expect(synergies.revenue.total).toBe(800000);
    });

    test('should calculate total cost synergies', () => {
      const synergies = calculateSynergies(
        { crossSelling: 300000 },
        { operationalEfficiency: 200000, overheadReduction: 150000 },
        1200000,
        10000000
      );
      expect(synergies.cost.total).toBe(350000);
    });

    test('should calculate total synergies', () => {
      const synergies = calculateSynergies(
        { crossSelling: 300000, marketExpansion: 500000 },
        { operationalEfficiency: 200000, overheadReduction: 150000 },
        1200000,
        10000000
      );
      expect(synergies.totalSynergies).toBeGreaterThan(0);
    });

    test('should calculate synergies as percentage of price', () => {
      const synergies = calculateSynergies(
        { crossSelling: 300000, marketExpansion: 500000 },
        { operationalEfficiency: 200000, overheadReduction: 150000 },
        1200000,
        10000000
      );
      expect(synergies.synergiesAsPercentOfPrice).toBeGreaterThan(0);
      expect(synergies.synergiesAsPercentOfPrice).toBeLessThan(100);
    });

    test('should handle missing synergy inputs', () => {
      const synergies = calculateSynergies(
        undefined,
        undefined,
        1200000,
        10000000
      );
      expect(synergies.revenue.total).toBe(0);
      expect(synergies.cost.total).toBe(0);
    });
  });

  describe('Risk Assessment', () => {
    test('should assess deal risks', () => {
      const risk = assessDealRisks(
        6, // integration complexity
        7, // cultural fit
        0.25, // customer concentration
        'tech'
      );
      expect(risk.overallRiskScore).toBeGreaterThan(0);
      expect(risk.overallRiskScore).toBeLessThan(100);
    });

    test('should assign risk grades', () => {
      const risk = assessDealRisks(3, 9, 0.1, 'tech');
      expect(['A', 'B', 'C', 'D', 'F']).toContain(risk.riskGrade);
    });

    test('should identify risk factors', () => {
      const risk = assessDealRisks(6, 7, 0.25, 'tech');
      expect(risk.factors).toHaveProperty('integrationComplexity');
      expect(risk.factors).toHaveProperty('culturalFit');
      expect(risk.factors).toHaveProperty('customerRetention');
    });

    test('should vary risk by industry', () => {
      const techRisk = assessDealRisks(5, 5, 0.25, 'tech');
      const healthcareRisk = assessDealRisks(5, 5, 0.25, 'healthcare');
      expect(techRisk.overallRiskScore).not.toEqual(healthcareRisk.overallRiskScore);
    });

    test('should provide risk assessment text', () => {
      const risk = assessDealRisks(6, 7, 0.25, 'tech');
      expect(typeof risk.assessment).toBe('string');
      expect(risk.assessment.length).toBeGreaterThan(0);
    });
  });

  describe('Deal Scorecard', () => {
    test('should calculate deal scorecard', () => {
      const analysis = analyzeDeal(sampleInputData);
      const scorecard = analysis.dealScorecard;

      expect(scorecard).toHaveProperty('pricingScore');
      expect(scorecard).toHaveProperty('roiScore');
      expect(scorecard).toHaveProperty('synergyScore');
      expect(scorecard).toHaveProperty('riskScore');
      expect(scorecard).toHaveProperty('overallScore');
    });

    test('should provide recommendations', () => {
      const analysis = analyzeDeal(sampleInputData);
      const scorecard = analysis.dealScorecard;

      expect(['strong_buy', 'buy', 'hold', 'pass']).toContain(scorecard.recommendation);
      expect(['Strong Buy', 'Buy', 'Hold', 'Pass']).toContain(scorecard.recommendationLevel);
    });

    test('should provide rationale', () => {
      const analysis = analyzeDeal(sampleInputData);
      const scorecard = analysis.dealScorecard;

      expect(typeof scorecard.rationale).toBe('string');
      expect(scorecard.rationale.length).toBeGreaterThan(0);
    });

    test('should score between 0 and 10', () => {
      const analysis = analyzeDeal(sampleInputData);
      const scorecard = analysis.dealScorecard;

      expect(scorecard.pricingScore).toBeGreaterThanOrEqual(0);
      expect(scorecard.pricingScore).toBeLessThanOrEqual(10);
      expect(scorecard.overallScore).toBeGreaterThanOrEqual(0);
      expect(scorecard.overallScore).toBeLessThanOrEqual(10);
    });
  });

  describe('Negotiation Guidance', () => {
    test('should provide fair value range', () => {
      const analysis = analyzeDeal(sampleInputData);
      const guidance = analysis.negotiationGuidance;

      expect(guidance.fairValueRange).toHaveProperty('low');
      expect(guidance.fairValueRange).toHaveProperty('high');
      expect(guidance.fairValueRange.low).toBeLessThan(guidance.fairValueRange.high);
    });

    test('should suggest a bidding strategy', () => {
      const analysis = analyzeDeal(sampleInputData);
      const guidance = analysis.negotiationGuidance;

      expect(guidance.suggestedBid).toBeDefined();
      expect(guidance.suggestedBid).toBeGreaterThan(0);
    });

    test('should provide walk-away price', () => {
      const analysis = analyzeDeal(sampleInputData);
      const guidance = analysis.negotiationGuidance;

      expect(guidance.walkAwayPrice).toBeDefined();
      expect(guidance.walkAwayPrice).toBeGreaterThan(guidance.suggestedBid);
    });

    test('should identify leverage points', () => {
      const analysis = analyzeDeal(sampleInputData);
      const guidance = analysis.negotiationGuidance;

      expect(Array.isArray(guidance.keyLeverPoints)).toBe(true);
      expect(guidance.keyLeverPoints.length).toBeGreaterThan(0);
    });

    test('should provide negotiation tips', () => {
      const analysis = analyzeDeal(sampleInputData);
      const guidance = analysis.negotiationGuidance;

      expect(Array.isArray(guidance.negotiationTips)).toBe(true);
      expect(guidance.negotiationTips.length).toBeGreaterThan(0);
    });
  });

  describe('Deal Scenarios', () => {
    test('should generate base, bullish, and bearish scenarios', () => {
      const scenarios = generateDealScenarios(null, sampleInputData);

      expect(scenarios).toHaveProperty('base');
      expect(scenarios).toHaveProperty('bullish');
      expect(scenarios).toHaveProperty('bearish');
    });

    test('should vary synergies across scenarios', () => {
      const baseAnalysis = analyzeDeal(sampleInputData);
      const scenarios = generateDealScenarios(baseAnalysis, sampleInputData);

      expect(scenarios.bullish.analysis.synergies.totalSynergies)
        .toBeGreaterThan(scenarios.base.analysis.synergies.totalSynergies);
      expect(scenarios.base.analysis.synergies.totalSynergies)
        .toBeGreaterThan(scenarios.bearish.analysis.synergies.totalSynergies);
    });

    test('should vary ROI across scenarios', () => {
      const baseAnalysis = analyzeDeal(sampleInputData);
      const scenarios = generateDealScenarios(baseAnalysis, sampleInputData);

      expect(scenarios.bullish.analysis.roiAnalysis.expectedROI)
        .toBeGreaterThan(scenarios.bearish.analysis.roiAnalysis.expectedROI);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very high prices', () => {
      const highPriceData = { ...sampleInputData, offeredPrice: 100000000 };
      const analysis = analyzeDeal(highPriceData);
      expect(analysis.dealMetrics.premium.percentage).toBeGreaterThan(0);
    });

    test('should handle very low prices', () => {
      const lowPriceData = { ...sampleInputData, offeredPrice: 1000000 };
      const analysis = analyzeDeal(lowPriceData);
      expect(analysis.dealMetrics.premium.percentage).toBeLessThan(0);
    });

    test('should handle zero synergies', () => {
      const noSynergyData = {
        ...sampleInputData,
        revenueSynergies: { total: 0 },
        costSynergies: { total: 0 }
      };
      const analysis = analyzeDeal(noSynergyData);
      expect(analysis.synergies.totalSynergies).toBeGreaterThanOrEqual(0);
    });

    test('should handle high debt targets', () => {
      const highDebtData = { ...sampleInputData, targetDebt: 5000000 };
      const analysis = analyzeDeal(highDebtData);
      expect(analysis.riskAssessment.overallRiskScore).toBeGreaterThan(50);
    });

    test('should handle low cultural fit', () => {
      const lowCultureData = { ...sampleInputData, culturalFitRating: 2 };
      const analysis = analyzeDeal(lowCultureData);
      expect(analysis.riskAssessment.riskGrade).not.toBe('A');
    });
  });

  describe('Data Consistency', () => {
    test('should have consistent analysis results', () => {
      const analysis1 = analyzeDeal(sampleInputData);
      const analysis2 = analyzeDeal(sampleInputData);

      expect(analysis1.dealMetrics.premium.percentage)
        .toEqual(analysis2.dealMetrics.premium.percentage);
      expect(analysis1.roiAnalysis.expectedROI)
        .toEqual(analysis2.roiAnalysis.expectedROI);
    });

    test('should have internally consistent calculations', () => {
      const analysis = analyzeDeal(sampleInputData);

      // Synergies should be positive or zero
      expect(analysis.synergies.totalSynergies).toBeGreaterThanOrEqual(0);

      // Risk scores should be within valid range
      expect(analysis.riskAssessment.overallRiskScore).toBeGreaterThanOrEqual(30);
      expect(analysis.riskAssessment.overallRiskScore).toBeLessThanOrEqual(95);

      // Overall score should be reasonable
      expect(analysis.dealScorecard.overallScore).toBeGreaterThanOrEqual(0);
      expect(analysis.dealScorecard.overallScore).toBeLessThanOrEqual(10);
    });
  });
});
