type BadgeTone =
  | 'new'
  | 'qualified'
  | 'hot'
  | 'lost'
  | 'support'
  | 'handoff'
  | 'paused'
  | 'active';

const toneClass: Record<BadgeTone, string> = {
  new: 'border-blue-500/35 bg-blue-500/15 text-blue-300',
  qualified: 'border-yellow-500/35 bg-yellow-500/15 text-yellow-200',
  hot: 'border-red-500/35 bg-red-500/15 text-red-300',
  lost: 'border-zinc-400/35 bg-zinc-500/20 text-zinc-200',
  support: 'border-cyan-500/35 bg-cyan-500/15 text-cyan-300',
  handoff: 'border-orange-500/35 bg-orange-500/15 text-orange-300',
  paused: 'border-violet-500/35 bg-violet-500/15 text-violet-300',
  active: 'border-primary/40 bg-primary/15 text-primary',
};

interface StatusBadgeProps {
  tone: BadgeTone;
  label: string;
}

export function StatusBadge({ tone, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${toneClass[tone]}`}
    >
      {label}
    </span>
  );
}
