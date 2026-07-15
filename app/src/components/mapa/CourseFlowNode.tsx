"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Icon } from "@/components/ui/Icon";
import { disciplinaDetailPath } from "@/lib/disciplinas/disciplina-path";
import type { MapaGrafoNodeData } from "@/lib/types/mapa-grafo-api";
import Link from "next/link";

export type CourseFlowNodeType = Node<MapaGrafoNodeData, "course">;

function nodeIcon(
  status: MapaGrafoNodeData["status"]
): "lock" | "unlock" | "check" {
  if (status === "locked") return "lock";
  if (status === "unlocked") return "unlock";
  return "check";
}

function CourseFlowNodeComponent({ data }: NodeProps<CourseFlowNodeType>) {
  const className = ["course-flow-node", "course-node", data.status]
    .filter(Boolean)
    .join(" ");

  const body = (
    <>
      <Icon name={nodeIcon(data.status)} size={14} aria-hidden />
      <div>
        <p className="course-node-code">{data.shortLabel}</p>
        <p className="course-node-name">{data.name}</p>
        {data.status !== "locked" && (
          <p className="course-node-ch">{data.ch}h · P{data.period}</p>
        )}
      </div>
    </>
  );

  return (
    <div className={className} aria-label={`${data.name} — ${data.status}`}>
      <Handle type="target" position={Position.Left} className="course-flow-handle" />
      {data.status === "locked" ? (
        body
      ) : (
        <Link
          href={disciplinaDetailPath(data.code)}
          className="course-flow-node-link"
          onClick={(event) => event.stopPropagation()}
        >
          {body}
        </Link>
      )}
      <Handle
        type="source"
        position={Position.Right}
        className="course-flow-handle"
      />
    </div>
  );
}

export const CourseFlowNode = memo(CourseFlowNodeComponent);
