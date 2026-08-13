import { useRef } from 'react';
import type { Edge, Node } from '@xyflow/react';
import type { FlowNodeData } from './FlowNodes';

interface GraphSnapshot {
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
}

const MAX_HISTORY = 50;

/**
 * Undo/redo for the flow canvas, kept in refs (not state) since a push should never trigger a
 * render on its own — only `undo`/`redo` actually change what's on screen, via the caller's own
 * `setNodes`/`setEdges`. React Flow's `applyNodesChange`/`applyEdgesChange` always return new
 * arrays rather than mutating in place, so holding a snapshot's array reference is enough to keep
 * it safe from later edits — no deep clone needed.
 */
export function useGraphHistory() {
  const undoStack = useRef<GraphSnapshot[]>([]);
  const redoStack = useRef<GraphSnapshot[]>([]);

  function push(nodes: Node<FlowNodeData>[], edges: Edge[]) {
    undoStack.current.push({ nodes, edges });
    if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift();
    // Any new edit invalidates whatever could have been redone from before it.
    redoStack.current = [];
  }

  function undo(current: GraphSnapshot): GraphSnapshot | null {
    const previous = undoStack.current.pop();
    if (!previous) return null;
    redoStack.current.push(current);
    return previous;
  }

  function redo(current: GraphSnapshot): GraphSnapshot | null {
    const next = redoStack.current.pop();
    if (!next) return null;
    undoStack.current.push(current);
    return next;
  }

  function clear() {
    undoStack.current = [];
    redoStack.current = [];
  }

  return { push, undo, redo, clear };
}
