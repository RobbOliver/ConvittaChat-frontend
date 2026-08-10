import { useState, type FormEvent } from 'react';
import {
  useContactFieldKeys,
  useContactFields,
  useCreateContactField,
  useDeleteContactField,
  useUpdateContactField,
} from '../../hooks/useContactFields';
import { contactDisplayName } from '../../lib/format';
import { PRESS, PRESS_SM } from '../../lib/interactions';
import type { Contact, ContactField } from '../../types';
import { Avatar } from './Avatar';

interface Props {
  contact: Contact;
  onClose: () => void;
}

export function ContactDetailsPanel({ contact, onClose }: Props) {
  const name = contactDisplayName(contact);
  const { data: fields, isLoading } = useContactFields(contact.id);

  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-l border-line bg-paper md:w-80">
      <div className="flex items-center justify-between border-b border-line px-4 py-4">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink/50">
          Informações do contato
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className={`rounded-full p-1 text-ink/40 hover:bg-mist hover:text-ink ${PRESS_SM}`}
        >
          <CloseIcon />
        </button>
      </div>

      <div className="flex flex-col items-center gap-2 border-b border-line px-4 py-6 text-center">
        <Avatar name={name} avatarUrl={contact.avatarUrl} size="md" tone="light" />
        <p className="font-display text-base font-semibold text-ink">{name}</p>
        {!contact.isGroup && <p className="font-mono text-xs text-ink/40">{contact.phoneNumber}</p>}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="pb-2 text-[11px] font-semibold uppercase tracking-wide text-ink/35">Campos personalizados</p>

        {isLoading && <p className="py-2 text-sm text-ink/40">Carregando…</p>}

        {!isLoading && fields && fields.length === 0 && (
          <p className="py-2 text-sm text-ink/40">Nenhum campo cadastrado ainda.</p>
        )}

        {!isLoading && fields && fields.length > 0 && (
          <ul className="space-y-2">
            {fields.map((field) => (
              <FieldRow key={field.id} contactId={contact.id} field={field} />
            ))}
          </ul>
        )}

        <AddFieldForm contactId={contact.id} />
      </div>
    </aside>
  );
}

function FieldRow({ contactId, field }: { contactId: string; field: ContactField }) {
  const [value, setValue] = useState(field.value);
  const updateField = useUpdateContactField(contactId);
  const deleteField = useDeleteContactField(contactId);

  function handleBlur() {
    const trimmed = value.trim();
    if (trimmed && trimmed !== field.value) {
      updateField.mutate({ fieldId: field.id, value: trimmed });
    } else if (!trimmed) {
      setValue(field.value);
    }
  }

  return (
    <li className="rounded-lg border border-line bg-white px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-ink/40">{field.key}</p>
        <button
          type="button"
          onClick={() => deleteField.mutate(field.id)}
          aria-label={`Remover campo ${field.key}`}
          className={`shrink-0 rounded-full p-0.5 text-ink/30 hover:text-stage-lost ${PRESS_SM}`}
        >
          <CloseIcon small />
        </button>
      </div>
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={handleBlur}
        className="mt-1 w-full rounded-md border border-transparent bg-transparent px-0 py-0.5 text-sm text-ink outline-none focus:border-line focus:px-1.5 focus:py-1"
      />
    </li>
  );
}

function AddFieldForm({ contactId }: { contactId: string }) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const { data: knownKeys } = useContactFieldKeys();
  const createField = useCreateContactField(contactId);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedKey = key.trim();
    const trimmedValue = value.trim();
    if (!trimmedKey || !trimmedValue) return;
    createField.mutate(
      { key: trimmedKey, value: trimmedValue },
      {
        onSuccess: () => {
          setKey('');
          setValue('');
          setOpen(false);
        },
      },
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-line py-2 text-xs font-semibold text-ink/50 hover:border-signal hover:text-ink ${PRESS}`}
      >
        <PlusIcon />
        Adicionar campo
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 rounded-lg border border-line bg-mist/40 p-3">
      <div>
        <input
          autoFocus
          list="contact-field-keys"
          value={key}
          onChange={(event) => setKey(event.target.value)}
          placeholder="Chave (ex.: endereço)"
          className="w-full rounded-md border border-line bg-paper px-2.5 py-1.5 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
        />
        <datalist id="contact-field-keys">
          {(knownKeys ?? []).map((k) => (
            <option key={k} value={k} />
          ))}
        </datalist>
      </div>
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Valor"
        className="w-full rounded-md border border-line bg-paper px-2.5 py-1.5 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className={`rounded-full px-3 py-1.5 text-xs text-ink/50 hover:bg-mist ${PRESS}`}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={createField.isPending || !key.trim() || !value.trim()}
          className={`rounded-full bg-signal px-3 py-1.5 text-xs font-semibold text-ink hover:bg-signal/90 disabled:opacity-50 ${PRESS}`}
        >
          {createField.isPending ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon({ small }: { small?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={small ? 'h-3 w-3' : 'h-4 w-4'} aria-hidden>
      <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
