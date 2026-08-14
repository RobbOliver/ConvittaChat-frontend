import type { AiFlowEdge, AiFlowNode } from '../../../types';

const SIBLING_SPACING = 260;
const DEPTH_SPACING = 170;

/**
 * A brand new/default flow has every node at (0, 0) — nothing has ever been dragged into place
 * yet, since positions only start meaning anything once Fase 3's editable canvas lets an admin
 * move nodes around. Rather than rendering every node stacked on top of itself, this computes a
 * top-to-bottom layered layout ("raiz" no topo, ramos descendo). Used both for that first-load seed
 * and, on demand, by FlowCanvas's "Auto-organizar" button — the algorithm itself is agnostic to
 * which side of a node any connection visually uses, so it works the same regardless of which
 * sides the admin actually connected by hand.
 *
 * A step's row is its LONGEST path from TRIGGER (bounded Bellman-Ford-style relaxation, safe on
 * cycles — a malformed loop just stops mattering once the pass cap is hit), not a plain BFS's
 * first-visit shortest distance. A shared step reached by several branches of different lengths
 * (e.g. one WAIT_REPLY node that three different upstream paths all funnel into) would, under
 * shortest-path BFS, get pinned to whichever branch reached it first — every other branch's edge
 * into it then has to jump backward/sideways across the canvas, which is exactly what looked
 * tangled before. Longest-path layering always places a step strictly below every one of its
 * predecessors, so every edge points downward.
 *
 * Within a row, siblings are ordered by the barycenter (average x) of their already-placed
 * parents, not by array order — a child lands roughly under its parent(s) instead of wherever it
 * happened to appear in the saved node list, which is the standard crossing-reduction heuristic
 * behind most tree/DAG auto-layout tools.
 */
export function autoLayoutPositions(
  nodes: Pick<AiFlowNode, 'id' | 'type'>[],
  edges: Pick<AiFlowEdge, 'sourceId' | 'targetId'>[],
): Record<string, { x: number; y: number }> {
  const realEdges = edges.filter((e) => e.sourceId !== e.targetId);
  const incoming = new Map<string, string[]>();
  for (const edge of realEdges) {
    const list = incoming.get(edge.targetId) ?? [];
    list.push(edge.sourceId);
    incoming.set(edge.targetId, list);
  }

  const depth = new Map<string, number>();
  const trigger = nodes.find((n) => n.type === 'TRIGGER');
  if (trigger) {
    depth.set(trigger.id, 0);
    for (let pass = 0; pass < nodes.length; pass++) {
      let changed = false;
      for (const edge of realEdges) {
        const sourceDepth = depth.get(edge.sourceId);
        if (sourceDepth === undefined) continue;
        const candidate = sourceDepth + 1;
        if ((depth.get(edge.targetId) ?? -1) < candidate) {
          depth.set(edge.targetId, candidate);
          changed = true;
        }
      }
      if (!changed) break;
    }
  }

  const columns = new Map<number, string[]>();
  for (const node of nodes) {
    const d = depth.get(node.id) ?? 0;
    const list = columns.get(d) ?? [];
    list.push(node.id);
    columns.set(d, list);
  }

  const positions: Record<string, { x: number; y: number }> = {};
  const sortedDepths = [...columns.keys()].sort((a, b) => a - b);
  for (const d of sortedDepths) {
    const ids = columns.get(d) as string[];
    const withKey = ids.map((id, originalIndex) => {
      const parentXs = (incoming.get(id) ?? [])
        .map((p) => positions[p]?.x)
        .filter((x): x is number => x !== undefined);
      const key =
        parentXs.length > 0
          ? parentXs.reduce((a, b) => a + b, 0) / parentXs.length
          : originalIndex * SIBLING_SPACING;
      return { id, key, originalIndex };
    });
    withKey.sort((a, b) => a.key - b.key || a.originalIndex - b.originalIndex);
    withKey.forEach(({ id }, col) => {
      positions[id] = { x: col * SIBLING_SPACING, y: d * DEPTH_SPACING };
    });
  }
  return positions;
}
