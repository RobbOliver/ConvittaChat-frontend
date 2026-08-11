import { useEffect, useState, type FormEvent } from 'react';
import {
  useAiCatalogItems,
  useCreateAiCatalogItem,
  useDeleteAiCatalogItem,
  useUpdateAiCatalogItem,
} from '../../hooks/useAiCatalogItems';
import { PRESS, PRESS_SM } from '../../lib/interactions';
import type { AiCatalogItem } from '../../types';
import { Toggle } from '../ui/Toggle';

function formatReais(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseReaisToCents(value: string): number | null {
  const normalized = value.trim().replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null;
}

/** The admin's catalog of what they sell — generic on purpose (product, service, or menu item),
 * so it fits any kind of business. Sent to the AI on every auto-reply, and used to check that the
 * AI never mentions a price or item that doesn't actually exist (see backend outputValidator). */
export function AiCatalogEditor() {
  const { data: items, isLoading } = useAiCatalogItems();
  const createItem = useCreateAiCatalogItem();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    const priceCents = parseReaisToCents(price);
    if (!trimmedName || priceCents === null) return;

    setError(null);
    createItem.mutate(
      { name: trimmedName, description: description.trim() || undefined, priceCents },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
          setPrice('');
        },
        onError: () => setError('Não foi possível adicionar esse item.'),
      },
    );
  }

  return (
    <div>
      {isLoading && <p className="text-sm text-ink/40">Carregando…</p>}

      {!isLoading && items && items.length === 0 && (
        <p className="mb-3 text-sm text-ink/40">Nenhum item cadastrado ainda.</p>
      )}

      {!isLoading && items && items.length > 0 && (
        <ul className="mb-4 space-y-2">
          {items.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
        <label className="min-w-[160px] flex-1">
          <span className="mb-1 block text-xs font-medium text-ink/50">Nome</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Corte masculino"
            className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
          />
        </label>
        <label className="min-w-[160px] flex-1">
          <span className="mb-1 block text-xs font-medium text-ink/50">Descrição (opcional)</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex.: Corte + acabamento"
            className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
          />
        </label>
        <label className="w-28">
          <span className="mb-1 block text-xs font-medium text-ink/50">Preço (R$)</span>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0,00"
            inputMode="decimal"
            className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
          />
        </label>
        <button
          type="submit"
          disabled={createItem.isPending || !name.trim() || parseReaisToCents(price) === null}
          className={`shrink-0 rounded-full bg-signal px-4 py-2 text-sm font-semibold text-ink hover:bg-signal/90 disabled:opacity-50 ${PRESS}`}
        >
          {createItem.isPending ? 'Adicionando…' : 'Adicionar'}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-stage-lost">{error}</p>}
    </div>
  );
}

function ItemRow({ item }: { item: AiCatalogItem }) {
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description ?? '');
  const [price, setPrice] = useState(formatReais(item.priceCents));
  const updateItem = useUpdateAiCatalogItem();
  const deleteItem = useDeleteAiCatalogItem();

  useEffect(() => {
    setName(item.name);
    setDescription(item.description ?? '');
    setPrice(formatReais(item.priceCents));
  }, [item.name, item.description, item.priceCents]);

  function saveIfChanged() {
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const priceCents = parseReaisToCents(price);
    if (!trimmedName || priceCents === null) {
      setName(item.name);
      setDescription(item.description ?? '');
      setPrice(formatReais(item.priceCents));
      return;
    }
    if (trimmedName === item.name && trimmedDescription === (item.description ?? '') && priceCents === item.priceCents) {
      return;
    }
    updateItem.mutate({ id: item.id, name: trimmedName, description: trimmedDescription, priceCents });
  }

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={saveIfChanged}
        className="min-w-[120px] flex-1 rounded-md border border-transparent bg-transparent px-0 py-0.5 text-sm font-medium text-ink outline-none focus:border-line focus:px-1.5 focus:py-1"
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={saveIfChanged}
        placeholder="Descrição"
        className="min-w-[120px] flex-1 rounded-md border border-transparent bg-transparent px-0 py-0.5 text-sm text-ink/60 outline-none placeholder:text-ink/30 focus:border-line focus:px-1.5 focus:py-1"
      />
      <input
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        onBlur={saveIfChanged}
        inputMode="decimal"
        className="w-20 shrink-0 rounded-md border border-transparent bg-transparent px-0 py-0.5 text-right font-mono text-sm text-ink outline-none focus:border-line focus:px-1.5 focus:py-1"
      />
      <Toggle
        checked={item.available}
        onChange={(available) => updateItem.mutate({ id: item.id, available })}
        label={`Disponível: ${item.name}`}
      />
      <button
        type="button"
        onClick={() => deleteItem.mutate(item.id)}
        aria-label={`Remover ${item.name}`}
        className={`shrink-0 rounded-full p-1 text-ink/30 hover:text-stage-lost ${PRESS_SM}`}
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
