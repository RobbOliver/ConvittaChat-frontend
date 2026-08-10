import axios from 'axios';
import { useEffect, useState, type FormEvent } from 'react';
import { useSendPix } from '../../hooks/useSendPix';
import { PRESS } from '../../lib/interactions';

interface Props {
  open: boolean;
  conversationId: string;
  onClose: () => void;
}

export function PixComposerModal({ open, conversationId, onClose }: Props) {
  const sendPix = useSendPix(conversationId);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAmount('');
    setDescription('');
    setError(null);
  }, [open]);

  const parsedAmount = Number(amount.replace(',', '.'));
  const isValidAmount = amount.trim() !== '' && Number.isFinite(parsedAmount) && parsedAmount > 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValidAmount) return;
    setError(null);
    try {
      await sendPix.mutateAsync({
        amount: Math.round(parsedAmount * 100) / 100,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message
        : undefined;
      setError(message ?? 'Não foi possível enviar a cobrança Pix.');
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-paper p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Cobrar via Pix</h2>
            <p className="mt-1 text-sm text-ink/50">
              Envia um QR Code e o código Pix Copia e Cola prontos para o cliente pagar.
            </p>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink/50">Valor (R$)</span>
            <input
              autoFocus
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0,00"
              required
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink/50">Descrição (opcional)</span>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ex.: Pedido #123"
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
            />
          </label>

          {error && <p className="text-sm text-stage-lost">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`rounded-full px-4 py-2 text-sm text-ink/60 hover:bg-mist ${PRESS}`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isValidAmount || sendPix.isPending}
              className={`rounded-full bg-signal px-4 py-2 text-sm font-semibold text-ink hover:bg-signal/90 disabled:opacity-60 ${PRESS}`}
            >
              {sendPix.isPending ? 'Enviando…' : 'Enviar cobrança'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
