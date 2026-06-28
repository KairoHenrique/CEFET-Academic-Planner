import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { CourseMapNode, CourseMapStatus } from "@/lib/types/mapa-api";

function nodeIcon(status: CourseMapStatus): "lock" | "unlock" | "check" {
  if (status === "locked") return "lock";
  if (status === "unlocked") return "unlock";
  return "check";
}

function lockHint(node: CourseMapNode): string | null {
  if (node.status !== "locked") return null;
  if (node.blockedBy === "ch" && node.chRemaining != null && node.chRemaining > 0) {
    return `PFC/estágio: faltam ~${Math.ceil(node.chRemaining)}h obrigatórias`;
  }
  if (node.blockedBy === "prereq") {
    return "Pré-requisitos pendentes";
  }
  return null;
}

interface CourseMapNodeCardProps {
  node: CourseMapNode;
  statusLabel: string;
}

export function CourseMapNodeCard({
  node,
  statusLabel,
}: CourseMapNodeCardProps) {
  const hint = lockHint(node);

  const content = (
    <>
      <Icon name={nodeIcon(node.status)} size={14} aria-hidden />
      <div>
        <p className="course-node-code">{node.code}</p>
        <p className="course-node-name">{node.name}</p>
        {node.status !== "locked" && (
          <p className="course-node-ch">{node.ch}h</p>
        )}
        {hint && <p className="course-node-lock-hint">{hint}</p>}
      </div>
    </>
  );

  const className = ["course-node", node.status].filter(Boolean).join(" ");

  if (node.status === "locked") {
    return (
      <div
        className={className}
        aria-label={`${node.name} — trancada`}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/disciplinas/${encodeURIComponent(node.code)}`}
      className={className}
      aria-label={`${node.name} — ${statusLabel}`}
    >
      {content}
    </Link>
  );
}
