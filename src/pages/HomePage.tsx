import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SessionStatusBadge } from '../components/whatsapp/SessionStatusBadge';
import { WhatsappConnectModal } from '../components/whatsapp/WhatsappConnectModal';
import { useDisconnectWhatsappSession, useWhatsappSessions } from '../hooks/useWhatsappSessions';
import { clearToken } from '../lib/authToken';
import { PRESS } from '../lib/interactions';
import { disconnectSocket } from '../lib/socket';

const MAX_SESSIONS = 5;

export function HomePage() {
  const navigate = useNavigate();
  const { data: sessions, isLoading } = useWhatsappSessions();
  const disconnectSession = useDisconnectWhatsappSession();
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

  function handleLogout() {
    disconnectSocket();
    clearToken();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex h-svh bg-paper text-ink">
      <aside className="flex w-64 shrink-0 flex-col bg-ink">
        <div className="px-5 pb-5 pt-6">
          <p className="font-display text-xl font-semibold tracking-tight text-white">Convitta</p>
          <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">Área de trabalho</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          <span className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white">
            Home
          </span>
          <Link
            to="/inbox"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            Inbox
          </Link>
        </nav>
        <div className="border-t border-white/10 px-3 py-3">
          <button
            type="button"
            onClick={handleLogout}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm text-white/60 hover:bg-white/5 hover:text-white ${PRESS}`}
          >
            Sair
          </button>
        </div>
      </aside>

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
                        onClick={() => disconnectSession.mutate(session.id)}
                        className={`text-xs font-medium text-ink/50 hover:text-stage-lost ${PRESS}`}
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
