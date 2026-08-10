import type { ReactNode } from 'react';

// WhatsApp's own inline markdown: single-char delimiters, no nesting. Line breaks are handled
// separately via `whitespace-pre-wrap` on the containing element, not here.
const TOKEN_PATTERN = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|```[^`]+```)/g;

/** Renders a WhatsApp message body with the same *bold*, _italic_, ~strikethrough~ and
 * ```monospace``` formatting the sender typed, instead of showing the raw delimiter characters. */
export function formatMessageText(text: string): ReactNode[] {
  return text.split(TOKEN_PATTERN).map((part, index) => {
    if (part.length > 1 && part.startsWith('*') && part.endsWith('*')) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(1, -1)}
        </strong>
      );
    }
    if (part.length > 1 && part.startsWith('_') && part.endsWith('_')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.length > 1 && part.startsWith('~') && part.endsWith('~')) {
      return (
        <span key={index} className="line-through">
          {part.slice(1, -1)}
        </span>
      );
    }
    if (part.startsWith('```') && part.endsWith('```') && part.length > 5) {
      return (
        <code key={index} className="rounded bg-black/10 px-1 font-mono text-[0.85em]">
          {part.slice(3, -3)}
        </code>
      );
    }
    return part;
  });
}
