import { useState, type FormEvent } from 'react';
import {
  useContactFieldDefinitions,
  useCreateContactFieldDefinition,
  useDeleteContactFieldDefinition,
  useRenameContactFieldDefinition,
} from '../../hooks/useContactFieldDefinitions';
import { PRESS, PRESS_SM } from '../../lib/interactions';
import type { ContactFieldDefinition } from '../../types';

/** Manages the Sales Inbox's custom-field keys (e.g. "endereço") once, here — each contact then
 * only fills in its own value from the contact-details panel, instead of retyping the key every
 * time on every contact. */
export function SalesFieldDefinitions() {
  const { data: definitions, isLoading } = useContactFieldDefinitions();
  const createDefinition = useCreateContactFieldDefinition();
  const [draftKey, setDraftKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const key = draftKey.trim();
    if (!key) return;
    setError(null);
    createDefinition.mutate(key, {
      onSuccess: () => setDraftKey(''),
      onError: () => setError('Não foi possível criar esse campo — talvez já exista.'),
    });
  }

  return (
    <div>
      {isLoading && <p className="text-sm text-ink/40 dark:text-[#ececed]/40">Carregando…</p>}

      {!isLoading && definitions && definitions.length === 0 && (
        <p className="mb-3 text-sm text-ink/40 dark:text-[#ececed]/40">Nenhum campo cadastrado ainda.</p>
      )}

      {!isLoading && definitions && definitions.length > 0 && (
        <ul className="mb-4 space-y-2">
          {definitions.map((definition) => (
            <DefinitionRow key={definition.id} definition={definition} />
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={draftKey}
          onChange={(event) => setDraftKey(event.target.value)}
          placeholder="Nova chave (ex.: endereço)"
          className="flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20 dark:border-[#34353f] dark:bg-[#1a1b21] dark:text-[#ececed]"
        />
        <button
          type="submit"
          disabled={createDefinition.isPending || !draftKey.trim()}
          className={`shrink-0 rounded-full bg-signal px-4 py-2 text-sm font-semibold text-ink hover:bg-signal/90 disabled:opacity-50 ${PRESS}`}
        >
          {createDefinition.isPending ? 'Criando…' : 'Adicionar'}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-stage-lost">{error}</p>}
    </div>
  );
}

function DefinitionRow({ definition }: { definition: ContactFieldDefinition }) {
  const [key, setKey] = useState(definition.key);
  const renameDefinition = useRenameContactFieldDefinition();
  const deleteDefinition = useDeleteContactFieldDefinition();

  function handleBlur() {
    const trimmed = key.trim();
    if (!trimmed) {
      setKey(definition.key);
      return;
    }
    if (trimmed !== definition.key) {
      renameDefinition.mutate(
        { id: definition.id, key: trimmed },
        { onError: () => setKey(definition.key) },
      );
    }
  }

  return (
    <li className="flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2 dark:border-[#34353f] dark:bg-[#1a1b21]">
      <input
        value={key}
        onChange={(event) => setKey(event.target.value)}
        onBlur={handleBlur}
        className="flex-1 rounded-md border border-transparent bg-transparent px-0 py-0.5 text-sm text-ink outline-none focus:border-line focus:px-1.5 focus:py-1 dark:text-[#ececed] dark:focus:border-[#34353f]"
      />
      <button
        type="button"
        onClick={() => deleteDefinition.mutate(definition.id)}
        aria-label={`Remover campo ${definition.key}`}
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
