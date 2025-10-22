import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterForm from "../RegisterForm";

// Mockowanie fetch API
vi.mock("global", () => ({
  fetch: vi.fn(),
}));

describe("RegisterForm", () => {
  // Przygotowanie mocka dla fetch przed każdym testem
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
    global.window = Object.create(window);
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });
  });

  it("renderuje formularz rejestracji z wszystkimi polami", () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText(/adres e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^hasło$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/potwierdzenie hasła/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zarejestruj się/i })).toBeInTheDocument();
  });

  it("wyświetla błąd gdy pola są puste", async () => {
    render(<RegisterForm />);

    // Kliknij przycisk submit bez wypełniania pól
    const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
    fireEvent.submit(submitButton.closest("form")!);

    // Sprawdź czy pojawił się komunikat o błędzie w komponencie Alert
    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      const acceptable = [
        /wszystkie pola są wymagane/i,
        /podaj prawidłowy adres e-mail/i,
        /hasło musi mieć co najmniej 8 znaków/i,
      ];
      expect(acceptable.some((rx) => alert.textContent?.match(rx))).toBe(true);
    });
  });

  it("wyświetla błąd przy nieprawidłowym formacie email", async () => {
    render(<RegisterForm />);

    // Wypełnij pole email nieprawidłowym formatem
    const emailInput = screen.getByLabelText(/adres e-mail/i);
    const passwordInput = screen.getByLabelText(/^hasło$/i);
    const confirmPasswordInput = screen.getByLabelText(/potwierdzenie hasła/i);

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "password123" } });

    // Wyślij formularz
    const form = screen.getByRole("button", { name: /zarejestruj się/i }).closest("form")!;
    fireEvent.submit(form);

    // Sprawdź czy pojawił się komunikat o błędzie formatu email w komponencie Alert
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/podaj prawidłowy adres e-mail/i)).toBeInTheDocument();
    });
  });

  it("wyświetla błąd gdy hasło jest za krótkie", async () => {
    render(<RegisterForm />);

    // Wypełnij pola z za krótkim hasłem
    const emailInput = screen.getByLabelText(/adres e-mail/i);
    const passwordInput = screen.getByLabelText(/^hasło$/i);
    const confirmPasswordInput = screen.getByLabelText(/potwierdzenie hasła/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "123" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "123" } });

    // Wyślij formularz
    const form = screen.getByRole("button", { name: /zarejestruj się/i }).closest("form")!;
    fireEvent.submit(form);

    // Sprawdź czy pojawił się komunikat o błędzie długości hasła w komponencie Alert
    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/hasło musi mieć co najmniej 8 znaków/i);
    });
  });

  it("wyświetla błąd gdy hasła nie są identyczne", async () => {
    render(<RegisterForm />);

    // Wypełnij pola z różnymi hasłami
    const emailInput = screen.getByLabelText(/adres e-mail/i);
    const passwordInput = screen.getByLabelText(/^hasło$/i);
    const confirmPasswordInput = screen.getByLabelText(/potwierdzenie hasła/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "different123" } });

    // Wyślij formularz
    const form = screen.getByRole("button", { name: /zarejestruj się/i }).closest("form")!;
    fireEvent.submit(form);

    // Sprawdź czy pojawił się komunikat o błędzie zgodności haseł w komponencie Alert
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/hasła nie są identyczne/i)).toBeInTheDocument();
    });
  });

  it("obsługuje błędy z API", async () => {
    // Mockowanie odpowiedzi z błędem z API
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Użytkownik z tym adresem email już istnieje" }),
    });

    render(<RegisterForm />);

    // Wypełnij poprawnie wszystkie pola
    await userEvent.type(screen.getByLabelText(/adres e-mail/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/^hasło$/i), "Password123");
    await userEvent.type(screen.getByLabelText(/potwierdzenie hasła/i), "Password123");

    // Wyślij formularz
    const form = screen.getByRole("button", { name: /zarejestruj się/i }).closest("form")!;
    fireEvent.submit(form);

    // Sprawdź czy pojawił się komunikat o błędzie z API w komponencie Alert
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/użytkownik z tym adresem email już istnieje/i)).toBeInTheDocument();
    });

    // Sprawdź czy fetch został wywołany z odpowiednimi parametrami
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/auth/register",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          email: "test@example.com",
          password: "Password123",
          confirmPassword: "Password123",
        }),
      })
    );
  });

  it("wyświetla komunikat o weryfikacji email po pomyślnej rejestracji", async () => {
    // Mockowanie pomyślnej odpowiedzi z API z wymaganiem weryfikacji
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      redirected: false,
      json: () =>
        Promise.resolve({
          message: "Sprawdź e-mail aby potwierdzić konto",
          requiresVerification: true,
        }),
    });

    render(<RegisterForm />);

    // Wypełnij poprawnie wszystkie pola
    await userEvent.type(screen.getByLabelText(/adres e-mail/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/^hasło$/i), "Password123");
    await userEvent.type(screen.getByLabelText(/potwierdzenie hasła/i), "Password123");

    // Wyślij formularz
    const form = screen.getByRole("button", { name: /zarejestruj się/i }).closest("form")!;
    fireEvent.submit(form);

    // Sprawdź czy pojawił się komunikat o weryfikacji w komponencie Alert
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/sprawdź e-mail aby potwierdzić konto/i)).toBeInTheDocument();
    });
  });

  it("przekierowuje po pomyślnej rejestracji bez wymagania weryfikacji", async () => {
    // Mockowanie pomyślnej odpowiedzi z API z przekierowaniem
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      redirected: true,
      url: "/generate",
      json: () => Promise.resolve({}),
    });

    render(<RegisterForm />);

    // Wypełnij poprawnie wszystkie pola
    await userEvent.type(screen.getByLabelText(/adres e-mail/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/^hasło$/i), "Password123");
    await userEvent.type(screen.getByLabelText(/potwierdzenie hasła/i), "Password123");

    // Wyślij formularz
    const form = screen.getByRole("button", { name: /zarejestruj się/i }).closest("form")!;
    fireEvent.submit(form);

    // Sprawdź czy nastąpiło przekierowanie
    await waitFor(() => {
      expect(window.location.href).toBe("/generate");
    });
  });
});
