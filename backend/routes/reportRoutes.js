/**
 * Report Export Routes
 * Handles PDF report generation and download
 */

const express = require('express');
const router = express.Router();
const pdfGenerator = require('../services/pdfGenerator');
const { requireAuth } = require('../middleware/authMiddleware');
const db = require('../db');

/**
 * POST /api/valuations/:id/export-pdf
 * Export valuation as PDF
 *
 * Request body:
 * {
 *   "template": "lite|standard|premium" (default: standard)
 * }
 *
 * Response: PDF file as binary data
 */
router.post('/:id/export-pdf', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { template = 'standard' } = req.body;
    const userId = req.user.userId;

    // Validate template
    const validTemplates = ['lite', 'standard', 'premium'];
    if (!validTemplates.includes(template)) {
      return res.status(400).json({
        error: 'Invalid template. Must be lite, standard, or premium'
      });
    }

    // Get valuation from database
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

    // Parse JSON fields if they're stored as strings
    let valuationData = { ...valuation };

    // Handle both object and JSON string formats
    if (typeof valuation.valuation_methods === 'string') {
      valuationData.valuationMethods = JSON.parse(valuation.valuation_methods);
    } else if (valuation.valuationMethods) {
      valuationData.valuationMethods = valuation.valuationMethods;
    }

    if (typeof valuation.valuation_range === 'string') {
      valuationData.valuationRange = JSON.parse(valuation.valuation_range);
    } else if (valuation.valuationRange) {
      valuationData.valuationRange = valuation.valuationRange;
    }

    if (typeof valuation.drivers === 'string') {
      valuationData.drivers = JSON.parse(valuation.drivers);
    } else if (!valuation.drivers) {
      valuationData.drivers = [];
    }

    if (typeof valuation.gaps === 'string') {
      valuationData.gaps = JSON.parse(valuation.gaps);
    } else if (!valuation.gaps) {
      valuationData.gaps = [];
    }

    if (typeof valuation.suggestions === 'string') {
      valuationData.suggestions = JSON.parse(valuation.suggestions);
    } else if (!valuation.suggestions) {
      valuationData.suggestions = [];
    }

    if (typeof valuation.risk_analysis === 'string') {
      valuationData.riskAnalysis = JSON.parse(valuation.risk_analysis);
    } else if (valuation.riskAnalysis) {
      valuationData.riskAnalysis = valuation.riskAnalysis;
    } else {
      valuationData.riskAnalysis = { overallScore: 50, grade: 'C' };
    }

    // Normalize field names (database might use snake_case)
    valuationData.companyName = valuation.company_name || valuation.companyName;
    valuationData.calculationDate = valuation.calculation_date || valuation.calculationDate;
    valuationData.recommendedValuation = valuation.recommended_valuation || valuation.recommendedValuation;

    console.log(`[PDF] Generating ${template} report for valuation ${id}`);

    // Generate PDF
    const pdf = await pdfGenerator.generateReport(valuationData, template);

    // Send file
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `valuation-${valuationData.companyName.replace(/\s+/g, '-').toLowerCase()}-${template}-${timestamp}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdf.length);
    res.send(pdf);

    console.log(`[PDF] Successfully generated ${filename}`);

  } catch (error) {
    console.error('[PDF] Export error:', error);
    res.status(500).json({
      error: 'Failed to generate PDF',
      message: error.message
    });
  }
});

/**
 * GET /api/valuations/:id/report/info
 * Get report generation info (optional - for checking if report can be generated)
 */
router.get('/:id/report/info', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const valuation = await db.get(
      `SELECT id, company_name, industry, calculation_date, recommended_valuation
       FROM valuations
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (!valuation) {
      return res.status(404).json({ error: 'Valuation not found' });
    }

    res.json({
      id: valuation.id,
      companyName: valuation.company_name,
      industry: valuation.industry,
      calculationDate: valuation.calculation_date,
      valuation: valuation.recommended_valuation,
      availableTemplates: ['lite', 'standard', 'premium']
    });

  } catch (error) {
    console.error('[Report] Info error:', error);
    res.status(500).json({
      error: 'Failed to get report info',
      message: error.message
    });
  }
});

module.exports = router;
