import { describe, it, expect } from "vitest";
import {
  CreateFlashcardSchema,
  CreateFlashcardsRequestSchema,
  UpdateFlashcardCommandSchema,
  FlashcardsListQuerySchema,
} from "../flashcards.schema";

describe("CreateFlashcardSchema", () => {
  it("powinien zaakceptować prawidłowe dane fiszki", () => {
    const validData = {
      front: "Pytanie testowe",
      back: "Odpowiedź testowa",
      source: "manual" as const,
    };

    const result = CreateFlashcardSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validData);
    }
  });

  it("powinien zaakceptować wszystkie typy source", () => {
    const sources = ["ai-full", "ai-edited", "manual"] as const;

    sources.forEach((source) => {
      const data = {
        front: "Pytanie",
        back: "Odpowiedź",
        source,
      };
      const result = CreateFlashcardSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  it("powinien zaakceptować opcjonalne generation_id jako UUID", () => {
    const validData = {
      front: "Pytanie",
      back: "Odpowiedź",
      source: "ai-full" as const,
      generation_id: "123e4567-e89b-12d3-a456-426614174000",
    };

    const result = CreateFlashcardSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("powinien zaakceptować generation_id jako null", () => {
    const validData = {
      front: "Pytanie",
      back: "Odpowiedź",
      source: "manual" as const,
      generation_id: null,
    };

    const result = CreateFlashcardSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("powinien odrzucić puste pole front", () => {
    const invalidData = {
      front: "",
      back: "Odpowiedź",
      source: "manual" as const,
    };

    const result = CreateFlashcardSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("wymagane");
    }
  });

  it("powinien odrzucić puste pole back", () => {
    const invalidData = {
      front: "Pytanie",
      back: "",
      source: "manual" as const,
    };

    const result = CreateFlashcardSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("wymagane");
    }
  });

  it("powinien odrzucić front dłuższe niż 200 znaków", () => {
    const invalidData = {
      front: "a".repeat(201),
      back: "Odpowiedź",
      source: "manual" as const,
    };

    const result = CreateFlashcardSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("200");
    }
  });

  it("powinien odrzucić back dłuższe niż 500 znaków", () => {
    const invalidData = {
      front: "Pytanie",
      back: "a".repeat(501),
      source: "manual" as const,
    };

    const result = CreateFlashcardSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("500");
    }
  });

  it("powinien odrzucić nieprawidłowy source", () => {
    const invalidData = {
      front: "Pytanie",
      back: "Odpowiedź",
      source: "invalid-source",
    };

    const result = CreateFlashcardSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("source");
    }
  });

  it("powinien odrzucić nieprawidłowy UUID dla generation_id", () => {
    const invalidData = {
      front: "Pytanie",
      back: "Odpowiedź",
      source: "ai-full" as const,
      generation_id: "invalid-uuid",
    };

    const result = CreateFlashcardSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("UUID");
    }
  });

  it("powinien odrzucić brak wymaganych pól", () => {
    const invalidData = {};

    const result = CreateFlashcardSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.length).toBeGreaterThanOrEqual(3); // front, back, source
    }
  });
});

describe("CreateFlashcardsRequestSchema", () => {
  it("powinien zaakceptować pojedynczą fiszkę", () => {
    const validData = {
      front: "Pytanie",
      back: "Odpowiedź",
      source: "manual" as const,
    };

    const result = CreateFlashcardsRequestSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("powinien zaakceptować tablicę fiszek", () => {
    const validData = [
      {
        front: "Pytanie 1",
        back: "Odpowiedź 1",
        source: "manual" as const,
      },
      {
        front: "Pytanie 2",
        back: "Odpowiedź 2",
        source: "ai-full" as const,
      },
    ];

    const result = CreateFlashcardsRequestSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("powinien odrzucić pustą tablicę", () => {
    const invalidData: unknown[] = [];

    const result = CreateFlashcardsRequestSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("jedna fiszka");
    }
  });

  it("powinien odrzucić tablicę z nieprawidłową fiszką", () => {
    const invalidData = [
      {
        front: "Pytanie 1",
        back: "Odpowiedź 1",
        source: "manual",
      },
      {
        front: "", // Nieprawidłowe - puste
        back: "Odpowiedź 2",
        source: "manual",
      },
    ];

    const result = CreateFlashcardsRequestSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe("UpdateFlashcardCommandSchema", () => {
  it("powinien zaakceptować aktualizację tylko front", () => {
    const validData = {
      front: "Zaktualizowane pytanie",
    };

    const result = UpdateFlashcardCommandSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("powinien zaakceptować aktualizację tylko back", () => {
    const validData = {
      back: "Zaktualizowana odpowiedź",
    };

    const result = UpdateFlashcardCommandSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("powinien zaakceptować aktualizację obu pól", () => {
    const validData = {
      front: "Zaktualizowane pytanie",
      back: "Zaktualizowana odpowiedź",
    };

    const result = UpdateFlashcardCommandSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("powinien zaakceptować pusty obiekt (walidacja wymaga pól odbywa się w API)", () => {
    const emptyData = {};

    const result = UpdateFlashcardCommandSchema.safeParse(emptyData);
    expect(result.success).toBe(true);
  });

  it("powinien odrzucić puste pole front", () => {
    const invalidData = {
      front: "",
    };

    const result = UpdateFlashcardCommandSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("puste");
    }
  });

  it("powinien odrzucić puste pole back", () => {
    const invalidData = {
      back: "",
    };

    const result = UpdateFlashcardCommandSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("puste");
    }
  });

  it("powinien odrzucić front dłuższe niż 200 znaków", () => {
    const invalidData = {
      front: "a".repeat(201),
    };

    const result = UpdateFlashcardCommandSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("200");
    }
  });

  it("powinien odrzucić back dłuższe niż 500 znaków", () => {
    const invalidData = {
      back: "a".repeat(501),
    };

    const result = UpdateFlashcardCommandSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("500");
    }
  });
});

describe("FlashcardsListQuerySchema", () => {
  it("powinien zaakceptować domyślne wartości dla pustego obiektu", () => {
    const emptyData = {};

    const result = FlashcardsListQuerySchema.safeParse(emptyData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.search).toBeUndefined();
    }
  });

  it("powinien zaakceptować prawidłowe parametry paginacji", () => {
    const validData = {
      page: "2",
      limit: "50",
    };

    const result = FlashcardsListQuerySchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(50);
    }
  });

  it("powinien zaakceptować parametr search", () => {
    const validData = {
      search: "TypeScript",
    };

    const result = FlashcardsListQuerySchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.search).toBe("TypeScript");
    }
  });

  it("powinien konwertować stringi na liczby (coerce)", () => {
    const validData = {
      page: "5",
      limit: "10",
    };

    const result = FlashcardsListQuerySchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data.page).toBe("number");
      expect(typeof result.data.limit).toBe("number");
      expect(result.data.page).toBe(5);
      expect(result.data.limit).toBe(10);
    }
  });

  it("powinien odrzucić page < 1", () => {
    const invalidData = {
      page: "0",
    };

    const result = FlashcardsListQuerySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("1");
    }
  });

  it("powinien odrzucić limit < 1", () => {
    const invalidData = {
      limit: "0",
    };

    const result = FlashcardsListQuerySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("1");
    }
  });

  it("powinien odrzucić limit > 100", () => {
    const invalidData = {
      limit: "101",
    };

    const result = FlashcardsListQuerySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("100");
    }
  });

  it("powinien odrzucić search dłuższe niż 200 znaków", () => {
    const invalidData = {
      search: "a".repeat(201),
    };

    const result = FlashcardsListQuerySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("200");
    }
  });

  it("powinien odrzucić nieprawidłowy format liczby dla page", () => {
    const invalidData = {
      page: "invalid",
    };

    const result = FlashcardsListQuerySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("powinien odrzucić liczby zmiennoprzecinkowe dla page", () => {
    const invalidData = {
      page: "2.5",
    };

    const result = FlashcardsListQuerySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
