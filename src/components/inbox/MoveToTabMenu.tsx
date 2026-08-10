import { useEffect, useRef, useState } from 'react';
import { PRESS, PRESS_SM } from '../../lib/interactions';
import type { ContactTab } from '../../types';

interface Props {
  tabs: ContactTab[];
  currentTabId: string | null;
  onMove: (tabId: string | null) => void;
}

export function MoveToTabMenu({ tabs, currentTabId, onMove }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function select(tabId: string | null) {
    onMove(tabId);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Mover para outra aba"
        aria-expanded={open}
        className={`flex h-7 w-7 items-center justify-center rounded-full text-white/40 opacity-0 hover:bg-white/10 hover:text-white focus-visible:opacity-100 focus-visible:outline-none group-hover:opacity-100 ${PRESS_SM}`}
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
          <circle cx="8" cy="3" r="1.3" />
          <circle cx="8" cy="8" r="1.3" />
          <circle cx="8" cy="13" r="1.3" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-20 w-40 overflow-hidden rounded-xl bg-white py-1 text-left shadow-xl">
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink/40">Mover para</p>
          <button
            type="button"
            onClick={() => select(null)}
            className={`block w-full px-3 py-1.5 text-left text-sm ${PRESS} ${
              currentTabId === null ? 'font-semibold text-signal' : 'text-ink hover:bg-mist'
            }`}
          >
            All
          </button>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => select(tab.id)}
              className={`block w-full truncate px-3 py-1.5 text-left text-sm ${PRESS} ${
                currentTabId === tab.id ? 'font-semibold text-signal' : 'text-ink hover:bg-mist'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
