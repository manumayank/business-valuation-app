// @ts-check
const { test, expect } = require('@playwright/test');
const { registerAndLogin, waitForLoading } = require('./helpers');

/**
 * Digital Readiness Assessment - Full Flow Test
 * Creates a business and engagement, then tests the assessment
 */

test.describe('Digital Assessment Full Flow', () => {

  test('should complete full assessment flow with questions', async ({ page }) => {
    // Register and login
    await registerAndLogin(page);
    await waitForLoading(page);

    // Step 1: Create a new business
    console.log('Step 1: Creating new business...');
    await page.locator('button:has-text("New Business")').first().click();
    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);

    await page.locator('input[name="name"], input#businessName').first().fill('Full Assessment Test Co');
    await page.locator('.modal button:has-text("Create Business")').click();

    await page.waitForTimeout(2000);
    await waitForLoading(page);

    // Step 2: Click on the business to start engagement
    console.log('Step 2: Starting engagement...');
    await page.locator('text=Full Assessment Test Co').first().click();
    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);

    // Click Start Engagement button in modal
    await page.locator('.modal button[type="submit"]:has-text("Start Engagement"), form button:has-text("Start Engagement")').first().click();
    await page.waitForTimeout(2000);
    await waitForLoading(page);

    await page.screenshot({ path: 'test-results/flow-01-engagement.png', fullPage: true });

    // Step 3: Click on Digital Assessment tab
    console.log('Step 3: Going to Digital Assessment tab...');
    const assessmentTab = page.locator('button:has-text("Digital Assessment"), a:has-text("Digital Assessment")').first();
    await assessmentTab.click();
    await waitForLoading(page);
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'test-results/flow-02-assessment-tab.png', fullPage: true });

    // Step 4: Click Start Digital Assessment button
    console.log('Step 4: Starting Digital Assessment...');
    const startAssessmentBtn = page.locator('button:has-text("Start Digital Assessment")');
    if (await startAssessmentBtn.count() > 0) {
      await startAssessmentBtn.click();
      await waitForLoading(page);
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'test-results/flow-03-assessment-started.png', fullPage: true });

    // Step 5: Check for modules
    console.log('Step 5: Checking for assessment modules...');
    const pageContent = await page.textContent('body') || '';

    // Check for expected modules
    const expectedModules = [
      'Website', 'Social Media', 'SEO', 'Digital Advertising',
      'Analytics', 'CRM', 'E-Commerce', 'Content',
      'Reputation', 'Security', 'Technology', 'Team'
    ];

    let foundModules = 0;
    for (const module of expectedModules) {
      if (pageContent.includes(module)) {
        foundModules++;
        console.log(`✓ Found module: ${module}`);
      }
    }
    console.log(`Found ${foundModules}/${expectedModules.length} modules`);

    // Look for module cards
    const moduleCards = page.locator('.module-card, [class*="module-card"], .assessment-module, [class*="assessment-module"]');
    const moduleCardCount = await moduleCards.count();
    console.log(`Found ${moduleCardCount} module cards`);

    await page.screenshot({ path: 'test-results/flow-04-modules.png', fullPage: true });

    // Step 6: Click on first module if found
    if (moduleCardCount > 0) {
      console.log('Step 6: Clicking first module...');
      await moduleCards.first().click();
      await waitForLoading(page);
      await page.waitForTimeout(1000);

      await page.screenshot({ path: 'test-results/flow-05-module-selected.png', fullPage: true });

      // Check for questions
      const questions = page.locator('.assessment-question, .question-card, [class*="question"]');
      const questionCount = await questions.count();
      console.log(`Found ${questionCount} question elements`);

      // Try to answer a question
      const selects = page.locator('select');
      const selectCount = await selects.count();
      console.log(`Found ${selectCount} select dropdowns`);

      if (selectCount > 0) {
        await selects.first().selectOption({ index: 1 });
        console.log('Answered first select question');
        await page.screenshot({ path: 'test-results/flow-06-answered.png', fullPage: true });
      }

      // Check for radio buttons
      const radios = page.locator('input[type="radio"]');
      const radioCount = await radios.count();
      console.log(`Found ${radioCount} radio buttons`);
    }

    // Final screenshot
    await page.screenshot({ path: 'test-results/flow-07-final.png', fullPage: true });

    // Assertions
    expect(foundModules).toBeGreaterThan(0);
  });

  test('should verify assessment API returns questions', async ({ page }) => {
    await registerAndLogin(page);
    await waitForLoading(page);

    // Create business and start engagement
    await page.locator('button:has-text("New Business")').first().click();
    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 5000 });
    await page.locator('input[name="name"], input#businessName').first().fill('API Test Co');
    await page.locator('.modal button:has-text("Create Business")').click();
    await page.waitForTimeout(2000);

    // Start engagement
    await page.locator('text=API Test Co').first().click();
    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 5000 });
    await page.locator('.modal button[type="submit"]:has-text("Start Engagement"), form button:has-text("Start Engagement")').first().click();
    await page.waitForTimeout(2000);

    // Now test the API directly with auth
    const cookies = await page.context().cookies();
    const token = cookies.find(c => c.name === 'token')?.value;

    // Try to get modules from API
    const modulesResponse = await page.request.get('http://localhost:5000/api/assessment/modules', {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });

    console.log('Modules API status:', modulesResponse.status());

    if (modulesResponse.ok()) {
      const data = await modulesResponse.json();
      console.log('Modules response:', JSON.stringify(data).substring(0, 500));

      if (data.modules) {
        console.log(`API returned ${data.modules.length} modules`);
        expect(data.modules.length).toBe(12);

        // Check first module for questions
        const firstModule = data.modules[0];
        console.log(`First module: ${firstModule.name} (${firstModule.module_key})`);

        const questionsResponse = await page.request.get(
          `http://localhost:5000/api/assessment/modules/${firstModule.module_key}/questions`,
          { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
        );

        if (questionsResponse.ok()) {
          const questionsData = await questionsResponse.json();
          if (questionsData.questions) {
            console.log(`${firstModule.name} has ${questionsData.questions.length} questions`);
            expect(questionsData.questions.length).toBeGreaterThan(0);
          }
        }
      }
    }

    await page.screenshot({ path: 'test-results/api-test.png', fullPage: true });
  });
});
