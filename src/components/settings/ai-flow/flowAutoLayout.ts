import type { AiFlowEdge, AiFlowNode } from '../../../types';

const COLUMN_WIDTH = 260;
const ROW_HEIGHT = 130;

/**
 * A brand new/default flow has every node at (0, 0) — nothing has ever been dragged into place
 * yet, since positions only start meaning anything once Fase 3's editable canvas lets an admin
 * move nodes around. Rather than rendering every node stacked on top of itself, this computes a
 * simple left-to-right layered layout: each node's column is its hop-distance from TRIGGER (a
 * plain BFS), with same-depth nodes stacked vertically. Used both for that first-load seed and,
 * on demand, by FlowCanvas's "Auto-organizar" button — the algorithm itself is agnostic to which
 * side of a node any connection visually uses, so it works the same regardless of layout direction.
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
    ids.forEach((id, row) => {
      positions[id] = { x: d * COLUMN_WIDTH, y: row * ROW_HEIGHT };
    });
  }
  return positions;
}
