import type { ConversationStage } from '../../types';
import { STAGE_DOT, STAGE_LABELS, STAGE_SOFT } from './stageTheme';

export function StageBadge({ stage }: { stage: ConversationStage }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${STAGE_SOFT[stage]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${STAGE_DOT[stage]}`} aria-hidden />
      {STAGE_LABELS[stage]}
    </span>
  );
}
