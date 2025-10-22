import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForgotPasswordForm from "../ForgotPasswordForm";

// Mockowanie fetch API
vi.mock("global", () => ({
  fetch: vi.fn(),
}));

describe("ForgotPasswordForm", () => {
  // Przygotowanie mocka dla fetch przed każdym testem
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it("renderuje formularz resetowania hasła", () => {
    render(<ForgotPasswordForm />);

    expect(screen.getByLabelText(/adres e-mail/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /wyślij link/i })).toBeInTheDocument();
  });

  it("wyświetla błąd gdy pole email jest puste", async () => {
    render(<ForgotPasswordForm />);

    // Wyślij formularz bez wypełniania pola
    const form = screen.getByRole("button", { name: /wyślij link/i }).closest("form")!;
    fireEvent.submit(form);

    // Sprawdź czy pojawił się komunikat o błędzie w komponencie Alert
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/adres e-mail jest wymagany/i)).toBeInTheDocument();
    });
  });

  it("wyświetla błąd przy nieprawidłowym formacie email", async () => {
    render(<ForgotPasswordForm />);

    // Wypełnij pole email nieprawidłowym formatem
    const emailInput = screen.getByLabelText(/adres e-mail/i);
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });

    // Wyślij formularz
    const form = screen.getByRole("button", { name: /wyślij link/i }).closest("form")!;
    fireEvent.submit(form);

    // Sprawdź czy pojawił się komunikat o błędzie formatu email w komponencie Alert
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/podaj prawidłowy adres e-mail/i)).toBeInTheDocument();
    });
  });

  it("obsługuje błędy z API", async () => {
    // Mockowanie odpowiedzi z błędem z API
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Nie znaleziono użytkownika z tym adresem email" }),
    });

    render(<ForgotPasswordForm />);

    // Wypełnij poprawnie pole email
    await userEvent.type(screen.getByLabelText(/adres e-mail/i), "test@example.com");

    // Wyślij formularz
    const form = screen.getByRole("button", { name: /wyślij link/i }).closest("form")!;
    fireEvent.submit(form);

    // Sprawdź czy pojawił się komunikat o błędzie z API w komponencie Alert
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/nie znaleziono użytkownika z tym adresem email/i)).toBeInTheDocument();
    });

    // Sprawdź czy fetch został wywołany z odpowiednimi parametrami
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/auth/forgot-password",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ email: "test@example.com" }),
      })
    );
  });

  it("wyświetla komunikat o sukcesie po pomyślnym wysłaniu linku", async () => {
    // Mockowanie pomyślnej odpowiedzi z API
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: "Link do resetowania hasła został wysłany na podany adres email" }),
    });

    render(<ForgotPasswordForm />);

    // Wypełnij poprawnie pole email
    await userEvent.type(screen.getByLabelText(/adres e-mail/i), "test@example.com");

    // Wyślij formularz
    const form = screen.getByRole("button", { name: /wyślij link/i }).closest("form")!;
    fireEvent.submit(form);

    // Sprawdź czy pojawił się komunikat o sukcesie w komponencie Alert
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/link do resetowania hasła został wysłany na podany adres email/i)).toBeInTheDocument();
    });

    // Sprawdź czy pole email zostało wyczyszczone
    expect(screen.getByLabelText(/adres e-mail/i)).toHaveValue("");
  });

  it("obsługuje błędy sieci", async () => {
    // Mockowanie błędu sieci
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network Error"));

    render(<ForgotPasswordForm />);

    // Wypełnij poprawnie pole email
    await userEvent.type(screen.getByLabelText(/adres e-mail/i), "test@example.com");

    // Wyślij formularz
    const form = screen.getByRole("button", { name: /wyślij link/i }).closest("form")!;
    fireEvent.submit(form);

    // Sprawdź czy pojawił się komunikat o błędzie sieci w komponencie Alert
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/błąd sieci/i)).toBeInTheDocument();
    });
  });

  it("dezaktywuje przycisk podczas ładowania", async () => {
    // Mockowanie opóźnionej odpowiedzi z API
    global.fetch = vi.fn().mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () =>
                Promise.resolve({ message: "Link do resetowania hasła został wysłany na podany adres email" }),
            });
          }, 100);
        })
    );

    render(<ForgotPasswordForm />);

    // Wypełnij poprawnie pole email
    await userEvent.type(screen.getByLabelText(/adres e-mail/i), "test@example.com");

    // Wyślij formularz
    const form = screen.getByRole("button", { name: /wyślij link/i }).closest("form")!;
    fireEvent.submit(form);

    // Sprawdź czy przycisk jest dezaktywowany podczas ładowania
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("button")).toHaveTextContent(/wysyłanie/i);

    // Poczekaj na zakończenie ładowania
    await waitFor(() => {
      expect(screen.getByText(/link do resetowania hasła został wysłany/i)).toBeInTheDocument();
    });
  });
});
