import type { ConversationStage } from '../../types';
import { STAGE_DOT, STAGE_LABELS } from './stageTheme';

const TRACK: ConversationStage[] = ['NEW', 'IN_PROGRESS'];
const OUTCOMES: ConversationStage[] = ['WON', 'LOST'];

export function StageFunnel({ stage }: { stage: ConversationStage }) {
  const pastNew = stage !== 'NEW';
  const decided = stage === 'WON' || stage === 'LOST';

  return (
    <div>
      <div className="flex items-center">
        {TRACK.map((step, index) => (
          <div key={step} className="flex flex-1 items-center last:flex-initial">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 rounded-full border-2 ${
                  step === stage || (step === 'NEW' && pastNew)
                    ? `${STAGE_DOT[step]} border-transparent`
                    : 'border-line bg-paper'
                }`}
                aria-hidden
              />
              <span className={`text-[11px] font-medium ${step === stage ? 'text-ink' : 'text-ink/40'}`}>
                {STAGE_LABELS[step]}
              </span>
            </div>
            {index === 0 && (
              <span className={`mx-1.5 mb-4 h-px flex-1 ${pastNew ? 'bg-stage-progress' : 'bg-line'}`} aria-hidden />
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2 border-t border-line pt-3">
        {OUTCOMES.map((step) => {
          const isActive = step === stage;
          return (
            <div
              key={step}
              className={`flex flex-1 items-center gap-2 rounded-lg px-2.5 py-2 ${isActive ? 'bg-mist' : ''}`}
            >
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full border-2 ${
                  isActive ? `${STAGE_DOT[step]} border-transparent` : 'border-line bg-paper'
                }`}
                aria-hidden
              />
              <span
                className={`text-[11px] font-medium ${isActive ? 'text-ink' : 'text-ink/40'} ${
                  decided && !isActive ? 'line-through decoration-ink/20' : ''
                }`}
              >
                {STAGE_LABELS[step]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
