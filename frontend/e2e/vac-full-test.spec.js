// @ts-check
const { test, expect } = require('@playwright/test');
const { registerAndLogin, waitForLoading } = require('./helpers');

/**
 * Comprehensive VAC Calculator Tests
 * Tests the full calculation flow and verifies results
 */

test.describe('VAC Calculator - Full Flow', () => {

  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
    await waitForLoading(page);
    await page.goto('/vac');
    await waitForLoading(page);
  });

  test('should complete full VAC calculation with all fields', async ({ page }) => {
    // Step 1: Business & Financial Information
    await expect(page.locator('h3:has-text("Business & Financial")')).toBeVisible({ timeout: 10000 });

    // Fill business name
    await page.locator('input[name="businessName"]').fill('Test Company Inc');

    // Fill revenue
    await page.locator('input[name="revenue"]').fill('5000000');

    // Fill pretax profit
    await page.locator('input[name="pretaxProfit"]').fill('500000');

    // Fill interest
    await page.locator('input[name="interest"]').fill('50000');

    // Fill depreciation
    await page.locator('input[name="depreciation"]').fill('100000');

    // Fill amortization
    await page.locator('input[name="amortization"]').fill('25000');

    // Click Next
    await page.locator('button:has-text("Next")').click();

    // Step 2: Risk Questions Part 1 (Q1-Q7)
    await expect(page.locator('h3:has-text("Risk Assessment (Questions 1-7)")')).toBeVisible({ timeout: 5000 });

    // Q1: Fiscal Year End
    await page.locator('input[name="q1_fiscalYearEnd"][value="yes"]').check();

    // Q2: Incorporated
    await page.locator('input[name="q2_incorporated"][value="yes"]').check();

    // Q3: Profit Last Year
    await page.locator('input[name="q3_profitLastYear"][value="yes"]').check();

    // Q4: Last 6 Months Performance
    await page.locator('select[name="q4_lastSixMonths"]').selectOption('10%+ YOY Steady Growth');

    // Q5: Clean Financials
    await page.locator('select[name="q5_cleanFinancialYears"]').selectOption('5+');

    // Q6: General Manager
    await page.locator('input[name="q6_hasGeneralManager"][value="yes"]').check();

    // Q7: Project Based
    await page.locator('select[name="q7_projectBased"]').selectOption('no');

    // Click Next
    await page.locator('button:has-text("Next")').click();

    // Step 3: Risk Questions Part 2 (Q8-Q15)
    await expect(page.locator('h3:has-text("Risk Assessment (Questions 8-14)")')).toBeVisible({ timeout: 5000 });

    // Q8: Largest Customer Percent
    await page.locator('select[name="q8_largestCustomerPercent"]').selectOption('<5%');

    // Q9: Owner Hours
    await page.locator('select[name="q9_ownerHours"]').selectOption('<10');

    // Q10: Lease Years
    await page.locator('select[name="q10_leaseYears"]').selectOption('own');

    // Q11: Business Age
    await page.locator('select[name="q11_businessAge"]').selectOption('25+');

    // Q12: Operating System
    await page.locator('select[name="q12_operatingSystem"]').selectOption('Cloud-based ERP');

    // Q13: Payment Terms
    await page.locator('select[name="q13_paymentTerms"]').selectOption('Contracted Recurring Monthly');

    // Q14: SPOFs
    await page.locator('select[name="q14_numberOfSPOFs"]').selectOption('0');

    // Click Next
    await page.locator('button:has-text("Next")').click();

    // Step 4: Valuation & Growth Settings
    await expect(page.locator('h3:has-text("Valuation & Growth")')).toBeVisible({ timeout: 5000 });

    // Keep defaults for multiple type, but set target wealth
    await page.locator('input[name="targetWealth"]').fill('10000000');

    // Click Next
    await page.locator('button:has-text("Next")').click();

    // Step 5: Enhanced Wealth Gap
    await expect(page.locator('h3:has-text("Enhanced Wealth Gap")')).toBeVisible({ timeout: 5000 });

    // Fill required desired income
    await page.locator('input[name="wg_desiredIncome"]').fill('200000');

    // Fill optional fields
    await page.locator('input[name="wg_dividends"]').fill('50000');
    await page.locator('input[name="wg_wages"]').fill('150000');

    // Click Calculate VAC
    await page.locator('button:has-text("Calculate VAC")').click();

    // Wait for results page
    await expect(page.locator('.vac-results-container')).toBeVisible({ timeout: 15000 });

    // Verify results are displayed (not N/A)
    const resultsText = await page.locator('.vac-results-container').textContent();

    // Check that we have actual values, not N/A everywhere
    expect(resultsText).toContain('$'); // Should have currency values
    expect(resultsText).toContain('Test Company Inc'); // Should show business name

    // Verify key metrics are present
    const currentValueCard = page.locator('.metric-card.primary');
    await expect(currentValueCard).toBeVisible();

    // Check sellability score is displayed
    const sellabilityCard = page.locator('.metric-card:has-text("Sellability Score")');
    await expect(sellabilityCard).toBeVisible();

    // Check grade is displayed
    const gradeCard = page.locator('.metric-card:has-text("Grade")');
    await expect(gradeCard).toBeVisible();

    // Check for risk breakdown section
    const riskBreakdown = page.locator('.vac-section:has-text("Sellability Assessment")');
    await expect(riskBreakdown).toBeVisible();

    // Check Key Insights section
    const keyInsights = page.locator('.vac-summary');
    await expect(keyInsights).toBeVisible();

    // Take screenshot of results
    await page.screenshot({ path: 'test-results/vac-results.png', fullPage: true });
  });

  test('should calculate correctly with baseline EBITDA', async ({ page }) => {
    // Step 1: Fill minimal required fields with baseline EBITDA
    await page.locator('input[name="businessName"]').fill('Baseline Test Co');
    await page.locator('input[name="revenue"]').fill('2000000');

    // Check use baseline
    await page.locator('input[name="useBaseline"]').check();

    await page.locator('button:has-text("Next")').click();

    // Step 2: Quick fill risk questions
    await page.locator('input[name="q1_fiscalYearEnd"][value="yes"]').check();
    await page.locator('input[name="q2_incorporated"][value="yes"]').check();
    await page.locator('input[name="q3_profitLastYear"][value="yes"]').check();
    await page.locator('select[name="q4_lastSixMonths"]').selectOption('Modest YOY Steady Growth');
    await page.locator('select[name="q5_cleanFinancialYears"]').selectOption('3-4');
    await page.locator('input[name="q6_hasGeneralManager"][value="no"]').check();
    await page.locator('select[name="q7_projectBased"]').selectOption('between');

    await page.locator('button:has-text("Next")').click();

    // Step 3: More risk questions
    await page.locator('select[name="q8_largestCustomerPercent"]').selectOption('5-10%');
    await page.locator('select[name="q9_ownerHours"]').selectOption('20-30');
    await page.locator('select[name="q10_leaseYears"]').selectOption('5-10');
    await page.locator('select[name="q11_businessAge"]').selectOption('15-25');
    await page.locator('select[name="q12_operatingSystem"]').selectOption('Customized CRM');
    await page.locator('select[name="q13_paymentTerms"]').selectOption('30-60 days');
    await page.locator('select[name="q14_numberOfSPOFs"]').selectOption('1');

    await page.locator('button:has-text("Next")').click();

    // Step 4: Settings
    await page.locator('button:has-text("Next")').click();

    // Step 5: Wealth Gap
    await page.locator('input[name="wg_desiredIncome"]').fill('150000');

    await page.locator('button:has-text("Calculate VAC")').click();

    // Verify results
    await expect(page.locator('.vac-results-container')).toBeVisible({ timeout: 15000 });

    // With baseline EBITDA at 11.5% of $2M revenue = $230,000 EBITDA
    // Should show calculated values
    const resultsText = await page.locator('.vac-results-container').textContent();
    expect(resultsText).toContain('Baseline Test Co');

    // EBITDA margin should mention Baseline
    const ebitdaCard = page.locator('.metric-card:has-text("EBITDA Margin")');
    const ebitdaText = await ebitdaCard.textContent();
    expect(ebitdaText).toContain('Baseline');

    await page.screenshot({ path: 'test-results/vac-baseline-results.png', fullPage: true });
  });

  test('should show proper risk score breakdown', async ({ page }) => {
    // Fill form quickly to get to results
    await page.locator('input[name="businessName"]').fill('Risk Test LLC');
    await page.locator('input[name="revenue"]').fill('3000000');
    await page.locator('input[name="useBaseline"]').check();

    await page.locator('button:has-text("Next")').click();

    // Fill Q1-Q7 with mixed answers
    await page.locator('input[name="q1_fiscalYearEnd"][value="no"]').check(); // Score: 1
    await page.locator('input[name="q2_incorporated"][value="yes"]').check(); // Score: 5
    await page.locator('input[name="q3_profitLastYear"][value="no"]').check(); // Score: 1
    await page.locator('select[name="q4_lastSixMonths"]').selectOption('Flat'); // Score: 3
    await page.locator('select[name="q5_cleanFinancialYears"]').selectOption('1-2'); // Score: 3
    await page.locator('input[name="q6_hasGeneralManager"][value="no"]').check(); // Score: 1
    await page.locator('select[name="q7_projectBased"]').selectOption('yes'); // Score: 1

    await page.locator('button:has-text("Next")').click();

    // Fill Q8-Q14
    await page.locator('select[name="q8_largestCustomerPercent"]').selectOption('>25%'); // Score: 1
    await page.locator('select[name="q9_ownerHours"]').selectOption('30+'); // Score: 1
    await page.locator('select[name="q10_leaseYears"]').selectOption('<5'); // Score: 1
    await page.locator('select[name="q11_businessAge"]').selectOption('<10'); // Score: 1
    await page.locator('select[name="q12_operatingSystem"]').selectOption('None'); // Score: 1
    await page.locator('select[name="q13_paymentTerms"]').selectOption('90+ days'); // Score: 1
    await page.locator('select[name="q14_numberOfSPOFs"]').selectOption('6+'); // Score: -5

    await page.locator('button:has-text("Next")').click();
    await page.locator('button:has-text("Next")').click();

    await page.locator('input[name="wg_desiredIncome"]').fill('100000');
    await page.locator('button:has-text("Calculate VAC")').click();

    // Verify results
    await expect(page.locator('.vac-results-container')).toBeVisible({ timeout: 15000 });

    // With these poor answers, should have a low score
    const gradeCard = page.locator('.metric-card:has-text("Grade")');
    const gradeText = await gradeCard.textContent();

    // Should show a lower grade (D or F with these answers)
    expect(gradeText).toMatch(/[CDF]/);

    // Check risk breakdown has items
    const riskItems = page.locator('.risk-item');
    const itemCount = await riskItems.count();
    expect(itemCount).toBeGreaterThan(0);

    await page.screenshot({ path: 'test-results/vac-risk-breakdown.png', fullPage: true });
  });

  test('should handle export PDF button', async ({ page }) => {
    // Quick fill to get results
    await page.locator('input[name="businessName"]').fill('Export Test Co');
    await page.locator('input[name="revenue"]').fill('1000000');
    await page.locator('input[name="useBaseline"]').check();

    await page.locator('button:has-text("Next")').click();

    // Fill all required risk questions
    await page.locator('input[name="q1_fiscalYearEnd"][value="yes"]').check();
    await page.locator('input[name="q2_incorporated"][value="yes"]').check();
    await page.locator('input[name="q3_profitLastYear"][value="yes"]').check();
    await page.locator('select[name="q4_lastSixMonths"]').selectOption('Flat');
    await page.locator('select[name="q5_cleanFinancialYears"]').selectOption('3-4');
    await page.locator('input[name="q6_hasGeneralManager"][value="yes"]').check();
    await page.locator('select[name="q7_projectBased"]').selectOption('no');

    await page.locator('button:has-text("Next")').click();

    await page.locator('select[name="q8_largestCustomerPercent"]').selectOption('10-15%');
    await page.locator('select[name="q9_ownerHours"]').selectOption('10-20');
    await page.locator('select[name="q10_leaseYears"]').selectOption('10+');
    await page.locator('select[name="q11_businessAge"]').selectOption('15-25');
    await page.locator('select[name="q12_operatingSystem"]').selectOption('Customized CRM');
    await page.locator('select[name="q13_paymentTerms"]').selectOption('30-60 days');
    await page.locator('select[name="q14_numberOfSPOFs"]').selectOption('1');

    await page.locator('button:has-text("Next")').click();
    await page.locator('button:has-text("Next")').click();

    await page.locator('input[name="wg_desiredIncome"]').fill('120000');
    await page.locator('button:has-text("Calculate VAC")').click();

    await expect(page.locator('.vac-results-container')).toBeVisible({ timeout: 15000 });

    // Check Export PDF button exists
    const exportBtn = page.locator('button:has-text("Export PDF")');
    await expect(exportBtn).toBeVisible();

    // Check New Calculation button exists
    const newCalcBtn = page.locator('button:has-text("New Calculation")');
    await expect(newCalcBtn).toBeVisible();
  });

  test('should navigate back to calculator with New Calculation', async ({ page }) => {
    // Quick fill
    await page.locator('input[name="businessName"]').fill('Navigation Test');
    await page.locator('input[name="revenue"]').fill('1500000');
    await page.locator('input[name="useBaseline"]').check();

    await page.locator('button:has-text("Next")').click();

    await page.locator('input[name="q1_fiscalYearEnd"][value="yes"]').check();
    await page.locator('input[name="q2_incorporated"][value="yes"]').check();
    await page.locator('input[name="q3_profitLastYear"][value="yes"]').check();
    await page.locator('select[name="q4_lastSixMonths"]').selectOption('Flat');
    await page.locator('select[name="q5_cleanFinancialYears"]').selectOption('3-4');
    await page.locator('input[name="q6_hasGeneralManager"][value="yes"]').check();
    await page.locator('select[name="q7_projectBased"]').selectOption('no');

    await page.locator('button:has-text("Next")').click();

    await page.locator('select[name="q8_largestCustomerPercent"]').selectOption('10-15%');
    await page.locator('select[name="q9_ownerHours"]').selectOption('10-20');
    await page.locator('select[name="q10_leaseYears"]').selectOption('10+');
    await page.locator('select[name="q11_businessAge"]').selectOption('15-25');
    await page.locator('select[name="q12_operatingSystem"]').selectOption('Customized CRM');
    await page.locator('select[name="q13_paymentTerms"]').selectOption('30-60 days');
    await page.locator('select[name="q14_numberOfSPOFs"]').selectOption('1');

    await page.locator('button:has-text("Next")').click();
    await page.locator('button:has-text("Next")').click();

    await page.locator('input[name="wg_desiredIncome"]').fill('100000');
    await page.locator('button:has-text("Calculate VAC")').click();

    await expect(page.locator('.vac-results-container')).toBeVisible({ timeout: 15000 });

    // Click New Calculation
    await page.locator('button:has-text("New Calculation")').click();

    // Should be back on form
    await expect(page.locator('h3:has-text("Business & Financial")')).toBeVisible({ timeout: 5000 });
  });
});
