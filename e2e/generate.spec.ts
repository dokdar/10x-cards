import { test, expect } from '@playwright/test';
import { LoginPage, GeneratePage, CandidateListPage } from './pages';

// Tests run in chromium project per playwright.config.ts
// Use robust selectors, intercept API calls, and stable waits.

test.describe('Generator Fiszek /generate', () => {
  test('Scenariusz 1 — generowanie manualne zapisuje sesję i przekierowuje do /review/e2e-gen-manual-123', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(process.env.E2E_USERNAME!, process.env.E2E_PASSWORD!);
    await loginPage.waitForNavigation();

    const generatePage = new GeneratePage(page);
    await generatePage.goto();
    await page.waitForLoadState('networkidle');

    const longText = 'a'.repeat(1100);
    await generatePage.pasteSourceText(longText);
    await generatePage.selectMode('manual');

    // Intercept POST /api/generations with controlled manual response
    const manualGenerationResponse = {
      generation_id: 'e2e-gen-manual-123',
      model: null,
      source_text_hash: 'stub-hash',
      source_text_length: 1100,
      generated_count: 0,
      rejected_count: 0,
      generation_duration: 100,
      created_at: new Date().toISOString(),
      candidates: [],
    };

    await page.route('**/api/generations', async (route) => {
      const request = route.request();
      if (request.method().toUpperCase() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(manualGenerationResponse),
        });
      } else {
        await route.continue();
      }
    });

    // Submit and wait for redirect to review page (avoid eval during navigation)
    await generatePage.submit();
    await page.waitForURL('/review/e2e-gen-manual-123');

    // Wait until sessionStorage is populated to avoid race conditions
    await page.waitForFunction((key) => !!sessionStorage.getItem(key), 'generation_e2e-gen-manual-123');

    // Expect sessionStorage contains generation data
    const stored = await page.evaluate((key) => sessionStorage.getItem(key), 'generation_e2e-gen-manual-123');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed).toMatchObject({ generation_id: 'e2e-gen-manual-123', candidates: [] });

    // Expect redirect to review page
    await expect(page).toHaveURL(/\/review\/e2e-gen-manual-123$/);
  });

  test('Scenariusz 2 — generowanie przez AI zapisuje sesję, przekierowuje i renderuje 3 kandydatów', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(process.env.E2E_USERNAME!, process.env.E2E_PASSWORD!);
    await loginPage.waitForNavigation();

    const generatePage = new GeneratePage(page);
    await generatePage.goto();
    await page.waitForLoadState('networkidle');

    const longText = 'a'.repeat(1200);
    await generatePage.pasteSourceText(longText);
    await generatePage.selectMode('ai');

    // Intercept POST /api/generations with AI candidates
    const aiGenerationResponse = {
      generation_id: 'e2e-gen-ai-123',
      model: 'openai/gpt-4o-mini',
      source_text_hash: 'stub-hash',
      source_text_length: 1200,
      generated_count: 3,
      rejected_count: 0,
      generation_duration: 120,
      created_at: new Date().toISOString(),
      candidates: [
        { front: 'Q1', back: 'A1', source: 'ai-full' },
        { front: 'Q2', back: 'A2', source: 'ai-full' },
        { front: 'Q3', back: 'A3', source: 'ai-full' },
      ],
    };

    await page.route('**/api/generations', async (route) => {
      const request = route.request();
      if (request.method().toUpperCase() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(aiGenerationResponse),
        });
      } else {
        await route.continue();
      }
    });

    // Submit and wait for redirect to review page (avoid eval during navigation)
    await generatePage.submit();
    await page.waitForURL('/review/e2e-gen-ai-123');

    // Wait until sessionStorage is populated to avoid race conditions
    await page.waitForFunction((key) => !!sessionStorage.getItem(key), 'generation_e2e-gen-ai-123');

    // Expect sessionStorage contains generation data
    const stored = await page.evaluate((key) => sessionStorage.getItem(key), 'generation_e2e-gen-ai-123');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed).toMatchObject({ generation_id: 'e2e-gen-ai-123', generated_count: 3 });

    // Expect redirect to review page
    await expect(page).toHaveURL(/\/review\/e2e-gen-ai-123$/);

    // On review page, list should be visible and have 3 cards
    const candidateListPage = new CandidateListPage(page);
    await candidateListPage.waitForLoad();
    await expect(candidateListPage.candidatesList).toBeVisible();
    const count = await candidateListPage.getCandidateCardsCount();
    expect(count).toBe(3);
  });

  test.describe('Form Validation Tests', () => {
    test('should disable submit button when text is too short', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(process.env.E2E_USERNAME!, process.env.E2E_PASSWORD!);
      await loginPage.waitForNavigation();

      const generatePage = new GeneratePage(page);
      await generatePage.goto();

      // Enter text shorter than minimum (1000 characters)
      const shortText = 'a'.repeat(999);
      await generatePage.pasteSourceText(shortText);
      await generatePage.selectMode('manual');

      // Submit button should be disabled
      await expect(generatePage.submitButton).toBeDisabled();

      // Helper text should show character count and minimum requirement
      await expect(page.locator('#source-text-helper')).toContainText('999 / 10000 znaków');
      await expect(page.locator('#source-text-helper')).toContainText('(minimum 1000 znaków)');
    });

    test('should disable submit button when text is too long', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(process.env.E2E_USERNAME!, process.env.E2E_PASSWORD!);
      await loginPage.waitForNavigation();

      const generatePage = new GeneratePage(page);
      await generatePage.goto();

      // Enter text longer than maximum (10000 characters)
      const longText = 'a'.repeat(10001);
      await generatePage.pasteSourceText(longText);
      await generatePage.selectMode('manual');

      // Submit button should be disabled
      await expect(generatePage.submitButton).toBeDisabled();

      // Helper text should show character count exceeding limit
      await expect(page.locator('#source-text-helper')).toContainText('10001 / 10000 znaków');
    });

    test('should enable submit button when text length is valid', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(process.env.E2E_USERNAME!, process.env.E2E_PASSWORD!);
      await loginPage.waitForNavigation();

      const generatePage = new GeneratePage(page);
      await generatePage.goto();

      // Enter valid text (exactly minimum length)
      const validText = 'a'.repeat(1000);
      await generatePage.pasteSourceText(validText);
      await generatePage.selectMode('manual');

      // Submit button should be enabled
      await expect(generatePage.submitButton).toBeEnabled();

      // Helper text should show valid character count
      await expect(page.locator('#source-text-helper')).toContainText('1000 / 10000 znaków');
    });
  });

  test.describe('Error Handling Tests', () => {
    test('should handle API validation error (400)', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(process.env.E2E_USERNAME!, process.env.E2E_PASSWORD!);
      await loginPage.waitForNavigation();

      const generatePage = new GeneratePage(page);
      await generatePage.goto();

      const validText = 'a'.repeat(1100);
      await generatePage.pasteSourceText(validText);
      await generatePage.selectMode('ai');

      // Mock API validation error
      const requestPromise = page.waitForRequest('**/api/generations');
      await page.route('**/api/generations', async (route) => {
        const request = route.request();
        if (request.method().toUpperCase() === 'POST') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Validation Error',
              message: 'Nieprawidłowe dane wejściowe',
              validation_errors: [
                { field: 'source_text', message: 'Tekst źródłowy musi mieć co najmniej 1000 znaków' }
              ]
            }),
          });
        } else {
          await route.continue();
        }
      });

      await generatePage.submit();
      await requestPromise; // Wait for the request to complete

      // Should show error message and stay on generate page
        await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 10000 });
        await expect(page).toHaveURL(/\/generate$/);
      });

    test('should handle AI service timeout (502)', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(process.env.E2E_USERNAME!, process.env.E2E_PASSWORD!);
      await loginPage.waitForNavigation();

      const generatePage = new GeneratePage(page);
      await generatePage.goto();

      const validText = 'a'.repeat(1100);
      await generatePage.pasteSourceText(validText);
      await generatePage.selectMode('ai');

      // Mock AI service timeout
      const requestPromise = page.waitForRequest('**/api/generations');
      await page.route('**/api/generations', async (route) => {
        const request = route.request();
        if (request.method().toUpperCase() === 'POST') {
          await route.fulfill({
            status: 502,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'AI Service Timeout',
              message: 'Usługa generowania jest tymczasowo niedostępna.',
              details: { message: 'Request timeout after 30 seconds' }
            }),
          });
        } else {
          await route.continue();
        }
      });

      await generatePage.submit();
      await requestPromise; // Wait for the request to complete

      // Should show error message and stay on generate page
      await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 10000 });
      await expect(page).toHaveURL(/\/generate$/);
    });

    test('should handle network error during generation', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(process.env.E2E_USERNAME!, process.env.E2E_PASSWORD!);
      await loginPage.waitForNavigation();

      const generatePage = new GeneratePage(page);
      await generatePage.goto();

      const validText = 'a'.repeat(1100);
      await generatePage.pasteSourceText(validText);
      await generatePage.selectMode('ai');

      // Mock network error by aborting the request
      await page.route('**/api/generations', async (route) => {
        await route.abort();
      });

      await generatePage.submit();
      
      // Wait a bit for the error state to update
      await page.waitForTimeout(1000);

      // Should show error message and stay on generate page
      await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 10000 });
      await expect(page).toHaveURL(/\/generate$/);
    });

    test('should handle unauthorized access (401)', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(process.env.E2E_USERNAME!, process.env.E2E_PASSWORD!);
      await loginPage.waitForNavigation();

      const generatePage = new GeneratePage(page);
      await generatePage.goto();

      const validText = 'a'.repeat(1100);
      await generatePage.pasteSourceText(validText);
      await generatePage.selectMode('ai');

      // Mock unauthorized error
      const requestPromise = page.waitForRequest('**/api/generations');
      await page.route('**/api/generations', async (route) => {
        const request = route.request();
        if (request.method().toUpperCase() === 'POST') {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Unauthorized',
              message: 'Musisz być zalogowany aby generować fiszki'
            }),
          });
        } else {
          await route.continue();
        }
      });

      await generatePage.submit();
      await requestPromise; // Wait for the request to complete

      // Should show error message and stay on generate page
      await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 10000 });
      await expect(page).toHaveURL(/\/generate$/);
    });
  });

  test.describe('UI Interaction Tests', () => {
    test('should switch between manual and AI modes correctly', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(process.env.E2E_USERNAME!, process.env.E2E_PASSWORD!);
      await loginPage.waitForNavigation();

      const generatePage = new GeneratePage(page);
      await generatePage.goto();

      const validText = 'a'.repeat(1100);
      await generatePage.pasteSourceText(validText);

      // Default should be manual mode
      await expect(generatePage.manualRadio).toBeChecked();
      await expect(generatePage.aiRadio).not.toBeChecked();
      await expect(generatePage.submitButton).toContainText('Utwórz Manualne Fiszki');

      // Switch to AI mode
      await generatePage.selectMode('ai');
      await expect(generatePage.aiRadio).toBeChecked();
      await expect(generatePage.manualRadio).not.toBeChecked();
      await expect(generatePage.submitButton).toContainText('Generuj przez AI');

      // Switch back to manual mode
      await generatePage.selectMode('manual');
      await expect(generatePage.manualRadio).toBeChecked();
      await expect(generatePage.aiRadio).not.toBeChecked();
      await expect(generatePage.submitButton).toContainText('Utwórz Manualne Fiszki');
    });

    test('should show loading state during generation', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(process.env.E2E_USERNAME!, process.env.E2E_PASSWORD!);
      await loginPage.waitForNavigation();

      const generatePage = new GeneratePage(page);
      await generatePage.goto();

      const validText = 'a'.repeat(1100);
      await generatePage.pasteSourceText(validText);
      await generatePage.selectMode('ai');

      // Mock slow API response
      await page.route('**/api/generations', async (route) => {
        const request = route.request();
        if (request.method().toUpperCase() === 'POST') {
          // Delay response to test loading state
          await new Promise(resolve => setTimeout(resolve, 1000));
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              generation_id: 'e2e-gen-loading-test',
              model: 'openai/gpt-4o-mini',
              source_text_hash: 'stub-hash',
              source_text_length: 1100,
              generated_count: 2,
              rejected_count: 0,
              generation_duration: 1000,
              created_at: new Date().toISOString(),
              candidates: [
                { front: 'Q1', back: 'A1', source: 'ai-full' },
                { front: 'Q2', back: 'A2', source: 'ai-full' },
              ],
            }),
          });
        } else {
          await route.continue();
        }
      });

      // Click submit and immediately check loading state
      await generatePage.submitButton.click();
      
      // Wait a moment for the loading state to be set
      await page.waitForTimeout(100);
      
      // Should show loading text and disable form elements
      await expect(generatePage.submitButton).toContainText('Generowanie przez AI...');
      await expect(generatePage.submitButton).toBeDisabled();
      await expect(generatePage.sourceTextarea).toBeDisabled();

      // Wait for completion and redirect
      await page.waitForURL('/review/e2e-gen-loading-test', { timeout: 15000 });
    });
  });
});