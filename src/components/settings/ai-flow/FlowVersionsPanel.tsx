import { useState } from 'react';
import type { AiFlowVersionSummary } from '../../../types';
import { PRESS_SM } from '../../../lib/interactions';

interface FlowVersionsPanelProps {
  versions: AiFlowVersionSummary[] | undefined;
  isLoading: boolean;
  isSaving: boolean;
  isRestoring: boolean;
  isDeleting: boolean;
  onSave: (label: string) => void;
  onRestore: (versionId: string) => void;
  onDelete: (versionId: string) => void;
}

type PendingAction = { id: string; kind: 'restore' | 'delete' };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Collapsible drawer pinned next to FlowJsPanel — same tab/drawer idiom, so the two read as one
 * family of side panels rather than two different UI patterns. Lets the admin save a named backup
 * of the current LIVE graph (whatever's already saved server-side — this panel doesn't snapshot
 * unsaved canvas edits, only "Salvar fluxo" does that), restore an earlier one, or permanently
 * delete one. Restoring and deleting both get the same inline-confirm treatment as the canvas's
 * own "Limpar"/"Criar novo fluxo" buttons — only one row's confirm box open at a time, tracked by
 * which action it's for so restoring one version and deleting another can't be conflated.
 */
export function FlowVersionsPanel({
  versions,
  isLoading,
  isSaving,
  isRestoring,
  isDeleting,
  onSave,
  onRestore,
  onDelete,
}: FlowVersionsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [pending, setPending] = useState<PendingAction | null>(null);

  function handleSave() {
    onSave(label.trim());
    setLabel('');
  }

  function handleConfirm() {
    if (!pending) return;
    if (pending.kind === 'restore') onRestore(pending.id);
    else onDelete(pending.id);
    setPending(null);
  }

  return (
    <div className="flex h-full shrink-0 items-stretch">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className={`shrink-0 rounded-r-lg border border-line bg-paper px-2 py-3 text-xs font-medium text-ink/70 shadow-sm hover:bg-mist ${PRESS_SM}`}
        style={{ writingMode: 'vertical-rl' }}
      >
        Versões
      </button>
      <div
        className={`overflow-hidden rounded-r-xl border border-l-0 border-line bg-paper shadow-lg transition-[width] duration-200 ${
          isOpen ? 'w-[340px]' : 'w-0'
        }`}
      >
        <div className="flex h-full w-[340px] flex-col p-3">
          <h4 className="font-display text-sm font-semibold text-ink">Versões salvas</h4>
          <p className="mt-1 text-xs text-ink/50">
            Guarda uma cópia do fluxo já salvo pra você poder voltar depois.
          </p>

          <div className="mt-3 flex gap-2">
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Nome (opcional)"
              maxLength={80}
              className="min-w-0 flex-1 rounded-lg border border-line bg-mist/30 px-2 py-1.5 text-xs text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
            />
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className={`shrink-0 rounded-full bg-signal px-3 py-1.5 text-xs font-semibold text-ink disabled:opacity-40 ${PRESS_SM}`}
            >
              {isSaving ? 'Salvando…' : 'Salvar versão'}
            </button>
          </div>

          <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
            {isLoading && <p className="text-xs text-ink/40">Carregando…</p>}
            {!isLoading && versions?.length === 0 && (
              <p className="text-xs text-ink/40">Nenhuma versão salva ainda.</p>
            )}
            <ul className="space-y-2">
              {versions?.map((version) => {
                const isPendingHere = pending?.id === version.id;
                return (
                  <li key={version.id} className="rounded-lg border border-line px-3 py-2">
                    <p className="text-sm font-medium text-ink">{version.label || 'Sem nome'}</p>
                    <p className="mt-0.5 text-xs text-ink/50">
                      {formatDate(version.createdAt)} · {version.nodeCount} passos, {version.edgeCount} ligações
                    </p>
                    {!isPendingHere ? (
                      <div className="mt-1.5 flex gap-2">
                        <button
                          type="button"
                          disabled={isRestoring || isDeleting}
                          onClick={() => setPending({ id: version.id, kind: 'restore' })}
                          className={`rounded-full border border-line px-3 py-1 text-xs font-medium text-ink/70 hover:bg-mist disabled:opacity-40 ${PRESS_SM}`}
                        >
                          Restaurar
                        </button>
                        <button
                          type="button"
                          disabled={isRestoring || isDeleting}
                          onClick={() => setPending({ id: version.id, kind: 'delete' })}
                          className={`rounded-full border border-stage-lost/30 px-3 py-1 text-xs font-medium text-stage-lost hover:bg-stage-lost/5 disabled:opacity-40 ${PRESS_SM}`}
                        >
                          Excluir
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`mt-1.5 rounded-lg border px-2 py-1.5 ${
                          pending.kind === 'delete'
                            ? 'border-stage-lost/30 bg-stage-lost/5'
                            : 'border-signal/30 bg-signal/5'
                        }`}
                      >
                        <p className="text-xs text-ink/70">
                          {pending.kind === 'delete'
                            ? 'Excluir essa versão salva? Não dá pra desfazer.'
                            : 'Substituir o fluxo atual por essa versão?'}
                        </p>
                        <div className="mt-1.5 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setPending(null)}
                            className={`rounded-full px-2.5 py-1 text-xs font-medium text-ink/60 hover:bg-mist ${PRESS_SM}`}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            disabled={isRestoring || isDeleting}
                            onClick={handleConfirm}
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold disabled:opacity-40 ${PRESS_SM} ${
                              pending.kind === 'delete' ? 'bg-stage-lost text-white' : 'bg-signal text-ink'
                            }`}
                          >
                            {pending.kind === 'delete'
                              ? isDeleting
                                ? 'Excluindo…'
                                : 'Confirmar'
                              : isRestoring
                                ? 'Restaurando…'
                                : 'Confirmar'}
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
