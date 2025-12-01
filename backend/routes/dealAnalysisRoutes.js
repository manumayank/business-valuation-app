/**
 * Deal Analysis Routes
 * M&A deal evaluation and financial analysis endpoints
 */

const express = require('express');
const router = express.Router();
const { analyzeDeal, generateDealScenarios } = require('../services/dealAnalysisEngine');
const { requireAuth } = require('../middleware/authMiddleware');
const db = require('../db');

/**
 * POST /api/valuations/:id/deal/analyze
 * Analyze a potential deal
 */
router.post('/:id/deal/analyze', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Verify user owns this valuation
    const valuation = await db.get(
      `SELECT * FROM valuations WHERE id = ? AND user_id = ?`,
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
      'offeredPrice',
      'targetEBITDA',
      'targetProfit',
      'targetRevenue',
      'industry'
    ];

    for (const field of requiredFields) {
      if (inputData[field] === undefined || inputData[field] === null) {
        return res.status(400).json({
          error: `Missing required field: ${field}`
        });
      }
    }

    console.log(`[Deal Analysis] Analyzing deal for valuation ${id}`);

    // Analyze the deal
    const analysis = analyzeDeal({
      offeredPrice: parseFloat(inputData.offeredPrice),
      targetEBITDA: parseFloat(inputData.targetEBITDA),
      targetProfit: parseFloat(inputData.targetProfit),
      targetRevenue: parseFloat(inputData.targetRevenue),
      targetDebt: inputData.targetDebt ? parseFloat(inputData.targetDebt) : 0,
      industry: inputData.industry,
      integrationComplexity: inputData.integrationComplexity || 5,
      culturalFitRating: inputData.culturalFitRating || 5,
      customerConcentration: inputData.customerConcentration || 0.3,
      integrationTimelineMonths: inputData.integrationTimelineMonths || 12,
      revenueSynergies: inputData.revenueSynergies || {},
      costSynergies: inputData.costSynergies || {}
    });

    // Save analysis to database
    await db.run(
      `INSERT OR REPLACE INTO deal_analysis
       (valuation_id, deal_data, analysis_data, created_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [id, JSON.stringify(inputData), JSON.stringify(analysis)]
    );

    console.log(`[Deal Analysis] Analysis complete for valuation ${id}`);

    res.json(analysis);

  } catch (error) {
    console.error('[Deal Analysis] Error:', error);
    res.status(500).json({
      error: 'Failed to analyze deal',
      message: error.message
    });
  }
});

/**
 * POST /api/valuations/:id/deal/scenarios
 * Generate multiple deal scenarios (best/base/worst case)
 */
router.post('/:id/deal/scenarios', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Verify user owns this valuation
    const valuation = await db.get(
      `SELECT * FROM valuations WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (!valuation) {
      return res.status(404).json({
        error: 'Valuation not found or you do not have access to it'
      });
    }

    const inputData = req.body;

    console.log(`[Deal Analysis] Generating scenarios for valuation ${id}`);

    // Generate scenarios
    const scenarios = generateDealScenarios(null, {
      offeredPrice: parseFloat(inputData.offeredPrice),
      targetEBITDA: parseFloat(inputData.targetEBITDA),
      targetProfit: parseFloat(inputData.targetProfit),
      targetRevenue: parseFloat(inputData.targetRevenue),
      targetDebt: inputData.targetDebt ? parseFloat(inputData.targetDebt) : 0,
      industry: inputData.industry,
      integrationComplexity: inputData.integrationComplexity || 5,
      culturalFitRating: inputData.culturalFitRating || 5,
      customerConcentration: inputData.customerConcentration || 0.3,
      integrationTimelineMonths: inputData.integrationTimelineMonths || 12,
      revenueSynergies: inputData.revenueSynergies || {},
      costSynergies: inputData.costSynergies || {}
    });

    console.log(`[Deal Analysis] Scenarios generated for valuation ${id}`);

    res.json({
      scenarios
    });

  } catch (error) {
    console.error('[Deal Analysis] Scenarios error:', error);
    res.status(500).json({
      error: 'Failed to generate scenarios',
      message: error.message
    });
  }
});

/**
 * GET /api/valuations/:id/deal/analysis
 * Retrieve existing deal analysis
 */
router.get('/:id/deal/analysis', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Verify user owns this valuation
    const valuation = await db.get(
      `SELECT * FROM valuations WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (!valuation) {
      return res.status(404).json({
        error: 'Valuation not found or you do not have access to it'
      });
    }

    // Get deal analysis if it exists
    const dealAnalysis = await db.get(
      `SELECT analysis_data, created_at FROM deal_analysis WHERE valuation_id = ?`,
      [id]
    );

    if (!dealAnalysis) {
      return res.status(404).json({
        error: 'No deal analysis found for this valuation'
      });
    }

    const analysis = JSON.parse(dealAnalysis.analysis_data);
    res.json({
      analysis,
      retrievedAt: dealAnalysis.created_at
    });

  } catch (error) {
    console.error('[Deal Analysis] Retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve deal analysis',
      message: error.message
    });
  }
});

/**
 * POST /api/valuations/:id/deal/compare
 * Compare multiple deal scenarios
 */
router.post('/:id/deal/compare', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Verify user owns this valuation
    const valuation = await db.get(
      `SELECT * FROM valuations WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (!valuation) {
      return res.status(404).json({
        error: 'Valuation not found or you do not have access to it'
      });
    }

    const { deals } = req.body;

    if (!Array.isArray(deals) || deals.length === 0) {
      return res.status(400).json({
        error: 'deals must be a non-empty array'
      });
    }

    console.log(`[Deal Analysis] Comparing ${deals.length} deals for valuation ${id}`);

    // Analyze each deal
    const analyses = deals.map(deal => {
      try {
        return analyzeDeal({
          offeredPrice: parseFloat(deal.offeredPrice),
          targetEBITDA: parseFloat(deal.targetEBITDA),
          targetProfit: parseFloat(deal.targetProfit),
          targetRevenue: parseFloat(deal.targetRevenue),
          targetDebt: deal.targetDebt ? parseFloat(deal.targetDebt) : 0,
          industry: deal.industry,
          integrationComplexity: deal.integrationComplexity || 5,
          culturalFitRating: deal.culturalFitRating || 5,
          customerConcentration: deal.customerConcentration || 0.3,
          integrationTimelineMonths: deal.integrationTimelineMonths || 12,
          revenueSynergies: deal.revenueSynergies || {},
          costSynergies: deal.costSynergies || {}
        });
      } catch (err) {
        console.error('[Deal Analysis] Error analyzing deal:', err);
        return null;
      }
    }).filter(analysis => analysis !== null);

    if (analyses.length === 0) {
      return res.status(400).json({
        error: 'Failed to analyze any deals'
      });
    }

    // Create comparison summary
    const comparison = {
      numberOfDeals: analyses.length,
      summary: {
        bestByROI: analyses.reduce((best, current, idx) =>
          current.roiAnalysis.expectedROI > analyses[best].roiAnalysis.expectedROI ? idx : best, 0),
        bestByPrice: analyses.reduce((best, current, idx) =>
          current.dealMetrics.premium.percentage < analyses[best].dealMetrics.premium.percentage ? idx : best, 0),
        bestBySynergies: analyses.reduce((best, current, idx) =>
          current.synergies.totalSynergies > analyses[best].synergies.totalSynergies ? idx : best, 0),
        bestOverall: analyses.reduce((best, current, idx) =>
          current.dealScorecard.overallScore > analyses[best].dealScorecard.overallScore ? idx : best, 0)
      },
      analyses
    };

    console.log(`[Deal Analysis] Comparison complete for ${analyses.length} deals`);

    res.json(comparison);

  } catch (error) {
    console.error('[Deal Analysis] Comparison error:', error);
    res.status(500).json({
      error: 'Failed to compare deals',
      message: error.message
    });
  }
});

/**
 * POST /api/valuations/:id/deal/sensitivity
 * Perform sensitivity analysis
 */
router.post('/:id/deal/sensitivity', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Verify user owns this valuation
    const valuation = await db.get(
      `SELECT * FROM valuations WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (!valuation) {
      return res.status(404).json({
        error: 'Valuation not found or you do not have access to it'
      });
    }

    const { baseData, variable, ranges } = req.body;

    if (!variable || !ranges || !Array.isArray(ranges)) {
      return res.status(400).json({
        error: 'variable and ranges array are required'
      });
    }

    console.log(`[Deal Analysis] Sensitivity analysis for ${variable} on valuation ${id}`);

    // Perform sensitivity analysis on the specified variable
    const sensitivityResults = ranges.map(value => {
      const testData = { ...baseData };
      testData[variable] = value;

      try {
        return {
          [variable]: value,
          analysis: analyzeDeal(testData)
        };
      } catch (err) {
        return null;
      }
    }).filter(result => result !== null);

    if (sensitivityResults.length === 0) {
      return res.status(400).json({
        error: 'Failed to perform sensitivity analysis'
      });
    }

    // Extract key metrics for sensitivity
    const metrics = sensitivityResults.map(result => ({
      [variable]: result[variable],
      roi: result.analysis.roiAnalysis.expectedROIPercent,
      riskScore: result.analysis.riskAssessment.overallRiskScore,
      overallScore: result.analysis.dealScorecard.overallScore,
      recommendation: result.analysis.dealScorecard.recommendation
    }));

    console.log(`[Deal Analysis] Sensitivity analysis complete`);

    res.json({
      variable,
      results: metrics
    });

  } catch (error) {
    console.error('[Deal Analysis] Sensitivity error:', error);
    res.status(500).json({
      error: 'Failed to perform sensitivity analysis',
      message: error.message
    });
  }
});

module.exports = router;
