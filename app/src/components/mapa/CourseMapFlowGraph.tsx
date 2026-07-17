"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type NodeMouseHandler,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CourseFlowNode } from "@/components/mapa/CourseFlowNode";
import { PeriodLabelNode } from "@/components/mapa/PeriodLabelNode";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  ExpandableStage,
  ExpandToggleButton,
} from "@/components/ui/ExpandableStage";
import {
  applyEdgeFocus,
  applyNodeFocus,
  buildCourseNodes,
  buildFlowEdges,
  buildPeriodLabelNodes,
  buildRelatedNodeIds,
} from "@/lib/mapa/course-map-flow-transforms";
import type { MapaGrafoNodeData, MapaGrafoResponse } from "@/lib/types/mapa-grafo-api";
import type { CourseMapStatus } from "@/lib/types/mapa-api";

const nodeTypes: NodeTypes = {
  course: CourseFlowNode,
  periodLabel: PeriodLabelNode,
};

const MINIMAP_COLORS: Record<CourseMapStatus, string> = {
  done: "#3fb950",
  current: "#4a9fd4",
  unlocked: "#e8c66a",
  locked: "#c45c5c",
};

function FitViewOnData({ nodeCount }: { nodeCount: number }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    if (nodeCount === 0) return;
    const timer = window.setTimeout(() => {
      void fitView({ padding: 0.16, duration: 320 });
    }, 40);
    return () => window.clearTimeout(timer);
  }, [fitView, nodeCount]);
  return null;
}

function CourseMapFlowGraphInner({ grafo }: { grafo: MapaGrafoResponse }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const { fitView } = useReactFlow();

  // Ao alternar inline <-> popup o container muda de tamanho: reajusta o
  // enquadramento para o grafo preencher o novo espaço sem cortar nós.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fitView({ padding: 0.16, duration: 320 });
    }, 90);
    return () => window.clearTimeout(timer);
  }, [expanded, fitView]);

  const baseNodes = useMemo(
    () => [...buildPeriodLabelNodes(grafo), ...buildCourseNodes(grafo)],
    [grafo]
  );
  const baseEdges = useMemo(() => buildFlowEdges(grafo), [grafo]);

  const nodes = useMemo(() => {
    const related = activeId ? buildRelatedNodeIds(baseEdges, activeId) : null;
    return applyNodeFocus(baseNodes, activeId, related);
  }, [baseNodes, baseEdges, activeId]);

  const edges = useMemo(() => applyEdgeFocus(baseEdges, activeId), [baseEdges, activeId]);

  // Debounce só do "limpar foco": ao cruzar o vão entre nós, o mouseleave não
  // reseta a malha inteira (evita o strobe). Se um novo nó receber o mouse
  // dentro da janela, o reset é cancelado e o foco transita suave A→B.
  const clearTimerRef = useRef<number | null>(null);

  const cancelClear = useCallback(() => {
    if (clearTimerRef.current !== null) {
      window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
  }, []);

  const handleEnter = useCallback<NodeMouseHandler>(
    (_, node) => {
      if (node.type !== "course") return;
      cancelClear();
      setActiveId(node.id);
    },
    [cancelClear]
  );

  const scheduleClear = useCallback(() => {
    cancelClear();
    clearTimerRef.current = window.setTimeout(() => {
      setActiveId(null);
      clearTimerRef.current = null;
    }, 160);
  }, [cancelClear]);

  const handleLeave = useCallback(() => scheduleClear(), [scheduleClear]);
  const handlePane = useCallback(() => {
    cancelClear();
    setActiveId(null);
  }, [cancelClear]);

  useEffect(() => () => cancelClear(), [cancelClear]);

  const statusOrder = Object.keys(grafo.statusLabels) as CourseMapStatus[];

  return (
    <ExpandableStage
      expanded={expanded}
      onCollapse={() => setExpanded(false)}
      title="Grafo de Pré-requisitos"
    >
    <div
      className="card course-map-flow-card"
      data-tutorial-id="tutorial-mapa-grafo"
      data-expanded={expanded || undefined}
    >
      <div className="expandable-head">
        <SectionHeader title="Grafo de Pré-requisitos" icon="map" />
        <ExpandToggleButton
          expanded={expanded}
          onToggle={() => setExpanded((value) => !value)}
          label="grafo"
        />
      </div>

      <div className="cmap-legend" role="list" aria-label="Legenda do grafo">
        {statusOrder.map((status) => (
          <span key={status} className="cmap-legend__item" role="listitem">
            <span className={`cmap-legend__dot cmap-legend__dot--${status}`} aria-hidden />
            {grafo.statusLabels[status]}
          </span>
        ))}
        <span className="cmap-legend__sep" aria-hidden />
        <span className="cmap-legend__item" role="listitem">
          <span className="cmap-legend__line" aria-hidden />
          Pré-requisito
        </span>
        <span className="cmap-legend__item" role="listitem">
          <span className="cmap-legend__line cmap-legend__line--dashed" aria-hidden />
          Co-requisito
        </span>
      </div>

      <p className="cmap-hint" role="note">
        Passe o mouse sobre uma disciplina para ver <strong>pré-requisitos</strong> e o que ela{" "}
        <strong>desbloqueia</strong>.
      </p>

      <div
        className="course-map-flow-canvas"
        role="application"
        aria-label="Grafo interativo do PPC"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          onNodeMouseEnter={handleEnter}
          onNodeMouseLeave={handleLeave}
          onPaneClick={handlePane}
          minZoom={0.2}
          maxZoom={1.75}
          proOptions={{ hideAttribution: true }}
        >
          <FitViewOnData nodeCount={nodes.length} />
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.4} color="rgba(232,198,106,0.10)" />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            maskColor="rgba(0, 16, 32, 0.72)"
            nodeColor={(node: Node) => {
              if (node.type === "periodLabel") return "transparent";
              const status = (node.data as MapaGrafoNodeData | undefined)?.status;
              return status ? MINIMAP_COLORS[status] : "#8899aa";
            }}
          />
        </ReactFlow>
      </div>
    </div>
    </ExpandableStage>
  );
}

export function CourseMapFlowGraph({ grafo }: { grafo: MapaGrafoResponse }) {
  return (
    <ReactFlowProvider>
      <CourseMapFlowGraphInner grafo={grafo} />
    </ReactFlowProvider>
  );
}
