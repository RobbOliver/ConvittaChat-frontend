import { useMessageMedia } from '../../hooks/useMessageMedia';
import { PRESS } from '../../lib/interactions';
import type { Message } from '../../types';
import type { LightboxTarget } from './MediaLightbox';

interface Props {
  message: Pick<Message, 'id' | 'mediaType' | 'mediaFileName' | 'mediaMimeType'>;
  tone: 'outbound' | 'inbound';
  onOpen?: (target: LightboxTarget) => void;
}

export function MediaAttachment({ message, tone, onOpen }: Props) {
  const { url, isLoading, isError } = useMessageMedia(message.id);

  if (isLoading) {
    return <div className="h-40 w-48 max-w-full animate-pulse rounded-lg bg-ink/10" />;
  }

  if (isError || !url) {
    return (
      <div
        className={`flex items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-xs ${
          tone === 'outbound' ? 'border-white/25 text-white/60' : 'border-line text-ink/40'
        }`}
      >
        <PaperclipIcon />
        <span>Mídia indisponível</span>
      </div>
    );
  }

  switch (message.mediaType) {
    case 'IMAGE':
      return (
        <button
          type="button"
          onClick={() => onOpen?.({ type: 'image', url, mimeType: message.mediaMimeType })}
          className={`block cursor-zoom-in ${PRESS}`}
        >
          <img src={url} alt="" className="max-h-72 w-full max-w-xs rounded-lg object-cover" />
        </button>
      );
    case 'STICKER':
      return <img src={url} alt="" className="h-32 w-32 object-contain" />;
    case 'GIF':
      // WhatsApp "GIFs" are short silent videos — rendered like an actual animated GIF, not a
      // video player: autoplay, loop, muted, no controls.
      return (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          src={url}
          autoPlay
          loop
          muted
          playsInline
          className="max-h-72 w-full max-w-xs rounded-lg object-cover"
        />
      );
    case 'VIDEO':
      return (
        <button
          type="button"
          onClick={() => onOpen?.({ type: 'video', url, mimeType: message.mediaMimeType })}
          className={`group relative block max-h-72 w-full max-w-xs cursor-pointer overflow-hidden rounded-lg ${PRESS}`}
        >
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video src={url} muted playsInline className="max-h-72 w-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center bg-ink/20 transition-colors group-hover:bg-ink/30">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-ink">
              <PlayIcon />
            </span>
          </span>
        </button>
      );
    case 'AUDIO':
      return <audio src={url} controls className="h-10 w-64 max-w-full" />;
    case 'DOCUMENT':
      return (
        <button
          type="button"
          onClick={() =>
            onOpen?.({
              type: 'document',
              url,
              mimeType: message.mediaMimeType,
              fileName: message.mediaFileName,
            })
          }
          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm ${PRESS} ${
            tone === 'outbound' ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-mist text-ink hover:bg-mist/70'
          }`}
        >
          <PaperclipIcon />
          <span className="max-w-[14rem] truncate">{message.mediaFileName ?? 'Arquivo'}</span>
        </button>
      );
    default:
      return null;
  }
}

function PaperclipIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0" aria-hidden>
      <path
        d="M13.5 7.5 8 13a2.5 2.5 0 1 1-3.5-3.5L10.5 3.5a3.5 3.5 0 1 1 5 5L9.5 14.5a1.5 1.5 0 1 1-2-2L13 7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="ml-0.5 h-5 w-5" aria-hidden>
      <path d="M6.5 4.5v11l9-5.5-9-5.5Z" />
    </svg>
  );
}
