import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSendMedia } from '../../hooks/useSendMedia';
import { useSendMessage } from '../../hooks/useSendMessage';
import { contactDisplayName, formatTime, senderColor } from '../../lib/format';
import { PRESS, PRESS_SM } from '../../lib/interactions';
import type { ConversationDetail, Message } from '../../types';
import { AttachMenu } from './AttachMenu';
import { Avatar } from './Avatar';
import { MediaAttachment } from './MediaAttachment';
import { MediaLightbox, type LightboxTarget } from './MediaLightbox';

/** True right before a message that starts a new run from a different group sender than the
 * previous one — that's the only spot the sender's name/photo needs to show, kept discreet. */
function startsNewSenderRun(message: Message, previous: Message | undefined) {
  if (!message.sender) return false;
  if (!previous) return true;
  return previous.direction !== message.direction || previous.sender?.id !== message.sender.id;
}

function GroupSenderTag({ sender, compact }: { sender: NonNullable<Message['sender']>; compact?: boolean }) {
  const name = contactDisplayName(sender);
  return (
    <div className={`flex items-center gap-1.5 ${compact ? 'pb-1' : 'px-3.5 pt-2.5'}`}>
      <Avatar name={name} avatarUrl={sender.avatarUrl} size="xs" tone="light" />
      <span className="truncate text-xs font-semibold" style={{ color: senderColor(sender.id) }}>
        {name}
      </span>
    </div>
  );
}

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

  const bottomRef = useRef<HTMLDivElement>(null);
  const previousConversationId = useRef(conversation.id);

  // Jump to the bottom instantly when switching chats, but scroll smoothly for messages that
  // arrive (or are sent) within the same chat — otherwise replies keep landing off-screen.
  useEffect(() => {
    const isNewConversation = previousConversationId.current !== conversation.id;
    previousConversationId.current = conversation.id;
    bottomRef.current?.scrollIntoView({ behavior: isNewConversation ? 'auto' : 'smooth' });
  }, [conversation.id, conversation.messages.length]);

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
            className={`-ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink/50 hover:bg-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/60 md:hidden ${PRESS_SM}`}
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
        {conversation.messages.map((message, index) => {
          const isOutbound = message.direction === 'OUTBOUND';
          const tone = isOutbound ? 'outbound' : 'inbound';
          const showSenderTag =
            conversation.contact.isGroup &&
            !isOutbound &&
            startsNewSenderRun(message, conversation.messages[index - 1]);

          if (message.mediaType === 'STICKER') {
            return (
              <div key={message.id} className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}>
                {showSenderTag && message.sender && <GroupSenderTag sender={message.sender} compact />}
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
                {showSenderTag && message.sender && <GroupSenderTag sender={message.sender} />}
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
        <div ref={bottomRef} />
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
            className={`rounded-full bg-signal px-5 py-2.5 text-sm font-semibold text-ink hover:bg-signal/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/50 disabled:opacity-50 ${PRESS}`}
          >
            {sendMessage.isPending ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
      </form>

      {lightboxTarget && <MediaLightbox target={lightboxTarget} onClose={() => setLightboxTarget(null)} />}
    </section>
  );
}
