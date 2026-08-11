import { useEffect, useState } from 'react';
import { useContactFieldDefinitions } from '../../hooks/useContactFieldDefinitions';
import { useClearContactFieldValue, useContactFields, useSetContactFieldValue } from '../../hooks/useContactFields';
import { contactDisplayName } from '../../lib/format';
import { PRESS_SM } from '../../lib/interactions';
import type { ContactFieldDefinition, ConversationDetail } from '../../types';
import { AiConversationPanel } from './AiConversationPanel';
import { Avatar } from './Avatar';

interface Props {
  conversation: ConversationDetail;
  onClose: () => void;
}

export function ContactDetailsPanel({ conversation, onClose }: Props) {
  const contact = conversation.contact;
  const name = contactDisplayName(contact);
  const { data: definitions, isLoading: isLoadingDefinitions } = useContactFieldDefinitions();
  const { data: fields, isLoading: isLoadingFields } = useContactFields(contact.id);
  const isLoading = isLoadingDefinitions || isLoadingFields;

  const valueByDefinitionId = new Map((fields ?? []).map((field) => [field.definitionId, field.value]));

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

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4">
          <p className="pb-2 text-[11px] font-semibold uppercase tracking-wide text-ink/35">Campos personalizados</p>

          {isLoading && <p className="py-2 text-sm text-ink/40">Carregando…</p>}

          {!isLoading && definitions && definitions.length === 0 && (
            <p className="py-2 text-sm text-ink/40">
              Nenhum campo configurado ainda. Adicione campos nas Configurações do Inbox para Vendas.
            </p>
          )}

          {!isLoading && definitions && definitions.length > 0 && (
            <ul className="space-y-2">
              {definitions.map((definition) => (
                <FieldValueRow
                  key={definition.id}
                  contactId={contact.id}
                  definition={definition}
                  value={valueByDefinitionId.get(definition.id) ?? ''}
                />
              ))}
            </ul>
          )}
        </div>

        {!contact.isGroup && <AiConversationPanel conversation={conversation} />}
      </div>
    </aside>
  );
}

function FieldValueRow({
  contactId,
  definition,
  value: initialValue,
}: {
  contactId: string;
  definition: ContactFieldDefinition;
  value: string;
}) {
  const [value, setValue] = useState(initialValue);
  const setFieldValue = useSetContactFieldValue(contactId);
  const clearFieldValue = useClearContactFieldValue(contactId);

  // The server-known value can change under us (switching contacts reuses this component tree
  // briefly before it remounts) — keep the input in sync with whatever the panel is actually showing.
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  function handleBlur() {
    const trimmed = value.trim();
    if (trimmed === initialValue) return;
    if (trimmed) {
      setFieldValue.mutate({ definitionId: definition.id, value: trimmed });
    } else {
      clearFieldValue.mutate(definition.id);
    }
  }

  return (
    <li className="rounded-lg border border-line bg-white px-3 py-2">
      <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-ink/40">{definition.key}</p>
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={handleBlur}
        placeholder="Não preenchido"
        className="mt-1 w-full rounded-md border border-transparent bg-transparent px-0 py-0.5 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-line focus:px-1.5 focus:py-1"
      />
    </li>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
