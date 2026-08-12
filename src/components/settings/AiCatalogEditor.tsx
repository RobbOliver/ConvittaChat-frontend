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

interface CatalogGroup {
  category: string | null;
  items: AiCatalogItem[];
}

/** Groups items by category, preserving each category's first-appearance order in the underlying
 * list — so the admin's own ordering still controls what shows up first. When nobody has set a
 * category yet, returns everything as a single ungrouped list (no "Sem categoria" header noise
 * for accounts that don't use this at all). */
function groupByCategory(items: AiCatalogItem[]): CatalogGroup[] {
  if (!items.some((item) => item.category)) return [{ category: null, items }];

  const order: string[] = [];
  const byKey = new Map<string, AiCatalogItem[]>();
  const UNCATEGORIZED = '\0uncategorized';
  for (const item of items) {
    const key = item.category ?? UNCATEGORIZED;
    if (!byKey.has(key)) {
      order.push(key);
      byKey.set(key, []);
    }
    byKey.get(key)!.push(item);
  }
  return order.map((key) => ({
    category: key === UNCATEGORIZED ? null : key,
    items: byKey.get(key)!,
  }));
}

/** The admin's catalog of what they sell — generic on purpose (product, service, or menu item),
 * so it fits any kind of business. Sent to the AI on every auto-reply, and used to check that the
 * AI never mentions a price or item that doesn't actually exist (see backend outputValidator). */
export function AiCatalogEditor() {
  const { data: items, isLoading } = useAiCatalogItems();
  const createItem = useCreateAiCatalogItem();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState<string | null>(null);

  const existingCategories = [...new Set((items ?? []).map((i) => i.category).filter((c): c is string => !!c))];

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    const priceCents = parseReaisToCents(price);
    if (!trimmedName || priceCents === null) return;

    setError(null);
    createItem.mutate(
      {
        name: trimmedName,
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        priceCents,
      },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
          setCategory('');
          setPrice('');
        },
        onError: () => setError('Não foi possível adicionar esse item.'),
      },
    );
  }

  const groups = groupByCategory(items ?? []);

  return (
    <div>
      {isLoading && <p className="text-sm text-ink/40">Carregando…</p>}

      {!isLoading && items && items.length === 0 && (
        <p className="mb-3 text-sm text-ink/40">Nenhum item cadastrado ainda.</p>
      )}

      {!isLoading && items && items.length > 0 && (
        <div className="mb-4 space-y-4">
          {groups.map((group) => (
            <div key={group.category ?? '__none__'}>
              {group.category !== null || groups.length > 1 ? (
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink/35">
                  {group.category ?? 'Sem categoria'}
                </p>
              ) : null}
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <ItemRow key={item.id} item={item} />
                ))}
              </ul>
            </div>
          ))}
        </div>
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
        <label className="min-w-[140px] flex-1">
          <span className="mb-1 block text-xs font-medium text-ink/50">Categoria (opcional)</span>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Ex.: Bebidas"
            list="catalog-categories"
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
      <datalist id="catalog-categories">
        {existingCategories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      {error && <p className="mt-2 text-sm text-stage-lost">{error}</p>}
      <p className="mt-2 text-xs text-ink/40">
        Categoria é opcional — usa pra agrupar itens (ex.: "Bebidas", "Marmitas") e a IA passa a
        enxergar essa organização, podendo ser referenciada nas instruções de um passo do fluxo
        (ex.: "ofereça algo da categoria Bebidas se o pedido não tiver nenhuma").
      </p>
    </div>
  );
}

function ItemRow({ item }: { item: AiCatalogItem }) {
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description ?? '');
  const [category, setCategory] = useState(item.category ?? '');
  const [price, setPrice] = useState(formatReais(item.priceCents));
  const updateItem = useUpdateAiCatalogItem();
  const deleteItem = useDeleteAiCatalogItem();

  useEffect(() => {
    setName(item.name);
    setDescription(item.description ?? '');
    setCategory(item.category ?? '');
    setPrice(formatReais(item.priceCents));
  }, [item.name, item.description, item.category, item.priceCents]);

  function saveIfChanged() {
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const trimmedCategory = category.trim();
    const priceCents = parseReaisToCents(price);
    if (!trimmedName || priceCents === null) {
      setName(item.name);
      setDescription(item.description ?? '');
      setCategory(item.category ?? '');
      setPrice(formatReais(item.priceCents));
      return;
    }
    if (
      trimmedName === item.name &&
      trimmedDescription === (item.description ?? '') &&
      trimmedCategory === (item.category ?? '') &&
      priceCents === item.priceCents
    ) {
      return;
    }
    updateItem.mutate({
      id: item.id,
      name: trimmedName,
      description: trimmedDescription,
      category: trimmedCategory,
      priceCents,
    });
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
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        onBlur={saveIfChanged}
        placeholder="Categoria"
        list="catalog-categories"
        className="w-28 shrink-0 rounded-md border border-transparent bg-transparent px-0 py-0.5 text-sm text-ink/60 outline-none placeholder:text-ink/30 focus:border-line focus:px-1.5 focus:py-1"
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
