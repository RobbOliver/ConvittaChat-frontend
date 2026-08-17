import {
  addEdge,
  Background,
  ConnectionMode,
  Controls,
  MarkerType,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type EdgeMouseHandler,
  type EdgeTypes,
  type IsValidConnection,
  type Node,
  type NodeMouseHandler,
  type NodeTypes,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useAiFlow,
  useAiFlowVersions,
  useDeleteAiFlowVersion,
  useRestoreAiFlowVersion,
  useSaveAiFlowVersion,
  useUpdateAiFlow,
} from '../../../hooks/useAiFlow';
import { PRESS_SM } from '../../../lib/interactions';
import type { AiFlow, AiFlowNodeType } from '../../../types';
import { EdgeConfigModal, type EditableEdge } from './EdgeConfigModal';
import { autoLayoutPositions } from './flowAutoLayout';
import { FlowJsPanel } from './FlowJsPanel';
import { parseFlowJs, serializeFlowAsJs } from './flowJsSerializer';
import { FlowVariablesPanel } from './FlowVariablesPanel';
import { FlowVersionsPanel } from './FlowVersionsPanel';
import {
  AiMessageNode,
  ConditionNode,
  EndNode,
  TextNode,
  TriggerNode,
  WaitReplyNode,
  type FlowNodeData,
} from './FlowNodes';
import { NodeConfigModal, type EditableNode } from './NodeConfigModal';
import { SelfLoopEdge } from './SelfLoopEdge';
import { useGraphHistory } from './useGraphHistory';

const NODE_TYPES: NodeTypes = {
  TRIGGER: TriggerNode,
  AI_MESSAGE: AiMessageNode,
  CONDITION: ConditionNode,
  TEXT: TextNode,
  END: EndNode,
  WAIT_REPLY: WaitReplyNode,
};

const EDGE_TYPES: EdgeTypes = {
  selfLoop: SelfLoopEdge,
};

const LEGEND: { type: AiFlowNodeType; label: string; dot: string }[] = [
  { type: 'TRIGGER', label: 'Início', dot: 'bg-stage-new' },
  { type: 'AI_MESSAGE', label: 'Mensagem de IA', dot: 'bg-signal' },
  { type: 'CONDITION', label: 'Condição', dot: 'bg-ink/40' },
  { type: 'TEXT', label: 'Texto fixo', dot: 'bg-stage-won' },
  { type: 'WAIT_REPLY', label: 'Resposta do cliente', dot: 'bg-stage-lost' },
  { type: 'END', label: 'Fim', dot: 'bg-ink' },
];

interface EdgeData {
  routeLabel: string | null;
  isFallback: boolean;
  [key: string]: unknown;
}

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Flows saved before the single-handle-per-side redesign stored ids like "right-source"/"left-
// target" (two handles per side); the redesign collapsed those into one handle per side, id'd
// just "right"/"left". Strip the old suffix on load so those edges still snap to a real handle
// instead of silently failing to render.
function normalizeHandleId(id: string | null | undefined): string | undefined {
  if (!id) return undefined;
  return id.replace(/-(source|target)$/, '');
}

/**
 * Editable canvas for the account's flow graph: drag nodes, add an AI_MESSAGE/CONDITION/END node,
 * remove a node (the "×" button or the delete key — never on TRIGGER, always exactly one), connect
 * two nodes (any number of outgoing connections — see EdgeConfigModal for labeling one as a route
 * option or as the fallback), double-click a node to edit its label/config (CONDITION gets a rule
 * builder), double-click an edge to label it. Nothing is sent to the server until "Salvar fluxo".
 */
export function FlowCanvas() {
  const { data: flow, isLoading, isError } = useAiFlow();
  const updateFlow = useUpdateAiFlow();
  const { data: versions, isLoading: versionsLoading } = useAiFlowVersions();
  const saveVersion = useSaveAiFlowVersion();
  const restoreVersion = useRestoreAiFlowVersion();
  const deleteVersion = useDeleteAiFlowVersion();

  const [nodes, setNodes, applyNodesChange] = useNodesState<Node<FlowNodeData>>([]);
  const [edges, setEdges, applyEdgesChange] = useEdgesState<Edge>([]);
  const [editingNode, setEditingNode] = useState<EditableNode | null>(null);
  const [editingEdge, setEditingEdge] = useState<EditableEdge | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [seededFlowId, setSeededFlowId] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [confirmingNewFlow, setConfirmingNewFlow] = useState(false);
  const reactFlowInstance = useRef<ReactFlowInstance<Node<FlowNodeData>, Edge> | null>(null);
  const history = useGraphHistory();
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  // Shared by the initial-load effect below and by the "criar novo fluxo"/"limpar" handlers, which
  // also need to replace local canvas state wholesale after the server confirms a save — same
  // reasoning as handleApplyFlowJs: a saved AiFlow keeps the same `id` across edits (it's a 1-per-
  // user row, never recreated), so the effect's own `flow.id === seededFlowId` guard wouldn't
  // notice a same-id server update on its own.
  function applyFlowToCanvas(nextFlow: AiFlow) {
    const allZero = nextFlow.nodes.every((n) => n.positionX === 0 && n.positionY === 0);
    const positions = allZero
      ? autoLayoutPositions(nextFlow.nodes, nextFlow.edges)
      : Object.fromEntries(nextFlow.nodes.map((n) => [n.id, { x: n.positionX, y: n.positionY }]));

    setNodes(
      nextFlow.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: positions[n.id] ?? { x: 0, y: 0 },
        data: { label: n.label, nodeType: n.type, config: n.config } satisfies FlowNodeData,
      })),
    );
    setEdges(
      nextFlow.edges.map((e) => ({
        id: e.id,
        source: e.sourceId,
        target: e.targetId,
        sourceHandle: normalizeHandleId(e.sourceHandle),
        targetHandle: normalizeHandleId(e.targetHandle),
        type: e.sourceId === e.targetId ? 'selfLoop' : undefined,
        label: e.routeLabel ?? undefined,
        style: e.isFallback ? { strokeDasharray: '4 4' } : undefined,
        labelStyle: { fill: '#14161f', fontSize: 11 },
        labelBgStyle: { fill: '#ffffff' },
        markerEnd: { type: MarkerType.ArrowClosed },
        data: { routeLabel: e.routeLabel, isFallback: e.isFallback } satisfies EdgeData,
      })),
    );
    setSeededFlowId(nextFlow.id);
    setIsDirty(false);
    history.clear();
  }

  // Seeds local editable state once per fetched flow id — after that, this component owns canvas
  // state until "Salvar fluxo" (or the tab unmounts, which resets everything back to whatever the
  // server has, same as discarding unsaved edits).
  useEffect(() => {
    if (!flow || flow.id === seededFlowId) return;
    applyFlowToCanvas(flow);
  }, [flow, seededFlowId, setNodes, setEdges, history]);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? null : current)), 4000);
  }

  const onNodesChange: OnNodesChange<Node<FlowNodeData>> = (changes) => {
    const filtered = changes.filter((c) => {
      if (c.type !== 'remove') return true;
      const isTrigger = nodes.find((n) => n.id === c.id)?.type === 'TRIGGER';
      if (isTrigger) showNotice('O passo de início não pode ser removido.');
      return !isTrigger;
    });
    // 'dimensions' fires on every node's first render (React Flow measuring its DOM size) and
    // 'select' on plain clicks — neither is a real edit, so neither should flip the dirty flag.
    if (filtered.some((c) => c.type !== 'select' && c.type !== 'dimensions')) setIsDirty(true);
    // Snapshot before a drag actually lands (not on every intermediate move event, or one drag
    // gesture would flood the stack) and before a Delete-key removal.
    if (filtered.some((c) => (c.type === 'position' && c.dragging === false) || c.type === 'remove')) {
      history.push(nodesRef.current, edgesRef.current);
    }
    applyNodesChange(filtered);
  };

  const onEdgesChange: OnEdgesChange = (changes) => {
    if (changes.some((c) => c.type !== 'select')) setIsDirty(true);
    if (changes.some((c) => c.type === 'remove')) history.push(nodesRef.current, edgesRef.current);
    applyEdgesChange(changes);
  };

  // Loose connectionMode lifts the source/target handle-type restriction (any handle can start or
  // end a drag), so the "no incoming edge on the start node / no outgoing edge on the end node"
  // rule that used to come from simply not rendering that handle now has to be checked here.
  const isValidConnection: IsValidConnection<Edge> = (connection: Connection | Edge) => {
    const sourceType = nodes.find((n) => n.id === connection.source)?.data.nodeType;
    const targetType = nodes.find((n) => n.id === connection.target)?.data.nodeType;
    if (targetType === 'TRIGGER') return false;
    if (sourceType === 'END') return false;
    return true;
  };

  const onConnect: OnConnect = (connection) => {
    if (edges.some((e) => e.source === connection.source && e.target === connection.target)) {
      showNotice('Esses dois passos já estão ligados.');
      return;
    }
    history.push(nodesRef.current, edgesRef.current);
    setEdges((eds) =>
      addEdge(
        {
          ...connection,
          id: makeId(),
          type: connection.source === connection.target ? 'selfLoop' : undefined,
          markerEnd: { type: MarkerType.ArrowClosed },
          data: { routeLabel: null, isFallback: false } satisfies EdgeData,
        },
        eds,
      ),
    );
    setIsDirty(true);
  };

  const onNodeDoubleClick: NodeMouseHandler<Node<FlowNodeData>> = (_event, node) => {
    setEditingNode({ id: node.id, type: node.data.nodeType, label: node.data.label, config: node.data.config });
  };

  const onEdgeDoubleClick: EdgeMouseHandler<Edge> = (_event, edge) => {
    const data = edge.data as EdgeData | undefined;
    const sourceLabel = nodes.find((n) => n.id === edge.source)?.data.label ?? '?';
    const targetLabel = nodes.find((n) => n.id === edge.target)?.data.label ?? '?';
    setEditingEdge({
      id: edge.id,
      routeLabel: data?.routeLabel ?? null,
      isFallback: data?.isFallback ?? false,
      sourceLabel,
      targetLabel,
    });
  };

  function handleNodeSave(nodeId: string, patch: { label: string; config: unknown }) {
    history.push(nodesRef.current, edgesRef.current);
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, label: patch.label, config: patch.config } } : n)),
    );
    setIsDirty(true);
  }

  function handleEdgeSave(edgeId: string, patch: { routeLabel: string | null; isFallback: boolean }) {
    history.push(nodesRef.current, edgesRef.current);
    setEdges((eds) => {
      const target = eds.find((e) => e.id === edgeId);
      const sourceId = target?.source;
      return eds.map((e) => {
        if (e.id === edgeId) {
          return {
            ...e,
            label: patch.routeLabel ?? undefined,
            style: patch.isFallback ? { strokeDasharray: '4 4' } : undefined,
            data: { routeLabel: patch.routeLabel, isFallback: patch.isFallback } satisfies EdgeData,
          };
        }
        // At most one fallback per source node — marking this one as fallback silently un-marks
        // any sibling, so the admin never has to notice/fix it manually (and the backend would
        // otherwise reject the save outright — see flow.service.ts's saveGraph).
        if (patch.isFallback && e.source === sourceId) {
          const siblingData = e.data as EdgeData | undefined;
          if (siblingData?.isFallback) {
            return { ...e, style: undefined, data: { ...siblingData, isFallback: false } satisfies EdgeData };
          }
        }
        return e;
      });
    });
    setIsDirty(true);
  }

  function handleDeleteNode(nodeId: string) {
    history.push(nodesRef.current, edgesRef.current);
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setIsDirty(true);
  }

  function handleAddNode(type: 'AI_MESSAGE' | 'CONDITION' | 'TEXT' | 'END' | 'WAIT_REPLY') {
    const maxX = nodes.reduce((max, n) => Math.max(max, n.position.x), 0);
    const label = {
      AI_MESSAGE: 'Nova mensagem',
      CONDITION: 'Nova condição',
      TEXT: 'Novo texto',
      END: 'Novo fim',
      WAIT_REPLY: 'Nova resposta do cliente',
    }[type];
    history.push(nodesRef.current, edgesRef.current);
    const newNode: Node<FlowNodeData> = {
      id: makeId(),
      type,
      position: { x: maxX + 260, y: 0 },
      data: { label, nodeType: type, config: type === 'CONDITION' ? { rules: [] } : {} },
    };
    setNodes((nds) => [...nds, newNode]);
    setIsDirty(true);
    // A newly-added node can land outside the last fitView's frame (each addition pushes further
    // right) — re-fit once the new node has actually rendered/measured, or it's invisible until
    // the admin manually pans/zooms to find it.
    requestAnimationFrame(() => reactFlowInstance.current?.fitView({ padding: 0.3, duration: 200 }));
  }

  /** Recomputes a clean layered layout on demand (the same BFS-by-hop-depth algorithm that seeds a
   * brand new flow) — works regardless of which side of a node any connection visually uses, since
   * the algorithm only looks at the graph's structure, never at handle positions. */
  function handleAutoLayout() {
    history.push(nodesRef.current, edgesRef.current);
    const positions = autoLayoutPositions(
      nodes.map((n) => ({ id: n.id, type: n.data.nodeType })),
      edges.map((e) => ({ sourceId: e.source, targetId: e.target })),
    );
    setNodes((nds) => nds.map((n) => ({ ...n, position: positions[n.id] ?? n.position })));
    setIsDirty(true);
    requestAnimationFrame(() => reactFlowInstance.current?.fitView({ padding: 0.3, duration: 200 }));
  }

  const jsText = useMemo(() => serializeFlowAsJs(nodes, edges), [nodes, edges]);

  /** Replaces the entire canvas with what's parsed from `text` (the "JS" panel's paste-to-replicate
   * behavior) — always a full replace, never a merge, matching "substituir" not "somar". Positions
   * are never trusted from the pasted text (there aren't any — flowJsSerializer omits them on
   * purpose); auto-layout runs immediately after, so hand-written/chat-authored flow text never
   * needs to specify pixel coordinates. Returns an error string instead of throwing, so the panel
   * can show it inline without a try/catch at the call site. */
  function handleApplyFlowJs(text: string): string | null {
    let parsed: ReturnType<typeof parseFlowJs>;
    try {
      parsed = parseFlowJs(text);
    } catch (err) {
      return err instanceof Error ? err.message : 'Não foi possível interpretar esse código.';
    }

    history.push(nodesRef.current, edgesRef.current);
    // Never trust ids from pasted text as real ids — a paste of this same canvas's own export
    // would otherwise collide with (or silently reuse) ids a ConversationFlowState row might still
    // reference, orphaning in-progress conversations the moment "Salvar fluxo" is clicked.
    const realId = new Map(parsed.nodes.map((n) => [n.id, makeId()]));
    const newNodes: Node<FlowNodeData>[] = parsed.nodes.map((n) => ({
      id: realId.get(n.id) as string,
      type: n.type,
      position: { x: 0, y: 0 },
      data: { label: n.label, nodeType: n.type, config: n.config },
    }));
    const newEdges: Edge[] = parsed.edges.map((e) => {
      const source = realId.get(e.source) as string;
      const target = realId.get(e.target) as string;
      return {
        id: makeId(),
        source,
        target,
        type: source === target ? 'selfLoop' : undefined,
        label: e.routeLabel ?? undefined,
        style: e.isFallback ? { strokeDasharray: '4 4' } : undefined,
        labelStyle: { fill: '#14161f', fontSize: 11 },
        labelBgStyle: { fill: '#ffffff' },
        markerEnd: { type: MarkerType.ArrowClosed },
        data: { routeLabel: e.routeLabel, isFallback: e.isFallback } satisfies EdgeData,
      };
    });
    const positions = autoLayoutPositions(
      newNodes.map((n) => ({ id: n.id, type: n.data.nodeType })),
      newEdges.map((e) => ({ sourceId: e.source, targetId: e.target })),
    );
    setNodes(newNodes.map((n) => ({ ...n, position: positions[n.id] ?? { x: 0, y: 0 } })));
    setEdges(newEdges);
    setIsDirty(true);
    requestAnimationFrame(() => reactFlowInstance.current?.fitView({ padding: 0.3, duration: 200 }));
    return null;
  }

  function handleSave() {
    updateFlow.mutate(
      {
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.data.nodeType,
          label: n.data.label,
          positionX: n.position.x,
          positionY: n.position.y,
          config: n.data.config,
        })),
        edges: edges.map((e) => {
          const data = e.data as EdgeData | undefined;
          return {
            id: e.id,
            sourceId: e.source,
            targetId: e.target,
            routeLabel: data?.routeLabel ?? null,
            isFallback: data?.isFallback ?? false,
            sourceHandle: e.sourceHandle ?? null,
            targetHandle: e.targetHandle ?? null,
          };
        }),
      },
      { onSuccess: () => setIsDirty(false) },
    );
  }

  /** Both handlers below take effect immediately (unlike every other canvas edit, which waits for
   * "Salvar fluxo") — a reset/clear that only stuck around locally could be lost as easily as it
   * was clicked, defeating the point of pairing them with a real backup. The current LIVE (already
   * saved) graph is snapshotted as a version first, so either action is always undoable via the
   * Versões panel even though it bypasses the normal save button. */
  function handleNewFlow() {
    const triggerId = makeId();
    const aiMessageId = makeId();
    const endId = makeId();
    saveVersion.mutate('Antes de criar novo fluxo', {
      onSuccess: () => {
        updateFlow.mutate(
          {
            nodes: [
              { id: triggerId, type: 'TRIGGER', label: 'Início da conversa', positionX: 0, positionY: 0, config: {} },
              { id: aiMessageId, type: 'AI_MESSAGE', label: 'Atendimento', positionX: 0, positionY: 0, config: {} },
              { id: endId, type: 'END', label: 'Fim', positionX: 0, positionY: 0, config: {} },
            ],
            edges: [
              {
                id: makeId(),
                sourceId: triggerId,
                targetId: aiMessageId,
                routeLabel: null,
                isFallback: false,
                sourceHandle: null,
                targetHandle: null,
              },
              {
                id: makeId(),
                sourceId: aiMessageId,
                targetId: endId,
                routeLabel: null,
                isFallback: false,
                sourceHandle: null,
                targetHandle: null,
              },
            ],
          },
          {
            onSuccess: (nextFlow) => {
              applyFlowToCanvas(nextFlow);
              showNotice('Novo fluxo criado — o anterior foi salvo em Versões.');
            },
          },
        );
      },
    });
    setConfirmingNewFlow(false);
  }

  function handleClear() {
    const triggerId = makeId();
    saveVersion.mutate('Antes de limpar', {
      onSuccess: () => {
        updateFlow.mutate(
          {
            nodes: [
              { id: triggerId, type: 'TRIGGER', label: 'Início da conversa', positionX: 0, positionY: 0, config: {} },
            ],
            edges: [],
          },
          {
            onSuccess: (nextFlow) => {
              applyFlowToCanvas(nextFlow);
              showNotice('Fluxo limpo — o anterior foi salvo em Versões.');
            },
          },
        );
      },
    });
    setConfirmingClear(false);
  }

  function handleUndo() {
    const snapshot = history.undo({ nodes: nodesRef.current, edges: edgesRef.current });
    if (!snapshot) return;
    setNodes(snapshot.nodes);
    setEdges(snapshot.edges);
    setIsDirty(true);
  }

  function handleRedo() {
    const snapshot = history.redo({ nodes: nodesRef.current, edges: edgesRef.current });
    if (!snapshot) return;
    setNodes(snapshot.nodes);
    setEdges(snapshot.edges);
    setIsDirty(true);
  }

  // Ctrl/Cmd+Z (undo) and Ctrl/Cmd+Shift+Z or Ctrl+Y (redo) at the window level — the canvas has no
  // DOM ref clean enough to scope this to. Must never fire while a modal is open (its own textarea/
  // input relies on the browser's native per-field undo) or while any input/textarea has focus.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      const isUndo = (event.metaKey || event.ctrlKey) && !event.shiftKey && key === 'z';
      const isRedo =
        ((event.metaKey || event.ctrlKey) && event.shiftKey && key === 'z') ||
        (event.ctrlKey && !event.metaKey && key === 'y');
      if (!isUndo && !isRedo) return;
      if (editingNode || editingEdge) return;
      const active = document.activeElement;
      const tag = active?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (active as HTMLElement | null)?.isContentEditable) return;
      event.preventDefault();
      if (isUndo) handleUndo();
      else handleRedo();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (isLoading) {
    return <div className="flex h-[640px] items-center justify-center text-sm text-ink/40">Carregando fluxo…</div>;
  }
  if (isError || !flow) {
    return (
      <div className="flex h-[640px] items-center justify-center text-sm text-stage-lost">
        Não foi possível carregar o fluxo. Tente recarregar a página.
      </div>
    );
  }

  const displayNodes: Node<FlowNodeData>[] = nodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      onDelete: n.data.nodeType === 'TRIGGER' ? undefined : () => handleDeleteNode(n.id),
    },
  }));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => handleAddNode('AI_MESSAGE')}
          className={`rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-mist ${PRESS_SM}`}
        >
          + Mensagem de IA
        </button>
        <button
          type="button"
          onClick={() => handleAddNode('CONDITION')}
          className={`rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-mist ${PRESS_SM}`}
        >
          + Condição
        </button>
        <button
          type="button"
          onClick={() => handleAddNode('TEXT')}
          className={`rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-mist ${PRESS_SM}`}
        >
          + Texto
        </button>
        <button
          type="button"
          onClick={() => handleAddNode('WAIT_REPLY')}
          className={`rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-mist ${PRESS_SM}`}
        >
          + Resposta do cliente
        </button>
        <button
          type="button"
          onClick={() => handleAddNode('END')}
          className={`rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-mist ${PRESS_SM}`}
        >
          + Fim
        </button>
        <button
          type="button"
          onClick={handleAutoLayout}
          title="Reorganiza automaticamente a posição de todos os passos"
          className={`rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-mist ${PRESS_SM}`}
        >
          Auto-organizar
        </button>
        <button
          type="button"
          onClick={() => setConfirmingNewFlow(true)}
          className={`rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-mist ${PRESS_SM}`}
        >
          Criar novo fluxo
        </button>
        <button
          type="button"
          onClick={() => setConfirmingClear(true)}
          className={`rounded-full border border-stage-lost/30 bg-paper px-3 py-1.5 text-xs font-medium text-stage-lost hover:bg-stage-lost/5 ${PRESS_SM}`}
        >
          Limpar
        </button>
        <div className="ml-auto flex items-center gap-3">
          {updateFlow.isError && <span className="text-xs text-stage-lost">Não foi possível salvar.</span>}
          {!isDirty && !updateFlow.isPending && <span className="text-xs text-ink/40">Tudo salvo</span>}
          <button
            type="button"
            disabled={!isDirty || updateFlow.isPending}
            onClick={handleSave}
            className={`rounded-full bg-signal px-4 py-1.5 text-xs font-semibold text-ink disabled:opacity-40 ${PRESS_SM}`}
          >
            {updateFlow.isPending ? 'Salvando…' : 'Salvar fluxo'}
          </button>
        </div>
      </div>

      {notice && <p className="mt-2 text-xs text-signal">{notice}</p>}
      {confirmingNewFlow && (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-line bg-mist/40 px-3 py-2">
          <p className="text-xs text-ink/70">
            Isso substitui o fluxo atual por um novo, em branco. Uma cópia do fluxo atual é salva em Versões antes.
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setConfirmingNewFlow(false)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium text-ink/60 hover:bg-mist ${PRESS_SM}`}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saveVersion.isPending || updateFlow.isPending}
              onClick={handleNewFlow}
              className={`rounded-full bg-signal px-3 py-1.5 text-xs font-semibold text-ink disabled:opacity-40 ${PRESS_SM}`}
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
      {confirmingClear && (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-stage-lost/30 bg-stage-lost/5 px-3 py-2">
          <p className="text-xs text-ink/70">
            Isso apaga todos os passos do fluxo atual, deixando só o início. Uma cópia do fluxo atual é salva em
            Versões antes.
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setConfirmingClear(false)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium text-ink/60 hover:bg-mist ${PRESS_SM}`}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saveVersion.isPending || updateFlow.isPending}
              onClick={handleClear}
              className={`rounded-full bg-stage-lost px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40 ${PRESS_SM}`}
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
      {flow.warnings.length > 0 && (
        <div className="mt-2 space-y-1 rounded-lg bg-signal/10 px-3 py-2">
          {flow.warnings.map((w) => (
            <p key={w} className="text-xs text-signal">
              {w}
            </p>
          ))}
        </div>
      )}

      <div className="mt-3 flex h-[640px] items-stretch gap-2">
        <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl border border-line bg-mist/40">
          <FlowVariablesPanel />
          <ReactFlow
            nodes={displayNodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            edgeTypes={EDGE_TYPES}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            connectionMode={ConnectionMode.Loose}
            onNodeDoubleClick={onNodeDoubleClick}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onInit={(instance) => {
              reactFlowInstance.current = instance;
            }}
            deleteKeyCode={['Backspace', 'Delete']}
            panOnScroll
            zoomOnScroll={false}
            zoomOnPinch
            fitView
            fitViewOptions={{ padding: 0.3 }}
            // Default minZoom (0.5) can't shrink far enough to fit a long, mostly single-column
            // chain of steps (e.g. a step-by-step data collection flow with little branching) into
            // the canvas height — fitView silently stops at 0.5x and most of the flow ends up
            // off-screen, which reads as "nodes are really far apart" even though row spacing itself
            // never changed. Lowering the floor lets fitView (and manual zoom-out) actually reach
            // whatever scale a tall flow needs.
            minZoom={0.1}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#e4e4e9" gap={20} />
            <Controls showInteractive={false} position="bottom-right" />
          </ReactFlow>
        </div>
        <FlowJsPanel value={jsText} onApply={handleApplyFlowJs} />
        <FlowVersionsPanel
          versions={versions}
          isLoading={versionsLoading}
          isSaving={saveVersion.isPending}
          isRestoring={restoreVersion.isPending}
          isDeleting={deleteVersion.isPending}
          onSave={(label) => saveVersion.mutate(label || undefined)}
          onRestore={(versionId) =>
            restoreVersion.mutate(versionId, {
              // The AiFlow row keeps the same `id` across a restore (it's a 1-per-user row, never
              // recreated) — the load-effect's `flow.id === seededFlowId` guard would otherwise
              // treat this as "already seeded" and silently leave the canvas showing the stale
              // pre-restore graph, same reasoning as handleNewFlow/handleClear above.
              onSuccess: (nextFlow) => {
                applyFlowToCanvas(nextFlow);
                showNotice('Versão restaurada.');
              },
            })
          }
          onDelete={(versionId) =>
            deleteVersion.mutate(versionId, {
              onSuccess: () => showNotice('Versão excluída.'),
            })
          }
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {LEGEND.map((item) => (
          <span key={item.type} className="flex items-center gap-1.5 text-xs text-ink/50">
            <span className={`h-2 w-2 rounded-full ${item.dot}`} />
            {item.label}
          </span>
        ))}
      </div>

      <NodeConfigModal
        node={editingNode}
        outgoingEdgeLabels={
          editingNode
            ? edges
                .filter((e) => e.source === editingNode.id && (e.data as EdgeData | undefined)?.routeLabel)
                .map((e) => (e.data as EdgeData).routeLabel as string)
            : []
        }
        onClose={() => setEditingNode(null)}
        onSave={handleNodeSave}
      />
      <EdgeConfigModal edge={editingEdge} onClose={() => setEditingEdge(null)} onSave={handleEdgeSave} />
    </div>
  );
}
