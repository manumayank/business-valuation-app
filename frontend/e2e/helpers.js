// @ts-check

/**
 * Test Helper Functions
 * Common utilities for E2E tests
 */

/**
 * Generate a unique test email
 * @returns {string} Unique email address
 */
function generateTestEmail() {
  return `test_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Register and login a test user
 * @param {import('@playwright/test').Page} page
 * @param {Object} options
 * @returns {Promise<{email: string, password: string}>}
 */
async function registerAndLogin(page, options = {}) {
  const email = options.email || generateTestEmail();
  const password = options.password || 'TestPassword123!';
  const fullName = options.fullName || 'Test User';

  await page.goto('/register');

  // Fill required fields
  await page.locator('input#fullName').fill(fullName);
  await page.locator('input#email').fill(email);
  await page.locator('input#password').fill(password);
  await page.locator('input#passwordConfirm').fill(password);

  // Check agree to terms checkbox
  await page.locator('input#agreeToTerms').check();

  // Submit form
  await page.locator('button[type="submit"]').click();

  // Wait for redirect to dashboard
  await page.waitForURL(/dashboard|\/$/i, { timeout: 15000 });

  return { email, password };
}

/**
 * Login with existing credentials
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 */
async function login(page, email, password) {
  await page.goto('/login');
  await page.locator('input[type="email"], input[name="email"]').fill(email);
  await page.locator('input[type="password"], input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/dashboard|\/$/i, { timeout: 15000 });
}

/**
 * Logout the current user
 * @param {import('@playwright/test').Page} page
 */
async function logout(page) {
  const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), [class*="logout"]');
  if (await logoutBtn.count() > 0) {
    await logoutBtn.first().click();
    await page.waitForURL(/login/i, { timeout: 5000 });
  }
}

/**
 * Create a new business
 * @param {import('@playwright/test').Page} page
 * @param {Object} businessData
 * @returns {Promise<string>} Business name
 */
async function createBusiness(page, businessData = {}) {
  const name = businessData.name || `Test Business ${Date.now()}`;

  // Click New Business button
  await page.locator('button:has-text("New Business"), button:has-text("Add Business")').first().click();

  // Wait for modal
  await page.waitForSelector('.modal, [class*="modal"]', { timeout: 5000 });

  // Fill business name
  await page.locator('input#businessName, input[name="name"]').fill(name);

  // Fill optional fields if provided
  if (businessData.location) {
    const locationField = page.locator('input#location, input[name="location"]');
    if (await locationField.count() > 0) {
      await locationField.fill(businessData.location);
    }
  }

  if (businessData.naicsCode) {
    const naicsField = page.locator('input#naicsCode, input[name="naicsCode"]');
    if (await naicsField.count() > 0) {
      await naicsField.fill(businessData.naicsCode);
    }
  }

  // Submit
  await page.locator('.modal button[type="submit"], .modal button:has-text("Create")').click();

  // Wait for modal to close
  await page.waitForSelector('.modal, [class*="modal"]', { state: 'hidden', timeout: 5000 }).catch(() => {});

  return name;
}

/**
 * Wait for loading to complete
 * @param {import('@playwright/test').Page} page
 */
async function waitForLoading(page) {
  // Wait for any loading indicators to disappear
  const loadingSelectors = [
    '.loading',
    '[class*="loading"]',
    '[class*="spinner"]',
    ':has-text("Loading")'
  ];

  for (const selector of loadingSelectors) {
    const loading = page.locator(selector);
    if (await loading.count() > 0) {
      await loading.first().waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    }
  }
}

module.exports = {
  generateTestEmail,
  registerAndLogin,
  login,
  logout,
  createBusiness,
  waitForLoading
};
