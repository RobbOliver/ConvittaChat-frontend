import type { AiFlowNodeType } from '../../../types';

export interface FlowJsNode {
  id: string;
  type: AiFlowNodeType;
  label: string;
  config: unknown;
}

export interface FlowJsEdge {
  source: string;
  target: string;
  routeLabel: string | null;
  isFallback: boolean;
}

export interface ParsedFlowJs {
  nodes: FlowJsNode[];
  edges: FlowJsEdge[];
}

const KNOWN_NODE_TYPES = new Set<AiFlowNodeType>([
  'TRIGGER',
  'AI_MESSAGE',
  'CONDITION',
  'TEXT',
  'END',
  'WAIT_REPLY',
]);

/**
 * Renders the canvas as a JSON object (a copy-pasteable, human-readable stand-in for "the JS
 * source" the admin asked for) — real node ids are replaced with short "n1"/"n2"/... labels so the
 * text stays readable, and positions/handle sides are deliberately omitted: this view is about the
 * *logic* (what each step does, how they connect), not pixel placement — parseFlowJs's caller
 * re-runs auto-layout after every import instead.
 */
export function serializeFlowAsJs(
  nodes: { id: string; data: { nodeType: AiFlowNodeType; label: string; config?: unknown; [key: string]: unknown } }[],
  edges: { source: string; target: string; data?: Record<string, unknown> }[],
): string {
  const idMap = new Map<string, string>();
  nodes.forEach((n, i) => idMap.set(n.id, `n${i + 1}`));

  const jsNodes = nodes.map((n) => ({
    id: idMap.get(n.id),
    type: n.data.nodeType,
    label: n.data.label,
    config: n.data.config,
  }));
  const jsEdges = edges.map((e) => ({
    source: idMap.get(e.source),
    target: idMap.get(e.target),
    routeLabel: (e.data?.routeLabel as string | null | undefined) ?? null,
    isFallback: e.data?.isFallback === true,
  }));

  return JSON.stringify({ nodes: jsNodes, edges: jsEdges }, null, 2);
}

/**
 * The reverse direction: text the admin pasted (their own edited copy, or one built by hand/via
 * chat) back into a graph. Deliberately never `eval`/`new Function`s the input — this is `JSON.parse`
 * plus manual shape checks only, same "no code execution on admin-authored text" posture as
 * flow-expression.util.ts's jexl choice on the backend. Throws a (Portuguese, admin-facing) Error
 * with a specific reason on the first problem found, rather than silently dropping bad data.
 */
export function parseFlowJs(text: string): ParsedFlowJs {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('JSON inválido — confira se colou o código completo, com chaves e colchetes fechados.');
  }

  if (
    !raw ||
    typeof raw !== 'object' ||
    !Array.isArray((raw as Record<string, unknown>).nodes) ||
    !Array.isArray((raw as Record<string, unknown>).edges)
  ) {
    throw new Error('Formato inválido: esperado um objeto com "nodes" e "edges".');
  }
  const rawNodes = (raw as { nodes: unknown[] }).nodes;
  const rawEdges = (raw as { edges: unknown[] }).edges;

  const ids = new Set<string>();
  const nodes: FlowJsNode[] = rawNodes.map((n, i) => {
    if (!n || typeof n !== 'object') throw new Error(`Nó #${i + 1} inválido.`);
    const { id, type, label, config } = n as Record<string, unknown>;
    if (typeof id !== 'string' || !id) throw new Error(`Nó #${i + 1} sem "id".`);
    if (ids.has(id)) throw new Error(`Id de nó duplicado: "${id}".`);
    ids.add(id);
    if (typeof type !== 'string' || !KNOWN_NODE_TYPES.has(type as AiFlowNodeType)) {
      throw new Error(`Nó "${id}" com "type" desconhecido: ${String(type)}.`);
    }
    if (typeof label !== 'string' || !label) throw new Error(`Nó "${id}" sem "label".`);
    return {
      id,
      type: type as AiFlowNodeType,
      label,
      config: config ?? (type === 'CONDITION' ? { rules: [] } : {}),
    };
  });

  const triggerCount = nodes.filter((n) => n.type === 'TRIGGER').length;
  if (triggerCount === 0) throw new Error('O fluxo precisa de exatamente 1 nó do tipo "TRIGGER".');
  if (triggerCount > 1) throw new Error('O fluxo só pode ter 1 nó do tipo "TRIGGER".');

  const edges: FlowJsEdge[] = rawEdges.map((e, i) => {
    if (!e || typeof e !== 'object') throw new Error(`Ligação #${i + 1} inválida.`);
    const { source, target, routeLabel, isFallback } = e as Record<string, unknown>;
    if (typeof source !== 'string' || !ids.has(source)) {
      throw new Error(`Ligação #${i + 1} com "source" inválido: ${String(source)}.`);
    }
    if (typeof target !== 'string' || !ids.has(target)) {
      throw new Error(`Ligação #${i + 1} com "target" inválido: ${String(target)}.`);
    }
    return {
      source,
      target,
      routeLabel: typeof routeLabel === 'string' ? routeLabel : null,
      isFallback: isFallback === true,
    };
  });

  return { nodes, edges };
}
