import type { Conversation, ConversationStage } from '../../types';
import { StageBadge } from './StageBadge';

const STAGES: ConversationStage[] = ['NEW', 'IN_PROGRESS', 'WON', 'LOST'];

export function PipelinePanel({ conversation }: { conversation: Conversation }) {
  return (
    <aside className="flex w-72 shrink-0 flex-col gap-4 border-l border-neutral-200 px-4 py-4 dark:border-neutral-800">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Estágio
        </h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {STAGES.map((stage) => (
            <div key={stage} className={stage === conversation.stage ? '' : 'opacity-40'}>
              <StageBadge stage={stage} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Responsável
        </h3>
        <p className="mt-1 text-sm text-neutral-900 dark:text-neutral-100">
          {conversation.assigneeName ?? 'Não atribuído'}
        </p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Contato
        </h3>
        <p className="mt-1 text-sm text-neutral-900 dark:text-neutral-100">{conversation.contact.name}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{conversation.contact.phoneNumber}</p>
      </div>
    </aside>
  );
}
