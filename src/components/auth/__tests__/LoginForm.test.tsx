import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoginForm from '../LoginForm';

// Mockowanie fetch API
vi.mock('global', () => ({
  fetch: vi.fn()
}));

describe('LoginForm', () => {
  it('renderuje formularz logowania', () => {
    render(<LoginForm />);
    
    expect(screen.getByRole('textbox', { name: /adres e-mail/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/hasło/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /zaloguj/i })).toBeInTheDocument();
  });
});