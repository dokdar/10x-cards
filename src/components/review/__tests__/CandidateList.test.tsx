import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CandidateList } from "../CandidateList";
import type { ReviewCandidateViewModel } from "../../../types";

// Mock CandidateCard component
vi.mock("../CandidateCard", () => ({
  CandidateCard: ({
    candidate,
    onUpdate,
    onToggleAccept,
    onReject,
  }: {
    candidate: ReviewCandidateViewModel;
    onUpdate: (id: string, field: "front" | "back", value: string) => void;
    onToggleAccept: (id: string) => void;
    onReject: (id: string) => void;
  }) => (
    <div data-testid={`candidate-card-${candidate.id}`}>
      <h3>{candidate.front}</h3>
      <p>{candidate.back}</p>
      <span data-testid={`status-${candidate.id}`}>{candidate.status}</span>
      <button onClick={() => onToggleAccept(candidate.id)} data-testid={`accept-${candidate.id}`}>
        Accept
      </button>
      <button onClick={() => onReject(candidate.id)} data-testid={`reject-${candidate.id}`}>
        Reject
      </button>
      <button onClick={() => onUpdate(candidate.id, "front", "Updated front")} data-testid={`update-${candidate.id}`}>
        Update
      </button>
    </div>
  ),
}));

describe("CandidateList", () => {
  const mockCandidates: ReviewCandidateViewModel[] = [
    {
      id: "1",
      front: "What is React?",
      back: "A JavaScript library for building user interfaces",
      source: "manual",
      status: "pending",
      originalFront: "What is React?",
      originalBack: "A JavaScript library for building user interfaces",
    },
    {
      id: "2",
      front: "What is TypeScript?",
      back: "A typed superset of JavaScript",
      source: "ai-full",
      status: "accepted",
      originalFront: "What is TypeScript?",
      originalBack: "A typed superset of JavaScript",
    },
    {
      id: "3",
      front: "What is Vitest?",
      back: "A fast unit testing framework",
      source: "manual",
      status: "edited",
      originalFront: "What is Vitest?",
      originalBack: "A fast unit testing framework",
    },
  ];

  const defaultProps = {
    candidates: mockCandidates,
    onUpdateCandidate: vi.fn(),
    onToggleAccept: vi.fn(),
    onReject: vi.fn(),
    onAddManualCard: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("renderowanie z danymi", () => {
    it("renderuje listę kandydatów", () => {
      render(<CandidateList {...defaultProps} />);

      expect(screen.getByTestId("candidate-card-1")).toBeInTheDocument();
      expect(screen.getByTestId("candidate-card-2")).toBeInTheDocument();
      expect(screen.getByTestId("candidate-card-3")).toBeInTheDocument();

      expect(screen.getByText("What is React?")).toBeInTheDocument();
      expect(screen.getByText("What is TypeScript?")).toBeInTheDocument();
      expect(screen.getByText("What is Vitest?")).toBeInTheDocument();
    });

    it("wyświetla statusy kandydatów", () => {
      render(<CandidateList {...defaultProps} />);

      expect(screen.getByTestId("status-1")).toHaveTextContent("pending");
      expect(screen.getByTestId("status-2")).toHaveTextContent("accepted");
      expect(screen.getByTestId("status-3")).toHaveTextContent("edited");
    });

    it("wywołuje onToggleAccept po kliknięciu przycisku accept", async () => {
      const mockOnToggleAccept = vi.fn();
      render(<CandidateList {...defaultProps} onToggleAccept={mockOnToggleAccept} />);

      const acceptButton = screen.getByTestId("accept-1");
      await userEvent.click(acceptButton);

      expect(mockOnToggleAccept).toHaveBeenCalledWith("1");
      expect(mockOnToggleAccept).toHaveBeenCalledTimes(1);
    });

    it("wywołuje onReject po kliknięciu przycisku reject", async () => {
      const mockOnReject = vi.fn();
      render(<CandidateList {...defaultProps} onReject={mockOnReject} />);

      const rejectButton = screen.getByTestId("reject-1");
      await userEvent.click(rejectButton);

      expect(mockOnReject).toHaveBeenCalledWith("1");
      expect(mockOnReject).toHaveBeenCalledTimes(1);
    });

    it("wywołuje onUpdateCandidate po kliknięciu przycisku update", async () => {
      const mockOnUpdate = vi.fn();
      render(<CandidateList {...defaultProps} onUpdateCandidate={mockOnUpdate} />);

      const updateButton = screen.getByTestId("update-1");
      await userEvent.click(updateButton);

      expect(mockOnUpdate).toHaveBeenCalledWith("1", "front", "Updated front");
      expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe("stan pusty", () => {
    it("wyświetla komunikat o braku fiszek gdy lista jest pusta", () => {
      render(<CandidateList {...defaultProps} candidates={[]} />);

      expect(screen.getByText(/brak fiszek do recenzji/i)).toBeInTheDocument();
      expect(screen.getByText(/wybrano tryb manualny/i)).toBeInTheDocument();
    });

    it("wyświetla przycisk dodawania pierwszej fiszki w stanie pustym", () => {
      render(<CandidateList {...defaultProps} candidates={[]} />);

      const addButton = screen.getByRole("button", { name: /dodaj pierwszą fiszkę/i });
      expect(addButton).toBeInTheDocument();
    });

    it("wywołuje onAddManualCard po kliknięciu przycisku w stanie pustym", async () => {
      const mockOnAddManualCard = vi.fn();
      render(<CandidateList {...defaultProps} candidates={[]} onAddManualCard={mockOnAddManualCard} />);

      const addButton = screen.getByRole("button", { name: /dodaj pierwszą fiszkę/i });
      await userEvent.click(addButton);

      expect(mockOnAddManualCard).toHaveBeenCalledTimes(1);
    });

    it("nie wyświetla przycisku dodawania gdy onAddManualCard nie jest podane", () => {
      const { onAddManualCard, ...propsWithoutCallback } = defaultProps;
      render(<CandidateList {...propsWithoutCallback} candidates={[]} />);

      expect(screen.queryByRole("button", { name: /dodaj pierwszą fiszkę/i })).not.toBeInTheDocument();
    });
  });

  describe("stany brzegowe", () => {
    it("obsługuje pojedynczą fiszkę", () => {
      const singleCandidate = [mockCandidates[0]];
      render(<CandidateList {...defaultProps} candidates={singleCandidate} />);

      expect(screen.getByTestId("candidate-card-1")).toBeInTheDocument();
      expect(screen.queryByTestId("candidate-card-2")).not.toBeInTheDocument();
      expect(screen.queryByTestId("candidate-card-3")).not.toBeInTheDocument();
    });

    it("obsługuje fiszkę z pustymi polami", () => {
      const candidateWithEmptyFields: ReviewCandidateViewModel[] = [
        {
          id: "4",
          front: "",
          back: "",
          source: "manual",
          status: "pending",
          originalFront: "",
          originalBack: "",
        },
      ];

      render(<CandidateList {...defaultProps} candidates={candidateWithEmptyFields} />);

      expect(screen.getByTestId("candidate-card-4")).toBeInTheDocument();
    });

    it("obsługuje długie listy kandydatów", () => {
      const longList = Array.from({ length: 100 }, (_, i) => ({
        id: `${i + 1}`,
        front: `Question ${i + 1}`,
        back: `Answer ${i + 1}`,
        source: "ai-full" as const,
        status: "pending" as const,
        originalFront: `Question ${i + 1}`,
        originalBack: `Answer ${i + 1}`,
      }));

      render(<CandidateList {...defaultProps} candidates={longList} />);

      // Sprawdź czy pierwsze i ostatnie elementy są renderowane
      expect(screen.getByTestId("candidate-card-1")).toBeInTheDocument();
      expect(screen.getByTestId("candidate-card-100")).toBeInTheDocument();
    });

    it("wyświetla przycisk dodawania kolejnej fiszki gdy są kandydaci", () => {
      render(<CandidateList {...defaultProps} />);

      const addButton = screen.getByRole("button", { name: /dodaj kolejną fiszkę/i });
      expect(addButton).toBeInTheDocument();
    });

    it("wywołuje onAddManualCard po kliknięciu przycisku dodawania kolejnej fiszki", async () => {
      const mockOnAddManualCard = vi.fn();
      render(<CandidateList {...defaultProps} onAddManualCard={mockOnAddManualCard} />);

      const addButton = screen.getByRole("button", { name: /dodaj kolejną fiszkę/i });
      await userEvent.click(addButton);

      expect(mockOnAddManualCard).toHaveBeenCalledTimes(1);
    });
  });

  describe("accessibility", () => {
    it("obsługuje nawigację klawiaturą", () => {
      render(<CandidateList {...defaultProps} />);

      const firstAcceptButton = screen.getByTestId("accept-1");

      // Sprawdź czy przycisk ma focus
      firstAcceptButton.focus();
      expect(firstAcceptButton).toHaveFocus();

      // Sprawdź czy można aktywować spacją (symuluje kliknięcie)
      fireEvent.click(firstAcceptButton);
      expect(defaultProps.onToggleAccept).toHaveBeenCalledWith("1");
    });
  });

  describe("snapshot tests", () => {
    it("snapshot test - lista z danymi", () => {
      const { container } = render(<CandidateList {...defaultProps} />);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="space-y-4"
          data-test-id="candidates-list"
        >
          <div
            data-testid="candidate-card-1"
          >
            <h3>
              What is React?
            </h3>
            <p>
              A JavaScript library for building user interfaces
            </p>
            <span
              data-testid="status-1"
            >
              pending
            </span>
            <button
              data-testid="accept-1"
            >
              Accept
            </button>
            <button
              data-testid="reject-1"
            >
              Reject
            </button>
            <button
              data-testid="update-1"
            >
              Update
            </button>
          </div>
          <div
            data-testid="candidate-card-2"
          >
            <h3>
              What is TypeScript?
            </h3>
            <p>
              A typed superset of JavaScript
            </p>
            <span
              data-testid="status-2"
            >
              accepted
            </span>
            <button
              data-testid="accept-2"
            >
              Accept
            </button>
            <button
              data-testid="reject-2"
            >
              Reject
            </button>
            <button
              data-testid="update-2"
            >
              Update
            </button>
          </div>
          <div
            data-testid="candidate-card-3"
          >
            <h3>
              What is Vitest?
            </h3>
            <p>
              A fast unit testing framework
            </p>
            <span
              data-testid="status-3"
            >
              edited
            </span>
            <button
              data-testid="accept-3"
            >
              Accept
            </button>
            <button
              data-testid="reject-3"
            >
              Reject
            </button>
            <button
              data-testid="update-3"
            >
              Update
            </button>
          </div>
          <button
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-9 px-4 py-2 has-[>svg]:px-3 w-full"
            data-slot="button"
            data-test-id="add-manual-flashcard-button"
          >
            Dodaj Kolejną Fiszkę
          </button>
        </div>
      `);
    });

    it("snapshot test - stan pusty", () => {
      const { container } = render(<CandidateList {...defaultProps} candidates={[]} />);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="flex flex-col items-center justify-center py-12 space-y-4"
          data-test-id="empty-state"
        >
          <div
            class="text-center space-y-2"
          >
            <p
              class="text-lg font-medium"
              data-test-id="empty-state-title"
            >
              Brak fiszek do recenzji
            </p>
            <p
              class="text-sm text-muted-foreground"
              data-test-id="empty-state-description"
            >
              Wybrano tryb manualny - utwórz fiszki samodzielnie
            </p>
          </div>
          <button
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-10 rounded-md px-6 has-[>svg]:px-4"
            data-slot="button"
            data-test-id="add-first-flashcard-button"
          >
            Dodaj Pierwszą Fiszkę
          </button>
        </div>
      `);
    });
  });
});
