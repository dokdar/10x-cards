import { expect, type Page, type Locator } from "@playwright/test";

export class GeneratePage {
  readonly page: Page;
  readonly sourceTextarea: Locator;
  readonly manualRadio: Locator;
  readonly aiRadio: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sourceTextarea = page.locator("#source-text-input");
    this.manualRadio = page.locator("#manual");
    this.aiRadio = page.locator("#ai");
    this.submitButton = page.getByRole("button", {
      name: /Generuj przez AI|Utwórz Manualne Fiszki|Generowanie przez AI\.\.\.|Przygotowywanie\.\.\./,
    });
  }

  async goto() {
    await this.page.goto("/generate", { waitUntil: "domcontentloaded" });
    // Wait for network idle and form elements to be ready
    await this.page.waitForLoadState("networkidle");
    await this.sourceTextarea.waitFor({ state: "visible" });
    await this.manualRadio.waitFor({ state: "visible" });
    await this.aiRadio.waitFor({ state: "visible" });
  }

  async pasteSourceText(text: string) {
    await this.sourceTextarea.waitFor({ state: "visible" });
    await this.sourceTextarea.click();
    await this.sourceTextarea.fill(text);
    await expect(this.sourceTextarea).toHaveValue(text);
  }

  async selectMode(mode: "manual" | "ai") {
    if (mode === "manual") {
      await this.manualRadio.click();
      await expect(this.manualRadio).toBeChecked();
    } else {
      await this.aiRadio.click();
      await expect(this.aiRadio).toBeChecked();
    }
  }

  async submit() {
    await expect(this.submitButton).toBeEnabled();
    await Promise.all([this.page.waitForLoadState("networkidle"), this.submitButton.click()]);
  }
}
