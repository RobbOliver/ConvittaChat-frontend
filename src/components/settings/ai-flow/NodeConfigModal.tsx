import { useEffect, useState } from 'react';
import { PRESS, PRESS_SM } from '../../../lib/interactions';
import type { AiFlowNodeType } from '../../../types';

export interface EditableNode {
  id: string;
  type: AiFlowNodeType;
  label: string;
  config: unknown;
}

const TYPE_LABEL: Record<AiFlowNodeType, string> = {
  TRIGGER: 'Início',
  AI_MESSAGE: 'Mensagem de IA',
  CONDITION: 'Condição',
  END: 'Fim',
};

const INSTRUCTIONS_SOFT_LIMIT = 400;

interface Props {
  node: EditableNode | null;
  onClose: () => void;
  onSave: (nodeId: string, patch: { label: string; config: unknown }) => void;
}

/**
 * Double-click-to-configure popup, following the same overlay pattern as AiContextResetModal
 * (custom, no modal library, backdrop click closes). Every node type shares a label field; the
 * rest of the form is per-type, matching what's actually stored in AiFlowNode.config.
 */
export function NodeConfigModal({ node, onClose, onSave }: Props) {
  const [label, setLabel] = useState('');
  const [instructions, setInstructions] = useState('');
  const [endMessage, setEndMessage] = useState('');

  useEffect(() => {
    if (!node) return;
    setLabel(node.label);
    const config = (node.config ?? {}) as { instructions?: string; message?: string };
    setInstructions(config.instructions ?? '');
    setEndMessage(config.message ?? '');
  }, [node]);

  if (!node) return null;

  function handleSave() {
    if (!node) return;
    const trimmedLabel = label.trim() || TYPE_LABEL[node.type];
    const config =
      node.type === 'AI_MESSAGE'
        ? { instructions: instructions.trim() || undefined }
        : node.type === 'END'
          ? { message: endMessage.trim() || undefined }
          : {};
    onSave(node.id, { label: trimmedLabel, config });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-paper p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">{TYPE_LABEL[node.type]}</p>
        <h2 className="mt-1 font-display text-lg font-semibold text-ink">Configurar passo</h2>

        <label className="mt-4 block text-sm font-medium text-ink/70">
          Nome deste passo
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none focus:border-signal"
          />
        </label>

        {node.type === 'AI_MESSAGE' && (
          <label className="mt-4 block text-sm font-medium text-ink/70">
            Instruções da IA pra este passo
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={5}
              placeholder="Ex.: Pergunte se o cliente quer entrega ou retirada."
              className="mt-1 w-full resize-none rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none focus:border-signal"
            />
            <span className={`mt-1 block text-xs ${instructions.length > INSTRUCTIONS_SOFT_LIMIT ? 'text-signal' : 'text-ink/40'}`}>
              {instructions.length > INSTRUCTIONS_SOFT_LIMIT
                ? 'Instrução longa — considere dividir em mais de um passo pra IA ficar mais precisa.'
                : 'Vale só pra este passo — as regras gerais (persona, horário, segurança) já valem sempre.'}
            </span>
          </label>
        )}

        {node.type === 'END' && (
          <label className="mt-4 block text-sm font-medium text-ink/70">
            Mensagem de encerramento (opcional)
            <input
              type="text"
              value={endMessage}
              onChange={(e) => setEndMessage(e.target.value)}
              placeholder="Deixe em branco pra não enviar nada extra ao chegar aqui"
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none focus:border-signal"
            />
          </label>
        )}

        {node.type === 'CONDITION' && (
          <p className="mt-4 rounded-lg bg-mist px-3 py-2 text-sm text-ink/50">
            Editor de regras de condição chega numa próxima etapa — por enquanto só o nome deste
            passo pode ser alterado aqui.
          </p>
        )}

        {node.type === 'TRIGGER' && (
          <p className="mt-4 text-sm text-ink/50">Sempre o ponto de partida — toda conversa nova começa por aqui.</p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full border border-line px-4 py-2 text-sm font-medium text-ink/60 hover:bg-mist ${PRESS_SM}`}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={`rounded-full bg-signal px-4 py-2 text-sm font-semibold text-ink ${PRESS}`}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
