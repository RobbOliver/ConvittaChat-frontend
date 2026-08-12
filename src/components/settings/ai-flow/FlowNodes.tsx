import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ReactNode } from 'react';
import type { AiFlowNodeType } from '../../../types';

export interface FlowNodeData {
  label: string;
  nodeType: AiFlowNodeType;
  [key: string]: unknown;
}

const NODE_STYLES: Record<AiFlowNodeType, { border: string; bg: string; text: string; icon: ReactNode }> = {
  TRIGGER: {
    border: 'border-stage-new',
    bg: 'bg-stage-new-soft',
    text: 'text-stage-new',
    icon: <PlayIcon />,
  },
  AI_MESSAGE: {
    border: 'border-signal',
    bg: 'bg-signal/10',
    text: 'text-signal',
    icon: <ChatIcon />,
  },
  CONDITION: {
    border: 'border-ink/30',
    bg: 'bg-mist',
    text: 'text-ink/70',
    icon: <BranchIcon />,
  },
  END: {
    border: 'border-ink',
    bg: 'bg-ink',
    text: 'text-paper',
    icon: <FlagIcon />,
  },
};

const NODE_TYPE_LABEL: Record<AiFlowNodeType, string> = {
  TRIGGER: 'Início',
  AI_MESSAGE: 'Mensagem de IA',
  CONDITION: 'Condição',
  END: 'Fim',
};

function FlowNodeCard({ data }: NodeProps & { data: FlowNodeData }) {
  const style = NODE_STYLES[data.nodeType];
  const isEnd = data.nodeType === 'END';
  return (
    <div
      className={`w-56 rounded-xl border-2 px-4 py-3 shadow-sm ${style.border} ${style.bg}`}
    >
      {data.nodeType !== 'TRIGGER' && <Handle type="target" position={Position.Left} className="!bg-ink/40" />}
      <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${style.text}`}>
        {style.icon}
        {NODE_TYPE_LABEL[data.nodeType]}
      </div>
      <p className={`mt-1.5 truncate text-sm font-semibold ${isEnd ? 'text-paper' : 'text-ink'}`} title={data.label}>
        {data.label}
      </p>
      {!isEnd && <Handle type="source" position={Position.Right} className="!bg-ink/40" />}
    </div>
  );
}

export function TriggerNode(props: NodeProps) {
  return <FlowNodeCard {...(props as NodeProps & { data: FlowNodeData })} />;
}
export function AiMessageNode(props: NodeProps) {
  return <FlowNodeCard {...(props as NodeProps & { data: FlowNodeData })} />;
}
export function ConditionNode(props: NodeProps) {
  return <FlowNodeCard {...(props as NodeProps & { data: FlowNodeData })} />;
}
export function EndNode(props: NodeProps) {
  return <FlowNodeCard {...(props as NodeProps & { data: FlowNodeData })} />;
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden>
      <path d="M6 4.5v11l9-5.5-9-5.5Z" fill="currentColor" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden>
      <path
        d="M3 5.5A1.5 1.5 0 0 1 4.5 4h11A1.5 1.5 0 0 1 17 5.5v6A1.5 1.5 0 0 1 15.5 13H8l-3.5 3v-3H4.5A1.5 1.5 0 0 1 3 11.5v-6Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BranchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden>
      <circle cx="5" cy="5" r="1.8" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="5" cy="15" r="1.8" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="15" cy="10" r="1.8" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.5 6 13.5 9M6.5 14 13.5 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden>
      <path d="M5 3v14M5 4h9l-2.5 3L14 10H5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
