/**
 * PDF Report Generation Service
 * Generates professional PDF reports from valuation data
 */

const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

// Cache for compiled templates
const templates = {};

/**
 * Load and compile a template
 * @param {string} templateName - Name of template (lite, standard, premium)
 * @returns {Function} Compiled template function
 */
function getTemplate(templateName) {
  if (templates[templateName]) {
    return templates[templateName];
  }

  const templatePath = path.join(
    __dirname,
    '../templates',
    `${templateName}-report.html`
  );

  const templateContent = fs.readFileSync(templatePath, 'utf-8');
  const compiled = handlebars.compile(templateContent);

  templates[templateName] = compiled;
  return compiled;
}

/**
 * Render HTML from template with data
 * @param {string} templateName - Template name (lite, standard, premium)
 * @param {Object} data - Data to fill into template
 * @returns {string} Rendered HTML
 */
function renderHTML(templateName, data) {
  const template = getTemplate(templateName);
  return template(data);
}

/**
 * Generate PDF from HTML
 * @param {string} html - HTML content
 * @param {Object} options - PDF options
 * @returns {Promise<Buffer>} PDF as buffer
 */
async function htmlToPDF(html, options = {}) {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    const page = await browser.newPage();

    // Set viewport for consistent rendering
    await page.setViewport({ width: 1200, height: 1600 });

    // Set content
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      printBackground: true,
      ...options
    });

    return pdf;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Format currency for display in report
 * @param {number} value - Number to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Format percentage for display
 * @param {number} value - Decimal percentage (e.g., 0.25 for 25%)
 * @returns {string} Formatted percentage
 */
function formatPercentage(value) {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Get risk assessment text based on grade
 */
function getRiskAssessmentText(grade) {
  const assessments = {
    A: 'Very Low Risk - Excellent financial health and strong fundamentals',
    B: 'Low Risk - Good financial position with minor concerns',
    C: 'Moderate Risk - Average financial health with some areas needing attention',
    D: 'High Risk - Significant concerns that should be addressed',
    E: 'Very High Risk - Multiple critical issues requiring immediate action',
    F: 'Extreme Risk - Severe financial distress'
  };
  return assessments[grade] || 'Unknown Risk';
}

/**
 * Main function: Generate complete PDF report
 * @param {Object} valuation - Valuation data from database
 * @param {string} templateName - Template name (lite, standard, premium)
 * @param {Object} options - Additional options (branding, etc)
 * @returns {Promise<Buffer>} PDF as buffer
 */
async function generateReport(valuation, templateName = 'standard', options = {}) {
  // Validate template
  const validTemplates = ['lite', 'standard', 'premium'];
  if (!validTemplates.includes(templateName)) {
    throw new Error(`Invalid template: ${templateName}`);
  }

  // Prepare data for template
  const reportData = {
    // Company Info
    companyName: valuation.companyName || valuation.company_name,
    industry: valuation.industry,
    calculationDate: new Date(valuation.calculationDate || valuation.calculation_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),

    // Valuation
    recommendedValuation: formatCurrency(valuation.recommendedValuation || valuation.recommended_valuation),
    recommendedValuationRaw: valuation.recommendedValuation || valuation.recommended_valuation,

    // Valuation Methods
    valuationMethods: {
      ebitda: {
        ...(valuation.valuationMethods?.ebitda || valuation.ebitda_valuation),
        valueFormatted: formatCurrency(valuation.valuationMethods?.ebitda?.value || valuation.ebitda_value),
        baseMetricFormatted: formatCurrency(valuation.valuationMethods?.ebitda?.baseMetric || valuation.ebitda)
      },
      revenue: {
        ...(valuation.valuationMethods?.revenue || valuation.revenue_valuation),
        valueFormatted: formatCurrency(valuation.valuationMethods?.revenue?.value || valuation.revenue_value),
        baseMetricFormatted: formatCurrency(valuation.valuationMethods?.revenue?.baseMetric || valuation.annualRevenue)
      },
      dcf: {
        ...(valuation.valuationMethods?.dcf || valuation.dcf_valuation),
        valueFormatted: formatCurrency(valuation.valuationMethods?.dcf?.value || valuation.dcf_value)
      }
    },

    // Valuation Range
    valuationRange: {
      low: formatCurrency(valuation.valuationRange?.low || valuation.valuation_low),
      high: formatCurrency(valuation.valuationRange?.high || valuation.valuation_high)
    },

    // Risk Analysis
    riskScore: valuation.riskAnalysis?.overallScore || (valuation.risk_analysis && JSON.parse(valuation.risk_analysis).overallScore) || 50,
    riskGrade: valuation.riskAnalysis?.grade || (valuation.risk_analysis && JSON.parse(valuation.risk_analysis).grade) || 'C',
    riskAssessment: getRiskAssessmentText(valuation.riskAnalysis?.grade || (valuation.risk_analysis && JSON.parse(valuation.risk_analysis).grade) || 'C'),

    // Drivers
    drivers: (valuation.drivers || valuation.value_drivers || []).map(driver => ({
      ...driver,
      impactFormatted: formatCurrency(driver.impact)
    })),

    // Gaps
    gaps: (valuation.gaps || valuation.performance_gaps || []).map(gap => ({
      ...gap,
      impactFormatted: formatCurrency(Math.abs(gap.impact))
    })),

    // Suggestions
    suggestions: (valuation.suggestions || valuation.improvement_suggestions || []).map(sugg => ({
      ...sugg,
      impactFormatted: sugg.impact > 0 ? formatCurrency(sugg.impact) : 'N/A'
    })),

    // Branding
    ...options.customBranding || {},

    // Template-specific data
    isLite: templateName === 'lite',
    isStandard: templateName === 'standard',
    isPremium: templateName === 'premium'
  };

  // Render HTML
  const html = renderHTML(templateName, reportData);

  // Convert to PDF
  const pdf = await htmlToPDF(html);

  return pdf;
}

module.exports = {
  generateReport,
  renderHTML,
  htmlToPDF,
  formatCurrency,
  formatPercentage,
  getTemplate
};
