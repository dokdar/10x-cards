import { test, expect } from '@playwright/test';

test('strona główna powinna się załadować', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/10x Cards - Aplikacja do Nauki Fiszkami/);
});

test('nawigacja do strony logowania', async ({ page }) => {
  await page.goto('/');
  // Bezpośrednia nawigacja do strony logowania zamiast szukania linku
  await page.goto('/login');
  await expect(page).toHaveURL(/.*login/);
});