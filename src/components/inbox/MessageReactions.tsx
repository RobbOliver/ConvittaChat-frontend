import { useEffect, useRef, useState } from 'react';
import { PRESS_SM } from '../../lib/interactions';
import type { MessageReaction } from '../../types';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface ReactButtonProps {
  align: 'left' | 'right';
  onReact: (emoji: string) => void;
}

/** Small always-visible trigger next to a message bubble that opens a fixed quick-emoji picker —
 * works the same on touch and desktop, unlike a hover-only affordance. */
export function ReactButton({ align, onReact }: ReactButtonProps) {
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

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Reagir à mensagem"
        title="Reagir"
        className={`flex h-6 w-6 items-center justify-center rounded-full text-ink/30 hover:bg-mist hover:text-ink/70 dark:text-[#ececed]/30 dark:hover:bg-[#24252e] dark:hover:text-[#ececed]/70 ${PRESS_SM}`}
      >
        <SmileIcon />
      </button>
      {open && (
        <div
          className={`absolute bottom-full z-10 mb-1 flex gap-0.5 rounded-full border border-line bg-paper px-1.5 py-1 shadow-lg dark:border-[#34353f] dark:bg-[#1a1b21] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onReact(emoji);
                setOpen(false);
              }}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-base hover:bg-mist dark:hover:bg-[#24252e] ${PRESS_SM}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ReactionPillsProps {
  reactions: MessageReaction[];
  onToggle: (emoji: string) => void;
}

/** Groups raw per-participant reactions by emoji (e.g. "👍 2") — tapping a group adds/removes
 * only the current user's own reaction, same as tapping a reaction summary in WhatsApp. */
export function ReactionPills({ reactions, onToggle }: ReactionPillsProps) {
  if (reactions.length === 0) return null;

  const groups = new Map<string, { count: number; mine: boolean }>();
  for (const reaction of reactions) {
    const group = groups.get(reaction.emoji) ?? { count: 0, mine: false };
    group.count += 1;
    if (reaction.fromMe) group.mine = true;
    groups.set(reaction.emoji, group);
  }

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {Array.from(groups.entries()).map(([emoji, { count, mine }]) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onToggle(mine ? '' : emoji)}
          className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs ${
            mine ? 'border-signal bg-signal/10' : 'border-line bg-white dark:border-[#34353f] dark:bg-[#24252e]'
          } ${PRESS_SM}`}
        >
          <span>{emoji}</span>
          {count > 1 && <span className="text-ink/50 dark:text-[#ececed]/50">{count}</span>}
        </button>
      ))}
    </div>
  );
}

function SmileIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="7.5" cy="8.5" r="0.9" fill="currentColor" />
      <circle cx="12.5" cy="8.5" r="0.9" fill="currentColor" />
      <path
        d="M7 12c.7.9 1.8 1.4 3 1.4s2.3-.5 3-1.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
