import { Textarea } from '@/components/ui/textarea';

interface SourceTextInputProps {
  value: string;
  onChange: (value: string) => void;
  minLength: number;
  maxLength: number;
  disabled: boolean;
}

export default function SourceTextInput({
  value,
  onChange,
  minLength,
  maxLength,
  disabled,
}: SourceTextInputProps) {
  const currentLength = value.length;
  const isUnderMin = currentLength < minLength;
  const isOverMax = currentLength > maxLength;
  const isInvalid = isUnderMin || isOverMax;

  const helperTextId = 'source-text-helper';
  const textareaId = 'source-text-input';

  return (
    <div className="space-y-2">
      <label htmlFor={textareaId} className="sr-only">
        Tekst źródłowy do generowania fiszek
      </label>
      <Textarea
        id={textareaId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Wklej tutaj tekst, z którego chcesz wygenerować fiszki..."
        className="min-h-[200px] sm:min-h-[300px] resize-y"
        maxLength={maxLength + 100}
        aria-describedby={helperTextId}
        aria-invalid={isInvalid && currentLength > 0}
      />
      <p
        id={helperTextId}
        className={`text-sm ${
          isInvalid ? 'text-destructive' : 'text-muted-foreground'
        }`}
        aria-live="polite"
      >
        {currentLength} / {maxLength} znaków
        {isUnderMin && currentLength > 0 && (
          <span className="ml-2">
            (minimum {minLength} znaków)
          </span>
        )}
        {isOverMax && (
          <span className="ml-2">
            (przekroczono maksymalną długość)
          </span>
        )}
      </p>
    </div>
  );
}

