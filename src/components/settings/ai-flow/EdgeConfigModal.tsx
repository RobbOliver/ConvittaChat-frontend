import { useEffect, useState } from 'react';
import { PRESS, PRESS_SM } from '../../../lib/interactions';

export interface EditableEdge {
  id: string;
  routeLabel: string | null;
  isFallback: boolean;
  sourceLabel: string;
  targetLabel: string;
}

interface Props {
  edge: EditableEdge | null;
  onClose: () => void;
  onSave: (edgeId: string, patch: { routeLabel: string | null; isFallback: boolean }) => void;
}

/**
 * Double-click-an-edge popup — same overlay pattern as NodeConfigModal/AiContextResetModal. This
 * is where "expected options + fallback" from the original request actually lives: a labeled edge
 * is one of the options a branching AI_MESSAGE or CONDITION node can route to; the fallback edge
 * is the safety net when nothing else matches.
 */
export function EdgeConfigModal({ edge, onClose, onSave }: Props) {
  const [routeLabel, setRouteLabel] = useState('');
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    if (!edge) return;
    setRouteLabel(edge.routeLabel ?? '');
    setIsFallback(edge.isFallback);
  }, [edge]);

  if (!edge) return null;

  function handleSave() {
    if (!edge) return;
    onSave(edge.id, { routeLabel: routeLabel.trim() || null, isFallback });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-paper p-6 shadow-xl dark:bg-[#1a1b21]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 dark:text-[#ececed]/40">Ligação</p>
        <h2 className="mt-1 font-display text-lg font-semibold text-ink dark:text-[#ececed]">
          {edge.sourceLabel} → {edge.targetLabel}
        </h2>

        <label className="mt-4 block text-sm font-medium text-ink/70 dark:text-[#ececed]/70">
          Rótulo desta opção
          <input
            type="text"
            value={routeLabel}
            onChange={(e) => setRouteLabel(e.target.value)}
            placeholder="Ex.: quer cardápio"
            disabled={isFallback}
            className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none focus:border-signal disabled:bg-mist disabled:text-ink/40 dark:border-[#34353f] dark:bg-[#1a1b21] dark:text-[#ececed] dark:disabled:bg-[#24252e] dark:disabled:text-[#ececed]/40"
          />
          <span className="mt-1 block text-xs text-ink/40 dark:text-[#ececed]/40">
            {isFallback
              ? 'Arestas padrão não usam rótulo — elas são escolhidas quando nenhuma outra opção bate.'
              : 'O que a IA (ou a regra de condição) precisa reconhecer pra seguir por aqui.'}
          </span>
        </label>

        <label className="mt-4 flex items-start gap-2 text-sm text-ink/70 dark:text-[#ececed]/70">
          <input
            type="checkbox"
            checked={isFallback}
            onChange={(e) => setIsFallback(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Esta é a opção padrão (fallback)
            <span className="block text-xs text-ink/40 dark:text-[#ececed]/40">
              Usada quando a resposta do cliente não bate com nenhum rótulo. Só uma por passo — marcar
              esta desmarca automaticamente qualquer outra do mesmo passo ao salvar.
            </span>
          </span>
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full border border-line px-4 py-2 text-sm font-medium text-ink/60 hover:bg-mist dark:border-[#34353f] dark:text-[#ececed]/60 dark:hover:bg-[#24252e] ${PRESS_SM}`}
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
