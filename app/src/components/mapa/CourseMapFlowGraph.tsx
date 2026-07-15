"use client";

import { useEffect, useMemo } from "react";
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  CourseFlowNode,
  type CourseFlowNodeType,
} from "@/components/mapa/CourseFlowNode";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { MapaGrafoNodeData, MapaGrafoResponse } from "@/lib/types/mapa-grafo-api";
import type { CourseMapStatus } from "@/lib/types/mapa-api";

const nodeTypes: NodeTypes = {
  course: CourseFlowNode,
};

const STATUS_BADGE: Record<CourseMapStatus, string> = {
  done: "success",
  current: "info",
  unlocked: "gold",
  locked: "danger",
};

const MINIMAP_COLORS: Record<CourseMapStatus, string> = {
  done: "#3d9b6e",
  current: "#4a9fd4",
  unlocked: "#d4a843",
  locked: "#c45c5c",
};

function toFlowNodes(grafo: MapaGrafoResponse): CourseFlowNodeType[] {
  return grafo.nodes.map((node) => ({
    id: node.id,
    type: "course" as const,
    position: node.position,
    data: node.data,
    draggable: false,
    connectable: false,
  }));
}

function toFlowEdges(grafo: MapaGrafoResponse): Edge[] {
  return grafo.edges.map((edge) => {
    const isCo = edge.kind === "co";
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: "smoothstep",
      animated: isCo,
      style: {
        stroke: isCo ? "var(--gold-300, #d4a843)" : "var(--jersey-light, #4a9fd4)",
        strokeWidth: isCo ? 1.5 : 2,
        strokeDasharray: edge.strokeStyle === "dashed" ? "6 4" : undefined,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: isCo ? "#d4a843" : "#4a9fd4",
      },
      ariaLabel:
        edge.kind === "pre"
          ? `Pré-requisito ${edge.source} → ${edge.target}`
          : `Co-requisito ${edge.source} ↔ ${edge.target}`,
    };
  });
}

function FitViewOnData({ nodeCount }: { nodeCount: number }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (nodeCount === 0) return;
    const timer = window.setTimeout(() => {
      void fitView({ padding: 0.18, duration: 280 });
    }, 40);
    return () => window.clearTimeout(timer);
  }, [fitView, nodeCount]);

  return null;
}

interface CourseMapFlowGraphInnerProps {
  grafo: MapaGrafoResponse;
}

function CourseMapFlowGraphInner({ grafo }: CourseMapFlowGraphInnerProps) {
  const initialNodes = useMemo(() => toFlowNodes(grafo), [grafo]);
  const initialEdges = useMemo(() => toFlowEdges(grafo), [grafo]);
  const [nodes, setNodes, onNodesChange] = useNodesState<CourseFlowNodeType>(
    initialNodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialEdges, initialNodes, setEdges, setNodes]);

  const statusOrder = Object.keys(grafo.statusLabels) as CourseMapStatus[];

  return (
    <div className="card course-map-flow-card" data-tutorial-id="tutorial-mapa-grafo">
      <SectionHeader title="Grafo de Pré-requisitos" icon="map" />

      <div
        className="course-map-legend"
        role="list"
        aria-label="Legenda de status e arestas"
      >
        {statusOrder.map((status) => (
          <span key={status} className="course-legend-item" role="listitem">
            <span className={`badge ${STATUS_BADGE[status]}`}>
              {grafo.statusLabels[status]}
            </span>
          </span>
        ))}
        <span className="course-legend-item" role="listitem">
          <span className="course-flow-edge-legend solid">Pré-requisito</span>
        </span>
        <span className="course-legend-item" role="listitem">
          <span className="course-flow-edge-legend dashed">Co-requisito</span>
        </span>
      </div>

      <div className="course-map-flow-canvas" role="application" aria-label="Grafo interativo do PPC">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          minZoom={0.25}
          maxZoom={1.6}
          proOptions={{ hideAttribution: true }}
        >
          <FitViewOnData nodeCount={nodes.length} />
          <Background gap={20} size={1} color="rgba(255,255,255,0.06)" />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            nodeColor={(node) => {
              const status = (
                node.data as MapaGrafoNodeData | undefined
              )?.status;
              return status ? MINIMAP_COLORS[status] : "#8899aa";
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}

interface CourseMapFlowGraphProps {
  grafo: MapaGrafoResponse;
}

export function CourseMapFlowGraph({ grafo }: CourseMapFlowGraphProps) {
  return (
    <ReactFlowProvider>
      <CourseMapFlowGraphInner grafo={grafo} />
    </ReactFlowProvider>
  );
}
