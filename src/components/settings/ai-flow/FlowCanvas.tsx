import { Background, Controls, ReactFlow, type Edge, type Node, type NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useMemo } from 'react';
import { useAiFlow } from '../../../hooks/useAiFlow';
import type { AiFlowNodeType } from '../../../types';
import { autoLayoutPositions } from './flowAutoLayout';
import { AiMessageNode, ConditionNode, EndNode, TriggerNode, type FlowNodeData } from './FlowNodes';

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

/**
 * Read-only preview of the account's conversation flow graph (Fase 2 — editing/dragging/adding
 * nodes lands in Fase 3). Nothing here is draggable/connectable/selectable on purpose: this is a
 * visualization, not yet the editor the plan describes.
 */
export function FlowCanvas() {
  const { data: flow, isLoading, isError } = useAiFlow();

  const { nodes, edges } = useMemo(() => {
    if (!flow) return { nodes: [] as Node[], edges: [] as Edge[] };
    const positions = autoLayoutPositions(flow.nodes, flow.edges);

    const nodes: Node[] = flow.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: positions[n.id] ?? { x: 0, y: 0 },
      data: { label: n.label, nodeType: n.type } satisfies FlowNodeData,
      draggable: false,
      connectable: false,
      selectable: false,
    }));

    const edges: Edge[] = flow.edges.map((e) => ({
      id: e.id,
      source: e.sourceId,
      target: e.targetId,
      label: e.routeLabel ?? (e.isFallback ? 'padrão' : undefined),
      style: e.isFallback ? { strokeDasharray: '4 4' } : undefined,
      labelStyle: { fill: '#14161f', fontSize: 11 },
      labelBgStyle: { fill: '#ffffff' },
      selectable: false,
    }));

    return { nodes, edges };
  }, [flow]);

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

  return (
    <div>
      <div className="h-[420px] overflow-hidden rounded-xl border border-line bg-mist/40">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
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
    </div>
  );
}
