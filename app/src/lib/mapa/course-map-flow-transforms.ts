import { MarkerType, type Edge, type EdgeMarker } from "@xyflow/react";
import type { CourseFlowNodeType } from "@/components/mapa/CourseFlowNode";
import type { PeriodLabelNodeType } from "@/components/mapa/PeriodLabelNode";
import type { MapaGrafoResponse } from "@/lib/types/mapa-grafo-api";

export type FlowNode = CourseFlowNodeType | PeriodLabelNodeType;
export type NodeEmphasis = "focus" | "related" | "dim";
type EdgeRole = "base" | "prereq" | "unlock" | "dim";

const COLOR_PRE = "#4a9fd4";
const COLOR_CO = "#e8c66a";
const COLOR_UNLOCK = "#3fb950";
// Repouso: teia fina e monocromática — o grafo fica calmo, sem competir com os nós.
const COLOR_REST = "rgba(150, 178, 214, 0.26)";
// Ao focar um nó, as arestas não relacionadas quase somem.
const COLOR_DIM = "rgba(150, 170, 195, 0.05)";
const PERIOD_LABEL_OFFSET_Y = 78;

export function buildCourseNodes(grafo: MapaGrafoResponse): CourseFlowNodeType[] {
  return grafo.nodes.map((node) => ({
    id: node.id,
    type: "course" as const,
    position: node.position,
    data: node.data,
    draggable: false,
    connectable: false,
  }));
}

export function buildPeriodLabelNodes(
  grafo: MapaGrafoResponse
): PeriodLabelNodeType[] {
  const byPeriod = new Map<number, number>();
  for (const node of grafo.nodes) {
    const period = node.data.period;
    byPeriod.set(period, (byPeriod.get(period) ?? 0) + 1);
  }

  return Array.from(byPeriod.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([period, count]) => ({
      id: `period-label-${period}`,
      type: "periodLabel" as const,
      position: {
        x: (period - 1) * grafo.layout.columnGap,
        y: -PERIOD_LABEL_OFFSET_Y,
      },
      data: { label: `P${period}`, count },
      draggable: false,
      selectable: false,
      connectable: false,
    }));
}

function marker(color: string): EdgeMarker {
  return { type: MarkerType.ArrowClosed, width: 16, height: 16, color };
}

type EdgeVisual = { style: Edge["style"]; markerColor: string | null };

/**
 * Visual da aresta por papel. Sem `animated` (nada de marching-ants) para não
 * "piscar". Em repouso a seta é omitida — o layout esquerda→direita já indica
 * o sentido — reduzindo o emaranhado visual.
 *
 * Co-requisito: sempre dourado pontilhado (nunca verde). Verde (“desbloqueia”)
 * só em arestas de pré-requisito quando a disciplina ativa é a origem.
 */
function edgeVisual(kind: "pre" | "co", role: EdgeRole): EdgeVisual {
  const strokeDasharray = kind === "co" ? "5 5" : undefined;

  if (role === "dim") {
    return {
      style: { stroke: COLOR_DIM, strokeWidth: 1, strokeDasharray },
      markerColor: null,
    };
  }
  if (role === "base") {
    return {
      style: {
        stroke: kind === "co" ? "rgba(232, 198, 106, 0.38)" : COLOR_REST,
        strokeWidth: 1.4,
        strokeDasharray,
      },
      markerColor: null,
    };
  }
  // prereq (entrada) ou unlock (saída)
  const color =
    kind === "co"
      ? COLOR_CO
      : role === "unlock"
        ? COLOR_UNLOCK
        : COLOR_PRE;
  return {
    style: { stroke: color, strokeWidth: 2.75, strokeDasharray },
    markerColor: color,
  };
}

export function buildFlowEdges(grafo: MapaGrafoResponse): Edge[] {
  return grafo.edges.map((edge) => {
    const visual = edgeVisual(edge.kind, "base");
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: "default",
      data: { kind: edge.kind },
      animated: false,
      style: visual.style,
      markerEnd: visual.markerColor ? marker(visual.markerColor) : undefined,
      ariaLabel:
        edge.kind === "pre"
          ? `Pré-requisito ${edge.source} para ${edge.target}`
          : `Co-requisito ${edge.source} e ${edge.target}`,
    };
  });
}

export function buildRelatedNodeIds(edges: Edge[], activeId: string): Set<string> {
  const related = new Set<string>([activeId]);
  for (const edge of edges) {
    if (edge.source === activeId) related.add(edge.target);
    if (edge.target === activeId) related.add(edge.source);
  }
  return related;
}

export function applyNodeFocus(
  nodes: FlowNode[],
  activeId: string | null,
  related: Set<string> | null
): FlowNode[] {
  return nodes.map((node) => {
    if (node.type === "periodLabel") {
      const dim = activeId ? "dim" : undefined;
      return { ...node, data: { ...node.data, emphasis: dim } };
    }
    let emphasis: NodeEmphasis | undefined;
    if (activeId && related) {
      emphasis = node.id === activeId ? "focus" : related.has(node.id) ? "related" : "dim";
    }
    return { ...node, data: { ...node.data, emphasis } };
  });
}

export function applyEdgeFocus(edges: Edge[], activeId: string | null): Edge[] {
  return edges.map((edge) => {
    const kind = (edge.data?.kind as "pre" | "co") ?? "pre";
    let role: EdgeRole = "base";
    if (activeId) {
      if (edge.target === activeId) role = "prereq";
      else if (edge.source === activeId) role = "unlock";
      else role = "dim";
    }
    const visual = edgeVisual(kind, role);
    const highlighted = role === "prereq" || role === "unlock";
    return {
      ...edge,
      animated: false,
      style: visual.style,
      markerEnd: visual.markerColor && kind !== "co" ? marker(visual.markerColor) : undefined,
      zIndex: highlighted ? 10 : 0,
    };
  });
}
