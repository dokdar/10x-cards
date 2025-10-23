import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CandidateCard } from "../CandidateCard";
import type { ReviewCandidateViewModel } from "@/types";

describe("CandidateCard", () => {
  const mockCandidate: ReviewCandidateViewModel = {
    id: "test-id-1",
    front: "Pytanie testowe",
    back: "Odpowiedź testowa",
    source: "ai-full",
    status: "pending",
    originalFront: "Pytanie testowe",
    originalBack: "Odpowiedź testowa",
  };

  const defaultProps = {
    candidate: mockCandidate,
    onUpdate: vi.fn(),
    onToggleAccept: vi.fn(),
    onReject: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderuje kartę fiszki z podstawowymi elementami", () => {
    render(<CandidateCard {...defaultProps} />);

    expect(screen.getByText("Pytanie testowe")).toBeInTheDocument();
    expect(screen.getByText("Odpowiedź testowa")).toBeInTheDocument();
    expect(screen.getByText("Przód fiszki")).toBeInTheDocument();
    expect(screen.getByText("Tył fiszki")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /odrzuć/i })).toBeInTheDocument();
  });

  it('wyświetla status "Oczekująca" dla kandydata w stanie pending', () => {
    render(<CandidateCard {...defaultProps} />);

    expect(screen.getByText("Oczekująca")).toBeInTheDocument();
    expect(screen.getByRole("switch")).not.toBeChecked();
  });

  it('wyświetla status "Zaakceptowana" dla kandydata w stanie accepted', () => {
    const acceptedCandidate = { ...mockCandidate, status: "accepted" as const };
    render(<CandidateCard {...defaultProps} candidate={acceptedCandidate} />);

    expect(screen.getByText("Zaakceptowana")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it('wyświetla status "Zaakceptowana" i znacznik "Edytowana" dla kandydata w stanie edited', () => {
    const editedCandidate = { ...mockCandidate, status: "edited" as const };
    render(<CandidateCard {...defaultProps} candidate={editedCandidate} />);

    expect(screen.getByText("Zaakceptowana")).toBeInTheDocument();
    expect(screen.getByText("Edytowana")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("wywołuje onToggleAccept przy kliknięciu przełącznika", async () => {
    const user = userEvent.setup();
    const onToggleAccept = vi.fn();

    render(<CandidateCard {...defaultProps} onToggleAccept={onToggleAccept} />);

    const toggle = screen.getByRole("switch");
    await user.click(toggle);

    expect(onToggleAccept).toHaveBeenCalledWith("test-id-1");
  });

  it("wywołuje onUpdate przy edycji pola przód", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();

    render(<CandidateCard {...defaultProps} onUpdate={onUpdate} />);

    const frontTextarea = screen.getByDisplayValue("Pytanie testowe");
    await user.type(frontTextarea, "X");

    expect(onUpdate).toHaveBeenCalledWith("test-id-1", "front", "Pytanie testoweX");
  });

  it("wywołuje onUpdate przy edycji pola tył", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();

    render(<CandidateCard {...defaultProps} onUpdate={onUpdate} />);

    const backTextarea = screen.getByDisplayValue("Odpowiedź testowa");
    await user.type(backTextarea, "X");

    expect(onUpdate).toHaveBeenCalledWith("test-id-1", "back", "Odpowiedź testowaX");
  });

  it("wywołuje onReject przy kliknięciu przycisku odrzuć", async () => {
    const user = userEvent.setup();
    const onReject = vi.fn();

    render(<CandidateCard {...defaultProps} onReject={onReject} />);

    const rejectButton = screen.getByRole("button", { name: /odrzuć/i });
    await user.click(rejectButton);

    expect(onReject).toHaveBeenCalledWith("test-id-1");
  });

  it("wyświetla stan odrzucony z odpowiednim stylem", () => {
    const rejectedCandidate = { ...mockCandidate, status: "rejected" as const };
    const { container } = render(<CandidateCard {...defaultProps} candidate={rejectedCandidate} />);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("opacity-50", "bg-muted/50");
    expect(screen.getByText("Odrzucona")).toBeInTheDocument(); // Button text changes to "Odrzucona"
  });

  it("wyłącza kontrolki dla odrzuconego kandydata", () => {
    const rejectedCandidate = { ...mockCandidate, status: "rejected" as const };
    render(<CandidateCard {...defaultProps} candidate={rejectedCandidate} />);

    expect(screen.getByRole("switch")).toBeDisabled();
    expect(screen.getByDisplayValue("Pytanie testowe")).toBeDisabled();
    expect(screen.getByDisplayValue("Odpowiedź testowa")).toBeDisabled();
    expect(screen.getByRole("button", { name: /odrzucona/i })).toBeDisabled();
  });

  it("wyświetla komunikat błędu dla pustych pól", () => {
    const emptyCandidate = { ...mockCandidate, front: "", back: "" };
    render(<CandidateCard {...defaultProps} candidate={emptyCandidate} />);

    expect(screen.getByText("Oba pola muszą zawierać tekst")).toBeInTheDocument();
  });

  it("wyświetla komunikat błędu gdy tylko przód jest pusty", () => {
    const emptyFrontCandidate = { ...mockCandidate, front: "" };
    render(<CandidateCard {...defaultProps} candidate={emptyFrontCandidate} />);

    expect(screen.getByText("Oba pola muszą zawierać tekst")).toBeInTheDocument();
  });

  it("wyświetla komunikat błędu gdy tylko tył jest pusty", () => {
    const emptyBackCandidate = { ...mockCandidate, back: "" };
    render(<CandidateCard {...defaultProps} candidate={emptyBackCandidate} />);

    expect(screen.getByText("Oba pola muszą zawierać tekst")).toBeInTheDocument();
  });

  it("nie wyświetla komunikatu błędu dla odrzuconego kandydata z pustymi polami", () => {
    const rejectedEmptyCandidate = {
      ...mockCandidate,
      front: "",
      back: "",
      status: "rejected" as const,
    };
    render(<CandidateCard {...defaultProps} candidate={rejectedEmptyCandidate} />);

    expect(screen.queryByText("Oba pola muszą zawierać tekst")).not.toBeInTheDocument();
  });

  it("wyłącza przełącznik dla kandydata z pustymi polami", () => {
    const emptyCandidate = { ...mockCandidate, front: "", back: "" };
    render(<CandidateCard {...defaultProps} candidate={emptyCandidate} />);

    expect(screen.getByRole("switch")).toBeDisabled();
  });

  it("wyświetla specjalny styl dla zaakceptowanego kandydata", () => {
    const acceptedCandidate = { ...mockCandidate, status: "accepted" as const };
    const { container } = render(<CandidateCard {...defaultProps} candidate={acceptedCandidate} />);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("border-primary/50", "bg-primary/5");
  });

  it("ustawia aria-invalid dla pustych pól", () => {
    const emptyCandidate = { ...mockCandidate, front: "", back: "" };
    render(<CandidateCard {...defaultProps} candidate={emptyCandidate} />);

    const frontTextarea = screen.getByLabelText(/przód fiszki/i);
    const backTextarea = screen.getByLabelText(/tył fiszki/i);

    expect(frontTextarea).toHaveAttribute("aria-invalid", "true");
    expect(backTextarea).toHaveAttribute("aria-invalid", "true");
  });

  it("nie ustawia aria-invalid dla wypełnionych pól", () => {
    render(<CandidateCard {...defaultProps} />);

    const frontTextarea = screen.getByLabelText(/przód fiszki/i);
    const backTextarea = screen.getByLabelText(/tył fiszki/i);

    expect(frontTextarea).toHaveAttribute("aria-invalid", "false");
    expect(backTextarea).toHaveAttribute("aria-invalid", "false");
  });

  it("ma odpowiednie aria-label dla przełącznika", () => {
    render(<CandidateCard {...defaultProps} />);

    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-label", "Accept flashcard");
  });

  it("ma odpowiednie id i htmlFor dla etykiet", () => {
    render(<CandidateCard {...defaultProps} />);

    const frontLabel = screen.getByText("Przód fiszki");
    const backLabel = screen.getByText("Tył fiszki");
    const frontTextarea = screen.getByDisplayValue("Pytanie testowe");
    const backTextarea = screen.getByDisplayValue("Odpowiedź testowa");

    expect(frontLabel).toHaveAttribute("for", "front-test-id-1");
    expect(backLabel).toHaveAttribute("for", "back-test-id-1");
    expect(frontTextarea).toHaveAttribute("id", "front-test-id-1");
    expect(backTextarea).toHaveAttribute("id", "back-test-id-1");
  });

  it("snapshot test - stan domyślny (pending)", () => {
    const { container } = render(<CandidateCard {...defaultProps} />);
    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm transition-all"
        data-slot="card"
        data-test-id="candidate-card"
      >
        <div
          class="@container/card-header auto-rows-min grid-rows-[auto_auto] gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6 flex flex-row items-center justify-between space-y-0 pb-3"
          data-slot="card-header"
        >
          <div
            class="flex items-center gap-2"
          >
            <button
              aria-checked="false"
              aria-label="Accept flashcard"
              class="peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              data-slot="switch"
              data-state="unchecked"
              data-test-id="accept-candidate-switch"
              role="switch"
              type="button"
              value="on"
            >
              <span
                class="bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
                data-slot="switch-thumb"
                data-state="unchecked"
              />
            </button>
            <span
              class="text-sm font-medium"
            >
              Oczekująca
            </span>
          </div>
        </div>
        <div
          class="px-6 space-y-4"
          data-slot="card-content"
        >
          <div
            class="space-y-2"
          >
            <label
              class="text-sm font-medium"
              for="front-test-id-1"
            >
              Przód fiszki
            </label>
            <textarea
              aria-invalid="false"
              class="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-20"
              data-slot="textarea"
              data-test-id="flashcard-front-textarea"
              id="front-test-id-1"
              placeholder="Treść na przodzie fiszki"
            >
              Pytanie testowe
            </textarea>
          </div>
          <div
            class="space-y-2"
          >
            <label
              class="text-sm font-medium"
              for="back-test-id-1"
            >
              Tył fiszki
            </label>
            <textarea
              aria-invalid="false"
              class="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-20"
              data-slot="textarea"
              data-test-id="flashcard-back-textarea"
              id="back-test-id-1"
              placeholder="Treść na tyle fiszki"
            >
              Odpowiedź testowa
            </textarea>
          </div>
        </div>
        <div
          class="items-center px-6 [.border-t]:pt-6 flex justify-end"
          data-slot="card-footer"
        >
          <button
            class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5"
            data-slot="button"
            data-test-id="reject-candidate-button"
          >
            Odrzuć
          </button>
        </div>
      </div>
    `);
  });

  it("snapshot test - stan zaakceptowany z edycją", () => {
    const editedCandidate = { ...mockCandidate, status: "edited" as const };
    const { container } = render(<CandidateCard {...defaultProps} candidate={editedCandidate} />);
    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm transition-all border-primary/50 bg-primary/5"
        data-slot="card"
        data-test-id="candidate-card"
      >
        <div
          class="@container/card-header auto-rows-min grid-rows-[auto_auto] gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6 flex flex-row items-center justify-between space-y-0 pb-3"
          data-slot="card-header"
        >
          <div
            class="flex items-center gap-2"
          >
            <button
              aria-checked="true"
              aria-label="Accept flashcard"
              class="peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              data-slot="switch"
              data-state="checked"
              data-test-id="accept-candidate-switch"
              role="switch"
              type="button"
              value="on"
            >
              <span
                class="bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
                data-slot="switch-thumb"
                data-state="checked"
              />
            </button>
            <span
              class="text-sm font-medium"
            >
              Zaakceptowana
            </span>
          </div>
          <span
            class="text-xs text-muted-foreground"
          >
            Edytowana
          </span>
        </div>
        <div
          class="px-6 space-y-4"
          data-slot="card-content"
        >
          <div
            class="space-y-2"
          >
            <label
              class="text-sm font-medium"
              for="front-test-id-1"
            >
              Przód fiszki
            </label>
            <textarea
              aria-invalid="false"
              class="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-20"
              data-slot="textarea"
              data-test-id="flashcard-front-textarea"
              id="front-test-id-1"
              placeholder="Treść na przodzie fiszki"
            >
              Pytanie testowe
            </textarea>
          </div>
          <div
            class="space-y-2"
          >
            <label
              class="text-sm font-medium"
              for="back-test-id-1"
            >
              Tył fiszki
            </label>
            <textarea
              aria-invalid="false"
              class="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-20"
              data-slot="textarea"
              data-test-id="flashcard-back-textarea"
              id="back-test-id-1"
              placeholder="Treść na tyle fiszki"
            >
              Odpowiedź testowa
            </textarea>
          </div>
        </div>
        <div
          class="items-center px-6 [.border-t]:pt-6 flex justify-end"
          data-slot="card-footer"
        >
          <button
            class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5"
            data-slot="button"
            data-test-id="reject-candidate-button"
          >
            Odrzuć
          </button>
        </div>
      </div>
    `);
  });

  it("snapshot test - stan odrzucony", () => {
    const rejectedCandidate = { ...mockCandidate, status: "rejected" as const };
    const { container } = render(<CandidateCard {...defaultProps} candidate={rejectedCandidate} />);
    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm transition-all opacity-50 bg-muted/50"
        data-slot="card"
        data-test-id="candidate-card"
      >
        <div
          class="@container/card-header auto-rows-min grid-rows-[auto_auto] gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6 flex flex-row items-center justify-between space-y-0 pb-3"
          data-slot="card-header"
        >
          <div
            class="flex items-center gap-2"
          >
            <button
              aria-checked="false"
              aria-label="Accept flashcard"
              class="peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              data-disabled=""
              data-slot="switch"
              data-state="unchecked"
              data-test-id="accept-candidate-switch"
              disabled=""
              role="switch"
              type="button"
              value="on"
            >
              <span
                class="bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
                data-disabled=""
                data-slot="switch-thumb"
                data-state="unchecked"
              />
            </button>
            <span
              class="text-sm font-medium"
            >
              Oczekująca
            </span>
          </div>
        </div>
        <div
          class="px-6 space-y-4"
          data-slot="card-content"
        >
          <div
            class="space-y-2"
          >
            <label
              class="text-sm font-medium"
              for="front-test-id-1"
            >
              Przód fiszki
            </label>
            <textarea
              aria-invalid="false"
              class="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-20"
              data-slot="textarea"
              data-test-id="flashcard-front-textarea"
              disabled=""
              id="front-test-id-1"
              placeholder="Treść na przodzie fiszki"
            >
              Pytanie testowe
            </textarea>
          </div>
          <div
            class="space-y-2"
          >
            <label
              class="text-sm font-medium"
              for="back-test-id-1"
            >
              Tył fiszki
            </label>
            <textarea
              aria-invalid="false"
              class="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-20"
              data-slot="textarea"
              data-test-id="flashcard-back-textarea"
              disabled=""
              id="back-test-id-1"
              placeholder="Treść na tyle fiszki"
            >
              Odpowiedź testowa
            </textarea>
          </div>
        </div>
        <div
          class="items-center px-6 [.border-t]:pt-6 flex justify-end"
          data-slot="card-footer"
        >
          <button
            class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5"
            data-slot="button"
            data-test-id="reject-candidate-button"
            disabled=""
          >
            Odrzucona
          </button>
        </div>
      </div>
    `);
  });
});
