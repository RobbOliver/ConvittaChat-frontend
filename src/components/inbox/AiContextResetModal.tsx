import { useEffect, useState } from 'react';
import { useResetAiContext, type AiContextResetScope } from '../../hooks/useResetAiContext';
import { PRESS } from '../../lib/interactions';

interface Props {
  open: boolean;
  conversationId: string;
  onClose: () => void;
}

const optionClass =
  'w-full rounded-lg border border-line px-4 py-3 text-left transition hover:bg-mist disabled:opacity-50';

/** Lets the admin reset what the AI knows about this contact without touching the real chat
 * history — three independent scopes, from "just today" up to everything AI-related at once. */
export function AiContextResetModal({ open, conversationId, onClose }: Props) {
  const resetContext = useResetAiContext(conversationId);
  const [confirmingAll, setConfirmingAll] = useState(false);

  useEffect(() => {
    if (!open) setConfirmingAll(false);
  }, [open]);

  if (!open) return null;

  function handleReset(scope: AiContextResetScope) {
    resetContext.mutate(scope, { onSuccess: onClose });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-paper p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <h2 className="font-display text-lg font-semibold text-ink">Zerar contexto da IA</h2>
        <p className="mt-1 text-sm text-ink/50">
          Nenhuma dessas opções apaga mensagem do chat — só o que a IA usa como memória pra essa conversa.
        </p>

        <div className="mt-4 space-y-2">
          <button
            type="button"
            disabled={resetContext.isPending}
            onClick={() => handleReset('day')}
            className={`${optionClass} ${PRESS}`}
          >
            <p className="text-sm font-medium text-ink">Contexto do dia</p>
            <p className="mt-0.5 text-xs text-ink/50">
              A IA para de considerar as mensagens de hoje anteriores a agora — começa do zero a partir daqui.
            </p>
          </button>

          <button
            type="button"
            disabled={resetContext.isPending}
            onClick={() => handleReset('general')}
            className={`${optionClass} ${PRESS}`}
          >
            <p className="text-sm font-medium text-ink">Contexto geral</p>
            <p className="mt-0.5 text-xs text-ink/50">
              Apaga o que a IA aprendeu sobre esse cliente ao longo do tempo.
            </p>
          </button>

          {!confirmingAll ? (
            <button
              type="button"
              disabled={resetContext.isPending}
              onClick={() => setConfirmingAll(true)}
              className={`${optionClass} border-stage-lost/30 ${PRESS}`}
            >
              <p className="text-sm font-medium text-stage-lost">Apagar todos os dados da IA</p>
              <p className="mt-0.5 text-xs text-ink/50">
                Zera contexto do dia, contexto geral, objetivo e campos personalizados desse contato. O
                histórico do chat continua intacto.
              </p>
            </button>
          ) : (
            <div className="rounded-lg border border-stage-lost/30 bg-stage-lost/5 px-4 py-3">
              <p className="text-sm font-medium text-stage-lost">Tem certeza?</p>
              <p className="mt-0.5 text-xs text-ink/60">Essa ação não pode ser desfeita.</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingAll(false)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium text-ink/60 hover:bg-mist ${PRESS}`}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={resetContext.isPending}
                  onClick={() => handleReset('all')}
                  className={`rounded-full bg-stage-lost px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60 ${PRESS}`}
                >
                  {resetContext.isPending ? 'Apagando…' : 'Confirmar'}
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className={`mt-4 text-sm text-ink/50 hover:text-ink ${PRESS}`}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
