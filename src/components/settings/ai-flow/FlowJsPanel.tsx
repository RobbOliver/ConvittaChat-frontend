import { useEffect, useState } from 'react';
import { PRESS_SM } from '../../../lib/interactions';

interface FlowJsPanelProps {
  /** The canvas's current graph, pre-serialized by the parent (which owns nodes/edges/history) —
   * kept in sync via the effect below whenever the admin isn't mid-edit of their own pasted text. */
  value: string;
  /** Parses+applies `text` as the new graph; returns an error message to show inline, or null on
   * success. Owned by the parent since replacing the graph needs history/makeId/auto-layout, all
   * already local to FlowCanvas. */
  onApply: (text: string) => string | null;
}

/**
 * Collapsible drawer pinned to the canvas's right edge, mirroring FlowVariablesPanel's tab/drawer
 * idiom — but rendered as a real flex sibling in FlowCanvas (not absolute-over-the-canvas), so
 * opening it actually shrinks the canvas's width instead of floating over the graph. There's a lot
 * of text to show here; overlapping nodes would make both unreadable.
 *
 * Shows the graph as copy-pasteable JSON (labeled "JS" per the admin's own naming — JSON is valid
 * JS, and this deliberately never `eval`s pasted text back in, see flowJsSerializer.ts). Pasting a
 * different flow's text here replaces the canvas automatically; typing by hand needs the "Aplicar"
 * button, so a few keystrokes mid-edit never trigger a parse of obviously-incomplete JSON.
 */
export function FlowJsPanel({ value, onApply }: FlowJsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [justApplied, setJustApplied] = useState(false);

  useEffect(() => {
    setText(value);
  }, [value]);

  function applyText(next: string) {
    const err = onApply(next);
    setError(err);
    if (!err) {
      setJustApplied(true);
      window.setTimeout(() => setJustApplied(false), 2500);
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text');
    const target = event.currentTarget;
    const next = text.slice(0, target.selectionStart) + pasted + text.slice(target.selectionEnd);
    setText(next);
    applyText(next);
  }

  return (
    <div className="flex h-full shrink-0 items-stretch">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className={`shrink-0 rounded-r-lg border border-line bg-paper px-2 py-3 text-xs font-medium text-ink/70 shadow-sm hover:bg-mist dark:border-[#34353f] dark:bg-[#1a1b21] dark:text-[#ececed]/70 dark:hover:bg-[#24252e] ${PRESS_SM}`}
        style={{ writingMode: 'vertical-rl' }}
      >
        JS
      </button>
      <div
        className={`overflow-hidden rounded-r-xl border border-l-0 border-line bg-paper shadow-lg transition-[width] duration-200 dark:border-[#34353f] dark:bg-[#1a1b21] ${
          isOpen ? 'w-[420px]' : 'w-0'
        }`}
      >
        <div className="flex h-full w-[420px] flex-col p-3">
          <h4 className="font-display text-sm font-semibold text-ink dark:text-[#ececed]">Código do fluxo (JS)</h4>
          <p className="mt-1 text-xs text-ink/50 dark:text-[#ececed]/50">
            Copie pra explicar a lógica. Cole outro código aqui pra substituir este fluxo automaticamente.
          </p>
          <textarea
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setError(null);
            }}
            onPaste={handlePaste}
            spellCheck={false}
            className="mt-2 min-h-0 flex-1 resize-none rounded-lg border border-line bg-mist/30 p-2 font-mono text-[11px] leading-snug text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20 dark:border-[#34353f] dark:bg-[#24252e]/40 dark:text-[#ececed]"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => applyText(text)}
              className={`rounded-full bg-signal px-3 py-1.5 text-xs font-semibold text-ink hover:bg-signal/90 ${PRESS_SM}`}
            >
              Aplicar
            </button>
            {justApplied && <span className="text-xs text-stage-won">Fluxo substituído ✓</span>}
          </div>
          {error && <p className="mt-2 text-xs text-stage-lost">{error}</p>}
        </div>
      </div>
    </div>
  );
}
