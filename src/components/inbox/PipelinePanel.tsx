import { contactDisplayName, getInitials } from '../../lib/format';
import type { ConversationDetail } from '../../types';
import { StageFunnel } from './StageFunnel';

export function PipelinePanel({ conversation }: { conversation: ConversationDetail }) {
  const name = contactDisplayName(conversation.contact);

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col gap-6 overflow-y-auto border-l border-line bg-paper px-5 py-6">
      <div>
        <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/40">
          Funil de vendas
        </h3>
        <div className="mt-3">
          <StageFunnel stage={conversation.stage} />
        </div>
      </div>

      <div className="h-px bg-line" />

      <div>
        <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/40">
          Responsável
        </h3>
        <p className="mt-2 text-sm text-ink">
          {conversation.assigneeName ?? <span className="text-ink/40">Não atribuído</span>}
        </p>
      </div>

      <div>
        <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/40">Contato</h3>
        <div className="mt-2 flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mist font-display text-sm font-semibold text-ink">
            {getInitials(name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm text-ink">{name}</p>
            <p className="font-mono text-xs text-ink/40">{conversation.contact.phoneNumber}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/40">Número</h3>
        <p className="mt-2 text-sm text-ink">{conversation.session.label}</p>
        <p className="font-mono text-xs text-ink/40">{conversation.session.phoneNumber ?? '—'}</p>
      </div>
    </aside>
  );
}
