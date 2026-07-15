import type { CourseMapNode, CourseMapStatus } from "@/lib/types/mapa-api";

/** Layout sugerido para posicionar nós no react-flow (F20). */
export interface MapaGrafoLayout {
  columnGap: number;
  rowGap: number;
  nodeWidth: number;
}

export type MapaGrafoEdgeKind = "pre" | "co";

export interface MapaGrafoNodeData extends CourseMapNode {
  period: number;
  /** Índice de assinatura exigido pelo @xyflow/react (`Record<string, unknown>`). */
  [key: string]: unknown;
}

export interface MapaGrafoNode {
  id: string;
  position: { x: number; y: number };
  data: MapaGrafoNodeData;
}

export interface MapaGrafoEdge {
  id: string;
  source: string;
  target: string;
  kind: MapaGrafoEdgeKind;
  /** Contrato F20: solid = pré-requisito · dashed = co-requisito. */
  strokeStyle: "solid" | "dashed";
}

export interface MapaGrafoResponse {
  curso: string;
  statusLabels: Record<CourseMapStatus, string>;
  historicoSynced: boolean;
  layout: MapaGrafoLayout;
  nodes: MapaGrafoNode[];
  edges: MapaGrafoEdge[];
}
