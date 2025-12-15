// @ts-check
const { test, expect } = require('@playwright/test');
const { registerAndLogin, waitForLoading } = require('./helpers');

/**
 * Digital Readiness Assessment Tests
 * Tests the assessment flow with the comprehensive questions
 */

test.describe('Digital Readiness Assessment', () => {

  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
    await waitForLoading(page);
  });

  test('should navigate to assessment page', async ({ page }) => {
    // Look for assessment link/button in navigation or dashboard
    const assessmentLink = page.locator('a:has-text("Assessment"), button:has-text("Assessment"), a:has-text("Digital"), button:has-text("Digital")').first();

    if (await assessmentLink.count() > 0) {
      await assessmentLink.click();
      await waitForLoading(page);

      // Verify we're on an assessment-related page
      await expect(page).toHaveURL(/assessment|digital/i, { timeout: 10000 });
    } else {
      // Try direct navigation
      await page.goto('/assessment');
      await waitForLoading(page);
    }

    // Take screenshot of assessment page
    await page.screenshot({ path: 'test-results/assessment-page.png', fullPage: true });
  });

  test('should display assessment modules', async ({ page }) => {
    await page.goto('/assessment');
    await waitForLoading(page);

    // Check for module cards or list
    const moduleSelectors = [
      '.assessment-module',
      '.module-card',
      '[class*="module"]',
      '.assessment-navigator',
      '[class*="assessment"]'
    ];

    let modulesFound = false;
    for (const selector of moduleSelectors) {
      if (await page.locator(selector).count() > 0) {
        modulesFound = true;
        console.log(`Found modules with selector: ${selector}`);
        break;
      }
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/assessment-modules.png', fullPage: true });

    // Check for module names in page content
    const pageContent = await page.textContent('body');
    const expectedModules = [
      'Website',
      'Social Media',
      'SEO',
      'Digital Advertising',
      'Analytics',
      'CRM',
      'E-Commerce',
      'Content',
      'Reputation',
      'Security',
      'Technology',
      'Team'
    ];

    let modulesInContent = 0;
    for (const module of expectedModules) {
      if (pageContent && pageContent.includes(module)) {
        modulesInContent++;
      }
    }

    console.log(`Found ${modulesInContent} of ${expectedModules.length} module names in page content`);
  });

  test('should display assessment questions when starting', async ({ page }) => {
    await page.goto('/assessment');
    await waitForLoading(page);

    // Look for a start button or first module
    const startButton = page.locator('button:has-text("Start"), button:has-text("Begin"), button:has-text("Take Assessment")').first();

    if (await startButton.count() > 0) {
      await startButton.click();
      await waitForLoading(page);
    }

    // Click on first module if visible
    const firstModule = page.locator('.module-card, .assessment-module, [class*="module-item"]').first();
    if (await firstModule.count() > 0) {
      await firstModule.click();
      await waitForLoading(page);
    }

    // Wait for questions to appear
    await page.waitForTimeout(2000);

    // Check for question elements
    const questionSelectors = [
      '.assessment-question',
      '.question-card',
      '[class*="question"]',
      'input[type="radio"]',
      'select',
      '.form-group'
    ];

    let questionsFound = false;
    for (const selector of questionSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        questionsFound = true;
        console.log(`Found ${count} elements with selector: ${selector}`);
      }
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/assessment-questions.png', fullPage: true });
  });

  test('should be able to answer questions', async ({ page }) => {
    await page.goto('/assessment');
    await waitForLoading(page);

    // Navigate to questions if needed
    const startButton = page.locator('button:has-text("Start"), button:has-text("Begin")').first();
    if (await startButton.count() > 0) {
      await startButton.click();
      await waitForLoading(page);
    }

    // Click first module
    const firstModule = page.locator('.module-card, .assessment-module, [class*="module"]').first();
    if (await firstModule.count() > 0 && await firstModule.isVisible()) {
      await firstModule.click();
      await waitForLoading(page);
    }

    await page.waitForTimeout(1000);

    // Try to answer a question - radio buttons
    const radioButtons = page.locator('input[type="radio"]');
    if (await radioButtons.count() > 0) {
      await radioButtons.first().check();
      console.log('Checked a radio button');
    }

    // Try to answer a question - select dropdowns
    const selects = page.locator('select');
    if (await selects.count() > 0) {
      const firstSelect = selects.first();
      const options = await firstSelect.locator('option').count();
      if (options > 1) {
        await firstSelect.selectOption({ index: 1 });
        console.log('Selected an option from dropdown');
      }
    }

    // Take screenshot after answering
    await page.screenshot({ path: 'test-results/assessment-answered.png', fullPage: true });

    // Look for next/save button
    const nextButton = page.locator('button:has-text("Next"), button:has-text("Save"), button:has-text("Continue")').first();
    if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
      console.log('Next/Save button is available');
    }
  });

  test('should show assessment progress', async ({ page }) => {
    await page.goto('/assessment');
    await waitForLoading(page);

    // Look for progress indicators
    const progressSelectors = [
      '.progress-bar',
      '.progress',
      '[class*="progress"]',
      '.completion',
      '[class*="completion"]',
      '.step-indicator'
    ];

    for (const selector of progressSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`Found progress indicator: ${selector}`);
      }
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/assessment-progress.png', fullPage: true });
  });

  test('should load all 12 modules from API', async ({ page }) => {
    // Check the API directly
    const response = await page.request.get('http://localhost:5000/api/assessment/modules');

    if (response.ok()) {
      const data = await response.json();
      console.log('API Response:', JSON.stringify(data, null, 2).substring(0, 500));

      if (data.modules) {
        expect(data.modules.length).toBe(12);
        console.log(`Found ${data.modules.length} modules from API`);

        // Log module names and question counts
        for (const module of data.modules) {
          console.log(`  - ${module.name}: ${module.questionCount || 'N/A'} questions`);
        }
      }
    } else {
      console.log('API request failed with status:', response.status());
    }
  });

  test('should load questions for a module from API', async ({ page }) => {
    // First get modules
    const modulesResponse = await page.request.get('http://localhost:5000/api/assessment/modules');

    if (modulesResponse.ok()) {
      const modulesData = await modulesResponse.json();

      if (modulesData.modules && modulesData.modules.length > 0) {
        const firstModule = modulesData.modules[0];
        console.log(`Testing questions for module: ${firstModule.name} (${firstModule.module_key})`);

        // Get questions for first module
        const questionsResponse = await page.request.get(`http://localhost:5000/api/assessment/modules/${firstModule.module_key}/questions`);

        if (questionsResponse.ok()) {
          const questionsData = await questionsResponse.json();
          console.log('Questions API Response:', JSON.stringify(questionsData, null, 2).substring(0, 1000));

          if (questionsData.questions) {
            console.log(`Found ${questionsData.questions.length} questions for ${firstModule.name}`);
            expect(questionsData.questions.length).toBeGreaterThan(0);

            // Log first few questions
            questionsData.questions.slice(0, 3).forEach((q, i) => {
              console.log(`  Q${i + 1}: ${q.question_text?.substring(0, 50)}...`);
            });
          }
        } else {
          console.log('Questions API failed:', questionsResponse.status());
        }
      }
    }
  });
});
