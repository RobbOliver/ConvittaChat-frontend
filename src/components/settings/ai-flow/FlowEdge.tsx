import { BaseEdge, type EdgeProps } from '@xyflow/react';

interface FlowEdgeData {
  /** Perpendicular offset (px) applied to this edge's curve — computed in FlowCanvas.tsx from how
   * many OTHER edges connect the exact same two nodes (either direction), so a duplicate route or a
   * forward step plus its own "voltar"/loop-back edge fan out instead of drawing on top of each
   * other. Most edges (no sibling sharing both endpoints) get 0 — a plain, unshifted curve. */
  offset?: number;
  [key: string]: unknown;
}

/**
 * Default edge for every connection except a literal self-loop (see SelfLoopEdge) — a hand-rolled
 * cubic bezier (not React Flow's built-in BezierEdge) so `offset` can bend the curve sideways: two
 * edges between the same pair of nodes would otherwise draw the exact same curve on top of each
 * other, which is exactly the "linhas se sobrepondo" the auto-layout used to produce. Edges are
 * still free to cross one another (normal in a branchy flow) — only literal path coincidence is
 * what this avoids. Node cards render with an opaque background (see flowNodeStyles.tsx), and React
 * Flow already paints its edges pane beneath the nodes pane, so every path — offset or not — passes
 * behind a card it happens to run under rather than drawing over it.
 */
export function FlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  markerStart,
  style,
  label,
  labelStyle,
  labelBgStyle,
  data,
}: EdgeProps) {
  const offset = (data as FlowEdgeData | undefined)?.offset ?? 0;
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  // Curve leaves/enters each node along whichever axis the connection is mostly aligned on
  // (vertical for the common top/bottom stacked layout, horizontal for a sideways connection) — the
  // offset always shifts the curve's belly along the OTHER axis, so parallel edges read as a clean
  // lateral fan rather than a stretch/skew of the connection itself.
  const vertical = Math.abs(dy) >= Math.abs(dx);
  const cp1x = vertical ? sourceX + offset : sourceX + dx * 0.4;
  const cp1y = vertical ? sourceY + dy * 0.4 : sourceY + offset;
  const cp2x = vertical ? targetX + offset : targetX - dx * 0.4;
  const cp2y = vertical ? targetY - dy * 0.4 : targetY + offset;
  const path = `M${sourceX},${sourceY} C${cp1x},${cp1y} ${cp2x},${cp2y} ${targetX},${targetY}`;
  // Point at t=0.5 of the cubic bezier above — where the route-label chip sits.
  const labelX = 0.125 * sourceX + 0.375 * cp1x + 0.375 * cp2x + 0.125 * targetX;
  const labelY = 0.125 * sourceY + 0.375 * cp1y + 0.375 * cp2y + 0.125 * targetY;

  return (
    <BaseEdge
      id={id}
      path={path}
      markerEnd={markerEnd}
      markerStart={markerStart}
      style={style}
      label={label}
      labelX={labelX}
      labelY={labelY}
      labelStyle={labelStyle}
      labelBgStyle={labelBgStyle}
    />
  );
}
