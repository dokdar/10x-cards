import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewControls } from '../ReviewControls';

describe('ReviewControls', () => {
  const defaultProps = {
    selectedCount: 0,
    totalCount: 5,
    isSaving: false,
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderuje komponent z podstawowymi elementami', () => {
    render(<ReviewControls {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /recenzja fiszek/i })).toBeInTheDocument();
    expect(screen.getByText(/wybrano/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /zapisz w kolekcji/i })).toBeInTheDocument();
  });

  it('wyświetla poprawne liczby fiszek', () => {
    render(<ReviewControls selectedCount={3} totalCount={10} isSaving={false} onSave={vi.fn()} />);
    
    expect(screen.getByText(/wybrano/i)).toHaveTextContent('Wybrano 3 z 10 fiszek');
  });

  it('wyświetla liczby w liczbie pojedynczej dla jednej fiszki', () => {
    render(<ReviewControls selectedCount={1} totalCount={1} isSaving={false} onSave={vi.fn()} />);
    
    expect(screen.getByText(/wybrano/i)).toHaveTextContent('Wybrano 1 z 1 fiszek');
  });

  it('przycisk zapisz jest wyłączony gdy nie wybrano żadnej fiszki', () => {
    render(<ReviewControls {...defaultProps} selectedCount={0} />);
    
    const saveButton = screen.getByRole('button', { name: /zapisz w kolekcji/i });
    expect(saveButton).toBeDisabled();
  });

  it('przycisk zapisz jest aktywny gdy wybrano przynajmniej jedną fiszkę', () => {
    render(<ReviewControls {...defaultProps} selectedCount={1} />);
    
    const saveButton = screen.getByRole('button', { name: /zapisz w kolekcji/i });
    expect(saveButton).not.toBeDisabled();
  });

  it('przycisk zapisz jest wyłączony podczas zapisywania', () => {
    render(<ReviewControls {...defaultProps} selectedCount={3} isSaving={true} />);
    
    const saveButton = screen.getByRole('button', { name: /zapisywanie/i });
    expect(saveButton).toBeDisabled();
  });

  it('wyświetla tekst "Zapisywanie..." podczas zapisywania', () => {
    render(<ReviewControls {...defaultProps} selectedCount={3} isSaving={true} />);
    
    expect(screen.getByRole('button', { name: /zapisywanie/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /zapisz w kolekcji/i })).not.toBeInTheDocument();
  });

  it('wywołuje onSave po kliknięciu przycisku zapisz', async () => {
    const mockOnSave = vi.fn();
    render(<ReviewControls {...defaultProps} selectedCount={3} onSave={mockOnSave} />);
    
    const saveButton = screen.getByRole('button', { name: /zapisz w kolekcji/i });
    await userEvent.click(saveButton);
    
    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });

  it('nie wywołuje onSave gdy przycisk jest wyłączony', async () => {
    const mockOnSave = vi.fn();
    render(<ReviewControls {...defaultProps} selectedCount={0} onSave={mockOnSave} />);
    
    const saveButton = screen.getByRole('button', { name: /zapisz w kolekcji/i });
    
    // Próba kliknięcia wyłączonego przycisku
    fireEvent.click(saveButton);
    
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('obsługuje stan brzegowy - zero fiszek', () => {
    render(<ReviewControls selectedCount={0} totalCount={0} isSaving={false} onSave={vi.fn()} />);
    
    expect(screen.getByText(/wybrano/i)).toHaveTextContent('Wybrano 0 z 0 fiszek');
    expect(screen.getByRole('button', { name: /zapisz w kolekcji/i })).toBeDisabled();
  });

  it('obsługuje stan brzegowy - wszystkie fiszki wybrane', () => {
    render(<ReviewControls selectedCount={5} totalCount={5} isSaving={false} onSave={vi.fn()} />);
    
    expect(screen.getByText(/wybrano/i)).toHaveTextContent('Wybrano 5 z 5 fiszek');
    expect(screen.getByRole('button', { name: /zapisz w kolekcji/i })).not.toBeDisabled();
  });

  it('ma odpowiednią strukturę dla responsywności', () => {
    const { container } = render(<ReviewControls {...defaultProps} />);
    
    // Sprawdź czy kontener ma klasy responsywne
    const mainContainer = container.querySelector('.container');
    expect(mainContainer).toHaveClass('flex', 'flex-col', 'gap-4', 'py-4', 'sm:flex-row', 'sm:items-center', 'sm:justify-between');
    
    // Sprawdź czy przycisk ma klasy responsywne
    const saveButton = screen.getByRole('button', { name: /zapisz w kolekcji/i });
    expect(saveButton).toHaveClass('sm:w-auto', 'w-full');
  });

  it('snapshot test - stan domyślny', () => {
    const { container } = render(<ReviewControls {...defaultProps} selectedCount={2} />);
    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="border-b bg-background"
        data-test-id="review-controls"
      >
        <div
          class="container flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div
            class="flex flex-col gap-1"
          >
            <h1
              class="text-2xl font-bold"
              data-test-id="review-title"
            >
              Recenzja fiszek
            </h1>
            <p
              class="text-sm text-muted-foreground"
              data-test-id="selection-count"
            >
              Wybrano 
              <span
                class="font-semibold"
              >
                2
              </span>
               z
               
              <span
                class="font-semibold"
              >
                5
              </span>
               fiszek
            </p>
          </div>
          <button
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-10 rounded-md px-6 has-[>svg]:px-4 sm:w-auto w-full"
            data-slot="button"
            data-test-id="save-flashcards-button"
          >
            Zapisz w kolekcji
          </button>
        </div>
      </div>
    `);
  });

  it('snapshot test - stan zapisywania', () => {
    const { container } = render(<ReviewControls {...defaultProps} selectedCount={3} isSaving={true} />);
    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="border-b bg-background"
        data-test-id="review-controls"
      >
        <div
          class="container flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div
            class="flex flex-col gap-1"
          >
            <h1
              class="text-2xl font-bold"
              data-test-id="review-title"
            >
              Recenzja fiszek
            </h1>
            <p
              class="text-sm text-muted-foreground"
              data-test-id="selection-count"
            >
              Wybrano 
              <span
                class="font-semibold"
              >
                3
              </span>
               z
               
              <span
                class="font-semibold"
              >
                5
              </span>
               fiszek
            </p>
          </div>
          <button
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-10 rounded-md px-6 has-[>svg]:px-4 sm:w-auto w-full"
            data-slot="button"
            data-test-id="save-flashcards-button"
            disabled=""
          >
            Zapisywanie...
          </button>
        </div>
      </div>
    `);
  });

  it('snapshot test - brak wybranych fiszek', () => {
    const { container } = render(<ReviewControls {...defaultProps} selectedCount={0} />);
    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="border-b bg-background"
        data-test-id="review-controls"
      >
        <div
          class="container flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div
            class="flex flex-col gap-1"
          >
            <h1
              class="text-2xl font-bold"
              data-test-id="review-title"
            >
              Recenzja fiszek
            </h1>
            <p
              class="text-sm text-muted-foreground"
              data-test-id="selection-count"
            >
              Wybrano 
              <span
                class="font-semibold"
              >
                0
              </span>
               z
               
              <span
                class="font-semibold"
              >
                5
              </span>
               fiszek
            </p>
          </div>
          <button
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-10 rounded-md px-6 has-[>svg]:px-4 sm:w-auto w-full"
            data-slot="button"
            data-test-id="save-flashcards-button"
            disabled=""
          >
            Zapisz w kolekcji
          </button>
        </div>
      </div>
    `);
  });
});