import { useMessageMedia } from '../../hooks/useMessageMedia';
import type { Message } from '../../types';

interface Props {
  message: Pick<Message, 'id' | 'mediaType' | 'mediaFileName'>;
  tone: 'outbound' | 'inbound';
}

export function MediaAttachment({ message, tone }: Props) {
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
        <a href={url} target="_blank" rel="noreferrer">
          <img src={url} alt="" className="max-h-72 w-full max-w-xs rounded-lg object-cover" />
        </a>
      );
    case 'STICKER':
      return <img src={url} alt="" className="h-32 w-32 object-contain" />;
    case 'VIDEO':
      return <video src={url} controls className="max-h-72 w-full max-w-xs rounded-lg" />;
    case 'AUDIO':
      return <audio src={url} controls className="h-10 w-64 max-w-full" />;
    case 'DOCUMENT':
      return (
        <a
          href={url}
          download={message.mediaFileName ?? undefined}
          className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
            tone === 'outbound' ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-mist text-ink hover:bg-mist/70'
          }`}
        >
          <PaperclipIcon />
          <span className="max-w-[14rem] truncate">{message.mediaFileName ?? 'Arquivo'}</span>
        </a>
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
