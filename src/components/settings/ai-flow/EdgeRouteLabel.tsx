import { EdgeLabelRenderer } from '@xyflow/react';
import type { CSSProperties, ReactNode } from 'react';

// React Flow renders node cards and edge labels as siblings with no z-index gap between them, so
// without an explicit lift a label sitting under a node (very common once auto-layout packs a flow
// tightly, or once FlowEdge.tsx's offset moves a curve's midpoint under a neighboring card) reads
// as hidden rather than "behind, but still legible" — a route label has to stay readable no matter
// where its edge happens to cross. 1000 comfortably clears node z-indexes (a handful of nodes at
// most, starting near 0).
const LABEL_Z_INDEX = 1000;

/**
 * A route-label chip floated above every node via `<EdgeLabelRenderer>` (a dedicated DOM layer
 * React Flow keeps transform-synced to the canvas viewport) instead of the SVG `<text>` that
 * `BaseEdge`'s own `label` prop would draw — the SVG text lives in the same paint layer as the edge
 * path itself, so it's exactly as easy for a node card to cover as the path is. Used by both
 * FlowEdge and SelfLoopEdge so every route label reads the same way regardless of the curve under
 * it. `labelStyle`/`labelBgStyle` keep the `{ fill }` shape FlowCanvas.tsx already constructs them
 * with (that shape was written for the SVG renderer this replaces) — reinterpreted here as
 * color/background for the HTML chip instead.
 */
export function EdgeRouteLabel({
  x,
  y,
  label,
  labelStyle,
  labelBgStyle,
}: {
  x: number;
  y: number;
  label?: ReactNode;
  labelStyle?: CSSProperties;
  labelBgStyle?: CSSProperties;
}) {
  if (!label) return null;
  return (
    <EdgeLabelRenderer>
      <div
        className="nodrag nopan"
        style={{
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
          zIndex: LABEL_Z_INDEX,
          pointerEvents: 'none',
          padding: '1px 5px',
          borderRadius: 4,
          fontSize: (labelStyle?.fontSize as number | undefined) ?? 11,
          fontWeight: 600,
          color: (labelStyle as { fill?: string } | undefined)?.fill ?? '#14161f',
          background: (labelBgStyle as { fill?: string } | undefined)?.fill ?? '#ffffff',
          boxShadow: '0 0 0 1px rgba(20, 22, 31, 0.1)',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
    </EdgeLabelRenderer>
  );
}
