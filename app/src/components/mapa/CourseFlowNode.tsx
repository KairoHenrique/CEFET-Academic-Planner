"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { disciplinaDetailPath } from "@/lib/disciplinas/disciplina-path";
import type { MapaGrafoNodeData } from "@/lib/types/mapa-grafo-api";
import type { NodeEmphasis } from "@/lib/mapa/course-map-flow-transforms";

export type CourseFlowNodeType = Node<MapaGrafoNodeData, "course">;

function nodeIcon(status: MapaGrafoNodeData["status"]): "lock" | "unlock" | "check" {
  if (status === "locked") return "lock";
  if (status === "unlocked") return "unlock";
  return "check";
}

function metaLabel(data: MapaGrafoNodeData): string {
  if (data.status === "locked" && data.blockedBy === "ch" && data.chRemaining) {
    return `Faltam ${data.chRemaining}h`;
  }
  return `${data.ch}h · P${data.period}`;
}

function NodeBody({ data }: { data: MapaGrafoNodeData }) {
  return (
    <>
      <span className="cmap-node__icon" aria-hidden>
        <Icon name={nodeIcon(data.status)} size={13} />
      </span>
      <span className="cmap-node__body">
        <span className="cmap-node__top">
          <span className="cmap-node__code">{data.shortLabel}</span>
          <span className="cmap-node__dot" aria-hidden />
        </span>
        <span className="cmap-node__name">{data.name}</span>
        <span className="cmap-node__meta">{metaLabel(data)}</span>
      </span>
    </>
  );
}

function CourseFlowNodeComponent({ data }: NodeProps<CourseFlowNodeType>) {
  const emphasis = data.emphasis as NodeEmphasis | undefined;
  const className = ["cmap-node", `cmap-node--${data.status}`, emphasis && `is-${emphasis}`]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} aria-label={`${data.name} — ${data.status}`}>
      <span className="cmap-node__accent" aria-hidden />
      <Handle type="target" position={Position.Left} className="cmap-node__handle" />
      {data.status === "locked" ? (
        <span className="cmap-node__inner">
          <NodeBody data={data} />
        </span>
      ) : (
        <Link
          href={disciplinaDetailPath(data.code)}
          className="cmap-node__inner cmap-node__link"
          onClick={(event) => event.stopPropagation()}
        >
          <NodeBody data={data} />
        </Link>
      )}
      <Handle type="source" position={Position.Right} className="cmap-node__handle" />
    </div>
  );
}

export const CourseFlowNode = memo(CourseFlowNodeComponent);
