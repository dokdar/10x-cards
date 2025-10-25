import { describe, it, expect, vi, beforeAll } from "vitest";
import { GET as getFlashcards, POST as createFlashcards } from "../flashcards";
import { GET as getFlashcard, PATCH as updateFlashcard, DELETE as deleteFlashcard } from "../flashcards/[id]";
import type { APIContext } from "astro";
import type { FlashcardEntity } from "@/types";

// Mock feature flags to enable flashcards feature in tests
beforeAll(() => {
  // Mock import.meta.env to enable features
  vi.stubEnv("PUBLIC_ENV_NAME", "local");
});

// Helper to create mock Supabase client
const createMockSupabaseClient = () => {
  const mockData: { current: FlashcardEntity[] | FlashcardEntity | null } = { current: null };
  const mockError: { current: { message?: string; code?: string } | null } = { current: null };
  const mockCount: { current: number | null } = { current: null };

  const createThenable = () => {
    const thenable = {
      then: vi.fn((onFulfilled) => {
        return Promise.resolve({
          data: mockData.current,
          error: mockError.current,
          count: mockCount.current,
        }).then(onFulfilled);
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

    // Make all methods chainable
    thenable.select.mockReturnValue(thenable);
    thenable.insert.mockReturnValue(thenable);
    thenable.update.mockReturnValue(thenable);
    thenable.delete.mockReturnValue(thenable);
    thenable.eq.mockReturnValue(thenable);
    thenable.or.mockReturnValue(thenable);
    thenable.order.mockReturnValue(thenable);
    thenable.range.mockReturnValue(thenable);
    thenable.single.mockReturnValue(thenable);

    return thenable;
  };

  return {
    from: vi.fn(() => createThenable()),
    setMockData: (data: FlashcardEntity[] | FlashcardEntity | null) => {
      mockData.current = data;
    },
    setMockError: (error: { message?: string; code?: string } | null) => {
      mockError.current = error;
    },
    setMockCount: (count: number | null) => {
      mockCount.current = count;
    },
    resetMocks: () => {
      mockData.current = null;
      mockError.current = null;
      mockCount.current = null;
    },
  };
};

// Helper to create mock API context
const createMockContext = (overrides: Partial<APIContext> = {}): APIContext => {
  const mockSupabase = createMockSupabaseClient();

  const defaultContext = {
    params: {},
    request: new Request("http://localhost:4321/api/flashcards"),
    url: new URL("http://localhost:4321/api/flashcards"),
    cookies: {} as unknown,
    redirect: vi.fn() as unknown,
    rewrite: vi.fn() as unknown,
    site: new URL("http://localhost:4321"),
    generator: "test",
    props: {},
    routePattern: "/api/flashcards",
    currentLocale: "en",
    preferredLocale: "en",
    preferredLocaleList: ["en"],
    getActionResult: vi.fn() as unknown,
    callAction: vi.fn() as unknown,
    locals: {
      ...mockSupabase,
      user: { id: "test-user-123", email: "test@example.com" },
      supabase: mockSupabase as unknown,
    },
  };

  // Deep merge locals if provided in overrides
  if (overrides.locals) {
    defaultContext.locals = {
      ...mockSupabase,
      ...overrides.locals,
      supabase: (overrides.locals.supabase ?? mockSupabase) as unknown,
    };
  }

  return {
    ...defaultContext,
    ...overrides,
    locals: defaultContext.locals,
  } as APIContext;
};

const mockFlashcards: FlashcardEntity[] = [
  {
    id: "1",
    user_id: "test-user-123",
    front: "Pytanie 1",
    back: "Odpowiedź 1",
    source: "manual",
    generation_id: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    user_id: "test-user-123",
    front: "Pytanie 2",
    back: "Odpowiedź 2",
    source: "ai-full",
    generation_id: null,
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
  },
];

describe("GET /api/flashcards", () => {
  it("powinien zwrócić 401 gdy użytkownik nie jest zalogowany", async () => {
    const context = createMockContext({
      locals: { user: null } as unknown,
    });

    const response = await getFlashcards(context);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("unauthorized");
    expect(data.message).toBe("Musisz być zalogowany aby przeglądać fiszki");
  });

  it("powinien zwrócić listę fiszek z paginacją", async () => {
    const context = createMockContext();
    context.locals.supabase.setMockData(mockFlashcards);
    context.locals.supabase.setMockCount(2);

    const response = await getFlashcards(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.data[0]).not.toHaveProperty("user_id"); // DTO nie zawiera user_id
    expect(data.pagination).toEqual({
      total_items: 2,
      total_pages: 1,
      current_page: 1,
      limit: 20,
    });
  });

  it("powinien obsłużyć parametry paginacji", async () => {
    const context = createMockContext({
      request: new Request("http://localhost:4321/api/flashcards?page=2&limit=10"),
      url: new URL("http://localhost:4321/api/flashcards?page=2&limit=10"),
    });
    context.locals.supabase.setMockData([]);
    context.locals.supabase.setMockCount(45);

    const response = await getFlashcards(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination).toEqual({
      total_items: 45,
      total_pages: 5,
      current_page: 2,
      limit: 10,
    });
  });

  it("powinien obsłużyć wyszukiwanie", async () => {
    const context = createMockContext({
      request: new Request("http://localhost:4321/api/flashcards?search=TypeScript"),
      url: new URL("http://localhost:4321/api/flashcards?search=TypeScript"),
    });
    context.locals.supabase.setMockData([mockFlashcards[0]]);
    context.locals.supabase.setMockCount(1);

    const response = await getFlashcards(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
  });

  it("powinien zwrócić 400 dla nieprawidłowych parametrów", async () => {
    const context = createMockContext({
      request: new Request("http://localhost:4321/api/flashcards?page=-1"),
      url: new URL("http://localhost:4321/api/flashcards?page=-1"),
    });

    const response = await getFlashcards(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("validation_error");
  });

  it("powinien zwrócić 500 gdy wystąpi błąd bazy danych", async () => {
    const context = createMockContext();
    context.locals.supabase.setMockError({ message: "Database error" });

    const response = await getFlashcards(context);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("internal_error");
  });
});

describe("POST /api/flashcards", () => {
  it("powinien zwrócić 401 gdy użytkownik nie jest zalogowany", async () => {
    const context = createMockContext({
      locals: { user: null } as unknown,
      request: new Request("http://localhost:4321/api/flashcards", {
        method: "POST",
        body: JSON.stringify({ front: "Test", back: "Test", source: "manual" }),
      }),
    });

    const response = await createFlashcards(context);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("unauthorized");
  });

  it("powinien utworzyć pojedynczą fiszkę", async () => {
    const context = createMockContext({
      request: new Request("http://localhost:4321/api/flashcards", {
        method: "POST",
        body: JSON.stringify({ front: "Pytanie", back: "Odpowiedź", source: "manual" }),
      }),
    });

    const createdFlashcard = {
      ...mockFlashcards[0],
      front: "Pytanie",
      back: "Odpowiedź",
    };
    context.locals.supabase.setMockData([createdFlashcard]);

    const response = await createFlashcards(context);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveLength(1);
    expect(data[0].front).toBe("Pytanie");
    expect(data[0]).not.toHaveProperty("user_id");
  });

  it("powinien utworzyć wiele fiszek (bulk)", async () => {
    const context = createMockContext({
      request: new Request("http://localhost:4321/api/flashcards", {
        method: "POST",
        body: JSON.stringify([
          { front: "Pytanie 1", back: "Odpowiedź 1", source: "manual" },
          { front: "Pytanie 2", back: "Odpowiedź 2", source: "ai-full" },
        ]),
      }),
    });

    context.locals.supabase.setMockData(mockFlashcards);

    const response = await createFlashcards(context);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveLength(2);
  });

  it("powinien zwrócić 400 dla nieprawidłowych danych", async () => {
    const context = createMockContext({
      request: new Request("http://localhost:4321/api/flashcards", {
        method: "POST",
        body: JSON.stringify({ front: "", back: "", source: "invalid" }),
      }),
    });

    const response = await createFlashcards(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("validation_error");
  });

  it("powinien zwrócić 500 gdy wystąpi błąd bazy danych", async () => {
    const context = createMockContext({
      request: new Request("http://localhost:4321/api/flashcards", {
        method: "POST",
        body: JSON.stringify({ front: "Test", back: "Test", source: "manual" }),
      }),
    });

    context.locals.supabase.setMockError({ message: "Insert failed" });

    const response = await createFlashcards(context);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("internal_error");
  });
});

describe("GET /api/flashcards/[id]", () => {
  it("powinien zwrócić 401 gdy użytkownik nie jest zalogowany", async () => {
    const context = createMockContext({
      params: { id: "550e8400-e29b-41d4-a716-446655440000" },
      locals: { user: null } as unknown,
    });

    const response = await getFlashcard(context);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("unauthorized");
  });

  it("powinien zwrócić fiszkę dla poprawnego ID", async () => {
    const context = createMockContext({
      params: { id: "550e8400-e29b-41d4-a716-446655440000" },
    });

    context.locals.supabase.setMockData(mockFlashcards[0]);

    const response = await getFlashcard(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe("1");
    expect(data.front).toBe("Pytanie 1");
    expect(data).not.toHaveProperty("user_id");
  });

  it("powinien zwrócić 400 dla nieprawidłowego UUID", async () => {
    const context = createMockContext({
      params: { id: "invalid-id" },
    });

    const response = await getFlashcard(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("bad_request");
    expect(data.message).toBe("Nieprawidłowe ID fiszki");
  });

  it("powinien zwrócić 404 gdy fiszka nie istnieje", async () => {
    const context = createMockContext({
      params: { id: "550e8400-e29b-41d4-a716-446655440000" },
    });

    context.locals.supabase.setMockError({ code: "PGRST116" });

    const response = await getFlashcard(context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("not_found");
  });
});

describe("PATCH /api/flashcards/[id]", () => {
  it("powinien zwrócić 401 gdy użytkownik nie jest zalogowany", async () => {
    const context = createMockContext({
      params: { id: "550e8400-e29b-41d4-a716-446655440000" },
      locals: { user: null } as unknown,
      request: new Request("http://localhost:4321/api/flashcards/550e8400-e29b-41d4-a716-446655440000", {
        method: "PATCH",
        body: JSON.stringify({ front: "Updated" }),
      }),
    });

    const response = await updateFlashcard(context);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("unauthorized");
  });

  it("powinien zaktualizować fiszkę", async () => {
    const context = createMockContext({
      params: { id: "550e8400-e29b-41d4-a716-446655440000" },
      request: new Request("http://localhost:4321/api/flashcards/550e8400-e29b-41d4-a716-446655440000", {
        method: "PATCH",
        body: JSON.stringify({ front: "Zaktualizowane pytanie" }),
      }),
    });

    const updatedFlashcard = {
      ...mockFlashcards[0],
      front: "Zaktualizowane pytanie",
    };

    // First call for getFlashcard check, second for update
    context.locals.supabase.setMockData(mockFlashcards[0]);

    const response = await updateFlashcard(context);

    // Set updated data after first call
    context.locals.supabase.setMockData(updatedFlashcard);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).not.toHaveProperty("user_id");
  });

  it("powinien zwrócić 400 dla nieprawidłowego UUID", async () => {
    const context = createMockContext({
      params: { id: "invalid-id" },
      request: new Request("http://localhost:4321/api/flashcards/invalid-id", {
        method: "PATCH",
        body: JSON.stringify({ front: "Test" }),
      }),
    });

    const response = await updateFlashcard(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("bad_request");
  });

  it("powinien zwrócić 400 gdy nie podano żadnego pola", async () => {
    const context = createMockContext({
      params: { id: "550e8400-e29b-41d4-a716-446655440000" },
      request: new Request("http://localhost:4321/api/flashcards/550e8400-e29b-41d4-a716-446655440000", {
        method: "PATCH",
        body: JSON.stringify({}),
      }),
    });

    const response = await updateFlashcard(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("bad_request");
    expect(data.message).toBe("Wymagane jest co najmniej jedno pole (front lub back)");
  });

  it("powinien zwrócić 400 dla nieprawidłowego JSON", async () => {
    const context = createMockContext({
      params: { id: "550e8400-e29b-41d4-a716-446655440000" },
      request: new Request("http://localhost:4321/api/flashcards/550e8400-e29b-41d4-a716-446655440000", {
        method: "PATCH",
        body: "invalid json",
      }),
    });

    const response = await updateFlashcard(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("bad_request");
    expect(data.message).toBe("Nieprawidłowy format JSON");
  });

  it("powinien zwrócić 404 gdy fiszka nie istnieje", async () => {
    const context = createMockContext({
      params: { id: "550e8400-e29b-41d4-a716-446655440000" },
      request: new Request("http://localhost:4321/api/flashcards/550e8400-e29b-41d4-a716-446655440000", {
        method: "PATCH",
        body: JSON.stringify({ front: "Updated" }),
      }),
    });

    context.locals.supabase.setMockError({ code: "PGRST116" });

    const response = await updateFlashcard(context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("not_found");
  });
});

describe("DELETE /api/flashcards/[id]", () => {
  it("powinien zwrócić 401 gdy użytkownik nie jest zalogowany", async () => {
    const context = createMockContext({
      params: { id: "550e8400-e29b-41d4-a716-446655440000" },
      locals: { user: null } as unknown,
    });

    const response = await deleteFlashcard(context);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("unauthorized");
  });

  it("powinien usunąć fiszkę", async () => {
    const context = createMockContext({
      params: { id: "550e8400-e29b-41d4-a716-446655440000" },
    });

    // First call for getFlashcard check
    context.locals.supabase.setMockData(mockFlashcards[0]);

    const response = await deleteFlashcard(context);

    expect(response.status).toBe(204);
    expect(response.body).toBeNull();
  });

  it("powinien zwrócić 400 dla nieprawidłowego UUID", async () => {
    const context = createMockContext({
      params: { id: "invalid-id" },
    });

    const response = await deleteFlashcard(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("bad_request");
  });

  it("powinien zwrócić 404 gdy fiszka nie istnieje", async () => {
    const context = createMockContext({
      params: { id: "550e8400-e29b-41d4-a716-446655440000" },
    });

    context.locals.supabase.setMockError({ code: "PGRST116" });

    const response = await deleteFlashcard(context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("not_found");
  });
});
