import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { AiFlowNodeType } from '../../../types';
import { NODE_STYLES, NODE_TYPE_LABEL } from './flowNodeStyles';

export interface FlowNodeData {
  label: string;
  nodeType: AiFlowNodeType;
  /** Undefined in Fase 2's read-only preview; set in Fase 3's editable canvas. TRIGGER never gets
   * one passed in (it's the one node type that can't be removed — exactly one must always exist). */
  onDelete?: () => void;
  [key: string]: unknown;
}

const SIDES = [Position.Top, Position.Right, Position.Bottom, Position.Left];

/**
 * One handle per side (4 total) — the canvas runs in `connectionMode="loose"` (see FlowCanvas),
 * so a drag can start OR end on any of them regardless of the `type` declared here; the gesture
 * itself decides direction (where you press down becomes the source, where you release becomes
 * the target). Declared `type="source"` is arbitrary under loose mode, just needs a value.
 * TRIGGER-can't-be-a-target / END-can't-be-a-source is enforced by `isValidConnection` in
 * FlowCanvas, not by hiding handles here.
 */
function SideHandles({ position }: { position: Position }) {
  return (
    <Handle
      type="source"
      position={position}
      id={position}
      className="!h-3 !w-3 !bg-ink/40 dark:!bg-[#ececed]/40"
    />
  );
}

function FlowNodeCard({ data }: NodeProps & { data: FlowNodeData }) {
  const style = NODE_STYLES[data.nodeType];
  const isEnd = data.nodeType === 'END';
  return (
    <div
      className={`group relative w-56 cursor-pointer rounded-xl border-2 px-4 py-3 shadow-sm ${style.border} ${style.bg}`}
    >
      {SIDES.map((side) => (
        <SideHandles key={side} position={side} />
      ))}
      {data.onDelete && (
        <button
          type="button"
          title="Remover passo"
          onClick={(e) => {
            e.stopPropagation();
            data.onDelete?.();
          }}
          className={`nodrag nopan absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full border shadow-sm group-hover:flex dark:border-[#34353f] dark:bg-[#1a1b21] ${
            isEnd ? 'border-line bg-paper text-ink dark:text-[#ececed]' : 'border-line bg-paper text-ink/60 dark:text-[#ececed]/60'
          } hover:!bg-stage-lost-soft hover:text-stage-lost`}
        >
          <CloseIcon />
        </button>
      )}
      <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${style.text}`}>
        {style.icon}
        {NODE_TYPE_LABEL[data.nodeType]}
      </div>
      <p
        className={`mt-1.5 truncate text-sm font-semibold ${isEnd ? 'text-paper' : 'text-ink dark:text-[#ececed]'}`}
        title={data.label}
      >
        {data.label}
      </p>
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
export function TextNode(props: NodeProps) {
  return <FlowNodeCard {...(props as NodeProps & { data: FlowNodeData })} />;
}
export function EndNode(props: NodeProps) {
  return <FlowNodeCard {...(props as NodeProps & { data: FlowNodeData })} />;
}
export function WaitReplyNode(props: NodeProps) {
  return <FlowNodeCard {...(props as NodeProps & { data: FlowNodeData })} />;
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3" aria-hidden>
      <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
