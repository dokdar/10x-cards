import type { Page, Locator } from '@playwright/test';
import { CandidateCard } from './CandidateCard';

export class CandidateListPage {
  readonly page: Page;
  readonly candidatesList: Locator;
  readonly emptyState: Locator;
  readonly emptyStateTitle: Locator;
  readonly emptyStateDescription: Locator;
  readonly addFirstFlashcardButton: Locator;
  readonly addManualFlashcardButton: Locator;
  readonly reviewTitle: Locator;
  readonly selectionCount: Locator;
  readonly saveFlashcardsButton: Locator;
  readonly returnHomeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.candidatesList = page.locator('[data-test-id="candidates-list"]');
    this.emptyState = page.locator('[data-test-id="empty-state"]');
    this.emptyStateTitle = page.locator('[data-test-id="empty-state-title"]');
    this.emptyStateDescription = page.locator('[data-test-id="empty-state-description"]');
    this.addFirstFlashcardButton = page.locator('[data-test-id="add-first-flashcard-button"]');
    this.addManualFlashcardButton = page.locator('[data-test-id="add-manual-flashcard-button"]');
    this.reviewTitle = page.locator('[data-test-id="review-title"]');
    this.selectionCount = page.locator('[data-test-id="selection-count"]');
    this.saveFlashcardsButton = page.locator('[data-test-id="save-flashcards-button"]');
    this.returnHomeButton = page.locator('[data-test-id="return-home-button"]');
  }

  async goto(generationId: string) {
    await this.page.goto(`/review/${generationId}`);
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async isEmptyStateVisible() {
    return await this.emptyState.isVisible();
  }

  async getEmptyStateTitle() {
    return await this.emptyStateTitle.textContent();
  }

  async getEmptyStateDescription() {
    return await this.emptyStateDescription.textContent();
  }

  async clickAddFirstFlashcard() {
    await this.addFirstFlashcardButton.click();
  }

  async clickAddManualFlashcard() {
    await this.addManualFlashcardButton.click();
  }

  async getCandidateCards() {
    const cardElements = await this.page.locator('[data-test-id="candidate-card"]').all();
    return cardElements.map(element => new CandidateCard(this.page, element));
  }

  async getCandidateCard(index: number) {
    const cardElement = this.page.locator('[data-test-id="candidate-card"]').nth(index);
    return new CandidateCard(this.page, cardElement);
  }

  async getCandidateCardsCount() {
    return await this.page.locator('[data-test-id="candidate-card"]').count();
  }

  async getSelectionCount() {
    return await this.selectionCount.textContent();
  }

  async clickSaveFlashcards() {
    await this.saveFlashcardsButton.click();
  }

  async clickReturnHome() {
    await this.returnHomeButton.click();
  }

  async waitForSaveSuccess() {
    await this.page.waitForURL('/generate');
  }

  async isLoadingVisible() {
    return await this.page.locator('text=Ładowanie...').isVisible();
  }
}