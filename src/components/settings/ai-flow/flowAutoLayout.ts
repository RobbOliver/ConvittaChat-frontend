import type { AiFlowEdge, AiFlowNode } from '../../../types';

const SIBLING_SPACING = 260;
// Node cards render ~70px tall (w-56, px-4 py-3, two text rows) — 170 left roughly 100px of dead
// space between a card's bottom edge and the next row's top edge, which barely matters for a wide/
// branchy flow but compounds badly for a long, mostly single-column chain of steps (e.g. a
// step-by-step data collection flow): a 10-row chain was ending up ~1700px tall for no visual
// benefit, forcing fitView to zoom out far more than the content actually needed. 120 still reads
// as a clearly separate row (~50px gap) without wasting a third of every row on empty canvas.
const DEPTH_SPACING = 120;

/**
 * A brand new/default flow has every node at (0, 0) — nothing has ever been dragged into place
 * yet, since positions only start meaning anything once Fase 3's editable canvas lets an admin
 * move nodes around. Rather than rendering every node stacked on top of itself, this computes a
 * top-to-bottom layered layout ("raiz" no topo, ramos descendo). Used both for that first-load seed
 * and, on demand, by FlowCanvas's "Auto-organizar" button — the algorithm itself is agnostic to
 * which side of a node any connection visually uses, so it works the same regardless of which
 * sides the admin actually connected by hand.
 *
 * A step's row is its LONGEST path from TRIGGER along non-looping edges (Bellman-Ford-style
 * relaxation), not a plain BFS's first-visit shortest distance. A shared step reached by several
 * branches of different lengths (e.g. one WAIT_REPLY node that three different upstream paths all
 * funnel into) would, under shortest-path BFS, get pinned to whichever branch reached it first —
 * every other branch's edge into it then has to jump backward/sideways across the canvas, which is
 * exactly what looked tangled before. Longest-path layering always places a step strictly below
 * every one of its predecessors, so every edge points downward.
 *
 * "Non-looping" matters: a WAIT_REPLY-driven "ask again" loop (e.g. a "quer mais alguma coisa?"
 * step whose "sim" edge points back to the question before it) is a completely normal, encouraged
 * shape in this node system, not a malformed graph. Feeding a loop edge into the relaxation above
 * would inflate the depth of that loop's own members (and everything downstream of them) by
 * roughly one extra row per relaxation pass the loop gets caught in, pushing them absurdly far
 * down — a real bug hit while designing an order-taking flow with exactly this kind of loop.
 * `backEdges` (a standard DFS-from-TRIGGER classification: an edge into a node still on the DFS
 * stack, i.e. one of its own ancestors, is a back/loop edge) excludes those from the relaxation
 * entirely, so a step's row reflects its real distance from TRIGGER along the graph's *forward*
 * structure — a loop's edge back to its own question just never draws a row change.
 *
 * Within a row, siblings are ordered by the barycenter (average x) of their already-placed
 * parents (looking at every incoming edge, loops included, since a looped-back step should still
 * visually pull toward whatever points at it), not by array order — a child lands roughly under
 * its parent(s) instead of wherever it happened to appear in the saved node list, the standard
 * crossing-reduction heuristic behind most tree/DAG auto-layout tools.
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

  const trigger = nodes.find((n) => n.type === 'TRIGGER');
  const backEdges = findBackEdges(realEdges, trigger?.id);
  const forwardEdges = realEdges.filter((e) => !backEdges.has(e));

  const depth = new Map<string, number>();
  if (trigger) {
    depth.set(trigger.id, 0);
    for (let pass = 0; pass < nodes.length; pass++) {
      let changed = false;
      for (const edge of forwardEdges) {
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

/** Standard DFS back-edge classification: walking from `startId`, an edge that lands on a node
 * still on the current DFS stack (one of its own ancestors in this walk) closes a cycle — that's a
 * back/loop edge. Iterative (explicit stack), not recursive, so a large flow can't blow the call
 * stack. Nodes unreachable from `startId` are simply never visited, which is fine here: their
 * depth defaults to 0 regardless (see the caller), so no edge of theirs needs classifying. */
function findBackEdges<E extends { sourceId: string; targetId: string }>(
  edges: E[],
  startId: string | undefined,
): Set<E> {
  const backEdges = new Set<E>();
  if (!startId) return backEdges;

  const outgoing = new Map<string, E[]>();
  for (const edge of edges) {
    const list = outgoing.get(edge.sourceId) ?? [];
    list.push(edge);
    outgoing.set(edge.sourceId, list);
  }

  const state = new Map<string, 1 | 2>(); // 1 = on the current DFS stack, 2 = fully explored
  const stack: { id: string; nextEdgeIndex: number }[] = [{ id: startId, nextEdgeIndex: 0 }];
  state.set(startId, 1);
  while (stack.length > 0) {
    const frame = stack[stack.length - 1];
    const out = outgoing.get(frame.id) ?? [];
    if (frame.nextEdgeIndex >= out.length) {
      state.set(frame.id, 2);
      stack.pop();
      continue;
    }
    const edge = out[frame.nextEdgeIndex];
    frame.nextEdgeIndex++;
    const targetState = state.get(edge.targetId);
    if (targetState === 1) {
      backEdges.add(edge);
    } else if (targetState === undefined) {
      state.set(edge.targetId, 1);
      stack.push({ id: edge.targetId, nextEdgeIndex: 0 });
    }
  }
  return backEdges;
}
