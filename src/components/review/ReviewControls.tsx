import { Button } from '@/components/ui/button';

interface ReviewControlsProps {
  selectedCount: number;
  totalCount: number;
  isSaving: boolean;
  onSave: () => void;
}

export function ReviewControls({
  selectedCount,
  totalCount,
  isSaving,
  onSave,
}: ReviewControlsProps) {
  const hasSelection = selectedCount > 0;

  return (
    <div className="border-b bg-background">
      <div className="container flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Recenzja fiszek</h1>
          <p className="text-sm text-muted-foreground">
            Wybrano <span className="font-semibold">{selectedCount}</span> z{' '}
            <span className="font-semibold">{totalCount}</span> fiszek
          </p>
        </div>

        <Button
          onClick={onSave}
          disabled={!hasSelection || isSaving}
          size="lg"
          className="sm:w-auto w-full"
        >
          {isSaving ? 'Zapisywanie...' : 'Zapisz w kolekcji'}
        </Button>
      </div>
    </div>
  );
}

