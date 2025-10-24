import { describe, it, expect, vi, beforeEach } from "vitest";
import { FlashcardsService, FlashcardError } from "../flashcards.service";
import type { SupabaseClient } from "@/db/supabase.client";
import type { FlashcardEntity } from "@/types";

// Mock Supabase response type
interface MockResponse {
  data: FlashcardEntity[] | FlashcardEntity | null;
  error: { message?: string; code?: string } | null;
  count?: number | null;
}

// Thenable builder - mimics Supabase's SupabaseQueryBuilder which is promise-like
interface ThenableBuilder extends PromiseLike<MockResponse> {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
}

// Mock Supabase client with proper promise-like chaining
const createMockSupabaseClient = () => {
  let finalResponse: MockResponse = { data: null, error: null, count: null };
  let lastBuilder: ThenableBuilder | null = null;

  const createThenableBuilder = (): ThenableBuilder => {
    // Create a thenable object that acts as both a builder and a promise
    // Capture current finalResponse in closure for this specific chain
    const responseForThisChain = finalResponse;

    const thenable: Partial<ThenableBuilder> = {
      then: vi.fn((onFulfilled) => {
        return Promise.resolve(responseForThisChain).then(onFulfilled);
      }),
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      eq: vi.fn(),
      or: vi.fn(),
      order: vi.fn(),
      range: vi.fn(),
      single: vi.fn(),
    };

    // Make all methods return the same thenable (for chaining)
    thenable.select!.mockReturnValue(thenable);
    thenable.insert!.mockReturnValue(thenable);
    thenable.update!.mockReturnValue(thenable);
    thenable.delete!.mockReturnValue(thenable);
    thenable.eq!.mockReturnValue(thenable);
    thenable.or!.mockReturnValue(thenable);
    thenable.order!.mockReturnValue(thenable);
    thenable.range!.mockReturnValue(thenable);
    thenable.single!.mockReturnValue(thenable);

    return thenable as ThenableBuilder;
  };

  // Create new builder for each .from() call
  const mockFrom = vi.fn().mockImplementation(() => {
    lastBuilder = createThenableBuilder();
    return lastBuilder;
  });

  return {
    from: mockFrom,
    _setResponse: (response: MockResponse) => {
      finalResponse = response;
    },
    _getLastBuilder: () => lastBuilder,
  } as unknown as SupabaseClient & {
    _setResponse: (response: MockResponse) => void;
    _getLastBuilder: () => ThenableBuilder | null;
  };
};

describe("FlashcardsService", () => {
  let service: FlashcardsService;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  const testUserId = "test-user-123";

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    service = new FlashcardsService(mockSupabase as unknown as SupabaseClient);
  });

  describe("listFlashcards", () => {
    it("powinien zwrócić listę fiszek z paginacją", async () => {
      const mockFlashcards: FlashcardEntity[] = [
        {
          id: "1",
          user_id: testUserId,
          front: "Pytanie 1",
          back: "Odpowiedź 1",
          source: "manual",
          generation_id: null,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          user_id: testUserId,
          front: "Pytanie 2",
          back: "Odpowiedź 2",
          source: "ai-full",
          generation_id: null,
          created_at: "2024-01-02T00:00:00Z",
          updated_at: "2024-01-02T00:00:00Z",
        },
      ];

      mockSupabase._setResponse({
        data: mockFlashcards,
        error: null,
        count: 2,
      });

      const result = await service.listFlashcards(testUserId, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).not.toHaveProperty("user_id"); // DTO nie zawiera user_id
      expect(result.pagination.total_items).toBe(2);
      expect(result.pagination.current_page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total_pages).toBe(1);
    });

    it("powinien zastosować wyszukiwanie", async () => {
      mockSupabase._setResponse({
        data: [],
        error: null,
        count: 0,
      });

      await service.listFlashcards(testUserId, { search: "TypeScript" });

      const builder = mockSupabase._getLastBuilder();
      expect(builder?.or).toHaveBeenCalled();
    });

    it("powinien rzucić FlashcardError gdy wystąpi błąd bazy danych", async () => {
      mockSupabase._setResponse({
        data: null,
        error: { message: "Database error" },
        count: null,
      });

      await expect(service.listFlashcards(testUserId, {})).rejects.toThrow(FlashcardError);
      await expect(service.listFlashcards(testUserId, {})).rejects.toThrow("Nie udało się pobrać listy fiszek");
    });

    it("powinien obliczyć poprawnie paginację dla wielu stron", async () => {
      mockSupabase._setResponse({
        data: [],
        error: null,
        count: 45,
      });

      const result = await service.listFlashcards(testUserId, { page: 2, limit: 10 });

      expect(result.pagination.total_items).toBe(45);
      expect(result.pagination.total_pages).toBe(5);
      expect(result.pagination.current_page).toBe(2);
      expect(result.pagination.limit).toBe(10);
    });
  });

  describe("createFlashcards", () => {
    it("powinien utworzyć wiele fiszek", async () => {
      const commands = [
        { front: "Pytanie 1", back: "Odpowiedź 1", source: "manual" as const },
        { front: "Pytanie 2", back: "Odpowiedź 2", source: "ai-full" as const },
      ];

      const mockCreatedFlashcards: FlashcardEntity[] = [
        {
          id: "1",
          user_id: testUserId,
          front: "Pytanie 1",
          back: "Odpowiedź 1",
          source: "manual",
          generation_id: null,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          user_id: testUserId,
          front: "Pytanie 2",
          back: "Odpowiedź 2",
          source: "ai-full",
          generation_id: null,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];

      mockSupabase._setResponse({
        data: mockCreatedFlashcards,
        error: null,
      });

      const result = await service.createFlashcards(testUserId, commands);

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty("user_id");
      expect(result[0].front).toBe("Pytanie 1");

      const builder = mockSupabase._getLastBuilder();
      expect(builder?.insert).toHaveBeenCalled();
    });

    it("powinien dodać user_id do każdej fiszki", async () => {
      const commands = [{ front: "Test", back: "Test", source: "manual" as const }];

      mockSupabase._setResponse({
        data: [
          {
            id: "1",
            user_id: testUserId,
            front: "Test",
            back: "Test",
            source: "manual",
            generation_id: null,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ],
        error: null,
      });

      await service.createFlashcards(testUserId, commands);

      const builder = mockSupabase._getLastBuilder();
      const insertCall = builder?.insert.mock.calls[0][0];
      expect(insertCall[0]).toHaveProperty("user_id", testUserId);
    });

    it("powinien rzucić FlashcardError gdy wystąpi błąd bazy danych", async () => {
      mockSupabase._setResponse({
        data: null,
        error: { message: "Insert failed" },
      });

      await expect(
        service.createFlashcards(testUserId, [{ front: "Test", back: "Test", source: "manual" }])
      ).rejects.toThrow(FlashcardError);
    });

    it("powinien rzucić błąd gdy nie utworzono żadnych fiszek", async () => {
      mockSupabase._setResponse({
        data: [],
        error: null,
      });

      await expect(
        service.createFlashcards(testUserId, [{ front: "Test", back: "Test", source: "manual" }])
      ).rejects.toThrow("Nie utworzono żadnych fiszek");
    });

    it("powinien przyciąć whitespace z pól front i back", async () => {
      const commands = [{ front: "  Test  ", back: "  Test  ", source: "manual" as const }];

      mockSupabase._setResponse({
        data: [
          {
            id: "1",
            user_id: testUserId,
            front: "Test",
            back: "Test",
            source: "manual",
            generation_id: null,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ],
        error: null,
      });

      await service.createFlashcards(testUserId, commands);

      const builder = mockSupabase._getLastBuilder();
      const insertCall = builder?.insert.mock.calls[0][0];
      expect(insertCall[0].front).toBe("Test");
      expect(insertCall[0].back).toBe("Test");
    });
  });

  describe("getFlashcard", () => {
    it("powinien zwrócić fiszkę dla poprawnego ID", async () => {
      const mockFlashcard: FlashcardEntity = {
        id: "test-id",
        user_id: testUserId,
        front: "Pytanie",
        back: "Odpowiedź",
        source: "manual",
        generation_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      mockSupabase._setResponse({
        data: mockFlashcard,
        error: null,
      });

      const result = await service.getFlashcard(testUserId, "test-id");

      expect(result).not.toHaveProperty("user_id");
      expect(result.id).toBe("test-id");
      expect(result.front).toBe("Pytanie");
    });

    it("powinien rzucić FlashcardError not_found gdy fiszka nie istnieje", async () => {
      mockSupabase._setResponse({
        data: null,
        error: { code: "PGRST116" },
      });

      await expect(service.getFlashcard(testUserId, "non-existent-id")).rejects.toThrow(FlashcardError);
      await expect(service.getFlashcard(testUserId, "non-existent-id")).rejects.toThrow(
        "Fiszka nie została znaleziona"
      );

      try {
        await service.getFlashcard(testUserId, "non-existent-id");
      } catch (error) {
        expect((error as FlashcardError).code).toBe("not_found");
      }
    });

    it("powinien sprawdzić czy fiszka należy do użytkownika", async () => {
      mockSupabase._setResponse({
        data: null,
        error: null,
      });

      await expect(service.getFlashcard(testUserId, "test-id")).rejects.toThrow("Fiszka nie została znaleziona");

      const builder = mockSupabase._getLastBuilder();
      expect(builder?.eq).toHaveBeenCalledWith("user_id", testUserId);
    });
  });

  describe("updateFlashcard", () => {
    it("powinien zaktualizować fiszkę", async () => {
      const mockFlashcard: FlashcardEntity = {
        id: "test-id",
        user_id: testUserId,
        front: "Stare pytanie",
        back: "Stara odpowiedź",
        source: "manual",
        generation_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      // getFlashcard check
      mockSupabase._setResponse({
        data: mockFlashcard,
        error: null,
      });

      await service.updateFlashcard(testUserId, "test-id", { front: "Nowe pytanie" });

      const builder = mockSupabase._getLastBuilder();
      expect(builder?.update).toHaveBeenCalled();
    });

    it("powinien przyciąć whitespace z aktualizowanych pól", async () => {
      const mockFlashcard: FlashcardEntity = {
        id: "test-id",
        user_id: testUserId,
        front: "Test",
        back: "Test",
        source: "manual",
        generation_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      mockSupabase._setResponse({
        data: mockFlashcard,
        error: null,
      });

      await service.updateFlashcard(testUserId, "test-id", { front: "  Updated  " });

      const builder = mockSupabase._getLastBuilder();
      const updateCall = builder?.update.mock.calls[0][0];
      expect(updateCall.front).toBe("Updated");
    });

    it("powinien rzucić błąd gdy fiszka nie istnieje", async () => {
      mockSupabase._setResponse({
        data: null,
        error: { code: "PGRST116" },
      });

      await expect(service.updateFlashcard(testUserId, "non-existent", { front: "Test" })).rejects.toThrow(
        "Fiszka nie została znaleziona"
      );
    });
  });

  describe("deleteFlashcard", () => {
    it("powinien usunąć fiszkę", async () => {
      const mockFlashcard: FlashcardEntity = {
        id: "test-id",
        user_id: testUserId,
        front: "Test",
        back: "Test",
        source: "manual",
        generation_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      // getFlashcard check
      mockSupabase._setResponse({
        data: mockFlashcard,
        error: null,
      });

      await service.deleteFlashcard(testUserId, "test-id");

      const builder = mockSupabase._getLastBuilder();
      expect(builder?.delete).toHaveBeenCalled();
    });

    it("powinien rzucić błąd gdy fiszka nie istnieje", async () => {
      mockSupabase._setResponse({
        data: null,
        error: { code: "PGRST116" },
      });

      await expect(service.deleteFlashcard(testUserId, "non-existent")).rejects.toThrow(
        "Fiszka nie została znaleziona"
      );
    });
  });
});
