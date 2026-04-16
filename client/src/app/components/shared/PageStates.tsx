import { type ReactNode } from 'react';
import { AlertTriangle, Loader2, SearchX } from 'lucide-react';

interface BaseStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: BaseStateProps) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-secondary/60">
        <SearchX className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="mx-auto mb-5 max-w-xl text-sm text-muted-foreground">
        {description}
      </p>
      {action}
    </div>
  );
}

export function LoadingState({ title, description, action }: BaseStateProps) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="mx-auto mb-5 max-w-xl text-sm text-muted-foreground">
        {description}
      </p>
      {action}
    </div>
  );
}

export function ErrorState({ title, description, action }: BaseStateProps) {
  return (
    <div className="rounded-xl border border-red-500/35 bg-red-500/10 p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-red-500/45 bg-red-500/20">
        <AlertTriangle className="h-5 w-5 text-red-300" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-red-200">{title}</h3>
      <p className="mx-auto mb-5 max-w-xl text-sm text-red-100/80">{description}</p>
      {action}
    </div>
  );
}
