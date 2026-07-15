import type { MapaGrafoResponse } from "@/lib/types/mapa-grafo-api";
import {
  buildMapa,
  buildMapaFromQueries,
  type MapaQueryDeps,
} from "@/lib/mapa/build-mapa";
import { assembleMapaGrafo } from "@/lib/mapa/mapa-grafo-pure";
import { getRequisitos } from "@/lib/db/queries";

export {
  MAPA_GRAFO_LAYOUT,
  assembleMapaGrafo,
  buildGrafoEdgesFromRequisitos,
  buildNodesFromMapa,
} from "@/lib/mapa/mapa-grafo-pure";

export function buildMapaGrafo(): MapaGrafoResponse {
  return assembleMapaGrafo(buildMapa(), getRequisitos());
}

export async function buildMapaGrafoFromQueries(
  deps: MapaQueryDeps,
  options?: { cursoLabel?: string }
): Promise<MapaGrafoResponse> {
  const mapa = await buildMapaFromQueries(deps, options);
  const requisitos = await deps.getRequisitos();
  return assembleMapaGrafo(mapa, requisitos);
}
