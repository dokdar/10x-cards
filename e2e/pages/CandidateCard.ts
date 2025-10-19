import type { Page, Locator } from '@playwright/test';

export class CandidateCard {
  readonly page: Page;
  readonly card: Locator;
  readonly frontTextarea: Locator;
  readonly backTextarea: Locator;
  readonly acceptSwitch: Locator;
  readonly rejectButton: Locator;

  constructor(page: Page, cardElement?: Locator) {
    this.page = page;
    this.card = cardElement || page.locator('[data-test-id="candidate-card"]').first();
    this.frontTextarea = this.card.locator('[data-test-id="flashcard-front-textarea"]');
    this.backTextarea = this.card.locator('[data-test-id="flashcard-back-textarea"]');
    this.acceptSwitch = this.card.locator('[data-test-id="accept-candidate-switch"]');
    this.rejectButton = this.card.locator('[data-test-id="reject-candidate-button"]');
  }

  async getFrontText() {
    return await this.frontTextarea.inputValue();
  }

  async getBackText() {
    return await this.backTextarea.inputValue();
  }

  async setFrontText(text: string) {
    await this.frontTextarea.clear();
    await this.frontTextarea.fill(text);
  }

  async setBackText(text: string) {
    await this.backTextarea.clear();
    await this.backTextarea.fill(text);
  }

  async accept() {
    const isChecked = await this.acceptSwitch.isChecked();
    if (!isChecked) {
      await this.acceptSwitch.click();
    }
  }

  async unaccept() {
    const isChecked = await this.acceptSwitch.isChecked();
    if (isChecked) {
      await this.acceptSwitch.click();
    }
  }

  async reject() {
    await this.rejectButton.click();
  }

  async isAccepted() {
    return await this.acceptSwitch.isChecked();
  }

  async isVisible() {
    return await this.card.isVisible();
  }

  async waitForVisible() {
    await this.card.waitFor({ state: 'visible' });
  }

  async focus() {
    await this.card.focus();
  }

  async pressKey(key: string) {
    await this.card.press(key);
  }

  async getAriaLabel() {
    return await this.card.getAttribute('aria-label');
  }

  async getSwitchAriaLabel() {
    return await this.acceptSwitch.getAttribute('aria-label');
  }

  async getRejectButtonAriaLabel() {
    return await this.rejectButton.getAttribute('aria-label');
  }
}