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
});