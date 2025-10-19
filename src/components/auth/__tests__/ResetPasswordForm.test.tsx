import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResetPasswordForm from '../ResetPasswordForm';

// Mockowanie fetch API
vi.mock('global', () => ({
  fetch: vi.fn()
}));

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
    // Ustawialne window.location do testów przekierowań i query params
    global.window = Object.create(window);
    Object.defineProperty(window, 'location', {
      value: { href: '', search: '' },
      writable: true
    });
  });

  it('renderuje formularz resetu hasła z polami', () => {
    render(<ResetPasswordForm />);

    expect(screen.getByLabelText(/^nowe hasło$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/potwierdzenie hasła/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /zmień hasło/i })).toBeInTheDocument();
  });

  it('wyświetla błąd z URL gdy link wygasł (error_code=otp_expired)', async () => {
    window.location.search = '?error_code=otp_expired';

    render(<ResetPasswordForm />);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/link do resetowania hasła wygasł/i);
    });
  });

  it('wyświetla błąd z URL z opisem błędu (error_description)', async () => {
    window.location.search = '?error_description=Nieprawid%C5%82owy+link';

    render(<ResetPasswordForm />);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/nieprawidłowy link/i);
    });
  });

  it('wyświetla błąd gdy brak kodu PKCE podczas wysyłki', async () => {
    // Brak parametru code w URL
    render(<ResetPasswordForm />);

    await userEvent.type(screen.getByLabelText(/^nowe hasło$/i), 'Password123');
    await userEvent.type(screen.getByLabelText(/potwierdzenie hasła/i), 'Password123');

    const form = screen.getByRole('button', { name: /zmień hasło/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/brak kodu autoryzacji/i);
    });
  });

  it('obsługuje walidację Zod — za krótkie hasło', async () => {
    window.location.search = '?code=abc123';

    render(<ResetPasswordForm />);

    await userEvent.type(screen.getByLabelText(/^nowe hasło$/i), '1234567');
    await userEvent.type(screen.getByLabelText(/potwierdzenie hasła/i), '1234567');

    const form = screen.getByRole('button', { name: /zmień hasło/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/hasło musi mieć co najmniej 8 znaków/i);
    });
  });

  it('obsługuje walidację Zod — hasła nie są identyczne', async () => {
    window.location.search = '?code=abc123';

    render(<ResetPasswordForm />);

    await userEvent.type(screen.getByLabelText(/^nowe hasło$/i), 'Password123');
    await userEvent.type(screen.getByLabelText(/potwierdzenie hasła/i), 'Different123');

    const form = screen.getByRole('button', { name: /zmień hasło/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/hasła nie są identyczne/i);
    });
  });

  it('obsługuje błędy z API (np. nowe hasło takie samo)', async () => {
    window.location.search = '?code=abc123';

    // Mock: API zwraca błąd
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Nowe hasło musi być inne niż poprzednie.' })
    } as any);

    render(<ResetPasswordForm />);

    await userEvent.type(screen.getByLabelText(/^nowe hasło$/i), 'Password123');
    await userEvent.type(screen.getByLabelText(/potwierdzenie hasła/i), 'Password123');

    const form = screen.getByRole('button', { name: /zmień hasło/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/inne niż poprzednie/i);
    });

    // Sprawdź czy fetch został wywołany
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/update-password', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
    }));
  });

  it('przekierowuje na stronę powodzenia po udanej zmianie hasła', async () => {
    window.location.search = '?code=abc123';

    // Mock: sukces z API
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, message: 'Hasło zostało zmienione. Zaloguj się z nowym hasłem.' })
    } as any);

    render(<ResetPasswordForm />);

    await userEvent.type(screen.getByLabelText(/^nowe hasło$/i), 'Password123');
    await userEvent.type(screen.getByLabelText(/potwierdzenie hasła/i), 'Password123');

    const form = screen.getByRole('button', { name: /zmień hasło/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(window.location.href).toBe('/password-changed');
    });
  });

  it('wyświetla stan ładowania podczas zmiany hasła', async () => {
    window.location.search = '?code=abc123';

    // Mock: opóźniona odpowiedź
    global.fetch = vi.fn().mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => {
        resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, message: 'Hasło zmienione' })
        });
      }, 100);
    })) as any;

    render(<ResetPasswordForm />);

    await userEvent.type(screen.getByLabelText(/^nowe hasło$/i), 'Password123');
    await userEvent.type(screen.getByLabelText(/potwierdzenie hasła/i), 'Password123');

    const form = screen.getByRole('button', { name: /zmień hasło/i }).closest('form')!;
    fireEvent.submit(form);

    // Stan ładowania
    expect(screen.getByRole('button', { name: /zmiana hasła/i })).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});