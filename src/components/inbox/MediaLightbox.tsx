import { useEffect } from 'react';
import { PRESS, PRESS_SM } from '../../lib/interactions';

export interface LightboxTarget {
  type: 'image' | 'video' | 'document';
  url: string;
  mimeType: string | null;
  fileName?: string | null;
}

const SPREADSHEET_EXTENSIONS = ['.xls', '.xlsx', '.csv'];
const SPREADSHEET_MIME_HINTS = ['spreadsheet', 'excel', 'csv'];

function isSpreadsheet(target: LightboxTarget): boolean {
  const mime = target.mimeType?.toLowerCase() ?? '';
  const name = target.fileName?.toLowerCase() ?? '';
  return (
    SPREADSHEET_MIME_HINTS.some((hint) => mime.includes(hint)) ||
    SPREADSHEET_EXTENSIONS.some((ext) => name.endsWith(ext))
  );
}

export function MediaLightbox({ target, onClose }: { target: LightboxTarget; onClose: () => void }) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink/95 p-4" onClick={onClose}>
      <div className="flex justify-end gap-1">
        <a
          href={target.url}
          download={target.fileName ?? undefined}
          onClick={(event) => event.stopPropagation()}
          aria-label="Baixar"
          title="Baixar"
          className={`flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white ${PRESS_SM}`}
        >
          <DownloadIcon />
        </a>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          title="Fechar"
          className={`flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white ${PRESS_SM}`}
        >
          <CloseIcon />
        </button>
      </div>
      <div
        className="flex flex-1 items-center justify-center overflow-auto py-4"
        onClick={(event) => event.stopPropagation()}
      >
        <LightboxContent target={target} />
      </div>
    </div>
  );
}

function LightboxContent({ target }: { target: LightboxTarget }) {
  if (target.type === 'image') {
    return <img src={target.url} alt="" className="max-h-full max-w-full object-contain" />;
  }

  if (target.type === 'video') {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video src={target.url} controls autoPlay className="max-h-full max-w-full" />
    );
  }

  if (target.mimeType === 'application/pdf') {
    return (
      <iframe
        src={target.url}
        title={target.fileName ?? 'Documento'}
        className="h-full w-full max-w-4xl rounded-lg bg-white"
      />
    );
  }

  if (isSpreadsheet(target)) {
    return (
      <UnsupportedPreview
        message="Pré-visualização de planilhas não é suportada — baixe o arquivo para abrir."
        target={target}
      />
    );
  }

  return <UnsupportedPreview message="Pré-visualização não disponível para este arquivo." target={target} />;
}

function UnsupportedPreview({ message, target }: { message: string; target: LightboxTarget }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center text-white/70">
      <PaperclipIcon />
      <p className="max-w-xs text-sm">{message}</p>
      {target.fileName && <p className="font-mono text-xs text-white/40">{target.fileName}</p>}
      <a
        href={target.url}
        download={target.fileName ?? undefined}
        className={`rounded-full bg-signal px-4 py-2 text-sm font-semibold text-ink hover:bg-signal/90 ${PRESS}`}
      >
        Baixar arquivo
      </a>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <path
        d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M4 15h12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function PaperclipIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-8 w-8" aria-hidden>
      <path
        d="M13.5 7.5 8 13a2.5 2.5 0 1 1-3.5-3.5L10.5 3.5a3.5 3.5 0 1 1 5 5L9.5 14.5a1.5 1.5 0 1 1-2-2L13 7"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
