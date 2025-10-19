import { expect, type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[role="alert"]');
  }

  async goto() {
    await this.page.goto('/login', { waitUntil: 'domcontentloaded' });
    // Ensure Astro client:idle hydration has run before interacting
    await this.page.evaluate(() => new Promise<void>((resolve) => (
      (window as any).requestIdleCallback
        ? (window as any).requestIdleCallback(() => resolve())
        : setTimeout(() => resolve(), 0)
    )));
  }

  async login(email: string, password: string) {
    // Wait for inputs to be visible and ready
    await this.emailInput.waitFor({ state: 'visible' });
    await this.passwordInput.waitFor({ state: 'visible' });

    // Type into controlled inputs character-by-character to trigger onChange
    await this.emailInput.click();
    await this.emailInput.clear();
    await this.emailInput.type(email, { delay: 30 });

    await this.passwordInput.click();
    await this.passwordInput.clear();
    await this.passwordInput.type(password, { delay: 30 });

    // Confirm values are set (React state reflects input)
    await expect(this.emailInput).toHaveValue(email);
    await expect(this.passwordInput).toHaveValue(password);

    // Submit and wait for navigation away from the login page
    await Promise.all([
      this.page.waitForNavigation({ timeout: 60000 }),
      this.loginButton.click(),
    ]);

    // Extra safety: ensure URL changed from /login
    await expect(this.page).not.toHaveURL(/\/login(\/?$)/);
  }

  async waitForNavigation() {
    await this.page.waitForURL('/generate');
  }

  async getErrorMessage() {
    try {
      const isVisible = await this.errorMessage.isVisible();
      if (isVisible) {
        return await this.errorMessage.textContent();
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}