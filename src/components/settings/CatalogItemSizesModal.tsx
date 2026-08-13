import { useEffect, useState } from 'react';
import { useUpdateAiCatalogItem } from '../../hooks/useAiCatalogItems';
import { formatReais, parseReaisToCents } from '../../lib/currency';
import { PRESS, PRESS_SM } from '../../lib/interactions';
import type { AiCatalogItem } from '../../types';

interface SizeRow {
  id: string;
  label: string;
  price: string;
}

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emptyRow(): SizeRow {
  return { id: makeId(), label: '', price: '' };
}

interface Props {
  item: AiCatalogItem | null;
  onClose: () => void;
}

/**
 * Popup to register named sizes + prices for a "preço por tamanho" catalog item — same overlay
 * shell and repeatable-row pattern as FlowCanvas's NodeConfigModal (add row / inline edit / remove
 * row, committed as a whole list on "Aplicar"). Always sends the complete `sizes` array on save,
 * matching UpdateAiCatalogItemInput's "present = replace everything" contract.
 */
export function CatalogItemSizesModal({ item, onClose }: Props) {
  const updateItem = useUpdateAiCatalogItem();
  const [rows, setRows] = useState<SizeRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!item) return;
    setRows(
      item.sizes.length
        ? item.sizes.map((s) => ({ id: s.id, label: s.label, price: formatReais(s.priceCents) }))
        : [emptyRow()],
    );
    setError(null);
  }, [item]);

  if (!item) return null;

  function updateRow(index: number, patch: Partial<SizeRow>) {
    setRows((rs) => rs.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function handleSave() {
    const parsed = rows
      .map((row, index) => ({
        id: row.id,
        label: row.label.trim(),
        priceCents: parseReaisToCents(row.price),
        order: index,
      }))
      .filter((row) => row.label);

    if (parsed.length === 0) {
      setError('Cadastre pelo menos um tamanho com nome e preço.');
      return;
    }
    if (parsed.some((row) => row.priceCents === null)) {
      setError('Todo tamanho cadastrado precisa de um preço válido.');
      return;
    }

    setError(null);
    updateItem.mutate(
      {
        id: item.id,
        pricingMode: 'BY_SIZE',
        sizes: parsed as { id: string; label: string; priceCents: number; order: number }[],
      },
      { onSuccess: onClose },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-paper p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">{item.name}</p>
        <h2 className="mt-1 font-display text-lg font-semibold text-ink">Tamanhos e preços</h2>
        <p className="mt-1 text-xs text-ink/40">
          Cada tamanho tem seu próprio preço — a IA vai oferecer exatamente essas opções, sem
          precisar calcular nada.
        </p>

        <div className="mt-4 space-y-2">
          {rows.map((row, index) => (
            <div key={row.id} className="flex items-center gap-2">
              <input
                type="text"
                value={row.label}
                onChange={(e) => updateRow(index, { label: e.target.value })}
                placeholder="Ex.: P"
                className="w-20 min-w-0 rounded-lg border border-line px-2 py-1.5 text-sm text-ink outline-none focus:border-signal"
              />
              <input
                type="text"
                value={row.price}
                onChange={(e) => updateRow(index, { price: e.target.value })}
                placeholder="0,00"
                inputMode="decimal"
                className="flex-1 rounded-lg border border-line px-2 py-1.5 text-right font-mono text-sm text-ink outline-none focus:border-signal"
              />
              <button
                type="button"
                onClick={() => setRows((rs) => rs.filter((_, i) => i !== index))}
                title="Remover tamanho"
                disabled={rows.length === 1}
                className="shrink-0 text-ink/40 hover:text-stage-lost disabled:opacity-30"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setRows((rs) => [...rs, emptyRow()])}
          className={`mt-3 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-mist ${PRESS_SM}`}
        >
          + tamanho
        </button>

        {error && <p className="mt-3 text-sm text-stage-lost">{error}</p>}

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
            disabled={updateItem.isPending}
            className={`rounded-full bg-signal px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50 ${PRESS}`}
          >
            {updateItem.isPending ? 'Salvando…' : 'Aplicar'}
          </button>
        </div>
      </div>
    </div>
  );
}
