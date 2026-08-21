import type { WhatsappSessionStatus } from '../../types';

const LABELS: Record<WhatsappSessionStatus, string> = {
  PENDING_QR: 'Aguardando pareamento',
  CONNECTED: 'Conectado',
  DISCONNECTED: 'Desconectado',
};

const STYLES: Record<WhatsappSessionStatus, string> = {
  PENDING_QR: 'bg-stage-progress-soft text-stage-progress dark:bg-[#3a2f1f] dark:text-[#e8a33d]',
  CONNECTED: 'bg-stage-won-soft text-stage-won dark:bg-[#173129] dark:text-[#34d399]',
  DISCONNECTED: 'bg-mist text-ink/40 dark:bg-[#24252e] dark:text-[#ececed]/40',
};

const DOT: Record<WhatsappSessionStatus, string> = {
  PENDING_QR: 'bg-stage-progress',
  CONNECTED: 'bg-stage-won',
  DISCONNECTED: 'bg-ink/30 dark:bg-[#ececed]/30',
};

export function SessionStatusBadge({ status }: { status: WhatsappSessionStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STYLES[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} aria-hidden />
      {LABELS[status]}
    </span>
  );
}
