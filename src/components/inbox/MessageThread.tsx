import { useState, type FormEvent } from 'react';
import { useSendMedia } from '../../hooks/useSendMedia';
import { useSendMessage } from '../../hooks/useSendMessage';
import { contactDisplayName, formatTime } from '../../lib/format';
import type { ConversationDetail } from '../../types';
import { AttachMenu } from './AttachMenu';
import { Avatar } from './Avatar';
import { MediaAttachment } from './MediaAttachment';
import { MediaLightbox, type LightboxTarget } from './MediaLightbox';

interface Props {
  conversation: ConversationDetail;
  onBack?: () => void;
}

export function MessageThread({ conversation, onBack }: Props) {
  const [draft, setDraft] = useState('');
  const [lightboxTarget, setLightboxTarget] = useState<LightboxTarget | null>(null);
  const sendMessage = useSendMessage(conversation.id);
  const sendMedia = useSendMedia(conversation.id);
  const name = contactDisplayName(conversation.contact);
  const canSend = conversation.session.status === 'CONNECTED';

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setDraft('');
    sendMessage.mutate(content);
  }

  function handleSelectFile(file: File) {
    sendMedia.mutate(file);
  }

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-paper">
      <div className="flex items-center gap-3 border-b border-line px-4 py-4 sm:px-5">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Voltar para a lista de conversas"
            className="-ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/60 md:hidden"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
              <path
                d="M12.5 15 7.5 10l5-5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        <Avatar name={name} avatarUrl={conversation.contact.avatarUrl} size="md" tone="light" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-base font-semibold text-ink">{name}</h2>
          <p className="font-mono text-xs text-ink/40">
            {conversation.contact.phoneNumber} · via {conversation.session.label}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-mist/40 px-4 py-5 sm:px-5">
        {conversation.messages.map((message) => {
          const isOutbound = message.direction === 'OUTBOUND';
          const tone = isOutbound ? 'outbound' : 'inbound';

          if (message.mediaType === 'STICKER') {
            return (
              <div key={message.id} className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}>
                <MediaAttachment message={message} tone={tone} onOpen={setLightboxTarget} />
                <span className="mt-1 font-mono text-[10px] text-ink/35">{formatTime(message.createdAt)}</span>
              </div>
            );
          }

          return (
            <div key={message.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`flex max-w-[85%] flex-col rounded-2xl text-sm leading-relaxed shadow-sm sm:max-w-[70%] ${
                  isOutbound ? 'rounded-br-sm bg-ink text-white' : 'rounded-bl-sm bg-white text-ink'
                }`}
              >
                {message.mediaType && (
                  <div className="p-1.5 pb-0">
                    <MediaAttachment message={message} tone={tone} onOpen={setLightboxTarget} />
                  </div>
                )}
                <div className="px-3.5 py-2.5">
                  {message.content && <p>{message.content}</p>}
                  <p
                    className={`font-mono text-[10px] ${message.content ? 'mt-1' : ''} ${
                      isOutbound ? 'text-white/45' : 'text-ink/35'
                    }`}
                  >
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form className="border-t border-line bg-paper p-3 sm:p-3.5" onSubmit={handleSubmit}>
        {!canSend && (
          <p className="mb-2 text-center text-xs text-stage-lost">
            {conversation.session.label} está desconectado — reconecte na Home para responder.
          </p>
        )}
        {sendMedia.isPending && <p className="mb-2 text-center text-xs text-ink/40">Enviando arquivo…</p>}
        <div className="flex items-center gap-2">
          <AttachMenu onSelectFile={handleSelectFile} disabled={!canSend || sendMedia.isPending} />
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Digite uma mensagem"
            disabled={!canSend}
            className="flex-1 rounded-full border border-line bg-mist/60 px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-signal focus:bg-white focus:ring-2 focus:ring-signal/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!canSend || sendMessage.isPending}
            className="rounded-full bg-signal px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-signal/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/50 disabled:opacity-50"
          >
            {sendMessage.isPending ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
      </form>

      {lightboxTarget && <MediaLightbox target={lightboxTarget} onClose={() => setLightboxTarget(null)} />}
    </section>
  );
}
