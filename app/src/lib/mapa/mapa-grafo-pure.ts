import type { RequisitoRow } from "@/lib/types/db";
import type { MapaResponse } from "@/lib/types/mapa-api";
import type {
  MapaGrafoEdge,
  MapaGrafoLayout,
  MapaGrafoNode,
  MapaGrafoResponse,
} from "@/lib/types/mapa-grafo-api";
import { normalizeDisciplinaCode } from "@/lib/mapa/course-status";

/** Espaçamento padrão para F20 (react-flow) posicionar colunas por período. */
export const MAPA_GRAFO_LAYOUT: MapaGrafoLayout = {
  columnGap: 280,
  rowGap: 110,
  nodeWidth: 200,
};

export function buildNodesFromMapa(mapa: MapaResponse): MapaGrafoNode[] {
  const nodes: MapaGrafoNode[] = [];

  for (const period of mapa.periods) {
    period.subjects.forEach((subject, index) => {
      const id = normalizeDisciplinaCode(subject.code);
      nodes.push({
        id,
        position: {
          x: (period.period - 1) * MAPA_GRAFO_LAYOUT.columnGap,
          y: index * MAPA_GRAFO_LAYOUT.rowGap,
        },
        data: {
          ...subject,
          code: id,
          period: period.period,
        },
      });
    });
  }

  return nodes;
}

/**
 * Aresta aponta do requisito → disciplina dependente (fluxo natural no grafo).
 * strokeStyle: solid = pré, dashed = co (contrato F20).
 */
export function buildGrafoEdgesFromRequisitos(
  requisitos: RequisitoRow[],
  nodeIds: Set<string>
): MapaGrafoEdge[] {
  const edges: MapaGrafoEdge[] = [];
  const seen = new Set<string>();

  for (const row of requisitos) {
    const kind = row.tipo === "co" ? "co" : "pre";
    const source = normalizeDisciplinaCode(row.requisito_id);
    const target = normalizeDisciplinaCode(row.disciplina_id);

    if (!nodeIds.has(source) || !nodeIds.has(target)) {
      continue;
    }
    if (source === target) {
      continue;
    }

    const id = `${kind}:${source}->${target}`;
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);

    edges.push({
      id,
      source,
      target,
      kind,
      strokeStyle: kind === "co" ? "dashed" : "solid",
    });
  }

  edges.sort((a, b) => a.id.localeCompare(b.id, "pt-BR"));
  return edges;
}

export function assembleMapaGrafo(
  mapa: MapaResponse,
  requisitos: RequisitoRow[]
): MapaGrafoResponse {
  const nodes = buildNodesFromMapa(mapa);
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = buildGrafoEdgesFromRequisitos(requisitos, nodeIds);

  return {
    curso: mapa.curso,
    statusLabels: mapa.statusLabels,
    historicoSynced: mapa.historicoSynced,
    layout: MAPA_GRAFO_LAYOUT,
    nodes,
    edges,
  };
}
