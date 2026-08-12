import {
  addEdge,
  Background,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type NodeTypes,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEffect, useRef, useState } from 'react';
import { useAiFlow, useUpdateAiFlow } from '../../../hooks/useAiFlow';
import { PRESS_SM } from '../../../lib/interactions';
import type { AiFlowNodeType } from '../../../types';
import { autoLayoutPositions } from './flowAutoLayout';
import { AiMessageNode, ConditionNode, EndNode, TriggerNode, type FlowNodeData } from './FlowNodes';
import { NodeConfigModal, type EditableNode } from './NodeConfigModal';

const NODE_TYPES: NodeTypes = {
  TRIGGER: TriggerNode,
  AI_MESSAGE: AiMessageNode,
  CONDITION: ConditionNode,
  END: EndNode,
};

const LEGEND: { type: AiFlowNodeType; label: string; dot: string }[] = [
  { type: 'TRIGGER', label: 'Início', dot: 'bg-stage-new' },
  { type: 'AI_MESSAGE', label: 'Mensagem de IA', dot: 'bg-signal' },
  { type: 'CONDITION', label: 'Condição', dot: 'bg-ink/40' },
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

/**
 * Editable canvas for the account's flow graph (Fase 3): drag nodes, add an AI_MESSAGE/END node,
 * remove a node (the "×" button or the delete key — never on TRIGGER, always exactly one), connect
 * two nodes, double-click a node to edit its label/config. Deliberately linear for now — a node
 * can have at most one outgoing connection here; branching (multiple labeled edges, a fallback
 * edge, the condition-rule builder) is Fase 4. Nothing is sent to the server until "Salvar fluxo".
 */
export function FlowCanvas() {
  const { data: flow, isLoading, isError } = useAiFlow();
  const updateFlow = useUpdateAiFlow();

  const [nodes, setNodes, applyNodesChange] = useNodesState<Node<FlowNodeData>>([]);
  const [edges, setEdges, applyEdgesChange] = useEdgesState<Edge>([]);
  const [editingNode, setEditingNode] = useState<EditableNode | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [seededFlowId, setSeededFlowId] = useState<string | null>(null);
  const reactFlowInstance = useRef<ReactFlowInstance<Node<FlowNodeData>, Edge> | null>(null);

  // Seeds local editable state once per fetched flow id — after that, this component owns canvas
  // state until "Salvar fluxo" (or the tab unmounts, which resets everything back to whatever the
  // server has, same as discarding unsaved edits).
  useEffect(() => {
    if (!flow || flow.id === seededFlowId) return;
    const allZero = flow.nodes.every((n) => n.positionX === 0 && n.positionY === 0);
    const positions = allZero
      ? autoLayoutPositions(flow.nodes, flow.edges)
      : Object.fromEntries(flow.nodes.map((n) => [n.id, { x: n.positionX, y: n.positionY }]));

    setNodes(
      flow.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: positions[n.id] ?? { x: 0, y: 0 },
        data: { label: n.label, nodeType: n.type, config: n.config } satisfies FlowNodeData,
      })),
    );
    setEdges(
      flow.edges.map((e) => ({
        id: e.id,
        source: e.sourceId,
        target: e.targetId,
        label: e.routeLabel ?? undefined,
        style: e.isFallback ? { strokeDasharray: '4 4' } : undefined,
        labelStyle: { fill: '#14161f', fontSize: 11 },
        labelBgStyle: { fill: '#ffffff' },
        data: { routeLabel: e.routeLabel, isFallback: e.isFallback } satisfies EdgeData,
      })),
    );
    setSeededFlowId(flow.id);
    setIsDirty(false);
  }, [flow, seededFlowId, setNodes, setEdges]);

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
    applyNodesChange(filtered);
  };

  const onEdgesChange: OnEdgesChange = (changes) => {
    if (changes.some((c) => c.type !== 'select')) setIsDirty(true);
    applyEdgesChange(changes);
  };

  const onConnect: OnConnect = (connection) => {
    if (edges.some((e) => e.source === connection.source)) {
      showNotice('Por enquanto cada passo só pode seguir pra um próximo — ramificações chegam numa próxima etapa.');
      return;
    }
    setEdges((eds) =>
      addEdge({ ...connection, id: makeId(), data: { routeLabel: null, isFallback: false } satisfies EdgeData }, eds),
    );
    setIsDirty(true);
  };

  const onNodeDoubleClick: NodeMouseHandler<Node<FlowNodeData>> = (_event, node) => {
    setEditingNode({ id: node.id, type: node.data.nodeType, label: node.data.label, config: node.data.config });
  };

  function handleNodeSave(nodeId: string, patch: { label: string; config: unknown }) {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, label: patch.label, config: patch.config } } : n)),
    );
    setIsDirty(true);
  }

  function handleDeleteNode(nodeId: string) {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setIsDirty(true);
  }

  function handleAddNode(type: 'AI_MESSAGE' | 'END') {
    const maxX = nodes.reduce((max, n) => Math.max(max, n.position.x), 0);
    const newNode: Node<FlowNodeData> = {
      id: makeId(),
      type,
      position: { x: maxX + 260, y: 0 },
      data: {
        label: type === 'AI_MESSAGE' ? 'Nova mensagem' : 'Novo fim',
        nodeType: type,
        config: {},
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setIsDirty(true);
    // A newly-added node can land outside the last fitView's frame (each addition pushes further
    // right) — re-fit once the new node has actually rendered/measured, or it's invisible until
    // the admin manually pans/zooms to find it.
    requestAnimationFrame(() => reactFlowInstance.current?.fitView({ padding: 0.3, duration: 200 }));
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
          };
        }),
      },
      { onSuccess: () => setIsDirty(false) },
    );
  }

  if (isLoading) {
    return <div className="flex h-[420px] items-center justify-center text-sm text-ink/40">Carregando fluxo…</div>;
  }
  if (isError || !flow) {
    return (
      <div className="flex h-[420px] items-center justify-center text-sm text-stage-lost">
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
          onClick={() => handleAddNode('END')}
          className={`rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-mist ${PRESS_SM}`}
        >
          + Fim
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

      <div className="mt-3 h-[420px] overflow-hidden rounded-xl border border-line bg-mist/40">
        <ReactFlow
          nodes={displayNodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          onInit={(instance) => {
            reactFlowInstance.current = instance;
          }}
          deleteKeyCode={['Backspace', 'Delete']}
          panOnScroll
          zoomOnScroll={false}
          zoomOnPinch
          fitView
          fitViewOptions={{ padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#e4e4e9" gap={20} />
          <Controls showInteractive={false} position="bottom-right" />
        </ReactFlow>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {LEGEND.map((item) => (
          <span key={item.type} className="flex items-center gap-1.5 text-xs text-ink/50">
            <span className={`h-2 w-2 rounded-full ${item.dot}`} />
            {item.label}
          </span>
        ))}
      </div>

      <NodeConfigModal node={editingNode} onClose={() => setEditingNode(null)} onSave={handleNodeSave} />
    </div>
  );
}
