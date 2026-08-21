import { useEffect, useRef, useState } from 'react';
import { PRESS, PRESS_SM } from '../../lib/interactions';

interface Props {
  onSelectFile: (file: File) => void;
  disabled?: boolean;
}

const CATEGORIES = [
  { label: 'Fotos e vídeos', accept: 'image/*,video/*' },
  { label: 'Áudios', accept: 'audio/*' },
  { label: 'Documentos', accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,application/pdf' },
  { label: 'Arquivos', accept: '' },
];

export function AttachMenu({ onSelectFile, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function pickFile(accept: string) {
    setOpen(false);
    const input = document.createElement('input');
    input.type = 'file';
    if (accept) input.accept = accept;
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) onSelectFile(file);
    };
    input.click();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
        aria-label="Anexar arquivo"
        title="Anexar arquivo"
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink/50 hover:bg-mist hover:text-ink disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/60 dark:text-[#ececed]/50 dark:hover:bg-[#24252e] dark:hover:text-[#ececed] ${PRESS_SM}`}
      >
        <ClipIcon />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-44 overflow-hidden rounded-xl border border-line bg-paper py-1 shadow-lg dark:border-[#34353f] dark:bg-[#1a1b21]">
          {CATEGORIES.map((category) => (
            <button
              key={category.label}
              type="button"
              onClick={() => pickFile(category.accept)}
              className={`block w-full px-3 py-2 text-left text-sm text-ink hover:bg-mist dark:text-[#ececed] dark:hover:bg-[#24252e] ${PRESS}`}
            >
              {category.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ClipIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
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
