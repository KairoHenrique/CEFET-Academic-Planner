import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { CourseMapNode, CourseMapStatus } from "@/lib/types/mapa-api";

function nodeIcon(status: CourseMapStatus): "lock" | "unlock" | "check" {
  if (status === "locked") return "lock";
  if (status === "unlocked") return "unlock";
  return "check";
}

interface CourseMapNodeCardProps {
  node: CourseMapNode;
  statusLabel: string;
}

export function CourseMapNodeCard({
  node,
  statusLabel,
}: CourseMapNodeCardProps) {
  const content = (
    <>
      <Icon name={nodeIcon(node.status)} size={14} aria-hidden />
      <div>
        <p className="course-node-code">{node.code}</p>
        <p className="course-node-name">{node.name}</p>
        {node.status !== "locked" && (
          <p className="course-node-ch">{node.ch}h</p>
        )}
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
