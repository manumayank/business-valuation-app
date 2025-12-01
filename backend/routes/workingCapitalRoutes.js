/**
 * Working Capital Routes
 * Handles working capital analysis, optimization, and recommendations
 */

const express = require('express');
const router = express.Router();
const { analyzeWorkingCapital, INDUSTRY_BENCHMARKS } = require('../services/workingCapitalEngine');
const { requireAuth } = require('../middleware/authMiddleware');
const db = require('../db');

/**
 * POST /api/valuations/:id/working-capital/calculate
 * Calculate working capital metrics and analysis
 *
 * Request body:
 * {
 *   "accountsReceivable": number,
 *   "inventory": number,
 *   "accountsPayable": number,
 *   "costOfGoodsSold": number,
 *   "annualRevenue": number,
 *   "totalCurrentAssets": number,
 *   "totalCurrentLiabilities": number,
 *   "industry": string
 * }
 *
 * Response: Complete working capital analysis with metrics, recommendations, and risk assessment
 */
router.post('/:id/working-capital/calculate', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Verify user owns this valuation
    const valuation = await db.get(
      `SELECT * FROM valuations
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (!valuation) {
      return res.status(404).json({
        error: 'Valuation not found or you do not have access to it'
      });
    }

    const inputData = req.body;

    // Validate required fields
    const requiredFields = [
      'accountsReceivable',
      'inventory',
      'accountsPayable',
      'costOfGoodsSold',
      'annualRevenue',
      'totalCurrentAssets',
      'totalCurrentLiabilities',
      'industry'
    ];

    for (const field of requiredFields) {
      if (inputData[field] === undefined || inputData[field] === null) {
        return res.status(400).json({
          error: `Missing required field: ${field}`
        });
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
      const value = parseFloat(inputData[field]);
      if (isNaN(value) || value < 0) {
        return res.status(400).json({
          error: `${field} must be a non-negative number`
        });
      }
    }

    console.log(`[Working Capital] Calculating analysis for valuation ${id}`);

    // Analyze working capital
    const analysis = analyzeWorkingCapital({
      accountsReceivable: parseFloat(inputData.accountsReceivable),
      inventory: parseFloat(inputData.inventory),
      accountsPayable: parseFloat(inputData.accountsPayable),
      costOfGoodsSold: parseFloat(inputData.costOfGoodsSold),
      annualRevenue: parseFloat(inputData.annualRevenue),
      totalCurrentAssets: parseFloat(inputData.totalCurrentAssets),
      totalCurrentLiabilities: parseFloat(inputData.totalCurrentLiabilities),
      industry: inputData.industry
    });

    // Save analysis to database (optional - for tracking)
    await db.run(
      `INSERT OR REPLACE INTO working_capital_analysis
       (valuation_id, analysis_data, created_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)`,
      [id, JSON.stringify(analysis)]
    );

    console.log(`[Working Capital] Analysis complete for valuation ${id}`);

    res.json(analysis);

  } catch (error) {
    console.error('[Working Capital] Calculate error:', error);
    res.status(500).json({
      error: 'Failed to calculate working capital analysis',
      message: error.message
    });
  }
});

/**
 * POST /api/valuations/:id/working-capital/optimize
 * Get optimization scenarios showing impact of improving metrics
 *
 * Request body:
 * {
 *   "dsoTarget": number (optional - days to target for DSO),
 *   "dioTarget": number (optional - days to target for DIO),
 *   "dpoTarget": number (optional - days to target for DPO),
 *   ... (other working capital input data)
 * }
 *
 * Response: Optimization scenarios with financial impact
 */
router.post('/:id/working-capital/optimize', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Verify user owns this valuation
    const valuation = await db.get(
      `SELECT * FROM valuations
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (!valuation) {
      return res.status(404).json({
        error: 'Valuation not found or you do not have access to it'
      });
    }

    const {
      accountsReceivable,
      inventory,
      accountsPayable,
      costOfGoodsSold,
      annualRevenue,
      totalCurrentAssets,
      totalCurrentLiabilities,
      industry,
      dsoTarget,
      dioTarget,
      dpoTarget
    } = req.body;

    // Validate required fields
    const baseInputData = {
      accountsReceivable: parseFloat(accountsReceivable),
      inventory: parseFloat(inventory),
      accountsPayable: parseFloat(accountsPayable),
      costOfGoodsSold: parseFloat(costOfGoodsSold),
      annualRevenue: parseFloat(annualRevenue),
      totalCurrentAssets: parseFloat(totalCurrentAssets),
      totalCurrentLiabilities: parseFloat(totalCurrentLiabilities),
      industry: industry
    };

    // Base case analysis
    const baseAnalysis = analyzeWorkingCapital(baseInputData);
    const benchmarks = baseAnalysis.benchmarks;

    console.log(`[Working Capital] Generating optimization scenarios for valuation ${id}`);

    // Generate three scenarios: Conservative, Moderate, Aggressive
    const scenarios = {
      conservative: generateScenario(
        baseInputData,
        benchmarks,
        0.5, // 50% of the gap to benchmark
        'Conservative - Achieve 50% of benchmark improvement'
      ),
      moderate: generateScenario(
        baseInputData,
        benchmarks,
        1.0, // 100% of the gap to benchmark
        'Moderate - Achieve full benchmark performance'
      ),
      aggressive: generateScenario(
        baseInputData,
        benchmarks,
        1.5, // 150% of the gap to benchmark (exceed benchmark)
        'Aggressive - Exceed industry benchmarks by 50%'
      )
    };

    console.log(`[Working Capital] Optimization scenarios generated for valuation ${id}`);

    res.json({
      baseAnalysis,
      scenarios,
      benchmarks
    });

  } catch (error) {
    console.error('[Working Capital] Optimize error:', error);
    res.status(500).json({
      error: 'Failed to generate optimization scenarios',
      message: error.message
    });
  }
});

/**
 * Helper function to generate optimization scenarios
 */
function generateScenario(baseData, benchmarks, improvementLevel, description) {
  const scenario = {
    description,
    improvementLevel,
    metrics: {},
    projectedImpact: {}
  };

  // Calculate target values based on improvement level
  const dsoGap = baseData.accountsReceivable / baseData.annualRevenue * 365 - benchmarks.dso;
  const dioGap = baseData.inventory / baseData.costOfGoodsSold * 365 - benchmarks.dio;
  const dpoGap = benchmarks.dpo - (baseData.accountsPayable / baseData.costOfGoodsSold * 365);

  // Target metrics
  scenario.metrics.dsoTarget = Math.max(
    Math.round((baseData.accountsReceivable / baseData.annualRevenue * 365 - dsoGap * improvementLevel) * 10) / 10,
    1
  );
  scenario.metrics.dioTarget = Math.max(
    Math.round((baseData.inventory / baseData.costOfGoodsSold * 365 - dioGap * improvementLevel) * 10) / 10,
    0
  );
  scenario.metrics.dpoTarget = Math.round((baseData.accountsPayable / baseData.costOfGoodsSold * 365 + dpoGap * improvementLevel) * 10) / 10;

  // Calculate cash impact
  const dsoCashImpact = Math.round(baseData.accountsReceivable * (baseData.accountsReceivable / baseData.annualRevenue * 365 - scenario.metrics.dsoTarget) / 365);
  const dioCashImpact = Math.round(baseData.inventory * (baseData.inventory / baseData.costOfGoodsSold * 365 - scenario.metrics.dioTarget) / 365);
  const dpoCashImpact = Math.round(baseData.accountsPayable * (scenario.metrics.dpoTarget - baseData.accountsPayable / baseData.costOfGoodsSold * 365) / 365);

  scenario.projectedImpact.dsoReleasedCash = Math.max(dsoCashImpact, 0);
  scenario.projectedImpact.dioReleasedCash = Math.max(dioCashImpact, 0);
  scenario.projectedImpact.dpoReleasedCash = Math.max(dpoCashImpact, 0);
  scenario.projectedImpact.totalReleasedCash =
    scenario.projectedImpact.dsoReleasedCash +
    scenario.projectedImpact.dioReleasedCash +
    scenario.projectedImpact.dpoReleasedCash;

  // Valuation impact (using 2.5x multiple on released cash)
  scenario.projectedImpact.estimatedValuationLift = Math.round(scenario.projectedImpact.totalReleasedCash * 2.5);

  return scenario;
}

/**
 * POST /api/valuations/:id/working-capital/recommendations
 * Get actionable recommendations based on current metrics
 *
 * Request body: Same as calculate endpoint
 * Response: Prioritized list of recommendations with implementation details
 */
router.post('/:id/working-capital/recommendations', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Verify user owns this valuation
    const valuation = await db.get(
      `SELECT * FROM valuations
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (!valuation) {
      return res.status(404).json({
        error: 'Valuation not found or you do not have access to it'
      });
    }

    const inputData = req.body;

    // Analyze working capital to get recommendations
    const analysis = analyzeWorkingCapital({
      accountsReceivable: parseFloat(inputData.accountsReceivable),
      inventory: parseFloat(inputData.inventory),
      accountsPayable: parseFloat(inputData.accountsPayable),
      costOfGoodsSold: parseFloat(inputData.costOfGoodsSold),
      annualRevenue: parseFloat(inputData.annualRevenue),
      totalCurrentAssets: parseFloat(inputData.totalCurrentAssets),
      totalCurrentLiabilities: parseFloat(inputData.totalCurrentLiabilities),
      industry: inputData.industry
    });

    // Sort recommendations by priority
    const priorityOrder = { high: 1, medium: 2, low: 3, info: 4 };
    const sortedRecommendations = analysis.recommendations.sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    console.log(`[Working Capital] Recommendations generated for valuation ${id} (${sortedRecommendations.length} items)`);

    res.json({
      recommendations: sortedRecommendations,
      summary: {
        critical: sortedRecommendations.filter(r => r.priority === 'high').length,
        medium: sortedRecommendations.filter(r => r.priority === 'medium').length,
        strengths: sortedRecommendations.filter(r => r.priority === 'info').length
      },
      metrics: analysis.metrics,
      riskAssessment: analysis.riskAssessment
    });

  } catch (error) {
    console.error('[Working Capital] Recommendations error:', error);
    res.status(500).json({
      error: 'Failed to generate recommendations',
      message: error.message
    });
  }
});

/**
 * GET /api/valuations/:id/working-capital/benchmarks
 * Get industry benchmarks for context
 *
 * Query parameters:
 * - industry: (optional) specific industry code
 *
 * Response: All available benchmarks or specific industry benchmarks
 */
router.get('/:id/working-capital/benchmarks', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { industry } = req.query;
    const userId = req.user.userId;

    // Verify user owns this valuation
    const valuation = await db.get(
      `SELECT * FROM valuations
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (!valuation) {
      return res.status(404).json({
        error: 'Valuation not found or you do not have access to it'
      });
    }

    console.log(`[Working Capital] Retrieving benchmarks for valuation ${id}`);

    if (industry && INDUSTRY_BENCHMARKS[industry.toLowerCase()]) {
      // Return specific industry benchmarks
      const benchmarkData = INDUSTRY_BENCHMARKS[industry.toLowerCase()];
      res.json({
        industry,
        benchmarks: benchmarkData,
        description: benchmarkData.description
      });
    } else {
      // Return all available benchmarks
      res.json({
        allBenchmarks: INDUSTRY_BENCHMARKS,
        availableIndustries: Object.keys(INDUSTRY_BENCHMARKS)
      });
    }

  } catch (error) {
    console.error('[Working Capital] Benchmarks error:', error);
    res.status(500).json({
      error: 'Failed to retrieve benchmarks',
      message: error.message
    });
  }
});

module.exports = router;
