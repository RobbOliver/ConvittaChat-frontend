import type { ConversationStage } from '../../types';

const STYLES: Record<ConversationStage, string> = {
  NEW: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  WON: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  LOST: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
};

const LABELS: Record<ConversationStage, string> = {
  NEW: 'Novo',
  IN_PROGRESS: 'Em andamento',
  WON: 'Ganho',
  LOST: 'Perdido',
};

export function StageBadge({ stage }: { stage: ConversationStage }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[stage]}`}>
      {LABELS[stage]}
    </span>
  );
}
