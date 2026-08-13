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
 * Two stacked handles per side (8 total) — one `target`, one `source`, offset a few percent apart
 * so both stay independently draggable. Deliberately NOT `connectionMode="loose"` with one dual-
 * purpose handle per side: xyflow has a documented bug where a loose-mode handle serving as both
 * source and target can attach a drag to the wrong one. Staying in the (default) strict mode with
 * two real handles avoids that entirely, at the cost of these extra elements.
 */
function SideHandles({
  position,
  showTarget,
  showSource,
}: {
  position: Position;
  showTarget: boolean;
  showSource: boolean;
}) {
  const isHorizontalEdge = position === Position.Top || position === Position.Bottom;
  const offsetStyle = (pct: string) => (isHorizontalEdge ? { left: pct } : { top: pct });
  return (
    <>
      {showTarget && (
        <Handle
          type="target"
          position={position}
          id={`${position}-target`}
          className="!bg-ink/40"
          style={offsetStyle('35%')}
        />
      )}
      {showSource && (
        <Handle
          type="source"
          position={position}
          id={`${position}-source`}
          className="!bg-ink/40"
          style={offsetStyle('65%')}
        />
      )}
    </>
  );
}

function FlowNodeCard({ data }: NodeProps & { data: FlowNodeData }) {
  const style = NODE_STYLES[data.nodeType];
  const isEnd = data.nodeType === 'END';
  const isTrigger = data.nodeType === 'TRIGGER';
  return (
    <div
      className={`group relative w-56 cursor-pointer rounded-xl border-2 px-4 py-3 shadow-sm ${style.border} ${style.bg}`}
    >
      {SIDES.map((side) => (
        <SideHandles key={side} position={side} showTarget={!isTrigger} showSource={!isEnd} />
      ))}
      {data.onDelete && (
        <button
          type="button"
          title="Remover passo"
          onClick={(e) => {
            e.stopPropagation();
            data.onDelete?.();
          }}
          className={`nodrag nopan absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full border shadow-sm group-hover:flex ${
            isEnd ? 'border-line bg-paper text-ink' : 'border-line bg-paper text-ink/60'
          } hover:!bg-stage-lost-soft hover:text-stage-lost`}
        >
          <CloseIcon />
        </button>
      )}
      <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${style.text}`}>
        {style.icon}
        {NODE_TYPE_LABEL[data.nodeType]}
      </div>
      <p className={`mt-1.5 truncate text-sm font-semibold ${isEnd ? 'text-paper' : 'text-ink'}`} title={data.label}>
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
