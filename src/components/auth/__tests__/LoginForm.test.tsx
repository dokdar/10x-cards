import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "../LoginForm";

// Mockowanie fetch API
vi.mock("global", () => ({
  fetch: vi.fn(),
}));

describe("LoginForm", () => {
  // Przygotowanie mocka dla fetch przed każdym testem
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
    // Mock window.location for redirect tests
    global.window = Object.create(window);
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });
  });

  it("renderuje formularz logowania z wszystkimi polami", () => {
    render(<LoginForm />);

    expect(screen.getByRole("textbox", { name: /adres e-mail/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/hasło/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zaloguj/i })).toBeInTheDocument();
    expect(screen.getByText(/zapomniałeś hasła/i)).toBeInTheDocument();
    expect(screen.getByText(/nie masz konta/i)).toBeInTheDocument();
  });

  it("wyświetla błąd gdy pola są puste", async () => {
    render(<LoginForm />);

    // Wyślij formularz bez wypełniania pól
    const form = screen.getByRole("button", { name: /zaloguj się/i }).closest("form")!;
    fireEvent.submit(form);

    // Sprawdź czy pojawił się komunikat o błędzie w komponencie Alert
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    // Preferujemy komunikaty pól; akceptujemy email lub hasło
    expect(
      screen.queryByText(/podaj prawidłowy adres e-mail/i) || screen.queryByText(/hasło jest wymagane/i)
    ).toBeTruthy();
  });

  it("wyświetla błąd przy nieprawidłowym formacie email", async () => {
    render(<LoginForm />);

    // Wypełnij pole email nieprawidłowym formatem
    const emailInput = screen.getByLabelText(/adres e-mail/i);
    const passwordInput = screen.getByLabelText(/hasło/i);

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    // Wyślij formularz
    const form = screen.getByRole("button", { name: /zaloguj się/i }).closest("form")!;
    fireEvent.submit(form);

    // Sprawdź czy pojawił się komunikat o błędzie formatu email w komponencie Alert
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/podaj prawidłowy adres e-mail/i)).toBeInTheDocument();
    });
  });

  it("obsługuje błędy z API - nieprawidłowe dane logowania", async () => {
    // Mockowanie błędnej odpowiedzi z API
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Nieprawidłowy email lub hasło" }),
    });

    render(<LoginForm />);

    // Wypełnij poprawnie pola
    await userEvent.type(screen.getByRole("textbox", { name: /adres e-mail/i }), "test@example.com");
    await userEvent.type(screen.getByLabelText(/hasło/i), "wrongpassword");

    // Wyślij formularz
    const form = screen.getByRole("button", { name: /zaloguj/i }).closest("form")!;
    fireEvent.submit(form);

    // Sprawdź czy pojawił się komunikat o błędzie z API w komponencie Alert
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/nieprawidłowy email lub hasło/i)).toBeInTheDocument();
    });

    // Sprawdź czy fetch został wywołany z odpowiednimi parametrami
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          email: "test@example.com",
          password: "wrongpassword",
        }),
      })
    );
  });

  it("obsługuje błędy sieci", async () => {
    // Mockowanie błędu sieci
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network Error"));

    render(<LoginForm />);

    // Wypełnij poprawnie pola
    await userEvent.type(screen.getByRole("textbox", { name: /adres e-mail/i }), "test@example.com");
    await userEvent.type(screen.getByLabelText(/hasło/i), "password123");

    // Wyślij formularz
    const form = screen.getByRole("button", { name: /zaloguj/i }).closest("form")!;
    fireEvent.submit(form);

    // Sprawdź czy pojawił się komunikat o błędzie sieci w komponencie Alert
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/błąd sieci/i)).toBeInTheDocument();
    });
  });

  it("wyświetla stan ładowania podczas logowania", async () => {
    // Mockowanie opóźnionej odpowiedzi
    global.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                redirected: true,
                url: "/generate",
              }),
            100
          )
        )
    );

    render(<LoginForm />);

    // Wypełnij poprawnie pola
    await userEvent.type(screen.getByRole("textbox", { name: /adres e-mail/i }), "test@example.com");
    await userEvent.type(screen.getByLabelText(/hasło/i), "password123");

    // Wyślij formularz
    const form = screen.getByRole("button", { name: /zaloguj/i }).closest("form")!;
    fireEvent.submit(form);

    // Sprawdź czy przycisk pokazuje stan ładowania
    expect(screen.getByRole("button", { name: /logowanie/i })).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();

    // Czekaj na zakończenie operacji asynchronicznej
    await waitFor(() => {
      expect(window.location.href).toBe("/generate");
    }, { timeout: 200 });
  });
});
