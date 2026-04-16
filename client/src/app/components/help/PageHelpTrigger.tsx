import { CircleHelp } from 'lucide-react';

interface PageHelpTriggerProps {
  onClick: () => void;
}

export function PageHelpTrigger({ onClick }: PageHelpTriggerProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/45 px-3 py-2 text-sm font-semibold text-muted-foreground transition-all hover:bg-secondary/65 hover:text-foreground"
      aria-label="Sayfa yardimini ac"
      title="Sayfa yardimini ac"
    >
      <CircleHelp className="h-4 w-4" />
      <span>Yardim</span>
    </button>
  );
}
