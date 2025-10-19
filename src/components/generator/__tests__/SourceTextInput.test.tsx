import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SourceTextInput from '../SourceTextInput';

describe('SourceTextInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    minLength: 1000,
    maxLength: 10000,
    disabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderuje textarea z odpowiednimi atrybutami', () => {
    render(<SourceTextInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('placeholder', 'Wklej tutaj tekst, z którego chcesz wygenerować fiszki...');
    expect(textarea).toHaveAttribute('maxLength', '10100'); // maxLength + 100
    expect(textarea).not.toBeDisabled();
  });

  it('wyświetla licznik znaków', () => {
    render(<SourceTextInput {...defaultProps} value="test" />);
    
    expect(screen.getByText('4 / 10000 znaków')).toBeInTheDocument();
  });

  it('wywołuje onChange przy wprowadzaniu tekstu', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    
    render(<SourceTextInput {...defaultProps} onChange={onChange} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'test');
    
    expect(onChange).toHaveBeenCalledTimes(4);
    expect(onChange).toHaveBeenCalledWith(expect.any(String));
  });

  it('wyświetla komunikat o minimum znaków gdy tekst jest za krótki', () => {
    render(<SourceTextInput {...defaultProps} value="za krótki tekst" />);
    
    expect(screen.getByText(/minimum 1000 znaków/)).toBeInTheDocument();
    const helperText = screen.getByText(/15 \/ 10000 znaków/);
    expect(helperText).toHaveClass('text-destructive');
  });

  it('wyświetla komunikat o przekroczeniu maksymalnej długości', () => {
    const longText = 'a'.repeat(10001);
    render(
      <SourceTextInput {...defaultProps} value={longText} />
    );
    
    expect(screen.getByText(/przekroczono maksymalną długość/)).toBeInTheDocument();
    const helperText = screen.getByText(/10001 \/ 10000 znaków/);
    expect(helperText).toHaveClass('text-destructive');
  });

  it('nie wyświetla komunikatu o minimum gdy pole jest puste', () => {
    render(
      <SourceTextInput {...defaultProps} value="" />
    );
    
    expect(screen.queryByText(/minimum 1000 znaków/)).not.toBeInTheDocument();
    const helperText = screen.getByText('0 / 10000 znaków');
    expect(helperText).toHaveClass('text-destructive'); // Komponent pokazuje destructive nawet dla pustego pola
  });

  it('wyświetla normalny kolor gdy długość tekstu jest prawidłowa', () => {
    const validText = 'a'.repeat(5000);
    render(<SourceTextInput {...defaultProps} value={validText} />);
    
    expect(screen.getByText('5000 / 10000 znaków')).toHaveClass('text-muted-foreground');
    expect(screen.queryByText(/minimum/)).not.toBeInTheDocument();
    expect(screen.queryByText(/przekroczono/)).not.toBeInTheDocument();
  });

  it('ustawia aria-invalid gdy tekst jest nieprawidłowy', () => {
    render(<SourceTextInput {...defaultProps} value="za krótki" />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
  });

  it('nie ustawia aria-invalid gdy pole jest puste', () => {
    render(<SourceTextInput {...defaultProps} value="" />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-invalid', 'false');
  });

  it('nie ustawia aria-invalid gdy tekst ma prawidłową długość', () => {
    const validText = 'a'.repeat(5000);
    render(<SourceTextInput {...defaultProps} value={validText} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-invalid', 'false');
  });

  it('wyłącza textarea gdy disabled=true', () => {
    render(<SourceTextInput {...defaultProps} disabled={true} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });

  it('ma odpowiednie aria-describedby dla dostępności', () => {
    render(<SourceTextInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    const helperText = screen.getByText(/znaków/);
    
    expect(textarea).toHaveAttribute('aria-describedby', 'source-text-helper');
    expect(helperText).toHaveAttribute('id', 'source-text-helper');
  });

  it('ma aria-live="polite" dla komunikatów pomocniczych', () => {
    render(<SourceTextInput {...defaultProps} />);
    
    const helperText = screen.getByText(/znaków/);
    expect(helperText).toHaveAttribute('aria-live', 'polite');
  });

  it('obsługuje różne długości minimalnej i maksymalnej', () => {
    render(
      <SourceTextInput 
        {...defaultProps} 
        minLength={500} 
        maxLength={2000} 
        value="test" 
      />
    );
    
    expect(screen.getByText('4 / 2000 znaków')).toBeInTheDocument();
    expect(screen.getByText(/minimum 500 znaków/)).toBeInTheDocument();
  });

  it('snapshot test - stan domyślny', () => {
    const { container } = render(<SourceTextInput {...defaultProps} />);
    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="space-y-2"
      >
        <label
          class="sr-only"
          for="source-text-input"
        >
          Tekst źródłowy do generowania fiszek
        </label>
        <textarea
          aria-describedby="source-text-helper"
          aria-invalid="false"
          class="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[200px] sm:min-h-[300px] resize-y"
          data-slot="textarea"
          id="source-text-input"
          maxlength="10100"
          placeholder="Wklej tutaj tekst, z którego chcesz wygenerować fiszki..."
        />
        <p
          aria-live="polite"
          class="text-sm text-destructive"
          id="source-text-helper"
        >
          0
           / 
          10000
           znaków
        </p>
      </div>
    `);
  });

  it('snapshot test - stan błędu (za krótki tekst)', () => {
    const { container } = render(
      <SourceTextInput {...defaultProps} value="za krótki tekst" />
    );
    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="space-y-2"
      >
        <label
          class="sr-only"
          for="source-text-input"
        >
          Tekst źródłowy do generowania fiszek
        </label>
        <textarea
          aria-describedby="source-text-helper"
          aria-invalid="true"
          class="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[200px] sm:min-h-[300px] resize-y"
          data-slot="textarea"
          id="source-text-input"
          maxlength="10100"
          placeholder="Wklej tutaj tekst, z którego chcesz wygenerować fiszki..."
        >
          za krótki tekst
        </textarea>
        <p
          aria-live="polite"
          class="text-sm text-destructive"
          id="source-text-helper"
        >
          15
           / 
          10000
           znaków
          <span
            class="ml-2"
          >
            (minimum 
            1000
             znaków)
          </span>
        </p>
      </div>
    `);
  });
});