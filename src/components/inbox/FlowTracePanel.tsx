import { useFlowTrace } from '../../hooks/useFlowTrace';
import { formatTime } from '../../lib/format';
import { NODE_STYLES, NODE_TYPE_LABEL } from '../settings/ai-flow/flowNodeStyles';
import type { AiFlowNodeType } from '../../types';

interface Props {
  conversationId: string;
}

/** Debug view of where the AI's conversation flow currently sits for this contact — the current
 * step plus the recent path it took to get there. Read-only, refetches whenever a new message
 * lands (see useFlowTrace). Nothing to configure here — editing the flow itself lives in
 * Configurações → Fluxo de IA. */
export function FlowTracePanel({ conversationId }: Props) {
  const { data: trace } = useFlowTrace(conversationId);
  if (!trace) return null;

  return (
    <div className="mt-4">
      <p className="pb-1 text-[11px] font-semibold uppercase tracking-wide text-ink/35">Passo atual do fluxo</p>

      {trace.status === null ? (
        <p className="text-xs text-ink/35">A IA ainda não rodou o fluxo com este contato.</p>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <StepBadge type={trace.currentNodeType} label={trace.currentNodeLabel ?? '—'} />
            <span className="text-[10px] font-medium uppercase tracking-wide text-ink/35">
              {trace.status === 'RUNNING' ? 'aguardando resposta' : 'concluído'}
            </span>
          </div>

          {trace.trace.length > 0 && (
            <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-line bg-mist/60 px-3 py-2">
              {[...trace.trace].reverse().map((entry, index) => (
                <li key={`${entry.at}-${index}`} className="flex items-center justify-between gap-2 text-xs text-ink/60">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className={NODE_STYLES[asNodeType(entry.nodeType)]?.text ?? 'text-ink/50'}>
                      {NODE_STYLES[asNodeType(entry.nodeType)]?.icon}
                    </span>
                    <span className="truncate">{entry.nodeLabel || NODE_TYPE_LABEL[asNodeType(entry.nodeType)]}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-ink/35">{formatTime(entry.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function StepBadge({ type, label }: { type: AiFlowNodeType | null; label: string }) {
  if (!type) return <span className="text-sm text-ink/50">{label}</span>;
  const style = NODE_STYLES[type];
  return (
    <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${style.border} ${style.bg} ${style.text}`}>
      {style.icon}
      {label}
    </span>
  );
}

// The backend stores nodeType as free-text JSON (see FlowTraceEntry's index signature) — narrow it
// back to the known union for the shared style map, falling back to CONDITION's neutral styling for
// anything unrecognized rather than crashing on a stale/malformed trace entry.
function asNodeType(value: string): AiFlowNodeType {
  return value === 'TRIGGER' || value === 'AI_MESSAGE' || value === 'CONDITION' || value === 'END'
    ? value
    : 'CONDITION';
}
