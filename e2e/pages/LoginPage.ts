import { type Page, type Locator } from "@playwright/test";

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
    await this.page.goto("/login", { waitUntil: "domcontentloaded" });
    // Wait for network idle and form elements to be ready
    await this.page.waitForLoadState("networkidle");
    await this.emailInput.waitFor({ state: "visible" });
    await this.passwordInput.waitFor({ state: "visible" });
  }

  async login(email: string, password: string) {
    // Wait for inputs to be visible and ready
    await this.emailInput.waitFor({ state: "visible" });
    await this.passwordInput.waitFor({ state: "visible" });

    // Fill inputs atomically to avoid autofill interference or partial typing
    await this.emailInput.click();
    await this.emailInput.fill(email);

    await this.passwordInput.click();
    await this.passwordInput.fill(password);

    // Debug actual values
    let emailValue = await this.emailInput.inputValue();
    let passwordValue = await this.passwordInput.inputValue();
    console.log("[LoginPage] email value after fill:", emailValue);
    console.log("[LoginPage] password filled");

    // If values mismatch (e.g., browser autofill), force-clear and re-fill
    if (emailValue !== email) {
      console.log("[LoginPage] email mismatch, refilling");
      await this.emailInput.focus();
      await this.emailInput.fill("");
      await this.emailInput.fill(email);
      emailValue = await this.emailInput.inputValue();
      console.log("[LoginPage] email value after refill:", emailValue);
    }

    if (passwordValue !== password) {
      console.log("[LoginPage] password mismatch, refilling");
      await this.passwordInput.focus();
      await this.passwordInput.fill("");
      await this.passwordInput.fill(password);
      passwordValue = await this.passwordInput.inputValue();
      console.log("[LoginPage] password refilled");
    }

    // Submit (navigation oczekiwane poza metodą przez waitForNavigation)
    await this.loginButton.click();
  }

  async waitForNavigation() {
    // Czekaj aż URL przestanie być /login lub pokaże się błąd
    const leaveLogin = this.page.waitForURL(/^(?!.*\/login\/?$).*/, { timeout: 30000 }).catch(() => null);
    const errorVisible = this.errorMessage.waitFor({ state: "visible", timeout: 30000 }).catch(() => null);

    await Promise.race([leaveLogin, errorVisible]);

    // Jeśli wciąż jesteśmy na /login, zraportuj powód
    if (this.page.url().includes("/login")) {
      const errText = await this.getErrorMessage();
      throw new Error(`[LoginPage] Redirect failed; still on ${this.page.url()}. Error: ${errText ?? "none"}`);
    }

    // Upewnij się, że docelowa strona się załadowała
    await this.page.waitForLoadState("domcontentloaded");
  }

  async getErrorMessage() {
    try {
      const isVisible = await this.errorMessage.isVisible();
      if (isVisible) {
        return await this.errorMessage.textContent();
      }
      return null;
    } catch {
      return null;
    }
  }
}
