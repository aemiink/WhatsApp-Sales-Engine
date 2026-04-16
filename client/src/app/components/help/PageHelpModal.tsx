import { X } from 'lucide-react';
import { PageHelpContent } from './help-content';

interface PageHelpModalProps {
  open: boolean;
  content: PageHelpContent | null;
  onClose: (markAsSeen?: boolean) => void;
}

export function PageHelpModal({ open, content, onClose }: PageHelpModalProps) {
  if (!open || !content) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-[#131722] p-5 shadow-2xl">
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Page Help
            </p>
            <h2 className="text-xl font-bold">{content.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{content.purpose}</p>
          </div>
          <button
            onClick={() => onClose(true)}
            className="rounded-lg border border-border bg-secondary/45 p-2 text-muted-foreground hover:text-foreground"
            aria-label="Yardim penceresini kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid gap-3 md:grid-cols-3">
          <section className="rounded-lg border border-border bg-secondary/35 p-3">
            <h3 className="mb-2 text-sm font-semibold">Burada ne yapabilirsin?</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {content.canDo.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-lg border border-border bg-secondary/35 p-3">
            <h3 className="mb-2 text-sm font-semibold">En onemli alanlar</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {content.keyAreas.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-lg border border-border bg-secondary/35 p-3">
            <h3 className="mb-2 text-sm font-semibold">Kritik aksiyonlar</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {content.criticalActions.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </section>
        </div>

        <footer className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={() => onClose(false)}
            className="rounded-lg border border-border bg-secondary/45 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Simdi kapat (otomatik gostermeye devam)
          </button>
          <button
            onClick={() => onClose(true)}
            className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-black hover:bg-primary/90"
          >
            Anladim, bir daha otomatik gosterme
          </button>
        </footer>
      </div>
    </div>
  );
}
