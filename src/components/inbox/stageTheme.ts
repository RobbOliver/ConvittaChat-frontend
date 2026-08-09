import type { ConversationStage } from '../../types';

export const STAGE_LABELS: Record<ConversationStage, string> = {
  NEW: 'Novo',
  IN_PROGRESS: 'Em andamento',
  WON: 'Ganho',
  LOST: 'Perdido',
};

export const STAGE_DOT: Record<ConversationStage, string> = {
  NEW: 'bg-stage-new',
  IN_PROGRESS: 'bg-stage-progress',
  WON: 'bg-stage-won',
  LOST: 'bg-stage-lost',
};

export const STAGE_SOFT: Record<ConversationStage, string> = {
  NEW: 'bg-stage-new-soft text-stage-new',
  IN_PROGRESS: 'bg-stage-progress-soft text-stage-progress',
  WON: 'bg-stage-won-soft text-stage-won',
  LOST: 'bg-stage-lost-soft text-stage-lost',
};
