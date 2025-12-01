const express = require('express');
const router = express.Router();
const {
  calculateVAC,
  calculateRiskScore,
  calculateEBITDA,
  selectMultiple,
  calculateCurrentValue,
  calculateValueAcceleration,
  calculateProbabilityDistribution,
  calculateWealthGap,
  COMMON_MULTIPLES,
  RISK_CATEGORIES
} = require('../services/vacEngine');
const naicsService = require('../services/naicsService');

/**
 * POST /api/vac/calculate
 * Full VAC calculation - all 7 layers
 */
router.post('/calculate', (req, res) => {
  try {
    const result = calculateVAC(req.body);

    if (!result.isValid) {
      return res.status(400).json({
        success: false,
        error: result.error,
        partialResults: {
          riskScore: result.riskScore,
          ebitda: result.ebitda
        }
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('VAC calculation error:', error);
    res.status(500).json({
      success: false,
      error: 'Calculation failed: ' + error.message
    });
  }
});

/**
 * POST /api/vac/risk-score
 * Calculate risk score only
 */
router.post('/risk-score', (req, res) => {
  try {
    const result = calculateRiskScore(req.body);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/vac/ebitda
 * Calculate EBITDA only
 */
router.post('/ebitda', (req, res) => {
  try {
    const result = calculateEBITDA(req.body);

    if (!result.isValid) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/vac/valuation
 * Quick valuation (EBITDA + Multiple = Value)
 */
router.post('/valuation', (req, res) => {
  try {
    const { ebitda, multiple, multipleType, businessSize, customMultiple, industryMultiple } = req.body;

    // Get multiple
    const multipleResult = selectMultiple({
      multipleType: multipleType || 'common',
      businessSize: businessSize || 'medium',
      customMultiple,
      industryMultiple
    });

    if (!multipleResult.isValid) {
      return res.status(400).json({
        success: false,
        error: multipleResult.error
      });
    }

    // Calculate value
    const valueResult = calculateCurrentValue(ebitda, multipleResult.multipleUsed);

    if (!valueResult.isValid) {
      return res.status(400).json({
        success: false,
        error: valueResult.error
      });
    }

    res.json({
      success: true,
      data: {
        ebitda: valueResult.ebitda,
        multiple: valueResult.multiple,
        multipleSource: multipleResult.source,
        currentValue: valueResult.currentValue
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/vac/value-acceleration
 * Calculate value acceleration levers
 */
router.post('/value-acceleration', (req, res) => {
  try {
    const result = calculateValueAcceleration(req.body);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/vac/probability
 * Calculate probability distribution
 */
router.post('/probability', (req, res) => {
  try {
    const result = calculateProbabilityDistribution(req.body);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/vac/wealth-gap
 * Calculate wealth gap projection
 */
router.post('/wealth-gap', (req, res) => {
  try {
    const result = calculateWealthGap(req.body);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/vac/multiples
 * Get common multiples reference data
 */
router.get('/multiples', (req, res) => {
  res.json({
    success: true,
    data: COMMON_MULTIPLES
  });
});

/**
 * GET /api/vac/risk-categories
 * Get risk category definitions
 */
router.get('/risk-categories', (req, res) => {
  res.json({
    success: true,
    data: RISK_CATEGORIES
  });
});

/**
 * GET /api/vac/industries
 * Search industries by name or list all
 * Query params: q (search query), limit (max results)
 */
router.get('/industries', (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (q) {
      const results = naicsService.searchByTitle(q, parseInt(limit, 10));
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } else {
      const stats = naicsService.getStats();
      res.json({
        success: true,
        data: {
          message: 'Use ?q=search_term to search industries',
          stats
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/vac/industries/:code
 * Get industry by NAICS code with its multiple
 */
router.get('/industries/:code', (req, res) => {
  try {
    const { code } = req.params;
    const industry = naicsService.getByCode(code);

    if (!industry) {
      return res.status(404).json({
        success: false,
        error: `Industry not found for NAICS code: ${code}`
      });
    }

    const multiple = naicsService.getMultipleForCode(code);

    res.json({
      success: true,
      data: {
        ...industry,
        multiple
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/vac/industry-multiples
 * Get all sector multiples
 */
router.get('/industry-multiples', (req, res) => {
  try {
    const multiples = naicsService.getSectorMultiples();
    res.json({
      success: true,
      data: multiples
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/vac/sectors/:sector
 * Get all industries in a sector
 */
router.get('/sectors/:sector', (req, res) => {
  try {
    const { sector } = req.params;
    const industries = naicsService.getBySector(sector);
    const multiple = naicsService.getMultipleForCode(sector + '0000');

    res.json({
      success: true,
      data: {
        sector,
        sectorName: multiple.name,
        multiple,
        industries,
        count: industries.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
