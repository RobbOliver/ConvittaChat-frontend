import type { ReactNode } from 'react';
import type { AiFlowNodeType } from '../../../types';

export const NODE_STYLES: Record<AiFlowNodeType, { border: string; bg: string; text: string; icon: ReactNode }> = {
  TRIGGER: {
    border: 'border-stage-new',
    bg: 'bg-stage-new-soft',
    text: 'text-stage-new',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden>
        <path d="M6 4.5v11l9-5.5-9-5.5Z" fill="currentColor" />
      </svg>
    ),
  },
  AI_MESSAGE: {
    border: 'border-signal',
    bg: 'bg-signal/10',
    text: 'text-signal',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden>
        <path
          d="M3 5.5A1.5 1.5 0 0 1 4.5 4h11A1.5 1.5 0 0 1 17 5.5v6A1.5 1.5 0 0 1 15.5 13H8l-3.5 3v-3H4.5A1.5 1.5 0 0 1 3 11.5v-6Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  CONDITION: {
    border: 'border-ink/30',
    bg: 'bg-mist',
    text: 'text-ink/70',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden>
        <circle cx="5" cy="5" r="1.8" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="5" cy="15" r="1.8" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="15" cy="10" r="1.8" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6.5 6 13.5 9M6.5 14 13.5 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  TEXT: {
    border: 'border-stage-won',
    bg: 'bg-stage-won-soft',
    text: 'text-stage-won',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden>
        <rect x="3" y="4" width="14" height="12" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5.8 7.5h8.4M5.8 10h8.4M5.8 12.5h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  END: {
    border: 'border-ink',
    bg: 'bg-ink',
    text: 'text-paper',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden>
        <path d="M5 3v14M5 4h9l-2.5 3L14 10H5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    ),
  },
  WAIT_REPLY: {
    border: 'border-stage-lost',
    bg: 'bg-stage-lost-soft',
    text: 'text-stage-lost',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden>
        <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M10 6.5V10l2.8 1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
};

export const NODE_TYPE_LABEL: Record<AiFlowNodeType, string> = {
  TRIGGER: 'Início',
  AI_MESSAGE: 'Mensagem de IA',
  CONDITION: 'Condição',
  TEXT: 'Texto fixo',
  END: 'Fim',
  WAIT_REPLY: 'Resposta do cliente',
};
