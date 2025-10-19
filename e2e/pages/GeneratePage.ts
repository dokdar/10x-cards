import { expect, type Page, type Locator } from '@playwright/test';

export class GeneratePage {
  readonly page: Page;
  readonly sourceTextarea: Locator;
  readonly manualRadio: Locator;
  readonly aiRadio: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sourceTextarea = page.locator('#source-text-input');
    this.manualRadio = page.locator('#manual');
    this.aiRadio = page.locator('#ai');
    this.submitButton = page.getByRole('button', { name: /Generuj przez AI|Utwórz Manualne Fiszki/ });
  }

  async goto() {
    await this.page.goto('/generate', { waitUntil: 'domcontentloaded' });
    await this.page.evaluate(() => new Promise<void>((resolve) => (
      (window as any).requestIdleCallback
        ? (window as any).requestIdleCallback(() => resolve())
        : setTimeout(() => resolve(), 0)
    )));
  }

  async pasteSourceText(text: string) {
    await this.sourceTextarea.waitFor({ state: 'visible' });
    await this.sourceTextarea.click();
    await this.sourceTextarea.fill('');
    await this.sourceTextarea.type(text, { delay: 1 });
    await expect(this.sourceTextarea).toHaveValue(text);
  }

  async selectMode(mode: 'manual' | 'ai') {
    if (mode === 'manual') {
      await this.manualRadio.click();
      await expect(this.manualRadio).toBeChecked();
    } else {
      await this.aiRadio.click();
      await expect(this.aiRadio).toBeChecked();
    }
  }

  async submit() {
    await expect(this.submitButton).toBeEnabled();
    await Promise.all([
      this.page.waitForLoadState('networkidle'),
      this.submitButton.click(),
    ]);
  }
}