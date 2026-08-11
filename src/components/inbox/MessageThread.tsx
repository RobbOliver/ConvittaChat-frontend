import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react';
import { useReactToMessage } from '../../hooks/useReactToMessage';
import { useSendMedia } from '../../hooks/useSendMedia';
import { useSendMessage } from '../../hooks/useSendMessage';
import { contactDisplayName, formatTime, senderColor } from '../../lib/format';
import { formatMessageText } from '../../lib/formatMessageText';
import { PRESS, PRESS_SM } from '../../lib/interactions';
import type { ConversationDetail, InboxType, Message } from '../../types';
import { AttachMenu } from './AttachMenu';
import { Avatar } from './Avatar';
import { MediaAttachment } from './MediaAttachment';
import { MediaLightbox, type LightboxTarget } from './MediaLightbox';
import { ReactButton, ReactionPills } from './MessageReactions';
import { PixComposerModal } from './PixComposerModal';

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
  inboxType: InboxType;
  onBack?: () => void;
  onOpenDetails?: () => void;
}

interface PendingAttachment {
  file: File;
  previewUrl: string | null;
}

export function MessageThread({ conversation, inboxType, onBack, onOpenDetails }: Props) {
  const [draft, setDraft] = useState('');
  const [lightboxTarget, setLightboxTarget] = useState<LightboxTarget | null>(null);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const sendMessage = useSendMessage(conversation.id);
  const sendMedia = useSendMedia(conversation.id);
  const reactToMessage = useReactToMessage(conversation.id);
  const name = contactDisplayName(conversation.contact);
  const canSend = conversation.session.status === 'CONNECTED';

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousConversationId = useRef(conversation.id);

  // Jump to the bottom instantly when switching chats, but scroll smoothly for messages that
  // arrive (or are sent) within the same chat — otherwise replies keep landing off-screen.
  useEffect(() => {
    const isNewConversation = previousConversationId.current !== conversation.id;
    previousConversationId.current = conversation.id;
    if (isNewConversation) setPendingAttachment(null);
    bottomRef.current?.scrollIntoView({ behavior: isNewConversation ? 'auto' : 'smooth' });
  }, [conversation.id, conversation.messages.length]);

  // Release the pasted/picked image's object URL once it's no longer needed, whether that's
  // because it got replaced, cleared, or the whole thread unmounted.
  useEffect(() => {
    return () => {
      if (pendingAttachment?.previewUrl) URL.revokeObjectURL(pendingAttachment.previewUrl);
    };
  }, [pendingAttachment]);

  // Auto-grow the composer as the user types multi-line messages, capped so it never eats the
  // whole thread — matches WhatsApp's own composer behavior.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [draft]);

  function sendDraft() {
    if (pendingAttachment) {
      const caption = draft.trim() || undefined;
      sendMedia.mutate({ file: pendingAttachment.file, caption });
      setPendingAttachment(null);
      setDraft('');
      return;
    }
    const content = draft.trim();
    if (!content) return;
    setDraft('');
    sendMessage.mutate(content);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    sendDraft();
  }

  // Enter sends (matching the previous single-line input's behavior); Shift+Enter inserts a
  // newline, same as WhatsApp's own composer.
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendDraft();
    }
  }

  // Doesn't send right away — staged as a preview so the user can type a caption to go with it
  // first, same as picking a file does. Replaces any attachment already staged.
  function attachFile(file: File) {
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    setPendingAttachment({ file, previewUrl });
    textareaRef.current?.focus();
  }

  function handleSelectFile(file: File) {
    attachFile(file);
  }

  // Lets a copied image (from anywhere — a screenshot, another app, a webpage) be staged for
  // sending just by pasting into the composer, same flow as picking a file from the attach menu.
  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const imageItem = Array.from(event.clipboardData.items).find((item) => item.type.startsWith('image/'));
    if (!imageItem) return;
    const file = imageItem.getAsFile();
    if (!file) return;
    event.preventDefault();
    attachFile(file);
  }

  function handleReact(messageId: string, emoji: string) {
    reactToMessage.mutate({ messageId, emoji });
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
        {inboxType === 'SALES' && onOpenDetails ? (
          <button
            type="button"
            onClick={onOpenDetails}
            className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left hover:bg-mist/60 ${PRESS}`}
          >
            <Avatar name={name} avatarUrl={conversation.contact.avatarUrl} size="md" tone="light" />
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-base font-semibold text-ink">{name}</h2>
              <p className="font-mono text-xs text-ink/40">
                {conversation.contact.phoneNumber} · via {conversation.session.label}
              </p>
            </div>
          </button>
        ) : (
          <>
            <Avatar name={name} avatarUrl={conversation.contact.avatarUrl} size="md" tone="light" />
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-base font-semibold text-ink">{name}</h2>
              <p className="font-mono text-xs text-ink/40">
                {conversation.contact.phoneNumber} · via {conversation.session.label}
              </p>
            </div>
          </>
        )}
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
              <div key={message.id} className={`flex items-center gap-0.5 ${isOutbound ? 'flex-row-reverse' : ''}`}>
                <div className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}>
                  {showSenderTag && message.sender && <GroupSenderTag sender={message.sender} compact />}
                  <MediaAttachment message={message} tone={tone} onOpen={setLightboxTarget} />
                  <span className="mt-1 font-mono text-[10px] text-ink/35">{formatTime(message.createdAt)}</span>
                  <ReactionPills
                    reactions={message.reactions ?? []}
                    onToggle={(emoji) => handleReact(message.id, emoji)}
                  />
                </div>
                <ReactButton
                  align={isOutbound ? 'right' : 'left'}
                  onReact={(emoji) => handleReact(message.id, emoji)}
                />
              </div>
            );
          }

          return (
            <div key={message.id} className={`flex items-center gap-0.5 ${isOutbound ? 'flex-row-reverse' : ''}`}>
              <div className={`flex min-w-0 flex-1 flex-col ${isOutbound ? 'items-end' : 'items-start'}`}>
                <div
                  className={`min-w-[96px] max-w-[85%] rounded-2xl text-sm leading-relaxed shadow-sm sm:max-w-[70%] ${
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
                    {message.content && (
                      <p className="whitespace-pre-wrap">{formatMessageText(message.content)}</p>
                    )}
                    <p
                      className={`flex items-center gap-1.5 font-mono text-[10px] ${message.content ? 'mt-1' : ''} ${
                        isOutbound ? 'text-white/45' : 'text-ink/35'
                      }`}
                    >
                      {message.isAiGenerated && (
                        <span
                          className={`rounded-full px-1.5 py-px font-sans text-[9px] font-semibold uppercase tracking-wide ${
                            isOutbound ? 'bg-white/15 text-white/70' : 'bg-mist text-ink/40'
                          }`}
                        >
                          IA
                        </span>
                      )}
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
                <ReactionPills
                  reactions={message.reactions ?? []}
                  onToggle={(emoji) => handleReact(message.id, emoji)}
                />
              </div>
              <ReactButton
                align={isOutbound ? 'right' : 'left'}
                onReact={(emoji) => handleReact(message.id, emoji)}
              />
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
        {pendingAttachment && (
          <div className="mb-2 flex items-center gap-3 rounded-xl border border-line bg-mist/40 p-2">
            {pendingAttachment.previewUrl ? (
              <img
                src={pendingAttachment.previewUrl}
                alt=""
                className="h-12 w-12 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-mist text-ink/40">
                <FileIcon />
              </div>
            )}
            <span className="min-w-0 flex-1 truncate text-xs text-ink/60">{pendingAttachment.file.name}</span>
            <button
              type="button"
              onClick={() => setPendingAttachment(null)}
              aria-label="Remover anexo"
              className={`shrink-0 rounded-full p-1 text-ink/40 hover:bg-mist hover:text-ink ${PRESS_SM}`}
            >
              <CloseIcon />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <AttachMenu onSelectFile={handleSelectFile} disabled={!canSend || sendMedia.isPending} />
          {inboxType === 'SALES' && (
            <button
              type="button"
              onClick={() => setPixModalOpen(true)}
              disabled={!canSend}
              aria-label="Cobrar via Pix"
              title="Cobrar via Pix"
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink/50 hover:bg-mist hover:text-ink disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/60 ${PRESS_SM}`}
            >
              <PixIcon />
            </button>
          )}
          <textarea
            ref={textareaRef}
            rows={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={pendingAttachment ? 'Digite uma legenda (opcional)' : 'Digite uma mensagem'}
            disabled={!canSend}
            className="hide-scrollbar max-h-[120px] flex-1 resize-none rounded-2xl border border-line bg-mist/60 px-4 py-2.5 text-sm leading-relaxed text-ink outline-none placeholder:text-ink/35 focus:border-signal focus:bg-white focus:ring-2 focus:ring-signal/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!canSend || sendMessage.isPending || sendMedia.isPending}
            className={`rounded-full bg-signal px-5 py-2.5 text-sm font-semibold text-ink hover:bg-signal/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/50 disabled:opacity-50 ${PRESS}`}
          >
            {sendMessage.isPending || sendMedia.isPending ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
      </form>

      {lightboxTarget && <MediaLightbox target={lightboxTarget} onClose={() => setLightboxTarget(null)} />}
      <PixComposerModal open={pixModalOpen} conversationId={conversation.id} onClose={() => setPixModalOpen(false)} />
    </section>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M6 3.5h5l3.5 3.5V16a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M11 3.5V7h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PixIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M6 4.5 3.5 7v6L6 15.5M14 4.5 16.5 7v6L14 15.5M8.2 8.2a2.5 2.5 0 0 1 3.6 0l.9.9a.5.5 0 0 0 .7 0l1.3-1.3M11.8 11.8a2.5 2.5 0 0 1-3.6 0l-.9-.9a.5.5 0 0 0-.7 0L5.3 12.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
