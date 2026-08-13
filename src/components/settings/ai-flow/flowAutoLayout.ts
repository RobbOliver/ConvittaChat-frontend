import type { AiFlowEdge, AiFlowNode } from '../../../types';

const SIBLING_SPACING = 260;
const DEPTH_SPACING = 170;

/**
 * A brand new/default flow has every node at (0, 0) — nothing has ever been dragged into place
 * yet, since positions only start meaning anything once Fase 3's editable canvas lets an admin
 * move nodes around. Rather than rendering every node stacked on top of itself, this computes a
 * simple top-to-bottom layered layout ("raiz" no topo, ramos descendo): each node's row is its
 * hop-distance from TRIGGER (a plain BFS), with same-depth nodes spread out side by side. Used
 * both for that first-load seed and, on demand, by FlowCanvas's "Auto-organizar" button — the
 * algorithm itself is agnostic to which side of a node any connection visually uses, so it works
 * the same regardless of which sides the admin actually connected by hand.
 */
export function autoLayoutPositions(
  nodes: Pick<AiFlowNode, 'id' | 'type'>[],
  edges: Pick<AiFlowEdge, 'sourceId' | 'targetId'>[],
): Record<string, { x: number; y: number }> {
  const outgoing = new Map<string, string[]>();
  for (const edge of edges) {
    const list = outgoing.get(edge.sourceId) ?? [];
    list.push(edge.targetId);
    outgoing.set(edge.sourceId, list);
  }

  const depth = new Map<string, number>();
  const trigger = nodes.find((n) => n.type === 'TRIGGER');
  if (trigger) {
    const queue: [string, number][] = [[trigger.id, 0]];
    const visited = new Set<string>();
    while (queue.length > 0) {
      const [id, d] = queue.shift() as [string, number];
      if (visited.has(id)) continue;
      visited.add(id);
      depth.set(id, d);
      for (const nextId of outgoing.get(id) ?? []) {
        if (!visited.has(nextId)) queue.push([nextId, d + 1]);
      }
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
  for (const [d, ids] of columns) {
    ids.forEach((id, col) => {
      positions[id] = { x: col * SIBLING_SPACING, y: d * DEPTH_SPACING };
    });
  }
  return positions;
}
