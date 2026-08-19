import { useState } from 'react';
import { useCancelScheduledMessage, useScheduledMessages } from '../../hooks/useScheduledMessages';
import { contactDisplayName } from '../../lib/format';
import { PRESS, PRESS_SM } from '../../lib/interactions';
import type { ScheduledMessage } from '../../types';
import { Avatar } from './Avatar';
import { ScheduleMessageForm } from './ScheduleMessageForm';

type PanelTab = 'pending' | 'history';

const MODE_LABEL: Record<ScheduledMessage['mode'], string> = {
  ONCE: 'Envio único',
  LOOP: 'Repetição',
  SPECIFIC_TIMES: 'Horários específicos',
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function describeSchedule(item: ScheduledMessage): string {
  if (item.status === 'CANCELLED') return 'Cancelado';
  if (item.status === 'COMPLETED') {
    return item.occurrencesSent > 1 ? `Concluído — ${item.occurrencesSent} envios` : 'Enviado';
  }
  // PENDING from here on.
  if (item.mode === 'ONCE') return item.lastError ? 'Tentando enviar novamente…' : 'Enviando…';
  const total = item.mode === 'LOOP' ? item.loopCount : (item.occurrences?.length ?? 0);
  const nextLabel = item.nextSendAt ? formatDateTime(item.nextSendAt) : '—';
  return `Envio ${item.occurrencesSent + 1} de ${total} — próximo em ${nextLabel}`;
}

export function ScheduleMessagePanel({ onClose }: { onClose: () => void }) {
  const { data: scheduled, isLoading } = useScheduledMessages();
  const cancelMutation = useCancelScheduledMessage();
  const [tab, setTab] = useState<PanelTab>('pending');
  const [showForm, setShowForm] = useState(false);

  const pending = (scheduled ?? []).filter((item) => item.status === 'PENDING');
  const history = (scheduled ?? []).filter((item) => item.status !== 'PENDING');
  const activeList = tab === 'pending' ? pending : history;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4" onClick={onClose}>
      <div
        className="flex max-h-[36rem] w-full max-w-md flex-col rounded-2xl bg-paper p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        {showForm ? (
          <ScheduleMessageForm onClose={() => setShowForm(false)} onCreated={() => setShowForm(false)} />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">Agendar mensagem</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className={`rounded-full p-1 text-ink/40 hover:bg-mist hover:text-ink ${PRESS_SM}`}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="mt-3 flex rounded-full bg-mist p-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => setTab('pending')}
                className={`flex-1 rounded-full py-1.5 ${PRESS} ${
                  tab === 'pending' ? 'bg-ink text-white' : 'text-ink/50 hover:text-ink'
                }`}
              >
                Agendamentos{pending.length > 0 ? ` (${pending.length})` : ''}
              </button>
              <button
                type="button"
                onClick={() => setTab('history')}
                className={`flex-1 rounded-full py-1.5 ${PRESS} ${
                  tab === 'history' ? 'bg-ink text-white' : 'text-ink/50 hover:text-ink'
                }`}
              >
                Histórico
              </button>
            </div>

            <div className="mt-2 flex-1 overflow-y-auto">
              {isLoading && <p className="py-6 text-center text-sm text-ink/40">Carregando…</p>}
              {!isLoading && activeList.length === 0 && (
                <p className="py-6 text-center text-sm text-ink/40">
                  {tab === 'pending' ? 'Nenhum agendamento pendente.' : 'Nenhum envio no histórico ainda.'}
                </p>
              )}
              {!isLoading && activeList.length > 0 && (
                <ul className="space-y-2">
                  {activeList.map((item) => {
                    const name = contactDisplayName(item.contact);
                    return (
                      <li key={item.id} className="rounded-lg border border-line p-3">
                        <div className="flex items-start gap-3">
                          <Avatar name={name} avatarUrl={item.contact.avatarUrl} tone="light" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-medium text-ink">{name}</span>
                              <span className="shrink-0 rounded-full bg-mist px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink/50">
                                {MODE_LABEL[item.mode]}
                              </span>
                            </div>
                            {item.text && <p className="mt-0.5 truncate text-xs text-ink/60">{item.text}</p>}
                            {item.mediaMimeType && (
                              <p className="mt-0.5 text-xs text-ink/40">📷 Imagem anexada</p>
                            )}
                            <p className="mt-1 text-xs text-ink/50">{describeSchedule(item)}</p>
                            {item.lastError && (
                              <p className="mt-1 text-xs text-stage-lost">Última tentativa falhou: {item.lastError}</p>
                            )}
                          </div>
                        </div>
                        {item.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => cancelMutation.mutate(item.id)}
                            disabled={cancelMutation.isPending}
                            className={`mt-2 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink/60 hover:bg-mist hover:text-stage-lost disabled:opacity-50 ${PRESS_SM}`}
                          >
                            Cancelar
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowForm(true)}
              className={`mt-3 w-full rounded-full bg-signal px-4 py-2 text-sm font-semibold text-ink hover:bg-signal/90 ${PRESS}`}
            >
              + Novo agendamento
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
