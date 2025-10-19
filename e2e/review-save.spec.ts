import { test, expect } from '@playwright/test';
import { LoginPage, CandidateListPage } from './pages';

// Review save scenario: accept/edit/reject, intercept POST /api/flashcards, verify redirect and session cleanup.

test.describe('Recenzja Fiszek — zapis', () => {
  test('Scenariusz 3 — zapis akceptowanych/edytowanych fiszek i redirect na /', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(process.env.E2E_USERNAME!, process.env.E2E_PASSWORD!);
    await loginPage.waitForNavigation();

    const generationId = 'test-generation-id';

    // Inject generation data into sessionStorage before navigation
    await page.evaluate(({ generationId }) => {
      const data = {
        generation_id: generationId,
        model: 'openai/gpt-4o-mini',
        source_text_hash: 'stub-hash',
        source_text_length: 1500,
        generated_count: 3,
        rejected_count: 0,
        generation_duration: 100,
        created_at: new Date().toISOString(),
        candidates: [
          { front: 'Front 1', back: 'Back 1', source: 'ai-full' },
          { front: 'Front 2', back: 'Back 2', source: 'ai-full' },
          { front: 'Front 3', back: 'Back 3', source: 'ai-full' },
        ],
      };
      sessionStorage.setItem(`generation_${generationId}`, JSON.stringify(data));
    }, { generationId });

    const candidateListPage = new CandidateListPage(page);
    await candidateListPage.goto(generationId);
    await candidateListPage.waitForLoad();

    // Ensure list is visible and has 3 candidates
    await expect(candidateListPage.candidatesList).toBeVisible();
    const initialCount = await candidateListPage.getCandidateCardsCount();
    expect(initialCount).toBe(3);

    // Accept first, edit second then accept, reject third
    const first = await candidateListPage.getCandidateCard(0);
    await first.accept();

    const second = await candidateListPage.getCandidateCard(1);
    await second.setFrontText('Edited Front 2');
    await second.setBackText('Edited Back 2');
    await second.accept();

    const third = await candidateListPage.getCandidateCard(2);
    await third.reject();

    // Intercept POST /api/flashcards to return 201 with saved DTOs
    const savedFlashcards = [
      {
        id: 'fc-1',
        generation_id: generationId,
        front: 'Front 1',
        back: 'Back 1',
        source: 'ai-full',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'fc-2',
        generation_id: generationId,
        front: 'Edited Front 2',
        back: 'Edited Back 2',
        source: 'ai-edited',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    await page.route('**/api/flashcards', async (route) => {
      const request = route.request();
      if (request.method().toUpperCase() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(savedFlashcards),
        });
      } else {
        await route.continue();
      }
    });

    // Click save
    await candidateListPage.clickSaveFlashcards();

    // Wait for redirect '/' using updated method
    await candidateListPage.waitForSaveSuccess();
    await expect(page).toHaveURL(/\/$/);

    // Optional: confirm sessionStorage cleanup of generation key
    const sessionKeyExists = await page.evaluate(({ generationId }) => {
      return sessionStorage.getItem(`generation_${generationId}`) !== null;
    }, { generationId });
    expect(sessionKeyExists).toBe(false);
  });
});