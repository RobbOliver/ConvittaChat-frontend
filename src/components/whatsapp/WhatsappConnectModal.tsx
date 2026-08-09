import axios from 'axios';
import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import { socket } from '../../lib/socket';
import type { WhatsappSessionStatus } from '../../types';
import { useCreateWhatsappSession, useReconnectWhatsappSession } from '../../hooks/useWhatsappSessions';

interface Props {
  open: boolean;
  onClose: () => void;
  /** When set, skip the "name this number" step and go straight to watching this session's QR (used to reconnect a previously disconnected number). */
  watchSessionId?: string;
}

export function WhatsappConnectModal({ open, onClose, watchSessionId }: Props) {
  const createSession = useCreateWhatsappSession();
  const reconnectSession = useReconnectWhatsappSession();
  const [label, setLabel] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [status, setStatus] = useState<WhatsappSessionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLabel('');
    setQr(null);
    setStatus(null);
    setError(null);
    setSessionId(watchSessionId ?? null);

    if (watchSessionId) {
      reconnectSession.mutate(watchSessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, watchSessionId]);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    api
      .get<{ qr: string | null }>(`/whatsapp-sessions/${sessionId}/qr`)
      .then(({ data }) => {
        if (!cancelled && data.qr) setQr(data.qr);
      })
      .catch(() => undefined);

    const onQr = (payload: { sessionId: string; qr: string }) => {
      if (payload.sessionId === sessionId) setQr(payload.qr);
    };
    const onStatus = (payload: { sessionId: string; status: WhatsappSessionStatus }) => {
      if (payload.sessionId === sessionId) setStatus(payload.status);
    };
    socket.on('whatsapp-session:qr', onQr);
    socket.on('whatsapp-session:status', onStatus);
    return () => {
      cancelled = true;
      socket.off('whatsapp-session:qr', onQr);
      socket.off('whatsapp-session:status', onStatus);
    };
  }, [sessionId]);

  useEffect(() => {
    if (status !== 'CONNECTED') return;
    const timeout = setTimeout(onClose, 1200);
    return () => clearTimeout(timeout);
  }, [status, onClose]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const session = await createSession.mutateAsync(label.trim());
      setSessionId(session.id);
    } catch (err) {
      const message = axios.isAxiosError(err) ? (err.response?.data as { message?: string })?.message : undefined;
      setError(message ?? 'Não foi possível criar a conexão.');
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-paper p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        {!sessionId && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Conectar WhatsApp</h2>
              <p className="mt-1 text-sm text-ink/50">Dê um nome pra esse número, pra identificar depois.</p>
            </div>
            <input
              autoFocus
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Ex.: Vendas SP"
              required
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
            />
            {error && <p className="text-sm text-stage-lost">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-4 py-2 text-sm text-ink/60 hover:bg-mist"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createSession.isPending}
                className="rounded-full bg-signal px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-signal/90 disabled:opacity-60"
              >
                {createSession.isPending ? 'Criando…' : 'Continuar'}
              </button>
            </div>
          </form>
        )}

        {sessionId && (
          <div className="text-center">
            <h2 className="font-display text-lg font-semibold text-ink">Escaneie o QR code</h2>
            <p className="mt-1 text-sm text-ink/50">
              No WhatsApp do celular: Configurações → Aparelhos conectados → Conectar aparelho.
            </p>
            <div className="mx-auto my-5 flex h-56 w-56 items-center justify-center rounded-xl bg-mist">
              {status === 'CONNECTED' ? (
                <p className="text-sm font-medium text-stage-won">Conectado!</p>
              ) : qr ? (
                <img src={qr} alt="QR code para conectar o WhatsApp" className="h-full w-full rounded-lg" />
              ) : (
                <p className="text-sm text-ink/40">Gerando QR…</p>
              )}
            </div>
            <button type="button" onClick={onClose} className="text-sm text-ink/50 hover:text-ink">
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
