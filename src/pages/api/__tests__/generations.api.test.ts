import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH } from "../generations/[id]";
import type { APIContext } from "astro";
import type { GenerationEntity } from "@/types";
import { GenerationDatabaseService } from "@/lib/services/generation-database.service";

// Mock the entire database service module
vi.mock("@/lib/services/generation-database.service");

// Helper to create a mock API context
const createMockContext = (
  overrides: Partial<APIContext> & {
    body?: object;
    mockUser?: { id: string } | null;
  } = {}
): APIContext => {
  const { body = {}, mockUser = { id: "test-user-123" } } = overrides;

  const defaultContext = {
    params: { id: "550e8400-e29b-41d4-a716-446655440000" },
    request: new Request(
      `http://localhost:4321/api/generations/${overrides.params?.id ?? "550e8400-e29b-41d4-a716-446655440000"}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }
    ),
    locals: {
      auth: {
        getSession: vi.fn().mockResolvedValue(mockUser ? { user: mockUser } : null),
      },
      supabase: {} as unknown, // Supabase client is passed to the service constructor
    },
    // Add other necessary properties with default mocks
    cookies: {} as unknown as APIContext["cookies"],
    redirect: vi.fn() as unknown as APIContext["redirect"],
  };

  return { ...defaultContext, ...overrides } as APIContext;
};

const mockGeneration: GenerationEntity = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  user_id: "test-user-123",
  generated_count: 18,
  accepted_unedited_count: null,
  accepted_edited_count: null,
  rejected_count: 0,
  model: "test-model",
  source_text_hash: "hash",
  source_text_length: 1200,
  generation_duration: 5000,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("PATCH /api/generations/[id]", () => {
  let mockDbServiceInstance: vi.Mocked<GenerationDatabaseService>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Since the service is instantiated within the API handler,
    // we need to ensure our mock setup targets the *next* instance that will be created.
    // We can do this by clearing mock instances and then setting up expectations
    // on the mocked class constructor.
    vi.mocked(GenerationDatabaseService).mockClear();

    // We will access the created instance through the mock's metadata
    mockDbServiceInstance = new (vi.mocked(GenerationDatabaseService))() as vi.Mocked<GenerationDatabaseService>;
    vi.mocked(GenerationDatabaseService).mockImplementation(() => mockDbServiceInstance);
  });

  it("should return 401 if user is not authenticated", async () => {
    const context = createMockContext({ mockUser: null });
    const response = await PATCH(context);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 400 for an invalid UUID", async () => {
    const context = createMockContext({ params: { id: "invalid-uuid" } });
    const response = await PATCH(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("Invalid generation ID format.");
  });

  it("should return 400 for an invalid request body", async () => {
    const context = createMockContext({
      body: { accepted_unedited_count: -1 }, // Invalid value
    });
    const response = await PATCH(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("Invalid request body.");
  });

  it("should return 404 if generation is not found", async () => {
    mockDbServiceInstance.getGenerationById.mockResolvedValue(null);
    const context = createMockContext({
      body: {
        accepted_unedited_count: 10,
        accepted_edited_count: 5,
        rejected_count: 3,
      },
    });
    const response = await PATCH(context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toBe("Generation log not found.");
  });

  it("should return 400 if sum of counts does not match", async () => {
    mockDbServiceInstance.getGenerationById.mockResolvedValue(mockGeneration);
    const context = createMockContext({
      body: {
        accepted_unedited_count: 10,
        accepted_edited_count: 5,
        rejected_count: 2, // Sum is 17, but generated_count is 18
      },
    });
    const response = await PATCH(context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain("The sum of counts (17) does not match the number of generated flashcards (18).");
  });

  it("should return 200 and the updated generation on success", async () => {
    mockDbServiceInstance.getGenerationById.mockResolvedValue(mockGeneration);
    const updatedData = {
      ...mockGeneration,
      accepted_unedited_count: 10,
      accepted_edited_count: 5,
      rejected_count: 3,
    };
    mockDbServiceInstance.updateGenerationReviewCounts.mockResolvedValue(updatedData);

    const context = createMockContext({
      body: {
        accepted_unedited_count: 10,
        accepted_edited_count: 5,
        rejected_count: 3, // Sum is 18
      },
    });

    const response = await PATCH(context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe(mockGeneration.id);
    expect(data.accepted_unedited_count).toBe(10);
    expect(data).not.toHaveProperty("user_id");
  });
});
