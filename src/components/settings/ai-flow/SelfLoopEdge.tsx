import { BaseEdge, type EdgeProps } from '@xyflow/react';
import { EdgeRouteLabel } from './EdgeRouteLabel';

// How far the arc bulges away from the node — big enough to clearly read as "looping around the
// corner" rather than a short line cutting back into the card.
const LOOP_OFFSET = 64;

/**
 * A node connected to itself (source === target) — used when the admin builds a "wait, then loop
 * back to re-ask" step. The default straight/bezier edge draws a line between two points on the
 * same small card, visually cutting through it. This instead arcs the connection out and around the
 * node's top-right corner, assuming the conventional pairing of "right-source" → "top-target" (see
 * FlowCanvas.tsx's edge-creation sites, which set this edge's type only when source === target).
 */
export function SelfLoopEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  style,
  label,
  labelStyle,
  labelBgStyle,
}: EdgeProps) {
  const path = `M ${sourceX} ${sourceY} C ${sourceX + LOOP_OFFSET} ${sourceY - LOOP_OFFSET}, ${
    targetX + LOOP_OFFSET
  } ${targetY - LOOP_OFFSET}, ${targetX} ${targetY}`;
  const labelX = sourceX + LOOP_OFFSET * 0.75;
  const labelY = sourceY - LOOP_OFFSET * 0.75;

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      <EdgeRouteLabel x={labelX} y={labelY} label={label} labelStyle={labelStyle} labelBgStyle={labelBgStyle} />
    </>
  );
}
