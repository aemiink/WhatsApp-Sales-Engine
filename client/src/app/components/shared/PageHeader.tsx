import { type ReactNode } from 'react';

interface PageHeaderAction {
  id: string;
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: ReactNode;
}

interface PageHeaderProps {
  title: string;
  description: string;
  badge?: string;
  actions?: PageHeaderAction[];
}

const actionVariantClass = {
  primary:
    'bg-primary text-black hover:bg-primary/90 shadow-lg shadow-primary/25',
  secondary: 'bg-secondary text-foreground hover:bg-secondary/70',
  danger: 'bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/40',
};

export function PageHeader({
  title,
  description,
  badge,
  actions,
}: PageHeaderProps) {
  return (
    <header className="mb-6 space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            {description}
          </p>
        </div>

        {(badge || actions?.length) && (
          <div className="flex flex-wrap items-center gap-2">
            {badge ? (
              <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {badge}
              </span>
            ) : null}
            {actions?.map((action) => (
              <button
                key={action.id}
                onClick={action.onClick}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  actionVariantClass[action.variant ?? 'secondary']
                }`}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
