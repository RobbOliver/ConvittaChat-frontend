import { useEffect, useState } from 'react';
import { useContactFieldDefinitions } from '../../../hooks/useContactFieldDefinitions';
import { PRESS, PRESS_SM } from '../../../lib/interactions';
import type { AiFlowNodeType, ConditionOperator, ConditionRule } from '../../../types';

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

const OPERATOR_LABEL: Record<ConditionOperator, string> = {
  isSet: 'está preenchido',
  isEmpty: 'está vazio',
  equals: 'é igual a',
  notEquals: 'é diferente de',
};

// The two signals computed deterministically by the backend, never by the model — same reserved
// pair as ia/'s systemPrompt.ts rule 6, always available regardless of what custom fields exist.
const RESERVED_FIELDS = [
  { key: 'horarioValido', label: 'Horário solicitado é válido' },
  { key: 'neighborhoodConfirmed', label: 'Bairro confirmado' },
];

const INSTRUCTIONS_SOFT_LIMIT = 400;

function emptyRule(): ConditionRule {
  return { field: RESERVED_FIELDS[0].key, operator: 'isSet', targetEdgeLabel: '' };
}

interface Props {
  node: EditableNode | null;
  /** This node's current outgoing edge labels (non-fallback), offered as autocomplete suggestions
   * for a rule's target — connect and label the edges first, then point rules at them here. */
  outgoingEdgeLabels: string[];
  onClose: () => void;
  onSave: (nodeId: string, patch: { label: string; config: unknown }) => void;
}

/**
 * Double-click-to-configure popup, following the same overlay pattern as AiContextResetModal
 * (custom, no modal library, backdrop click closes). Every node type shares a label field; the
 * rest of the form is per-type, matching what's actually stored in AiFlowNode.config.
 */
export function NodeConfigModal({ node, outgoingEdgeLabels, onClose, onSave }: Props) {
  const { data: fieldDefinitions } = useContactFieldDefinitions();
  const [label, setLabel] = useState('');
  const [instructions, setInstructions] = useState('');
  const [endMessage, setEndMessage] = useState('');
  const [rules, setRules] = useState<ConditionRule[]>([]);

  useEffect(() => {
    if (!node) return;
    setLabel(node.label);
    const config = (node.config ?? {}) as { instructions?: string; message?: string; rules?: ConditionRule[] };
    setInstructions(config.instructions ?? '');
    setEndMessage(config.message ?? '');
    setRules(config.rules ?? []);
  }, [node]);

  if (!node) return null;

  const fieldOptions = [...RESERVED_FIELDS, ...(fieldDefinitions ?? []).map((f) => ({ key: f.key, label: f.key }))];

  function handleSave() {
    if (!node) return;
    const trimmedLabel = label.trim() || TYPE_LABEL[node.type];
    const config =
      node.type === 'AI_MESSAGE'
        ? { instructions: instructions.trim() || undefined }
        : node.type === 'END'
          ? { message: endMessage.trim() || undefined }
          : node.type === 'CONDITION'
            ? { rules: rules.filter((r) => r.targetEdgeLabel.trim()) }
            : {};
    onSave(node.id, { label: trimmedLabel, config });
    onClose();
  }

  function updateRule(index: number, patch: Partial<ConditionRule>) {
    setRules((rs) => rs.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-paper p-6 shadow-xl"
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
          <div className="mt-4">
            <p className="text-sm font-medium text-ink/70">Regras (a primeira que bater decide)</p>
            <p className="mt-1 text-xs text-ink/40">
              Ligue este passo aos próximos primeiro (arrastando um conector) e dê um rótulo a cada
              ligação — as regras abaixo apontam pra esses rótulos.
            </p>

            <div className="mt-3 space-y-3">
              {rules.map((rule, index) => (
                <div key={index} className="rounded-lg border border-line p-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={rule.field}
                      onChange={(e) => updateRule(index, { field: e.target.value })}
                      className="min-w-0 flex-1 rounded-lg border border-line px-2 py-1.5 text-xs text-ink outline-none focus:border-signal"
                    >
                      {fieldOptions.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={rule.operator}
                      onChange={(e) => updateRule(index, { operator: e.target.value as ConditionOperator })}
                      className="rounded-lg border border-line px-2 py-1.5 text-xs text-ink outline-none focus:border-signal"
                    >
                      {(Object.keys(OPERATOR_LABEL) as ConditionOperator[]).map((op) => (
                        <option key={op} value={op}>
                          {OPERATOR_LABEL[op]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setRules((rs) => rs.filter((_, i) => i !== index))}
                      title="Remover regra"
                      className="shrink-0 text-ink/40 hover:text-stage-lost"
                    >
                      ×
                    </button>
                  </div>

                  {(rule.operator === 'equals' || rule.operator === 'notEquals') && (
                    <input
                      type="text"
                      value={rule.value ?? ''}
                      onChange={(e) => updateRule(index, { value: e.target.value })}
                      placeholder="Valor"
                      className="mt-2 w-full rounded-lg border border-line px-2 py-1.5 text-xs text-ink outline-none focus:border-signal"
                    />
                  )}

                  <input
                    type="text"
                    list={`edge-labels-${node.id}`}
                    value={rule.targetEdgeLabel}
                    onChange={(e) => updateRule(index, { targetEdgeLabel: e.target.value })}
                    placeholder="Rótulo da ligação de destino"
                    className="mt-2 w-full rounded-lg border border-line px-2 py-1.5 text-xs text-ink outline-none focus:border-signal"
                  />
                </div>
              ))}
              <datalist id={`edge-labels-${node.id}`}>
                {outgoingEdgeLabels.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </div>

            <button
              type="button"
              onClick={() => setRules((rs) => [...rs, emptyRule()])}
              className={`mt-3 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-mist ${PRESS_SM}`}
            >
              + regra
            </button>

            <p className="mt-3 text-xs text-ink/40">
              Se nenhuma regra bater, segue pela ligação marcada como padrão (fallback) — se não
              houver uma, a conversa recebe a mensagem de erro genérica e recomeça.
            </p>
          </div>
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
