import { useState } from 'react';
import type { Conversation } from '../../types';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function MessageThread({ conversation }: { conversation: Conversation }) {
  const [draft, setDraft] = useState('');

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {conversation.contact.name}
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{conversation.contact.phoneNumber}</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {conversation.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                message.direction === 'OUTBOUND'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
              }`}
            >
              <p>{message.content}</p>
              <p
                className={`mt-1 text-[10px] ${
                  message.direction === 'OUTBOUND' ? 'text-emerald-100' : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                {formatTime(message.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <form
        className="flex gap-2 border-t border-neutral-200 p-3 dark:border-neutral-800"
        onSubmit={(event) => {
          event.preventDefault();
          setDraft('');
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Digite uma mensagem"
          className="flex-1 rounded-full border border-neutral-200 bg-transparent px-4 py-2 text-sm outline-none focus:border-emerald-500 dark:border-neutral-700"
        />
        <button
          type="submit"
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Enviar
        </button>
      </form>
    </section>
  );
}
