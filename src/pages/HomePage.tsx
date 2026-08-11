import { useState } from 'react';
import { SidebarNav } from '../components/layout/SidebarNav';
import { SessionStatusBadge } from '../components/whatsapp/SessionStatusBadge';
import { WhatsappConnectModal } from '../components/whatsapp/WhatsappConnectModal';
import {
  useDisconnectWhatsappSession,
  useRemoveWhatsappSession,
  useWhatsappSessions,
} from '../hooks/useWhatsappSessions';
import { PRESS } from '../lib/interactions';

const MAX_SESSIONS = 5;

export function HomePage() {
  const { data: sessions, isLoading } = useWhatsappSessions();
  const disconnectSession = useDisconnectWhatsappSession();
  const removeSession = useRemoveWhatsappSession();
  const [modalOpen, setModalOpen] = useState(false);
  const [reconnectId, setReconnectId] = useState<string | undefined>(undefined);

  const activeCount = sessions?.filter((session) => session.removedAt === null).length ?? 0;
  const atLimit = activeCount >= MAX_SESSIONS;

  function openConnectModal() {
    setReconnectId(undefined);
    setModalOpen(true);
  }

  function openReconnectModal(id: string) {
    setReconnectId(id);
    setModalOpen(true);
  }

  return (
    <div className="flex h-svh bg-paper text-ink">
      <SidebarNav active="home" />

      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-semibold text-ink">Números do WhatsApp</h1>
              <p className="mt-1 text-sm text-ink/50">
                Conecte até {MAX_SESSIONS} números. Toda mensagem recebida cai no mesmo Inbox, e cada resposta sai
                pelo número certo.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-mist px-3 py-1.5 text-xs font-semibold text-ink/60">
              {activeCount}/{MAX_SESSIONS} conectados
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {isLoading && <p className="text-sm text-ink/40">Carregando…</p>}

            {!isLoading && sessions?.length === 0 && (
              <div className="rounded-xl border border-dashed border-line px-6 py-10 text-center">
                <p className="text-sm text-ink/50">Nenhum número conectado ainda.</p>
              </div>
            )}

            {sessions?.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-line bg-paper px-4 py-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{session.label}</p>
                  <p className="mt-0.5 font-mono text-xs text-ink/40">{session.phoneNumber ?? 'Ainda não pareado'}</p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <SessionStatusBadge status={session.status} />
                  {session.status === 'CONNECTED' ? (
                    <button
                      type="button"
                      onClick={() => disconnectSession.mutate(session.id)}
                      className={`text-xs font-medium text-ink/50 hover:text-stage-lost ${PRESS}`}
                    >
                      Desconectar
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openReconnectModal(session.id)}
                        disabled={!!session.removedAt && atLimit}
                        className={`text-xs font-medium text-signal hover:text-signal/80 disabled:opacity-40 ${PRESS}`}
                      >
                        Reconectar
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSession.mutate(session.id)}
                        disabled={removeSession.isPending}
                        className={`text-xs font-medium text-ink/50 hover:text-stage-lost disabled:opacity-50 ${PRESS}`}
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={openConnectModal}
            disabled={atLimit}
            className={`mt-6 rounded-full bg-signal px-5 py-2.5 text-sm font-semibold text-ink hover:bg-signal/90 disabled:cursor-not-allowed disabled:opacity-40 ${PRESS}`}
          >
            + Conectar WhatsApp
          </button>
          {atLimit && <p className="mt-2 text-xs text-ink/40">Limite de {MAX_SESSIONS} números atingido.</p>}
        </div>
      </main>

      <WhatsappConnectModal open={modalOpen} onClose={() => setModalOpen(false)} watchSessionId={reconnectId} />
    </div>
  );
}
