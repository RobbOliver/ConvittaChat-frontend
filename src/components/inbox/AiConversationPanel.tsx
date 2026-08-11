import { useEffect, useState } from 'react';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useUpdateConversationAi } from '../../hooks/useUpdateConversationAi';
import type { ConversationDetail } from '../../types';
import { AiContextResetModal } from './AiContextResetModal';
import { PRESS } from '../../lib/interactions';
import { Toggle } from '../ui/Toggle';

interface Props {
  conversation: ConversationDetail;
}

/** The AI's view of this specific conversation: a toggle to opt this contact out of automation
 * without touching the account-wide setting, an editable "Objetivo" note guiding what the AI
 * should still find out, and two read-only blocks the AI itself maintains — never hand-edited. */
export function AiConversationPanel({ conversation }: Props) {
  const { data: currentUser } = useCurrentUser();
  const updateAi = useUpdateConversationAi();
  const [objective, setObjective] = useState(conversation.aiObjective ?? '');
  const [resetModalOpen, setResetModalOpen] = useState(false);

  useEffect(() => {
    setObjective(conversation.aiObjective ?? '');
  }, [conversation.id, conversation.aiObjective]);

  function saveObjectiveIfChanged() {
    const trimmed = objective.trim();
    if (trimmed === (conversation.aiObjective ?? '')) return;
    updateAi.mutate({ conversationId: conversation.id, aiObjective: trimmed || null });
  }

  return (
    <div className="border-t border-line px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/35">
            IA responde automaticamente aqui
          </p>
          <p className="mt-0.5 text-xs text-ink/40">Desliga só para essa conversa, sem afetar as outras.</p>
        </div>
        <Toggle
          checked={conversation.aiEnabled}
          onChange={(checked) =>
            updateAi.mutate({ conversationId: conversation.id, aiEnabled: checked })
          }
          label="IA responde automaticamente nesta conversa"
        />
      </div>

      <label className="mt-4 block">
        <span className="pb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink/35">
          Objetivo
        </span>
        <textarea
          value={objective}
          onChange={(event) => setObjective(event.target.value)}
          onBlur={saveObjectiveIfChanged}
          rows={2}
          placeholder={
            currentUser?.aiDefaultObjective
              ? `Usando o padrão: "${currentUser.aiDefaultObjective}"`
              : 'O que ainda falta pra fechar — ex.: confirmar endereço e horário'
          }
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-signal focus:ring-2 focus:ring-signal/20"
        />
        <span className="mt-1 block text-xs text-ink/40">
          Em branco, usa o objetivo padrão configurado em Configurações. Preencher aqui vale só pra
          esse contato.
        </span>
      </label>

      <div className="mt-4">
        <p className="pb-1 text-[11px] font-semibold uppercase tracking-wide text-ink/35">Contexto do dia</p>
        {conversation.aiContextWindow ? (
          <p className="whitespace-pre-wrap rounded-lg border border-line bg-mist/60 px-3 py-2 text-xs leading-relaxed text-ink/60">
            {conversation.aiContextWindow}
          </p>
        ) : (
          <p className="text-xs text-ink/35">Sem mensagens recentes.</p>
        )}
      </div>

      <div className="mt-4">
        <p className="pb-1 text-[11px] font-semibold uppercase tracking-wide text-ink/35">
          Contexto geral do cliente
        </p>
        {conversation.contact.aiLongTermMemory ? (
          <p className="whitespace-pre-wrap rounded-lg border border-line bg-mist/60 px-3 py-2 text-xs leading-relaxed text-ink/60">
            {conversation.contact.aiLongTermMemory}
          </p>
        ) : (
          <p className="text-xs text-ink/35">A IA ainda não aprendeu nada duradouro sobre esse cliente.</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setResetModalOpen(true)}
        className={`mt-4 text-xs font-medium text-ink/50 hover:text-ink ${PRESS}`}
      >
        Zerar contexto…
      </button>

      <AiContextResetModal
        open={resetModalOpen}
        conversationId={conversation.id}
        onClose={() => setResetModalOpen(false)}
      />
    </div>
  );
}
