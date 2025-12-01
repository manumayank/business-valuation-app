# Week 2 - Day 1-2: PDF Report Generation Implementation

**Estimated Time**: 14 hours
**Objective**: Create professional PDF export functionality with 3 template tiers

---

## 🎯 Feature Overview

Users can export their valuation as a professional PDF in 3 formats:
- **Lite Report** (Free) - 3 pages, basic metrics
- **Standard Report** (Paid) - 5 pages, comprehensive analysis
- **Premium Report** (Enterprise) - 10-15 pages, executive summary + charts

---

## 📋 Implementation Checklist

### Phase 1: Setup & Dependencies (1 hour)
- [ ] Install npm packages
- [ ] Create service file structure
- [ ] Create template directory

### Phase 2: Create PDF Service (4 hours)
- [ ] Implement pdfGenerator.js service
- [ ] Create template engine setup
- [ ] Build HTML rendering function
- [ ] Implement PDF conversion with Puppeteer

### Phase 3: Create HTML Templates (4 hours)
- [ ] Create lite-report.html template
- [ ] Create standard-report.html template
- [ ] Create premium-report.html template
- [ ] Style templates for PDF display

### Phase 4: Build Backend API (3 hours)
- [ ] Create reportRoutes.js
- [ ] Implement POST /api/valuations/:id/export-pdf endpoint
- [ ] Add authentication middleware
- [ ] Implement error handling

### Phase 5: Frontend Integration (2 hours)
- [ ] Create ExportReport component
- [ ] Add button to Dashboard
- [ ] Implement download dialog
- [ ] Add loading states

---

## 🔧 Step-by-Step Implementation

### STEP 1: Install Dependencies

Run these commands:

```bash
cd backend
npm install puppeteer handlebars html-formatter sharp
```

**What these do:**
- `puppeteer` - Converts HTML to PDF using headless Chrome
- `handlebars` - Template engine for dynamic HTML generation
- `html-formatter` - Formats HTML for clean output
- `sharp` - Optimizes images in PDFs (future feature)

**Verify installation:**
```bash
npm list puppeteer handlebars
```

---

### STEP 2: Create Service File

Create: `backend/services/pdfGenerator.js`

```javascript
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
    companyName: valuation.companyName,
    industry: valuation.industry,
    calculationDate: new Date(valuation.calculationDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),

    // Valuation
    recommendedValuation: formatCurrency(valuation.recommendedValuation),
    recommendedValuationRaw: valuation.recommendedValuation,

    // Valuation Methods
    valuationMethods: {
      ebitda: {
        ...valuation.valuationMethods.ebitda,
        valueFormatted: formatCurrency(valuation.valuationMethods.ebitda.value),
        baseMetricFormatted: formatCurrency(valuation.valuationMethods.ebitda.baseMetric)
      },
      revenue: {
        ...valuation.valuationMethods.revenue,
        valueFormatted: formatCurrency(valuation.valuationMethods.revenue.value),
        baseMetricFormatted: formatCurrency(valuation.valuationMethods.revenue.baseMetric)
      },
      dcf: {
        ...valuation.valuationMethods.dcf,
        valueFormatted: formatCurrency(valuation.valuationMethods.dcf.value)
      }
    },

    // Valuation Range
    valuationRange: {
      low: formatCurrency(valuation.valuationRange.low),
      high: formatCurrency(valuation.valuationRange.high)
    },

    // Risk Analysis
    riskScore: valuation.riskAnalysis.overallScore,
    riskGrade: valuation.riskAnalysis.grade,
    riskAssessment: getRiskAssessmentText(valuation.riskAnalysis.grade),

    // Drivers
    drivers: valuation.drivers.map(driver => ({
      ...driver,
      impactFormatted: formatCurrency(driver.impact)
    })),

    // Gaps
    gaps: valuation.gaps.map(gap => ({
      ...gap,
      impactFormatted: formatCurrency(Math.abs(gap.impact))
    })),

    // Suggestions
    suggestions: valuation.suggestions.map(sugg => ({
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

module.exports = {
  generateReport,
  renderHTML,
  htmlToPDF,
  formatCurrency,
  formatPercentage,
  getTemplate
};
```

---

### STEP 3: Create Lite Report Template

Create: `backend/templates/lite-report.html`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Valuation Report - {{companyName}}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: white;
    }

    .page {
      page-break-after: always;
      padding: 40px;
    }

    .header {
      border-bottom: 3px solid #0066cc;
      margin-bottom: 30px;
      padding-bottom: 20px;
    }

    .header h1 {
      color: #0066cc;
      font-size: 32px;
      margin-bottom: 10px;
    }

    .header p {
      color: #666;
      font-size: 14px;
    }

    .valuation-box {
      background: linear-gradient(135deg, #0066cc 0%, #004999 100%);
      color: white;
      padding: 30px;
      border-radius: 8px;
      margin: 30px 0;
      text-align: center;
    }

    .valuation-box .amount {
      font-size: 48px;
      font-weight: bold;
      margin: 20px 0;
    }

    .valuation-box .label {
      font-size: 18px;
      opacity: 0.9;
    }

    .section {
      margin: 30px 0;
    }

    .section h2 {
      color: #0066cc;
      font-size: 24px;
      margin-bottom: 20px;
      border-left: 4px solid #0066cc;
      padding-left: 15px;
    }

    .metric-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 20px 0;
    }

    .metric-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #0066cc;
    }

    .metric-card .label {
      color: #666;
      font-size: 13px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .metric-card .value {
      color: #0066cc;
      font-size: 24px;
      font-weight: bold;
    }

    .driver-item {
      background: #f0f8ff;
      padding: 15px;
      margin: 10px 0;
      border-left: 4px solid #28a745;
      border-radius: 4px;
    }

    .driver-item .title {
      font-weight: bold;
      color: #28a745;
      margin-bottom: 5px;
    }

    .driver-item .description {
      font-size: 13px;
      color: #555;
      line-height: 1.5;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #999;
      text-align: center;
    }

    .page-break {
      page-break-before: always;
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .page {
        page-break-after: always;
        padding: 40px;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <!-- PAGE 1: COVER & VALUATION -->
  <div class="page">
    <div class="header">
      <h1>Business Valuation Report</h1>
      <p>{{companyName}} • {{industry}}</p>
      <p>Generated: {{calculationDate}}</p>
    </div>

    <div class="valuation-box">
      <div class="label">Estimated Business Value</div>
      <div class="amount">{{recommendedValuation}}</div>
      <div class="label">Based on comprehensive financial analysis</div>
    </div>

    <div class="section">
      <h2>Executive Summary</h2>
      <p>
        This report provides an independent valuation of {{companyName}}.
        The analysis is based on financial performance, industry benchmarks,
        and relevant market conditions as of {{calculationDate}}.
      </p>
      <p style="margin-top: 15px;">
        <strong>Risk Assessment:</strong>
        Grade {{riskGrade}} - {{riskAssessment}}
      </p>
    </div>

    <div class="metric-grid">
      <div class="metric-card">
        <div class="label">Risk Grade</div>
        <div class="value">{{riskGrade}}</div>
      </div>
      <div class="metric-card">
        <div class="label">Risk Score</div>
        <div class="value">{{riskScore}}/100</div>
      </div>
    </div>

    <div class="footer">
      <p>This valuation is an estimate based on provided data and current market conditions.</p>
      <p>It should not be considered as investment advice or a formal appraisal.</p>
    </div>
  </div>

  <!-- PAGE 2: VALUE DRIVERS -->
  <div class="page page-break">
    <div class="header">
      <h2>Value Drivers</h2>
    </div>

    <p style="margin-bottom: 20px; color: #666;">
      The following factors positively contribute to your business valuation:
    </p>

    {{#each drivers}}
      <div class="driver-item">
        <div class="title">✓ {{this.label}}</div>
        <div class="description">{{this.description}}</div>
        <div style="margin-top: 8px; font-size: 12px; color: #0066cc;">
          Impact: +{{this.impactFormatted}}
        </div>
      </div>
    {{/each}}

    {{#if (eq drivers.length 0)}}
      <p style="color: #999; font-style: italic;">No positive drivers identified. Focus on improvements below.</p>
    {{/if}}
  </div>

  <!-- PAGE 3: RECOMMENDATIONS -->
  <div class="page page-break">
    <div class="header">
      <h2>Improvement Recommendations</h2>
    </div>

    <p style="margin-bottom: 20px; color: #666;">
      The following improvements could increase your business valuation:
    </p>

    {{#each suggestions}}
      {{#if (ne this.key 'maintain_strengths')}}
        <div style="margin: 20px 0; padding: 15px; background: #fff3cd; border-left: 4px solid #ff9800; border-radius: 4px;">
          <div style="font-weight: bold; color: #856404; margin-bottom: 8px;">
            {{this.title}}
          </div>
          <div style="font-size: 14px; color: #555; line-height: 1.6;">
            {{this.description}}
          </div>
          {{#if this.priority}}
            <div style="margin-top: 8px; font-size: 12px; color: #ff9800;">
              Priority: <strong>{{this.priority}}</strong>
            </div>
          {{/if}}
        </div>
      {{/if}}
    {{/each}}

    <div class="footer">
      <p>Implementing these improvements could significantly increase your business valuation.</p>
    </div>
  </div>
</body>
</html>
```

---

### STEP 4: Create Standard Report Template

Create: `backend/templates/standard-report.html`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Valuation Report - {{companyName}}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: white;
    }

    .page {
      page-break-after: always;
      padding: 40px;
    }

    .header {
      border-bottom: 3px solid #0066cc;
      margin-bottom: 30px;
      padding-bottom: 20px;
    }

    .header h1 {
      color: #0066cc;
      font-size: 32px;
      margin-bottom: 10px;
    }

    .header h2 {
      color: #0066cc;
      font-size: 20px;
      margin-bottom: 5px;
    }

    .header p {
      color: #666;
      font-size: 14px;
      margin: 5px 0;
    }

    .valuation-box {
      background: linear-gradient(135deg, #0066cc 0%, #004999 100%);
      color: white;
      padding: 30px;
      border-radius: 8px;
      margin: 30px 0;
      text-align: center;
    }

    .valuation-box .amount {
      font-size: 48px;
      font-weight: bold;
      margin: 20px 0;
    }

    .valuation-box .label {
      font-size: 18px;
      opacity: 0.9;
    }

    .section {
      margin: 30px 0;
    }

    .section h2 {
      color: #0066cc;
      font-size: 24px;
      margin-bottom: 20px;
      border-left: 4px solid #0066cc;
      padding-left: 15px;
    }

    .section h3 {
      color: #333;
      font-size: 16px;
      margin: 20px 0 10px 0;
      font-weight: 600;
    }

    .metric-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 20px 0;
    }

    .metric-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #0066cc;
    }

    .metric-card .label {
      color: #666;
      font-size: 13px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .metric-card .value {
      color: #0066cc;
      font-size: 24px;
      font-weight: bold;
    }

    .metric-card .benchmark {
      font-size: 12px;
      color: #999;
      margin-top: 8px;
    }

    .driver-item {
      background: #f0f8ff;
      padding: 15px;
      margin: 10px 0;
      border-left: 4px solid #28a745;
      border-radius: 4px;
    }

    .driver-item .title {
      font-weight: bold;
      color: #28a745;
      margin-bottom: 5px;
    }

    .gap-item {
      background: #fff3f3;
      padding: 15px;
      margin: 10px 0;
      border-left: 4px solid #dc3545;
      border-radius: 4px;
    }

    .gap-item .title {
      font-weight: bold;
      color: #dc3545;
      margin-bottom: 5px;
    }

    .suggestion-item {
      background: #fff3cd;
      padding: 15px;
      margin: 15px 0;
      border-left: 4px solid #ff9800;
      border-radius: 4px;
    }

    .suggestion-item .title {
      font-weight: bold;
      color: #ff9800;
      margin-bottom: 8px;
    }

    .suggestion-item .description {
      font-size: 13px;
      color: #555;
      line-height: 1.5;
    }

    .suggestion-item .priority {
      font-size: 12px;
      color: #ff9800;
      margin-top: 8px;
    }

    .valuation-methods {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 15px;
      margin: 20px 0;
    }

    .method-box {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      border-top: 3px solid #0066cc;
    }

    .method-box .method-name {
      font-weight: bold;
      color: #0066cc;
      margin-bottom: 5px;
      font-size: 14px;
    }

    .method-box .method-value {
      font-size: 20px;
      font-weight: bold;
      color: #333;
    }

    .method-box .method-desc {
      font-size: 12px;
      color: #666;
      margin-top: 8px;
      line-height: 1.4;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }

    .table th {
      background: #0066cc;
      color: white;
      padding: 12px;
      text-align: left;
      font-size: 13px;
      font-weight: 600;
    }

    .table td {
      padding: 10px 12px;
      border-bottom: 1px solid #ddd;
      font-size: 13px;
    }

    .table tr:nth-child(even) {
      background: #f8f9fa;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #999;
      text-align: center;
    }

    .page-break {
      page-break-before: always;
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .page {
        page-break-after: always;
        padding: 40px;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <!-- PAGE 1: COVER -->
  <div class="page">
    <div class="header">
      <h1>Business Valuation Report</h1>
      <h2>{{companyName}}</h2>
      <p><strong>Industry:</strong> {{industry}}</p>
      <p><strong>Report Date:</strong> {{calculationDate}}</p>
    </div>

    <div class="valuation-box">
      <div class="label">Estimated Business Value</div>
      <div class="amount">{{recommendedValuation}}</div>
      <div style="margin-top: 20px; font-size: 14px;">
        Valuation Range: {{valuationRange.low}} - {{valuationRange.high}}
      </div>
    </div>

    <div class="section">
      <h3>Risk Assessment</h3>
      <div class="metric-grid">
        <div class="metric-card">
          <div class="label">Risk Grade</div>
          <div class="value">{{riskGrade}}</div>
        </div>
        <div class="metric-card">
          <div class="label">Risk Score</div>
          <div class="value">{{riskScore}}/100</div>
        </div>
      </div>
      <p style="color: #666; margin-top: 15px;">
        {{riskAssessment}}
      </p>
    </div>

    <div class="footer">
      <p>This report provides an independent valuation based on financial analysis and industry benchmarks.</p>
    </div>
  </div>

  <!-- PAGE 2: VALUATION METHODS -->
  <div class="page page-break">
    <div class="header">
      <h2>Valuation Methods</h2>
    </div>

    <p style="margin-bottom: 20px; color: #666;">
      The recommended valuation is derived using three established methods:
    </p>

    <div class="valuation-methods">
      <div class="method-box">
        <div class="method-name">EBITDA Multiple</div>
        <div class="method-value">{{valuationMethods.ebitda.valueFormatted}}</div>
        <div class="method-desc">
          {{valuationMethods.ebitda.description}}
        </div>
      </div>
      <div class="method-box">
        <div class="method-name">Revenue Multiple</div>
        <div class="method-value">{{valuationMethods.revenue.valueFormatted}}</div>
        <div class="method-desc">
          {{valuationMethods.revenue.description}}
        </div>
      </div>
      <div class="method-box">
        <div class="method-name">Discounted Cash Flow</div>
        <div class="method-value">{{valuationMethods.dcf.valueFormatted}}</div>
        <div class="method-desc">
          {{valuationMethods.dcf.description}}
        </div>
      </div>
    </div>

    <div class="section">
      <h3>Valuation Summary</h3>
      <table class="table">
        <thead>
          <tr>
            <th>Method</th>
            <th>Valuation</th>
            <th>Weight</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>EBITDA Multiple</td>
            <td>{{valuationMethods.ebitda.valueFormatted}}</td>
            <td>50%</td>
          </tr>
          <tr>
            <td>Revenue Multiple</td>
            <td>{{valuationMethods.revenue.valueFormatted}}</td>
            <td>25%</td>
          </tr>
          <tr>
            <td>Discounted Cash Flow</td>
            <td>{{valuationMethods.dcf.valueFormatted}}</td>
            <td>25%</td>
          </tr>
          <tr style="background: #e3f2fd;">
            <td><strong>Recommended Valuation</strong></td>
            <td><strong>{{recommendedValuation}}</strong></td>
            <td><strong>100%</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- PAGE 3: VALUE DRIVERS -->
  <div class="page page-break">
    <div class="header">
      <h2>Value Drivers</h2>
    </div>

    <p style="margin-bottom: 20px; color: #666;">
      The following factors positively contribute to your business valuation:
    </p>

    {{#each drivers}}
      <div class="driver-item">
        <div class="title">✓ {{this.label}}</div>
        <div style="font-size: 13px; color: #555; line-height: 1.5;">
          {{this.description}}
        </div>
        <div style="margin-top: 8px; font-size: 12px; color: #0066cc;">
          Estimated Impact: +{{this.impactFormatted}}
        </div>
      </div>
    {{/each}}

    {{#if (eq drivers.length 0)}}
      <p style="color: #999; font-style: italic;">No positive drivers identified at this time.</p>
    {{/if}}
  </div>

  <!-- PAGE 4: PERFORMANCE GAPS -->
  <div class="page page-break">
    <div class="header">
      <h2>Performance Gaps</h2>
    </div>

    <p style="margin-bottom: 20px; color: #666;">
      Areas where your business performance lags industry benchmarks:
    </p>

    {{#each gaps}}
      <div class="gap-item">
        <div class="title">⚠ {{this.label}}</div>
        <div style="font-size: 13px; color: #555; line-height: 1.5; margin-bottom: 8px;">
          <strong>Current:</strong> {{this.current}} | <strong>Industry Benchmark:</strong> {{this.benchmark}}
        </div>
        <div style="font-size: 12px; color: #dc3545;">
          Estimated Valuation Impact: {{this.impactFormatted}}
        </div>
      </div>
    {{/each}}

    {{#if (eq gaps.length 0)}}
      <p style="color: #28a745; font-weight: bold;">✓ No significant gaps identified. Your business meets or exceeds industry benchmarks!</p>
    {{/if}}
  </div>

  <!-- PAGE 5: RECOMMENDATIONS -->
  <div class="page page-break">
    <div class="header">
      <h2>Improvement Recommendations</h2>
    </div>

    <p style="margin-bottom: 20px; color: #666;">
      The following recommendations could increase your business valuation:
    </p>

    {{#each suggestions}}
      <div class="suggestion-item">
        <div class="title">{{this.title}}</div>
        <div class="description">{{this.description}}</div>
        {{#if this.priority}}
          <div class="priority">Priority: <strong>{{this.priority}}</strong></div>
        {{/if}}
      </div>
    {{/each}}

    <div class="footer">
      <p>Implementing these recommendations could significantly improve your business valuation and operational performance.</p>
    </div>
  </div>
</body>
</html>
```

---

### STEP 5: Create Premium Report Template

Create: `backend/templates/premium-report.html`

For now, copy the standard template and add enhancements:

```bash
cp backend/templates/standard-report.html backend/templates/premium-report.html
```

Then edit it to add:
- Executive summary page
- Additional charts (if using Chart.js)
- Detailed financial analysis
- Comparable company analysis section
- Risk analysis breakdown by category

---

### STEP 6: Create Report Routes

Create: `backend/routes/reportRoutes.js`

```javascript
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
 */
router.post('/:id/export-pdf', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { template = 'standard' } = req.body;

    // Validate template
    const validTemplates = ['lite', 'standard', 'premium'];
    if (!validTemplates.includes(template)) {
      return res.status(400).json({
        error: 'Invalid template. Must be lite, standard, or premium'
      });
    }

    // Get valuation from database
    const valuation = await db.get(
      'SELECT * FROM valuations WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    if (!valuation) {
      return res.status(404).json({ error: 'Valuation not found' });
    }

    // Parse JSON fields
    const valuationData = {
      ...valuation,
      valuationMethods: JSON.parse(valuation.valuation_methods || '{}'),
      valuationRange: JSON.parse(valuation.valuation_range || '{}'),
      drivers: JSON.parse(valuation.drivers || '[]'),
      gaps: JSON.parse(valuation.gaps || '[]'),
      suggestions: JSON.parse(valuation.suggestions || '[]'),
      riskAnalysis: JSON.parse(valuation.risk_analysis || '{}'),
      companyName: valuation.company_name,
      calculationDate: valuation.calculation_date,
      recommendedValuation: valuation.recommended_valuation
    };

    // Generate PDF
    const pdf = await pdfGenerator.generateReport(valuationData, template);

    // Send file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="valuation-${id.substring(0, 8)}-${template}.pdf"`
    );
    res.send(pdf);

  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({
      error: 'Failed to generate PDF',
      message: error.message
    });
  }
});

module.exports = router;
```

---

### STEP 7: Register Routes in Server

Edit: `backend/server.js`

Add these lines after other route registrations:

```javascript
// Add near the top with other imports
const reportRoutes = require('./routes/reportRoutes');

// Add after other route registrations (around line where auth routes are)
app.post('/api/valuations/:id/export-pdf',
  reportRoutes.post('/:id/export-pdf', ...)
);

// Or better, register the entire router:
app.use('/api/valuations', reportRoutes);
```

---

### STEP 8: Create Frontend Component

Create: `frontend/src/components/ExportReport.js`

```javascript
import React, { useState } from 'react';
import '../styles/ExportReport.css';

function ExportReport({ valuationId }) {
  const [selectedTemplate, setSelectedTemplate] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/valuations/${valuationId}/export-pdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify({
            template: selectedTemplate
          })
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to export PDF');
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `valuation-${valuationId}-${selectedTemplate}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      setError(err.message);
      console.error('Export error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="export-report">
      <h3>Export Report as PDF</h3>

      <div className="template-selector">
        <label>Choose Report Type:</label>
        <div className="template-options">
          <div className="option">
            <input
              type="radio"
              id="lite"
              value="lite"
              checked={selectedTemplate === 'lite'}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            />
            <label htmlFor="lite">
              <strong>Lite</strong>
              <small>3 pages • Basic metrics</small>
            </label>
          </div>

          <div className="option">
            <input
              type="radio"
              id="standard"
              value="standard"
              checked={selectedTemplate === 'standard'}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            />
            <label htmlFor="standard">
              <strong>Standard</strong> (Recommended)
              <small>5 pages • Full analysis</small>
            </label>
          </div>

          <div className="option">
            <input
              type="radio"
              id="premium"
              value="premium"
              checked={selectedTemplate === 'premium'}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            />
            <label htmlFor="premium">
              <strong>Premium</strong>
              <small>15 pages • Executive summary</small>
            </label>
          </div>
        </div>
      </div>

      {error && <div className="error-message">❌ {error}</div>}

      <button
        onClick={handleExport}
        disabled={loading}
        className="export-button"
      >
        {loading ? (
          <>
            <span className="spinner"></span> Generating PDF...
          </>
        ) : (
          '📄 Download PDF'
        )}
      </button>
    </div>
  );
}

export default ExportReport;
```

---

### STEP 9: Add Styling

Create: `frontend/src/styles/ExportReport.css`

```css
.export-report {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
  border: 1px solid #dee2e6;
}

.export-report h3 {
  color: #0066cc;
  margin-bottom: 15px;
  font-size: 18px;
}

.template-selector {
  margin-bottom: 20px;
}

.template-selector label {
  display: block;
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
}

.template-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.option {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  background: white;
  border: 2px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.option input[type="radio"] {
  margin-right: 10px;
  margin-top: 3px;
  cursor: pointer;
}

.option label {
  display: flex;
  flex-direction: column;
  margin: 0;
  cursor: pointer;
}

.option strong {
  color: #0066cc;
  font-size: 14px;
  margin-bottom: 3px;
}

.option small {
  color: #666;
  font-size: 12px;
  font-weight: normal;
}

.option input:checked ~ label,
.option:has(input:checked) {
  border-color: #0066cc;
  background: #f0f8ff;
}

.export-button {
  background: linear-gradient(135deg, #0066cc 0%, #004999 100%);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
}

.export-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
}

.export-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  background: #ffe0e0;
  color: #c81e1e;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 15px;
  border-left: 4px solid #c81e1e;
}
```

---

### STEP 10: Add Export Button to Dashboard

Edit: `frontend/src/components/Dashboard.js`

Add this import:
```javascript
import ExportReport from './ExportReport';
```

Add this component in the dashboard (after valuation display):
```javascript
<ExportReport valuationId={valuation.id} />
```

---

## ✅ Testing Checklist

### Unit Tests (Create: `backend/services/pdfGenerator.test.js`)

Test:
- [ ] Template loading
- [ ] HTML rendering with data
- [ ] PDF generation
- [ ] Error handling
- [ ] Currency formatting
- [ ] Template validation

### Integration Tests

Test:
- [ ] API endpoint returns PDF
- [ ] Authentication required
- [ ] Invalid template rejected
- [ ] File downloads correctly
- [ ] PDF file is valid

### Manual Tests

- [ ] Click export button
- [ ] Select different templates
- [ ] PDF downloads
- [ ] PDF opens in viewer
- [ ] All data displays correctly
- [ ] Styling is professional

---

## 🎯 Success Criteria

✅ All 3 templates render without errors
✅ PDF generation < 3 seconds
✅ PDF file size < 2MB
✅ All data accurate in reports
✅ Download works in all browsers
✅ Frontend component integrated
✅ Tests passing (> 20 tests)

---

## ⚠️ Common Issues & Solutions

**Issue**: Puppeteer fails to launch
**Solution**:
```bash
npm install --save-optional puppeteer
# Or use system Chrome: export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

**Issue**: PDF generation timeout
**Solution**: Increase timeout in pdf options: `timeout: 10000`

**Issue**: Styling not rendering in PDF
**Solution**: Use inline styles or ensure CSS is embedded

---

## Next Steps After Completion

1. ✅ Complete all tests
2. ✅ Merge to main branch
3. → Move to Working Capital Calculator (Day 3-4)

---

**You've got this! This is a high-value feature that will significantly enhance the platform.**

Need help with any step? Let me know which part to focus on next!
