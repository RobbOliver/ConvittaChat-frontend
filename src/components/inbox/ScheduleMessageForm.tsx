import axios from 'axios';
import { useMemo, useState } from 'react';
import { useContacts } from '../../hooks/useContacts';
import { useCreateScheduledMessage } from '../../hooks/useScheduledMessages';
import { contactDisplayName } from '../../lib/format';
import { PRESS, PRESS_SM } from '../../lib/interactions';
import type { ContactWithConversation, ScheduledMessageMode } from '../../types';
import { Avatar } from './Avatar';

type PickerTab = 'chats' | 'groups';
type SendMode = ScheduledMessageMode;
type IntervalUnit = 'MINUTES' | 'HOURS' | 'DAYS';

const UNIT_TO_MINUTES: Record<IntervalUnit, number> = { MINUTES: 1, HOURS: 60, DAYS: 60 * 24 };

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function ScheduleMessageForm({ onClose, onCreated }: Props) {
  const { data: contacts, isLoading: contactsLoading } = useContacts();
  const create = useCreateScheduledMessage();

  const [pickerTab, setPickerTab] = useState<PickerTab>('chats');
  const [query, setQuery] = useState('');
  const [contactId, setContactId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<SendMode>('ONCE');
  const [loopCount, setLoopCount] = useState('3');
  const [intervalValue, setIntervalValue] = useState('1');
  const [intervalUnit, setIntervalUnit] = useState<IntervalUnit>('HOURS');
  const [occurrenceInputs, setOccurrenceInputs] = useState<string[]>(['']);
  const [error, setError] = useState<string | null>(null);

  const { chats, groups } = useMemo(() => {
    const all = contacts ?? [];
    const q = query.trim().toLowerCase();
    const matches = q
      ? all.filter((contact) => {
          const name = contactDisplayName(contact).toLowerCase();
          return name.includes(q) || contact.phoneNumber.includes(q);
        })
      : all;
    return {
      chats: matches.filter((contact) => !contact.isGroup),
      groups: matches.filter((contact) => contact.isGroup),
    };
  }, [contacts, query]);

  const selectedContact = (contacts ?? []).find((c) => c.id === contactId) ?? null;
  const activeList = pickerTab === 'chats' ? chats : groups;
  const imagePreviewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  function selectContact(contact: ContactWithConversation) {
    setContactId(contact.id);
    setError(null);
  }

  function updateOccurrence(index: number, value: string) {
    setOccurrenceInputs((rows) => rows.map((row, i) => (i === index ? value : row)));
  }

  async function handleSubmit() {
    setError(null);
    if (!contactId) {
      setError('Escolha um contato ou grupo.');
      return;
    }
    if (!text.trim() && !file) {
      setError('Escreva um texto e/ou anexe uma imagem.');
      return;
    }
    if (mode === 'LOOP' && (!loopCount || !intervalValue)) {
      setError('Informe quantas vezes enviar e o intervalo entre os envios.');
      return;
    }
    const occurrences = occurrenceInputs.map((v) => v.trim()).filter(Boolean);
    if (mode === 'SPECIFIC_TIMES' && occurrences.length === 0) {
      setError('Informe ao menos um horário de envio.');
      return;
    }

    try {
      await create.mutateAsync({
        contactId,
        text: text.trim() || undefined,
        file: file ?? undefined,
        mode,
        loopCount: mode === 'LOOP' ? Number.parseInt(loopCount, 10) : undefined,
        loopIntervalMinutes:
          mode === 'LOOP' ? Number.parseInt(intervalValue, 10) * UNIT_TO_MINUTES[intervalUnit] : undefined,
        occurrences: mode === 'SPECIFIC_TIMES' ? occurrences.map((v) => new Date(v).toISOString()) : undefined,
      });
      onCreated();
    } catch (err) {
      const message = axios.isAxiosError(err) ? (err.response?.data as { message?: string })?.message : undefined;
      setError(message ?? 'Não foi possível criar o agendamento.');
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          aria-label="Voltar"
          className={`rounded-full p-1 text-ink/40 hover:bg-mist hover:text-ink ${PRESS_SM}`}
        >
          <BackIcon />
        </button>
        <h2 className="font-display text-lg font-semibold text-ink">Novo agendamento</h2>
      </div>

      <div className="mt-3 flex-1 overflow-y-auto pr-1">
        {!selectedContact ? (
          <>
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome ou número"
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
            />
            <div className="mt-3 flex rounded-full bg-mist p-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => setPickerTab('chats')}
                className={`flex-1 rounded-full py-1.5 ${PRESS} ${
                  pickerTab === 'chats' ? 'bg-ink text-white' : 'text-ink/50 hover:text-ink'
                }`}
              >
                Conversas{chats.length > 0 ? ` (${chats.length})` : ''}
              </button>
              <button
                type="button"
                onClick={() => setPickerTab('groups')}
                className={`flex-1 rounded-full py-1.5 ${PRESS} ${
                  pickerTab === 'groups' ? 'bg-ink text-white' : 'text-ink/50 hover:text-ink'
                }`}
              >
                Grupos{groups.length > 0 ? ` (${groups.length})` : ''}
              </button>
            </div>
            <div className="mt-2">
              {contactsLoading && <p className="py-6 text-center text-sm text-ink/40">Carregando…</p>}
              {!contactsLoading && activeList.length === 0 && (
                <p className="py-6 text-center text-sm text-ink/40">
                  {pickerTab === 'chats' ? 'Nenhum contato encontrado.' : 'Nenhum grupo encontrado.'}
                </p>
              )}
              {!contactsLoading && activeList.length > 0 && (
                <ul>
                  {activeList.map((contact) => {
                    const name = contactDisplayName(contact);
                    return (
                      <li key={contact.id}>
                        <button
                          type="button"
                          onClick={() => selectContact(contact)}
                          className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-mist ${PRESS}`}
                        >
                          <Avatar name={name} avatarUrl={contact.avatarUrl} tone="light" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-ink">{name}</span>
                            <span className="block truncate font-mono text-xs text-ink/40">
                              {!contact.isGroup ? contact.phoneNumber : 'Grupo'}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setContactId(null)}
              className={`flex w-full items-center gap-3 rounded-lg border border-line px-2 py-2 text-left hover:bg-mist ${PRESS}`}
            >
              <Avatar name={contactDisplayName(selectedContact)} avatarUrl={selectedContact.avatarUrl} tone="light" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">
                  {contactDisplayName(selectedContact)}
                </span>
                <span className="block text-xs text-ink/40">Trocar destinatário</span>
              </span>
            </button>

            <label className="block text-sm font-medium text-ink/70">
              Texto (opcional se anexar imagem)
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={3}
                placeholder="Escreva a mensagem…"
                className="mt-1 w-full resize-none rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none focus:border-signal"
              />
            </label>

            <div>
              <p className="text-sm font-medium text-ink/70">Imagem (opcional)</p>
              {file ? (
                <div className="mt-1 flex items-center gap-3">
                  {imagePreviewUrl && (
                    <img src={imagePreviewUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className={`rounded-full border border-line px-3 py-1 text-xs font-medium text-ink/60 hover:bg-mist ${PRESS_SM}`}
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  className="mt-1 w-full text-sm text-ink/60 file:mr-3 file:rounded-full file:border-0 file:bg-mist file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink"
                />
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-ink/70">Como enviar</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {(['ONCE', 'LOOP', 'SPECIFIC_TIMES'] as SendMode[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setMode(option)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium ${PRESS_SM} ${
                      mode === option ? 'border-signal bg-signal/10 text-ink' : 'border-line bg-paper text-ink/60 hover:bg-mist'
                    }`}
                  >
                    {option === 'ONCE' ? 'Enviar agora' : option === 'LOOP' ? 'Repetir' : 'Horários específicos'}
                  </button>
                ))}
              </div>

              {mode === 'LOOP' && (
                <div className="mt-2 space-y-2 rounded-lg border border-line p-3">
                  <label className="block text-xs font-medium text-ink/70">
                    Quantas vezes enviar
                    <input
                      type="number"
                      min={2}
                      value={loopCount}
                      onChange={(event) => setLoopCount(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none focus:border-signal"
                    />
                  </label>
                  <label className="block text-xs font-medium text-ink/70">
                    Intervalo entre os envios
                    <div className="mt-1 flex gap-2">
                      <input
                        type="number"
                        min={1}
                        value={intervalValue}
                        onChange={(event) => setIntervalValue(event.target.value)}
                        className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none focus:border-signal"
                      />
                      <select
                        value={intervalUnit}
                        onChange={(event) => setIntervalUnit(event.target.value as IntervalUnit)}
                        className="rounded-lg border border-line px-2 py-2 text-sm text-ink outline-none focus:border-signal"
                      >
                        <option value="MINUTES">minutos</option>
                        <option value="HOURS">horas</option>
                        <option value="DAYS">dias</option>
                      </select>
                    </div>
                  </label>
                  <p className="text-xs text-ink/40">O 1º envio acontece assim que você confirmar.</p>
                </div>
              )}

              {mode === 'SPECIFIC_TIMES' && (
                <div className="mt-2 space-y-2 rounded-lg border border-line p-3">
                  {occurrenceInputs.map((value, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="datetime-local"
                        value={value}
                        onChange={(event) => updateOccurrence(index, event.target.value)}
                        className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none focus:border-signal"
                      />
                      {occurrenceInputs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setOccurrenceInputs((rows) => rows.filter((_, i) => i !== index))}
                          className="shrink-0 text-ink/40 hover:text-stage-lost"
                          aria-label="Remover horário"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setOccurrenceInputs((rows) => [...rows, ''])}
                    className={`rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-mist ${PRESS_SM}`}
                  >
                    + horário
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-stage-lost">{error}</p>}
      {selectedContact && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={create.isPending}
          className={`mt-3 w-full rounded-full bg-signal px-4 py-2 text-sm font-semibold text-ink hover:bg-signal/90 disabled:opacity-60 ${PRESS}`}
        >
          {create.isPending ? 'Agendando…' : mode === 'ONCE' ? 'Enviar agora' : 'Criar agendamento'}
        </button>
      )}
    </div>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <path d="M12.5 15 7.5 10l5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
