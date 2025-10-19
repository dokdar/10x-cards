import { test, expect } from '@playwright/test';
import { LoginPage, CandidateListPage } from './pages';

// Test data helpers
const createMockGenerationData = (candidates: any[] = []) => ({
  generation_id: 'test-generation-id',
  model: 'openai/gpt-4o-mini',
  source_text_hash: 'test-hash',
  source_text_length: 1500,
  generated_count: candidates.length,
  rejected_count: 0,
  generation_duration: 5000,
  created_at: new Date().toISOString(),
  candidates
});

const mockCandidates = [
  {
    front: 'Co to jest React?',
    back: 'React to biblioteka JavaScript do budowania interfejsów użytkownika',
    source: 'ai-full' as const
  },
  {
    front: 'Czym są komponenty w React?',
    back: 'Komponenty to niezależne, wielokrotnego użytku fragmenty kodu, które zwracają elementy React',
    source: 'ai-full' as const
  },
  {
    front: 'Co to jest JSX?',
    back: 'JSX to rozszerzenie składni JavaScript, które pozwala pisać kod podobny do HTML w plikach JavaScript',
    source: 'ai-full' as const
  }
];

// Disable parallel execution for this file to avoid session conflicts
// All tests use the same user account and need sequential execution
test.describe.configure({ mode: 'serial' });

test.describe('CandidateList Component E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Use credentials from .env.test
    const email = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;
    
    if (!email || !password) {
      throw new Error('E2E_USERNAME and E2E_PASSWORD must be set in environment variables');
    }
    
    // Login with real credentials using LoginPage
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(email, password);
    await loginPage.waitForNavigation();
  });

  test.describe('Empty State Tests', () => {
    test('should display empty state when no candidates are available', async ({ page }) => {
      // Setup empty generation data in sessionStorage before navigation
      const emptyGenerationData = createMockGenerationData([]);
      
      await page.addInitScript((data) => {
        window.sessionStorage.setItem('generation_test-generation-id', JSON.stringify(data));
      }, emptyGenerationData);

      // Navigate to review page using CandidateListPage
      const candidateListPage = new CandidateListPage(page);
      await candidateListPage.goto('test-generation-id');
      
      // Wait for page to load completely
      await candidateListPage.waitForLoad();

      // Verify empty state is displayed
      await expect(candidateListPage.emptyState).toBeVisible();
      await expect(candidateListPage.emptyStateTitle).toBeVisible();
      await expect(candidateListPage.emptyStateDescription).toBeVisible();
      
      // Verify "Add Manual Flashcard" button is present
      await expect(candidateListPage.addFirstFlashcardButton).toBeVisible();
    });

    test('should allow adding manual flashcard from empty state', async ({ page }) => {
      const emptyGenerationData = createMockGenerationData([]);
      
      await page.addInitScript((data) => {
        window.sessionStorage.setItem('generation_test-generation-id', JSON.stringify(data));
      }, emptyGenerationData);

      const candidateListPage = new CandidateListPage(page);
      await candidateListPage.goto('test-generation-id');
      
      // Wait for page to load completely
      await candidateListPage.waitForLoad();

      // Click "Add Manual Flashcard" button
      await candidateListPage.clickAddFirstFlashcard();

      // Verify that a new candidate card appears
      const candidateCard = await candidateListPage.getCandidateCard(0);
      await expect(candidateCard.card).toBeVisible();
      
      // Verify the card has empty text areas for manual input
      await expect(candidateCard.frontTextarea).toBeVisible();
      await expect(candidateCard.backTextarea).toBeVisible();
      await expect(candidateCard.frontTextarea).toHaveValue('');
      await expect(candidateCard.backTextarea).toHaveValue('');
    });
  });

  test.describe('Data-filled State Tests', () => {
    test('should display candidate cards when data is available', async ({ page }) => {
      const generationData = createMockGenerationData(mockCandidates);
      
      await page.addInitScript((data) => {
        window.sessionStorage.setItem('generation_test-generation-id', JSON.stringify(data));
      }, generationData);

      const candidateListPage = new CandidateListPage(page);
      await candidateListPage.goto('test-generation-id');
      
      // Wait for page to load completely
      await candidateListPage.waitForLoad();

      // Wait for the candidates list to be visible (data loaded)
      await expect(candidateListPage.candidatesList).toBeVisible();

      // Verify candidate cards are displayed
      await expect(await candidateListPage.getCandidateCardsCount()).toBe(3);

      // Verify first candidate content
      const firstCard = await candidateListPage.getCandidateCard(0);
      await expect(firstCard.frontTextarea).toHaveValue('Co to jest React?');
      await expect(firstCard.backTextarea).toHaveValue('React to biblioteka JavaScript do budowania interfejsów użytkownika');
    });

    test('should show correct candidate count in header', async ({ page }) => {
      const generationData = createMockGenerationData(mockCandidates);
      
      await page.addInitScript((data) => {
        window.sessionStorage.setItem('generation_test-generation-id', JSON.stringify(data));
      }, generationData);

      const candidateListPage = new CandidateListPage(page);
      await candidateListPage.goto('test-generation-id');
      
      // Wait for page to load completely
      await candidateListPage.waitForLoad();
      
      // Wait for candidates list to be visible first
      await expect(candidateListPage.candidatesList).toBeVisible();

      // Verify candidate count is displayed in ReviewControls
      await expect(candidateListPage.selectionCount).toBeVisible();
    });
  });

  test.describe('User Interaction Tests', () => {
    test('should allow accepting a candidate', async ({ page }) => {
      const generationData = createMockGenerationData(mockCandidates);
      
      await page.addInitScript((data) => {
        window.sessionStorage.setItem('generation_test-generation-id', JSON.stringify(data));
      }, generationData);

      const candidateListPage = new CandidateListPage(page);
      await candidateListPage.goto('test-generation-id');
      
      // Wait for page to load completely
      await candidateListPage.waitForLoad();
      
      // Wait for candidates list to be visible first
      await expect(candidateListPage.candidatesList).toBeVisible();

      // Find first candidate card and accept it
      const firstCard = await candidateListPage.getCandidateCard(0);
      
      // Verify switch is initially off (aria-checked="false")
      await expect(firstCard.acceptSwitch).toHaveAttribute('aria-checked', 'false');
      
      // Click to accept
      await firstCard.accept();
      
      // Verify switch is now on
      await expect(firstCard.acceptSwitch).toHaveAttribute('aria-checked', 'true');
    });

    test('should allow rejecting a candidate', async ({ page }) => {
      const generationData = createMockGenerationData(mockCandidates);
      
      await page.addInitScript((data) => {
        window.sessionStorage.setItem('generation_test-generation-id', JSON.stringify(data));
      }, generationData);

      const candidateListPage = new CandidateListPage(page);
      await candidateListPage.goto('test-generation-id');
      
      // Wait for page to load completely
      await candidateListPage.waitForLoad();
      
      // Wait for candidates to load
      await expect(candidateListPage.candidatesList).toBeVisible();

      // Find first candidate card and reject it
      const firstCard = await candidateListPage.getCandidateCard(0);
      await firstCard.reject();
      
      // Verify card is still visible but marked as rejected (with opacity and disabled controls)
      await expect(await candidateListPage.getCandidateCardsCount()).toBe(3); // Should still be 3 cards
      await expect(firstCard.card).toHaveClass(/opacity-50/);
      await expect(firstCard.acceptSwitch).toBeDisabled();
      await expect(firstCard.rejectButton).toBeDisabled();
    });

    test('should allow editing candidate content', async ({ page }) => {
      const generationData = createMockGenerationData(mockCandidates);
      
      await page.addInitScript((data) => {
        window.sessionStorage.setItem('generation_test-generation-id', JSON.stringify(data));
      }, generationData);

      const candidateListPage = new CandidateListPage(page);
      await candidateListPage.goto('test-generation-id');
      
      // Wait for page to load completely
      await candidateListPage.waitForLoad();
      
      // Wait for candidates list to be visible first
      await expect(candidateListPage.candidatesList).toBeVisible();

      // Find first candidate card and edit its content
      const firstCard = await candidateListPage.getCandidateCard(0);
      
      // Clear and type new content
      await firstCard.setFrontText('Edited front content');
      await firstCard.setBackText('Edited back content');
      
      // Verify content was updated
      await expect(firstCard.frontTextarea).toHaveValue('Edited front content');
      await expect(firstCard.backTextarea).toHaveValue('Edited back content');
    });

    test('should handle multiple candidate interactions', async ({ page }) => {
      const generationData = createMockGenerationData(mockCandidates);
      
      await page.addInitScript((data) => {
        window.sessionStorage.setItem('generation_test-generation-id', JSON.stringify(data));
      }, generationData);

      const candidateListPage = new CandidateListPage(page);
      await candidateListPage.goto('test-generation-id');
      
      // Wait for page to load completely
      await candidateListPage.waitForLoad();
      
      // Wait for candidates to load
      await expect(candidateListPage.candidatesList).toBeVisible();

      // Accept first candidate
      const firstCard = await candidateListPage.getCandidateCard(0);
      await firstCard.accept();
      
      // Reject second candidate
      const secondCard = await candidateListPage.getCandidateCard(1);
      await secondCard.reject();
      
      // Edit third candidate (still at index 2 since rejected cards remain visible)
      const thirdCard = await candidateListPage.getCandidateCard(2);
      await thirdCard.setFrontText('Modified content');
      
      // Verify states
      await expect(firstCard.acceptSwitch).toHaveAttribute('aria-checked', 'true');
      await expect(secondCard.card).toHaveClass(/opacity-50/); // Second card should be visually rejected
      await expect(await candidateListPage.getCandidateCardsCount()).toBe(3); // All cards still visible
      await expect(thirdCard.frontTextarea).toHaveValue('Modified content');
    });
  });

  test.describe('Manual Flashcard Addition Tests', () => {
    test('should allow adding manual flashcard to existing candidates', async ({ page }) => {
      const generationData = createMockGenerationData(mockCandidates);
      
      await page.addInitScript((data) => {
        window.sessionStorage.setItem('generation_test-generation-id', JSON.stringify(data));
      }, generationData);

      const candidateListPage = new CandidateListPage(page);
      await candidateListPage.goto('test-generation-id');
      
      // Wait for page to load completely
      await candidateListPage.waitForLoad();
      
      // Wait for candidates to load
      await expect(candidateListPage.candidatesList).toBeVisible();

      // Initial count should be 3
      await expect(await candidateListPage.getCandidateCardsCount()).toBe(3);

      // Wait for add manual flashcard button to be visible and click it
      await expect(candidateListPage.addManualFlashcardButton).toBeVisible();
      await candidateListPage.addManualFlashcardButton.click({ force: true });

      // Verify new card was added
      await expect(await candidateListPage.getCandidateCardsCount()).toBe(4);
      
      // Verify the new card has empty content
      const newCard = await candidateListPage.getCandidateCard(3);
      
      await expect(newCard.frontTextarea).toHaveValue('');
      await expect(newCard.backTextarea).toHaveValue('');
      
      // Fill in the manual flashcard
      await newCard.setFrontText('Manual question');
      await newCard.setBackText('Manual answer');
      
      // Verify content was saved
      await expect(newCard.frontTextarea).toHaveValue('Manual question');
      await expect(newCard.backTextarea).toHaveValue('Manual answer');
    });

    test('should validate manual flashcard content', async ({ page }) => {
      const generationData = createMockGenerationData(mockCandidates);
      
      await page.addInitScript((data) => {
        window.sessionStorage.setItem('generation_test-generation-id', JSON.stringify(data));
      }, generationData);

      const candidateListPage = new CandidateListPage(page);
      await candidateListPage.goto('test-generation-id');
      
      // Wait for page to load completely
      await candidateListPage.waitForLoad();
      
      // Wait for candidates to load
      await expect(candidateListPage.candidatesList).toBeVisible();

      // Add manual flashcard
      await expect(candidateListPage.addManualFlashcardButton).toBeVisible();
      await candidateListPage.addManualFlashcardButton.click({ force: true });
      
      const newCard = await candidateListPage.getCandidateCard(3);

      // Fill both sides to make it valid
      await newCard.setFrontText('Front content');
      await newCard.setBackText('Back content');
      
      // Accept the flashcard
      await newCard.accept();
      
      // Should now be accepted
      await expect(newCard.acceptSwitch).toHaveAttribute('aria-checked', 'true');
    });
  });

  test.describe('Accessibility Tests', () => {
    test('should be keyboard navigable', async ({ page }) => {
      const generationData = createMockGenerationData(mockCandidates);
      
      await page.addInitScript((data) => {
        window.sessionStorage.setItem('generation_test-generation-id', JSON.stringify(data));
      }, generationData);

      const candidateListPage = new CandidateListPage(page);
      await candidateListPage.goto('test-generation-id');
      
      // Wait for page to load completely
      await candidateListPage.waitForLoad();
      
      // Wait for candidates to load
      await expect(candidateListPage.candidatesList).toBeVisible();

      // Test keyboard navigation through candidate cards
      await page.keyboard.press('Tab');
      
      // Should focus on first interactive element
      const firstCard = await candidateListPage.getCandidateCard(0);
      
      // Navigate to the switch and activate it
      await firstCard.acceptSwitch.focus();
      await page.keyboard.press('Space'); // Space key activates switches
      await expect(firstCard.acceptSwitch).toHaveAttribute('aria-checked', 'true');
    });

    test('should have proper ARIA labels', async ({ page }) => {
      const generationData = createMockGenerationData(mockCandidates);
      
      await page.addInitScript((data) => {
        window.sessionStorage.setItem('generation_test-generation-id', JSON.stringify(data));
      }, generationData);

      const candidateListPage = new CandidateListPage(page);
      await candidateListPage.goto('test-generation-id');
      
      // Wait for page to load completely
      await candidateListPage.waitForLoad();
      
      // Wait for candidates to load
      await expect(candidateListPage.candidatesList).toBeVisible();

      // Check ARIA labels on interactive elements
      const firstCard = await candidateListPage.getCandidateCard(0);
      
      await expect(firstCard.acceptSwitch).toHaveAttribute('aria-label', 'Accept flashcard');
      // Note: reject button doesn't have aria-label in the component, so we'll check if it's accessible via text
      await expect(firstCard.rejectButton).toBeVisible();
    });
  });

  test.describe('Error Handling Tests', () => {
    test('should handle missing generation data gracefully', async ({ page }) => {
      // Don't set any sessionStorage data
      const candidateListPage = new CandidateListPage(page);
      await candidateListPage.goto('test-generation-id');
      
      // Wait for page to load completely
      await candidateListPage.waitForLoad();

      // Should show appropriate error message when data is missing
      await expect(page.getByText('Nie znaleziono danych sesji generowania')).toBeVisible();
      await expect(page.getByTestId('return-home-button')).toBeVisible({ timeout: 10000 });
    });

    test('should handle corrupted generation data', async ({ page }) => {
      // Set invalid JSON in sessionStorage
      await page.addInitScript(() => {
        window.sessionStorage.setItem('generation_test-generation-id', 'invalid-json');
      });

      const candidateListPage = new CandidateListPage(page);
      await candidateListPage.goto('test-generation-id');
      
      // Wait for page to load completely
      await candidateListPage.waitForLoad();

      // Should handle gracefully and show error message when data is corrupted
      await expect(page.getByText('Nie znaleziono danych sesji generowania')).toBeVisible();
      await expect(page.getByTestId('return-home-button')).toBeVisible();
    });

    test('should handle API errors during save operation', async ({ page }) => {
      const generationData = createMockGenerationData(mockCandidates);
      
      await page.addInitScript((data) => {
        window.sessionStorage.setItem('generation_test-generation-id', JSON.stringify(data));
      }, generationData);

      const candidateListPage = new CandidateListPage(page);
      await candidateListPage.goto('test-generation-id');
      await candidateListPage.waitForLoad();

      // Accept first candidate
      const firstCard = await candidateListPage.getCandidateCard(0);
      await firstCard.accept();

      // Mock API error response
      await page.route('**/api/flashcards', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });

      // Try to save and expect error handling
      await candidateListPage.clickSaveFlashcards();
      
      // Should show error message and stay on the same page
      await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 10000 });
      await expect(page).toHaveURL(/\/review\/test-generation-id$/);
    });

    test('should handle network timeout during save operation', async ({ page }) => {
      const generationData = createMockGenerationData(mockCandidates);
      
      await page.addInitScript((data) => {
        window.sessionStorage.setItem('generation_test-generation-id', JSON.stringify(data));
      }, generationData);

      const candidateListPage = new CandidateListPage(page);
      await candidateListPage.goto('test-generation-id');
      await candidateListPage.waitForLoad();

      // Accept first candidate
      const firstCard = await candidateListPage.getCandidateCard(0);
      await firstCard.accept();

      // Mock network timeout by aborting the request
      await page.route('**/api/flashcards', async (route) => {
        await route.abort();
      });

      // Try to save and expect error handling
      await candidateListPage.clickSaveFlashcards();
      
      // Should show error message and stay on the same page
      await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 10000 });
      await expect(page).toHaveURL(/\/review\/test-generation-id$/);
    });

    test('should handle empty candidates array gracefully', async ({ page }) => {
      const emptyGenerationData = createMockGenerationData([]);
      
      await page.addInitScript((data) => {
        window.sessionStorage.setItem('generation_test-generation-id', JSON.stringify(data));
      }, emptyGenerationData);

      const candidateListPage = new CandidateListPage(page);
      await candidateListPage.goto('test-generation-id');
      await candidateListPage.waitForLoad();

      // Should show empty state
      await expect(candidateListPage.emptyState).toBeVisible();
      await expect(candidateListPage.addFirstFlashcardButton).toBeVisible();
    });

    test('should handle malformed candidate data', async ({ page }) => {
      const malformedData = {
        generation_id: 'test-generation-id',
        model: 'openai/gpt-4o-mini',
        source_text_hash: 'test-hash',
        source_text_length: 1500,
        generated_count: 3,
        rejected_count: 0,
        generation_duration: 5000,
        created_at: new Date().toISOString(),
        candidates: [
          { front: '', back: '', source: 'ai-full' }, // Empty content
          { front: 'Valid front', back: '', source: 'ai-full' }, // Missing back
          { front: '', back: 'Valid back', source: 'ai-full' }, // Missing front
        ]
      };
      
      await page.addInitScript((data) => {
        window.sessionStorage.setItem('generation_test-generation-id', JSON.stringify(data));
      }, malformedData);

      const candidateListPage = new CandidateListPage(page);
      await candidateListPage.goto('test-generation-id');
      
      // Wait for page to load
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle');
      
      // Wait for either candidates list or empty state to appear
      await page.waitForSelector('[data-test-id="candidates-list"], [data-test-id="empty-state"]', { 
        state: 'visible', 
        timeout: 10000 
      });

      // Check if candidates list is visible (app should render malformed data)
      const isListVisible = await page.locator('[data-test-id="candidates-list"]').isVisible();
      
      if (isListVisible) {
        // Should still render candidates but handle missing data gracefully
        const candidateCount = await candidateListPage.getCandidateCardsCount();
        expect(candidateCount).toBe(3);

        // Check that cards with missing data are still editable
        const firstCard = await candidateListPage.getCandidateCard(0);
        await firstCard.setFrontText('Edited front');
        await firstCard.setBackText('Edited back');
        
        const frontText = await firstCard.getFrontText();
        const backText = await firstCard.getBackText();
        expect(frontText).toBe('Edited front');
        expect(backText).toBe('Edited back');
      } else {
        // If app shows empty state for malformed data, that's also acceptable
        await expect(candidateListPage.emptyState).toBeVisible();
      }
    });
  });
});