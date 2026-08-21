import { useState, type FormEvent } from 'react';
import {
  useAiFlowVariables,
  useCreateAiFlowVariable,
  useDeleteAiFlowVariable,
  useRenameAiFlowVariable,
} from '../../../hooks/useAiFlowVariables';
import { PRESS, PRESS_SM } from '../../../lib/interactions';
import type { AiFlowVariable } from '../../../types';

/**
 * Collapsible drawer pinned to the canvas's far left edge — floats over the graph rather than
 * pushing it (same idiom as a map's floating control panel), so it never fights the canvas for
 * width. Manages AiFlowVariable definitions (mirrors SalesFieldDefinitions' list/add/rename/delete
 * UI); each one's actual per-conversation value is written at runtime by a WAIT_REPLY node, never
 * edited here.
 */
export function FlowVariablesPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: variables, isLoading } = useAiFlowVariables();
  const createVariable = useCreateAiFlowVariable();
  const [draftKey, setDraftKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const key = draftKey.trim();
    if (!key) return;
    setError(null);
    createVariable.mutate(key, {
      onSuccess: () => setDraftKey(''),
      onError: () =>
        setError('Não foi possível criar essa variável — talvez já exista ou o nome seja reservado.'),
    });
  }

  return (
    <div className="nodrag nopan absolute left-0 top-3 z-10 flex items-stretch">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className={`shrink-0 rounded-r-lg border border-line bg-paper px-2 py-3 text-xs font-medium text-ink/70 shadow-sm hover:bg-mist dark:border-[#34353f] dark:bg-[#1a1b21] dark:text-[#ececed]/70 dark:hover:bg-[#24252e] ${PRESS_SM}`}
        style={{ writingMode: 'vertical-rl' }}
      >
        Variáveis
      </button>
      <div
        className={`overflow-hidden rounded-r-xl border border-l-0 border-line bg-paper shadow-lg transition-[width] duration-200 dark:border-[#34353f] dark:bg-[#1a1b21] ${
          isOpen ? 'w-72' : 'w-0'
        }`}
      >
        <div className="w-72 p-4">
          <h4 className="font-display text-sm font-semibold text-ink dark:text-[#ececed]">Variáveis</h4>
          <p className="mt-1 text-xs text-ink/50 dark:text-[#ececed]/50">
            Memória de trabalho do fluxo — use <code>$NomeDaVariavel$</code> em condições por
            expressão.
          </p>

          {isLoading && <p className="mt-3 text-sm text-ink/40 dark:text-[#ececed]/40">Carregando…</p>}
          {!isLoading && variables && variables.length === 0 && (
            <p className="mt-3 text-sm text-ink/40 dark:text-[#ececed]/40">Nenhuma variável cadastrada ainda.</p>
          )}
          {!isLoading && variables && variables.length > 0 && (
            <ul className="mt-3 space-y-2">
              {variables.map((variable) => (
                <VariableRow key={variable.id} variable={variable} />
              ))}
            </ul>
          )}

          <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
            <input
              value={draftKey}
              onChange={(event) => setDraftKey(event.target.value)}
              placeholder="Nova variável"
              className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-2.5 py-1.5 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20 dark:border-[#34353f] dark:bg-[#1a1b21] dark:text-[#ececed]"
            />
            <button
              type="submit"
              disabled={createVariable.isPending || !draftKey.trim()}
              className={`shrink-0 rounded-full bg-signal px-3 py-1.5 text-xs font-semibold text-ink hover:bg-signal/90 disabled:opacity-50 ${PRESS}`}
            >
              {createVariable.isPending ? 'Criando…' : '+ variável'}
            </button>
          </form>
          {error && <p className="mt-2 text-xs text-stage-lost">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function VariableRow({ variable }: { variable: AiFlowVariable }) {
  const [key, setKey] = useState(variable.key);
  const renameVariable = useRenameAiFlowVariable();
  const deleteVariable = useDeleteAiFlowVariable();

  function handleBlur() {
    const trimmed = key.trim();
    if (!trimmed) {
      setKey(variable.key);
      return;
    }
    if (trimmed !== variable.key) {
      renameVariable.mutate({ id: variable.id, key: trimmed }, { onError: () => setKey(variable.key) });
    }
  }

  return (
    <li className="flex items-center gap-2 rounded-lg border border-line bg-paper px-2.5 py-1.5 dark:border-[#34353f] dark:bg-[#1a1b21]">
      <input
        value={key}
        onChange={(event) => setKey(event.target.value)}
        onBlur={handleBlur}
        className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-0 py-0.5 text-sm text-ink outline-none focus:border-line focus:px-1.5 focus:py-1 dark:text-[#ececed] dark:focus:border-[#34353f]"
      />
      <button
        type="button"
        onClick={() => deleteVariable.mutate(variable.id)}
        aria-label={`Remover variável ${variable.key}`}
        className={`shrink-0 rounded-full p-1 text-ink/30 hover:text-stage-lost dark:text-[#ececed]/30 ${PRESS_SM}`}
      >
        <CloseIcon />
      </button>
    </li>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" aria-hidden>
      <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
