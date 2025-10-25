import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages";
import type { FlashcardDTO, FlashcardsListResponse } from "../src/types";

/**
 * E2E Tests for Flashcards CRUD API
 *
 * Tests the complete flashcard management API endpoints:
 * - POST /api/flashcards (single and bulk creation)
 * - GET /api/flashcards (list with pagination and search)
 * - GET /api/flashcards/:id (get single flashcard)
 * - PATCH /api/flashcards/:id (update flashcard)
 * - DELETE /api/flashcards/:id (delete flashcard)
 */

test.beforeAll(() => {
  if (!process.env.E2E_USERNAME) {
    throw new Error("E2E_USERNAME is not set");
  }
  if (!process.env.E2E_PASSWORD) {
    throw new Error("E2E_PASSWORD is not set");
  }
});

test.describe("Flashcards API E2E Tests", () => {
  test.describe("Full CRUD Flow", () => {
    test("should complete full lifecycle: create → list → get → update → delete", async ({ page }) => {
      // 1. Login first
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(process.env.E2E_USERNAME as string, process.env.E2E_PASSWORD as string);
      await loginPage.waitForNavigation();

      // Get base URL from page
      const baseURL = new URL(page.url()).origin;

      // 2. CREATE - Post a new flashcard
      const createResponse = await page.request.post(`${baseURL}/api/flashcards`, {
        data: {
          front: "E2E Test Question",
          back: "E2E Test Answer",
          source: "manual",
        },
      });

      expect(createResponse.ok()).toBeTruthy();
      expect(createResponse.status()).toBe(201);

      const createdFlashcards: FlashcardDTO[] = await createResponse.json();
      expect(Array.isArray(createdFlashcards)).toBeTruthy();
      expect(createdFlashcards.length).toBe(1);

      const flashcard = createdFlashcards[0];
      expect(flashcard).toHaveProperty("id");
      expect(flashcard.front).toBe("E2E Test Question");
      expect(flashcard.back).toBe("E2E Test Answer");
      expect(flashcard.source).toBe("manual");
      expect(flashcard).not.toHaveProperty("user_id"); // Should be excluded from DTO

      const flashcardId = flashcard.id;

      // 3. LIST - Get list of flashcards (should work and return valid response)
      const listResponse = await page.request.get(`${baseURL}/api/flashcards`);

      expect(listResponse.ok()).toBeTruthy();
      expect(listResponse.status()).toBe(200);

      const listData: FlashcardsListResponse = await listResponse.json();
      expect(listData).toHaveProperty("data");
      expect(listData).toHaveProperty("pagination");
      expect(Array.isArray(listData.data)).toBeTruthy();
      expect(listData.pagination.total_items).toBeGreaterThanOrEqual(1); // At least our flashcard exists

      // Verify list structure (don't assume our flashcard is on first page due to sorting/other data)
      if (listData.data.length > 0) {
        const sampleFlashcard = listData.data[0];
        expect(sampleFlashcard).toHaveProperty("id");
        expect(sampleFlashcard).toHaveProperty("front");
        expect(sampleFlashcard).toHaveProperty("back");
        expect(sampleFlashcard).not.toHaveProperty("user_id");
      }

      // 4. GET - Retrieve single flashcard by ID
      const getResponse = await page.request.get(`${baseURL}/api/flashcards/${flashcardId}`);

      expect(getResponse.ok()).toBeTruthy();
      expect(getResponse.status()).toBe(200);

      const retrievedFlashcard: FlashcardDTO = await getResponse.json();
      expect(retrievedFlashcard.id).toBe(flashcardId);
      expect(retrievedFlashcard.front).toBe("E2E Test Question");
      expect(retrievedFlashcard.back).toBe("E2E Test Answer");

      // 5. UPDATE - Patch the flashcard
      const updateResponse = await page.request.patch(`${baseURL}/api/flashcards/${flashcardId}`, {
        data: {
          front: "E2E Test Question - Updated",
          back: "E2E Test Answer - Updated",
        },
      });

      expect(updateResponse.ok()).toBeTruthy();
      expect(updateResponse.status()).toBe(200);

      const updatedFlashcard: FlashcardDTO = await updateResponse.json();
      expect(updatedFlashcard.id).toBe(flashcardId);
      expect(updatedFlashcard.front).toBe("E2E Test Question - Updated");
      expect(updatedFlashcard.back).toBe("E2E Test Answer - Updated");
      expect(updatedFlashcard.source).toBe("manual"); // Should remain unchanged

      // 6. DELETE - Remove the flashcard
      const deleteResponse = await page.request.delete(`${baseURL}/api/flashcards/${flashcardId}`);

      expect(deleteResponse.ok()).toBeTruthy();
      expect(deleteResponse.status()).toBe(204);

      // No body expected for 204 No Content
      const deleteBody = await deleteResponse.text();
      expect(deleteBody).toBe("");

      // 7. VERIFY DELETION - Try to get the deleted flashcard (should return 404)
      const getDeletedResponse = await page.request.get(`${baseURL}/api/flashcards/${flashcardId}`);

      expect(getDeletedResponse.status()).toBe(404);

      const errorData = await getDeletedResponse.json();
      expect(errorData.error).toBe("not_found");
      expect(errorData.message).toContain("Fiszka nie została znaleziona");
    });

    test("should handle partial updates (only front)", async ({ page }) => {
      // Login
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(process.env.E2E_USERNAME as string, process.env.E2E_PASSWORD as string);
      await loginPage.waitForNavigation();

      const baseURL = new URL(page.url()).origin;

      // Create flashcard
      const createResponse = await page.request.post(`${baseURL}/api/flashcards`, {
        data: {
          front: "Original Front",
          back: "Original Back",
          source: "manual",
        },
      });

      const [flashcard] = await createResponse.json();
      const flashcardId = flashcard.id;

      // Update only front
      const updateResponse = await page.request.patch(`${baseURL}/api/flashcards/${flashcardId}`, {
        data: {
          front: "Updated Front Only",
        },
      });

      expect(updateResponse.ok()).toBeTruthy();
      const updated: FlashcardDTO = await updateResponse.json();
      expect(updated.front).toBe("Updated Front Only");
      expect(updated.back).toBe("Original Back"); // Should remain unchanged

      // Cleanup
      await page.request.delete(`${baseURL}/api/flashcards/${flashcardId}`);
    });

    test("should handle partial updates (only back)", async ({ page }) => {
      // Login
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(process.env.E2E_USERNAME as string, process.env.E2E_PASSWORD as string);
      await loginPage.waitForNavigation();

      const baseURL = new URL(page.url()).origin;

      // Create flashcard
      const createResponse = await page.request.post(`${baseURL}/api/flashcards`, {
        data: {
          front: "Original Front",
          back: "Original Back",
          source: "manual",
        },
      });

      const [flashcard] = await createResponse.json();
      const flashcardId = flashcard.id;

      // Update only back
      const updateResponse = await page.request.patch(`${baseURL}/api/flashcards/${flashcardId}`, {
        data: {
          back: "Updated Back Only",
        },
      });

      expect(updateResponse.ok()).toBeTruthy();
      const updated: FlashcardDTO = await updateResponse.json();
      expect(updated.front).toBe("Original Front"); // Should remain unchanged
      expect(updated.back).toBe("Updated Back Only");

      // Cleanup
      await page.request.delete(`${baseURL}/api/flashcards/${flashcardId}`);
    });
  });

  test.describe("Bulk Creation", () => {
    test("should create multiple flashcards at once", async ({ page }) => {
      // Login
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(process.env.E2E_USERNAME as string, process.env.E2E_PASSWORD as string);
      await loginPage.waitForNavigation();

      const baseURL = new URL(page.url()).origin;

      // Create 5 flashcards in bulk
      const bulkData = [
        { front: "Bulk Q1", back: "Bulk A1", source: "manual" as const },
        { front: "Bulk Q2", back: "Bulk A2", source: "manual" as const },
        { front: "Bulk Q3", back: "Bulk A3", source: "manual" as const },
        { front: "Bulk Q4", back: "Bulk A4", source: "manual" as const },
        { front: "Bulk Q5", back: "Bulk A5", source: "manual" as const },
      ];

      const createResponse = await page.request.post(`${baseURL}/api/flashcards`, {
        data: bulkData,
      });

      expect(createResponse.ok()).toBeTruthy();
      expect(createResponse.status()).toBe(201);

      const createdFlashcards: FlashcardDTO[] = await createResponse.json();
      expect(createdFlashcards.length).toBe(5);

      // Verify each flashcard was created correctly
      for (const data of bulkData) {
        const created = createdFlashcards.find((f) => f.front === data.front);
        expect(created).toBeDefined();
        expect(created?.back).toBe(data.back);
        expect(created?.source).toBe(data.source);
        expect(created).toHaveProperty("id");
        expect(created).toHaveProperty("created_at");
        expect(created).toHaveProperty("updated_at");
      }

      // Cleanup - delete all created flashcards
      for (const flashcard of createdFlashcards) {
        await page.request.delete(`${baseURL}/api/flashcards/${flashcard.id}`);
      }
    });

    test("should create flashcards with different sources", async ({ page }) => {
      // Login
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(process.env.E2E_USERNAME as string, process.env.E2E_PASSWORD as string);
      await loginPage.waitForNavigation();

      const baseURL = new URL(page.url()).origin;

      // Create flashcards with different sources
      const bulkData = [
        { front: "Manual Q", back: "Manual A", source: "manual" as const },
        { front: "AI Full Q", back: "AI Full A", source: "ai-full" as const },
        { front: "AI Edited Q", back: "AI Edited A", source: "ai-edited" as const },
      ];

      const createResponse = await page.request.post(`${baseURL}/api/flashcards`, {
        data: bulkData,
      });

      expect(createResponse.ok()).toBeTruthy();
      const createdFlashcards: FlashcardDTO[] = await createResponse.json();
      expect(createdFlashcards.length).toBe(3);

      // Verify sources
      expect(createdFlashcards.find((f) => f.source === "manual")).toBeDefined();
      expect(createdFlashcards.find((f) => f.source === "ai-full")).toBeDefined();
      expect(createdFlashcards.find((f) => f.source === "ai-edited")).toBeDefined();

      // Cleanup
      for (const flashcard of createdFlashcards) {
        await page.request.delete(`${baseURL}/api/flashcards/${flashcard.id}`);
      }
    });
  });

  test.describe("Pagination", () => {
    test("should paginate flashcards correctly", async ({ page }) => {
      // Login
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(process.env.E2E_USERNAME as string, process.env.E2E_PASSWORD as string);
      await loginPage.waitForNavigation();

      const baseURL = new URL(page.url()).origin;

      // Create 25 flashcards for pagination testing
      const flashcardsToCreate = Array.from({ length: 25 }, (_, i) => ({
        front: `Pagination Test Q${i + 1}`,
        back: `Pagination Test A${i + 1}`,
        source: "manual" as const,
      }));

      const createResponse = await page.request.post(`${baseURL}/api/flashcards`, {
        data: flashcardsToCreate,
      });

      expect(createResponse.ok()).toBeTruthy();
      const createdFlashcards: FlashcardDTO[] = await createResponse.json();
      expect(createdFlashcards.length).toBe(25);

      try {
        // Use search to find only our test flashcards (isolate from other data in DB)
        const searchTerm = "Pagination Test";

        // Test page 1 with limit 10
        const page1Response = await page.request.get(`${baseURL}/api/flashcards?search=${searchTerm}&page=1&limit=10`);
        expect(page1Response.ok()).toBeTruthy();

        const page1Data: FlashcardsListResponse = await page1Response.json();
        expect(page1Data.data.length).toBe(10);
        expect(page1Data.pagination.current_page).toBe(1);
        expect(page1Data.pagination.limit).toBe(10);
        expect(page1Data.pagination.total_items).toBe(25); // Exactly our 25 test flashcards
        expect(page1Data.pagination.total_pages).toBe(3); // 25 items / 10 per page = 3 pages

        // Verify all results contain our search term
        expect(page1Data.data.every((f) => f.front.includes(searchTerm))).toBeTruthy();

        // Test page 2 with limit 10
        const page2Response = await page.request.get(`${baseURL}/api/flashcards?search=${searchTerm}&page=2&limit=10`);
        expect(page2Response.ok()).toBeTruthy();

        const page2Data: FlashcardsListResponse = await page2Response.json();
        expect(page2Data.data.length).toBe(10);
        expect(page2Data.pagination.current_page).toBe(2);

        // Verify no overlap between page 1 and page 2
        const page1Ids = new Set(page1Data.data.map((f) => f.id));
        const page2Ids = new Set(page2Data.data.map((f) => f.id));
        const intersection = [...page1Ids].filter((id) => page2Ids.has(id));
        expect(intersection.length).toBe(0); // No duplicates

        // Test page 3 with limit 10
        const page3Response = await page.request.get(`${baseURL}/api/flashcards?search=${searchTerm}&page=3&limit=10`);
        expect(page3Response.ok()).toBeTruthy();

        const page3Data: FlashcardsListResponse = await page3Response.json();
        expect(page3Data.data.length).toBe(5); // Remaining 5 from our 25 (25 - 10 - 10 = 5)
        expect(page3Data.pagination.current_page).toBe(3);

        // Test custom limit (5 items per page)
        const customLimitResponse = await page.request.get(
          `${baseURL}/api/flashcards?search=${searchTerm}&page=1&limit=5`
        );
        expect(customLimitResponse.ok()).toBeTruthy();

        const customLimitData: FlashcardsListResponse = await customLimitResponse.json();
        expect(customLimitData.data.length).toBe(5);
        expect(customLimitData.pagination.limit).toBe(5);
        expect(customLimitData.pagination.total_pages).toBe(5); // 25 items / 5 per page = 5 pages
      } finally {
        // Cleanup - delete all created flashcards
        for (const flashcard of createdFlashcards) {
          await page.request.delete(`${baseURL}/api/flashcards/${flashcard.id}`);
        }
      }
    });

    test("should handle default pagination parameters", async ({ page }) => {
      // Login
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(process.env.E2E_USERNAME as string, process.env.E2E_PASSWORD as string);
      await loginPage.waitForNavigation();

      const baseURL = new URL(page.url()).origin;

      // Get flashcards without pagination params (should use defaults)
      const response = await page.request.get(`${baseURL}/api/flashcards`);
      expect(response.ok()).toBeTruthy();

      const data: FlashcardsListResponse = await response.json();
      expect(data.pagination.current_page).toBe(1); // Default page
      expect(data.pagination.limit).toBe(20); // Default limit
      expect(data.data.length).toBeLessThanOrEqual(20);
    });

    test("should reject invalid pagination parameters", async ({ page }) => {
      // Login
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(process.env.E2E_USERNAME as string, process.env.E2E_PASSWORD as string);
      await loginPage.waitForNavigation();

      const baseURL = new URL(page.url()).origin;

      // Test page < 1
      const invalidPageResponse = await page.request.get(`${baseURL}/api/flashcards?page=0`);
      expect(invalidPageResponse.status()).toBe(400);
      const invalidPageError = await invalidPageResponse.json();
      expect(invalidPageError.error).toBe("validation_error");

      // Test limit > 100
      const invalidLimitResponse = await page.request.get(`${baseURL}/api/flashcards?limit=101`);
      expect(invalidLimitResponse.status()).toBe(400);
      const invalidLimitError = await invalidLimitResponse.json();
      expect(invalidLimitError.error).toBe("validation_error");

      // Test negative limit
      const negativeLimitResponse = await page.request.get(`${baseURL}/api/flashcards?limit=-5`);
      expect(negativeLimitResponse.status()).toBe(400);
      const negativeLimitError = await negativeLimitResponse.json();
      expect(negativeLimitError.error).toBe("validation_error");
    });
  });

  test.describe("Search", () => {
    test("should search flashcards by front text", async ({ page }) => {
      // Login
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(process.env.E2E_USERNAME as string, process.env.E2E_PASSWORD as string);
      await loginPage.waitForNavigation();

      const baseURL = new URL(page.url()).origin;

      // Create flashcards with unique searchable terms
      const flashcardsToCreate = [
        { front: "What is TypeScript?", back: "A typed superset of JavaScript", source: "manual" as const },
        { front: "What is React?", back: "A JavaScript library for building UIs", source: "manual" as const },
        { front: "What is Node.js?", back: "JavaScript runtime built on Chrome's V8", source: "manual" as const },
        { front: "What is Astro?", back: "A modern web framework", source: "manual" as const },
      ];

      const createResponse = await page.request.post(`${baseURL}/api/flashcards`, {
        data: flashcardsToCreate,
      });

      const createdFlashcards: FlashcardDTO[] = await createResponse.json();

      try {
        // Search for "TypeScript" in front
        const searchResponse = await page.request.get(`${baseURL}/api/flashcards?search=TypeScript`);
        expect(searchResponse.ok()).toBeTruthy();

        const searchData: FlashcardsListResponse = await searchResponse.json();
        expect(searchData.data.length).toBeGreaterThanOrEqual(1);

        const typeScriptCard = searchData.data.find((f) => f.front.includes("TypeScript"));
        expect(typeScriptCard).toBeDefined();
        expect(typeScriptCard?.front).toBe("What is TypeScript?");

        // Search for "React"
        const reactSearchResponse = await page.request.get(`${baseURL}/api/flashcards?search=React`);
        expect(reactSearchResponse.ok()).toBeTruthy();

        const reactSearchData: FlashcardsListResponse = await reactSearchResponse.json();
        expect(reactSearchData.data.length).toBeGreaterThanOrEqual(1);

        const reactCard = reactSearchData.data.find((f) => f.front.includes("React"));
        expect(reactCard).toBeDefined();
      } finally {
        // Cleanup
        for (const flashcard of createdFlashcards) {
          await page.request.delete(`${baseURL}/api/flashcards/${flashcard.id}`);
        }
      }
    });

    test("should search flashcards by back text", async ({ page }) => {
      // Login
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(process.env.E2E_USERNAME as string, process.env.E2E_PASSWORD as string);
      await loginPage.waitForNavigation();

      const baseURL = new URL(page.url()).origin;

      // Create flashcards with unique searchable terms in back
      const flashcardsToCreate = [
        { front: "Q1", back: "Answer with SEARCHTERM1 in it", source: "manual" as const },
        { front: "Q2", back: "Answer with SEARCHTERM2 in it", source: "manual" as const },
        { front: "Q3", back: "Different answer here", source: "manual" as const },
      ];

      const createResponse = await page.request.post(`${baseURL}/api/flashcards`, {
        data: flashcardsToCreate,
      });

      const createdFlashcards: FlashcardDTO[] = await createResponse.json();

      try {
        // Search for "SEARCHTERM1" (should find it in back)
        const searchResponse = await page.request.get(`${baseURL}/api/flashcards?search=SEARCHTERM1`);
        expect(searchResponse.ok()).toBeTruthy();

        const searchData: FlashcardsListResponse = await searchResponse.json();
        expect(searchData.data.length).toBeGreaterThanOrEqual(1);

        const foundCard = searchData.data.find((f) => f.back.includes("SEARCHTERM1"));
        expect(foundCard).toBeDefined();
        expect(foundCard?.back).toContain("SEARCHTERM1");
      } finally {
        // Cleanup
        for (const flashcard of createdFlashcards) {
          await page.request.delete(`${baseURL}/api/flashcards/${flashcard.id}`);
        }
      }
    });

    test("should return empty results for non-matching search", async ({ page }) => {
      // Login
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(process.env.E2E_USERNAME as string, process.env.E2E_PASSWORD as string);
      await loginPage.waitForNavigation();

      const baseURL = new URL(page.url()).origin;

      // Search for something that definitely doesn't exist
      const searchResponse = await page.request.get(
        `${baseURL}/api/flashcards?search=NONEXISTENT_UNIQUE_STRING_XYZ123`
      );

      expect(searchResponse.ok()).toBeTruthy();

      const searchData: FlashcardsListResponse = await searchResponse.json();

      // Should return empty array, not an error
      expect(Array.isArray(searchData.data)).toBeTruthy();
      expect(searchData.pagination.total_items).toBe(0);
      expect(searchData.pagination.total_pages).toBe(0);
    });

    test("should handle case-insensitive search", async ({ page }) => {
      // Login
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(process.env.E2E_USERNAME as string, process.env.E2E_PASSWORD as string);
      await loginPage.waitForNavigation();

      const baseURL = new URL(page.url()).origin;

      // Create flashcard with mixed case
      const createResponse = await page.request.post(`${baseURL}/api/flashcards`, {
        data: {
          front: "What is PostgreSQL?",
          back: "A powerful relational database",
          source: "manual",
        },
      });

      const [flashcard]: FlashcardDTO[] = await createResponse.json();

      try {
        // Search with lowercase (should still find it due to case-insensitive search)
        const searchResponse = await page.request.get(`${baseURL}/api/flashcards?search=postgresql`);
        expect(searchResponse.ok()).toBeTruthy();

        const searchData: FlashcardsListResponse = await searchResponse.json();
        const foundCard = searchData.data.find((f) => f.id === flashcard.id);
        expect(foundCard).toBeDefined();

        // Search with uppercase
        const upperSearchResponse = await page.request.get(`${baseURL}/api/flashcards?search=POSTGRESQL`);
        expect(upperSearchResponse.ok()).toBeTruthy();

        const upperSearchData: FlashcardsListResponse = await upperSearchResponse.json();
        const foundUpperCard = upperSearchData.data.find((f) => f.id === flashcard.id);
        expect(foundUpperCard).toBeDefined();
      } finally {
        // Cleanup
        await page.request.delete(`${baseURL}/api/flashcards/${flashcard.id}`);
      }
    });

    test("should combine search with pagination", async ({ page }) => {
      // Login
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(process.env.E2E_USERNAME as string, process.env.E2E_PASSWORD as string);
      await loginPage.waitForNavigation();

      const baseURL = new URL(page.url()).origin;

      // Create multiple flashcards with common search term
      const flashcardsToCreate = Array.from({ length: 15 }, (_, i) => ({
        front: `JavaScript Question ${i + 1}`,
        back: `JavaScript Answer ${i + 1}`,
        source: "manual" as const,
      }));

      const createResponse = await page.request.post(`${baseURL}/api/flashcards`, {
        data: flashcardsToCreate,
      });

      const createdFlashcards: FlashcardDTO[] = await createResponse.json();

      try {
        // Search for "JavaScript" with pagination
        const page1Response = await page.request.get(`${baseURL}/api/flashcards?search=JavaScript&page=1&limit=10`);
        expect(page1Response.ok()).toBeTruthy();

        const page1Data: FlashcardsListResponse = await page1Response.json();
        expect(page1Data.data.length).toBe(10);
        expect(page1Data.pagination.current_page).toBe(1);
        expect(page1Data.pagination.total_items).toBeGreaterThanOrEqual(15);

        // Get page 2
        const page2Response = await page.request.get(`${baseURL}/api/flashcards?search=JavaScript&page=2&limit=10`);
        expect(page2Response.ok()).toBeTruthy();

        const page2Data: FlashcardsListResponse = await page2Response.json();
        expect(page2Data.data.length).toBeGreaterThanOrEqual(5); // At least 5 from our 15
        expect(page2Data.pagination.current_page).toBe(2);
      } finally {
        // Cleanup
        for (const flashcard of createdFlashcards) {
          await page.request.delete(`${baseURL}/api/flashcards/${flashcard.id}`);
        }
      }
    });
  });

  test.describe("Error Handling", () => {
    test("should return 404 for non-existent flashcard", async ({ page }) => {
      // Login
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(process.env.E2E_USERNAME as string, process.env.E2E_PASSWORD as string);
      await loginPage.waitForNavigation();

      const baseURL = new URL(page.url()).origin;

      // Try to get non-existent flashcard (valid UUID v4 format but doesn't exist)
      const nonExistentId = "12345678-1234-4567-89ab-123456789012";
      const getResponse = await page.request.get(`${baseURL}/api/flashcards/${nonExistentId}`);

      expect(getResponse.status()).toBe(404);
      const errorData = await getResponse.json();
      expect(errorData.error).toBe("not_found");
      expect(errorData.message).toContain("Fiszka nie została znaleziona");
    });

    test("should return 400 for invalid UUID format", async ({ page }) => {
      // Login
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(process.env.E2E_USERNAME as string, process.env.E2E_PASSWORD as string);
      await loginPage.waitForNavigation();

      const baseURL = new URL(page.url()).origin;

      // Try with invalid UUID
      const invalidId = "not-a-valid-uuid";
      const getResponse = await page.request.get(`${baseURL}/api/flashcards/${invalidId}`);

      expect(getResponse.status()).toBe(400);
      const errorData = await getResponse.json();
      expect(errorData.error).toBe("bad_request");
    });

    test("should return 400 for validation errors on create", async ({ page }) => {
      // Login
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(process.env.E2E_USERNAME as string, process.env.E2E_PASSWORD as string);
      await loginPage.waitForNavigation();

      const baseURL = new URL(page.url()).origin;

      // Try to create flashcard with missing required fields
      const createResponse = await page.request.post(`${baseURL}/api/flashcards`, {
        data: {
          front: "Only front provided",
          // Missing back and source
        },
      });

      expect(createResponse.status()).toBe(400);
      const errorData = await createResponse.json();
      expect(errorData.error).toBe("validation_error");
      expect(errorData).toHaveProperty("validation_errors");
      expect(Array.isArray(errorData.validation_errors)).toBeTruthy();
    });

    test("should return 400 when updating with no fields", async ({ page }) => {
      // Login
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(process.env.E2E_USERNAME as string, process.env.E2E_PASSWORD as string);
      await loginPage.waitForNavigation();

      const baseURL = new URL(page.url()).origin;

      // Create a flashcard first
      const createResponse = await page.request.post(`${baseURL}/api/flashcards`, {
        data: {
          front: "Test",
          back: "Test",
          source: "manual",
        },
      });

      const [flashcard]: FlashcardDTO[] = await createResponse.json();

      try {
        // Try to update with empty object
        const updateResponse = await page.request.patch(`${baseURL}/api/flashcards/${flashcard.id}`, {
          data: {},
        });

        expect(updateResponse.status()).toBe(400);
        const errorData = await updateResponse.json();
        expect(errorData.error).toBe("bad_request");
        expect(errorData.message).toContain("co najmniej jedno pole");
      } finally {
        // Cleanup
        await page.request.delete(`${baseURL}/api/flashcards/${flashcard.id}`);
      }
    });

    test("should return 401 when not authenticated", async ({ page }) => {
      // Don't login - try to access API without auth
      const baseURL = "http://localhost:3000"; // Use default base URL

      const getResponse = await page.request.get(`${baseURL}/api/flashcards`);
      expect(getResponse.status()).toBe(401);

      const errorData = await getResponse.json();
      expect(errorData.error).toBe("unauthorized");
    });
  });
});
