import { useEffect, useState } from 'react';
import { useAiFlowVariables } from '../../../hooks/useAiFlowVariables';
import { useContactFieldDefinitions } from '../../../hooks/useContactFieldDefinitions';
import { PRESS, PRESS_SM } from '../../../lib/interactions';
import type {
  AiFlowNodeType,
  ConditionOperator,
  ConditionRule,
  ExpressionConditionRule,
  WaitReplyNodeConfig,
} from '../../../types';

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
  TEXT: 'Texto fixo',
  END: 'Fim',
  WAIT_REPLY: 'Resposta do cliente',
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

type ConditionMode = 'FIELD' | 'EXPRESSION';
type WaitAssignKind = 'NONE' | 'FIELD' | 'VARIABLE';

function emptyRule(): ConditionRule {
  return { field: RESERVED_FIELDS[0].key, operator: 'isSet', targetEdgeLabel: '' };
}

function emptyExpressionRule(): ExpressionConditionRule {
  return { expression: '', targetEdgeLabel: '' };
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
  const { data: flowVariables } = useAiFlowVariables();
  const [label, setLabel] = useState('');
  const [instructions, setInstructions] = useState('');
  // Shared between END's (optional) closing message and TEXT's (the whole point of the node)
  // fixed message — the two are never active for the same node instance, so one field is enough.
  const [message, setMessage] = useState('');
  const [conditionMode, setConditionMode] = useState<ConditionMode>('FIELD');
  const [rules, setRules] = useState<ConditionRule[]>([]);
  const [expressionRules, setExpressionRules] = useState<ExpressionConditionRule[]>([]);
  const [waitAssignKind, setWaitAssignKind] = useState<WaitAssignKind>('NONE');
  const [waitAssignKey, setWaitAssignKey] = useState('');
  const [timeoutMinutes, setTimeoutMinutes] = useState('');

  useEffect(() => {
    if (!node) return;
    setLabel(node.label);
    const config = (node.config ?? {}) as {
      instructions?: string;
      message?: string;
      mode?: ConditionMode;
      rules?: (ConditionRule | ExpressionConditionRule)[];
      assign?: WaitReplyNodeConfig['assign'];
      timeoutMinutes?: number;
    };
    setInstructions(config.instructions ?? '');
    setMessage(config.message ?? '');
    const mode = config.mode ?? 'FIELD';
    setConditionMode(mode);
    if (mode === 'EXPRESSION') {
      setExpressionRules((config.rules as ExpressionConditionRule[] | undefined) ?? []);
      setRules([]);
    } else {
      setRules((config.rules as ConditionRule[] | undefined) ?? []);
      setExpressionRules([]);
    }
    setWaitAssignKind(config.assign?.kind ?? 'NONE');
    setWaitAssignKey(config.assign?.key ?? '');
    setTimeoutMinutes(config.timeoutMinutes ? String(config.timeoutMinutes) : '');
  }, [node]);

  if (!node) return null;

  const fieldOptions = [...RESERVED_FIELDS, ...(fieldDefinitions ?? []).map((f) => ({ key: f.key, label: f.key }))];

  function handleSave() {
    if (!node) return;
    const trimmedLabel = label.trim() || TYPE_LABEL[node.type];
    const parsedTimeout = Number.parseInt(timeoutMinutes, 10);
    const config =
      node.type === 'AI_MESSAGE'
        ? { instructions: instructions.trim() || undefined }
        : node.type === 'END' || node.type === 'TEXT'
          ? { message: message.trim() || undefined }
          : node.type === 'CONDITION'
            ? conditionMode === 'EXPRESSION'
              ? {
                  mode: 'EXPRESSION' as const,
                  rules: expressionRules.filter((r) => r.expression.trim() && r.targetEdgeLabel.trim()),
                }
              : { mode: 'FIELD' as const, rules: rules.filter((r) => r.targetEdgeLabel.trim()) }
            : node.type === 'WAIT_REPLY'
              ? {
                  assign:
                    waitAssignKind === 'NONE' || !waitAssignKey
                      ? undefined
                      : { kind: waitAssignKind, key: waitAssignKey },
                  timeoutMinutes: Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : undefined,
                }
              : {};
    onSave(node.id, { label: trimmedLabel, config });
    onClose();
  }

  function updateRule(index: number, patch: Partial<ConditionRule>) {
    setRules((rs) => rs.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function updateExpressionRule(index: number, patch: Partial<ExpressionConditionRule>) {
    setExpressionRules((rs) => rs.map((r, i) => (i === index ? { ...r, ...patch } : r)));
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
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Deixe em branco pra não enviar nada extra ao chegar aqui"
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none focus:border-signal"
            />
          </label>
        )}

        {node.type === 'TEXT' && (
          <label className="mt-4 block text-sm font-medium text-ink/70">
            Texto enviado
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Ex.: Segue nosso cardápio completo: convitta.com/cardapio"
              className="mt-1 w-full resize-none rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none focus:border-signal"
            />
            <span className="mt-1 block text-xs text-ink/40">
              Enviado exatamente como escrito, sem passar pela IA — depois segue direto pro próximo
              passo ligado a este, sem esperar resposta do cliente.
            </span>
          </label>
        )}

        {node.type === 'WAIT_REPLY' && (
          <div className="mt-4">
            <p className="text-sm font-medium text-ink/70">
              Este passo sempre para e espera o cliente responder
            </p>
            <p className="mt-1 text-xs text-ink/40">
              O que fazer com a resposta assim que ela chegar:
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {(['NONE', 'FIELD', 'VARIABLE'] as WaitAssignKind[]).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => {
                    setWaitAssignKind(kind);
                    setWaitAssignKey('');
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${PRESS_SM} ${
                    waitAssignKind === kind
                      ? 'border-signal bg-signal/10 text-ink'
                      : 'border-line bg-paper text-ink/60 hover:bg-mist'
                  }`}
                >
                  {kind === 'NONE' ? 'Nenhum destino' : kind === 'FIELD' ? 'Campo personalizado' : 'Variável global'}
                </button>
              ))}
            </div>

            {waitAssignKind === 'FIELD' && (
              <select
                value={waitAssignKey}
                onChange={(e) => setWaitAssignKey(e.target.value)}
                className="mt-2 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none focus:border-signal"
              >
                <option value="">Escolha um campo…</option>
                {(fieldDefinitions ?? []).map((f) => (
                  <option key={f.id} value={f.key}>
                    {f.key}
                  </option>
                ))}
              </select>
            )}

            {waitAssignKind === 'VARIABLE' && (
              <select
                value={waitAssignKey}
                onChange={(e) => setWaitAssignKey(e.target.value)}
                className="mt-2 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none focus:border-signal"
              >
                <option value="">Escolha uma variável…</option>
                {(flowVariables ?? []).map((v) => (
                  <option key={v.id} value={v.key}>
                    {v.key}
                  </option>
                ))}
              </select>
            )}

            <label className="mt-4 block text-sm font-medium text-ink/70">
              Tempo limite em minutos (opcional)
              <input
                type="number"
                min={1}
                value={timeoutMinutes}
                onChange={(e) => setTimeoutMinutes(e.target.value)}
                placeholder="Deixe em branco para esperar sem limite"
                className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none focus:border-signal"
              />
              <span className="mt-1 block text-xs text-ink/40">
                Se o cliente não responder a tempo, o fluxo segue pela ligação marcada como padrão
                (fallback) deste passo — a mesma opção "Esta é a opção padrão" que aparece ao
                configurar uma ligação.
              </span>
            </label>
          </div>
        )}

        {node.type === 'CONDITION' && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {(['FIELD', 'EXPRESSION'] as ConditionMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setConditionMode(mode)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${PRESS_SM} ${
                    conditionMode === mode
                      ? 'border-signal bg-signal/10 text-ink'
                      : 'border-line bg-paper text-ink/60 hover:bg-mist'
                  }`}
                >
                  {mode === 'FIELD' ? 'Por campo' : 'Por expressão'}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink/40">
              {conditionMode === 'FIELD'
                ? 'Regras (a primeira que bater decide). Ligue este passo aos próximos primeiro (arrastando um conector) e dê um rótulo a cada ligação — as regras abaixo apontam pra esses rótulos.'
                : 'Cada linha é uma expressão (a primeira que der verdadeiro decide). Use $cp.NomeDoCampo$ para campos personalizados, $NomeDaVariavel$ para variáveis globais, e $horarioValido$/$neighborhoodConfirmed$ para os dois sinais do sistema. Trocar de "Por campo" para "Por expressão" (ou vice-versa) descarta as regras do outro modo ao aplicar.'}
            </p>

            {conditionMode === 'FIELD' && (
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

                <button
                  type="button"
                  onClick={() => setRules((rs) => [...rs, emptyRule()])}
                  className={`rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-mist ${PRESS_SM}`}
                >
                  + regra
                </button>
              </div>
            )}

            {conditionMode === 'EXPRESSION' && (
              <div className="mt-3 space-y-3">
                {expressionRules.map((rule, index) => (
                  <div key={index} className="rounded-lg border border-line p-3">
                    <div className="flex items-start gap-2">
                      <textarea
                        value={rule.expression}
                        onChange={(e) => updateExpressionRule(index, { expression: e.target.value })}
                        rows={2}
                        placeholder='Ex.: $cp.Idade$ >= 18 && $horarioValido$ == true'
                        className="min-w-0 flex-1 resize-none rounded-lg border border-line px-2 py-1.5 font-mono text-xs text-ink outline-none focus:border-signal"
                      />
                      <button
                        type="button"
                        onClick={() => setExpressionRules((rs) => rs.filter((_, i) => i !== index))}
                        title="Remover regra"
                        className="shrink-0 text-ink/40 hover:text-stage-lost"
                      >
                        ×
                      </button>
                    </div>
                    <input
                      type="text"
                      list={`edge-labels-${node.id}`}
                      value={rule.targetEdgeLabel}
                      onChange={(e) => updateExpressionRule(index, { targetEdgeLabel: e.target.value })}
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

                <button
                  type="button"
                  onClick={() => setExpressionRules((rs) => [...rs, emptyExpressionRule()])}
                  className={`rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-mist ${PRESS_SM}`}
                >
                  + regra
                </button>
              </div>
            )}

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
