import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import GenerationStatusIndicator from "../GenerationStatusIndicator";

describe("GenerationStatusIndicator", () => {
  it("nie renderuje niczego w stanie idle", () => {
    const { container } = render(<GenerationStatusIndicator status="idle" errorMessage={null} />);

    expect(container.firstChild).toBeNull();
  });

  it("wyświetla spinner podczas ładowania", () => {
    const { container } = render(<GenerationStatusIndicator status="loading" errorMessage={null} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    // Używamy bardziej precyzyjnego selektora, aby uniknąć problemów z wieloma dopasowaniami
    expect(container.querySelector(".text-lg")).toHaveTextContent(/generowanie fiszek/i);
  });

  it("wyświetla komunikat błędu w stanie error", () => {
    const errorMessage = "Wystąpił błąd podczas generowania fiszek";
    render(<GenerationStatusIndicator status="error" errorMessage={errorMessage} />);

    // Zamiast szukać po roli, szukamy po tekście, który na pewno jest w komponencie
    expect(screen.getByText("Błąd")).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it("nie wyświetla błędu gdy status to error ale brak wiadomości", () => {
    const { container } = render(<GenerationStatusIndicator status="error" errorMessage={null} />);

    expect(container.firstChild).toBeNull();
  });
});
