"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

interface DashboardStateCardProps {
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  onRetry?: () => void;
  variant?: "empty" | "error";
}

export function DashboardStateCard({
  title,
  message,
  actionLabel,
  actionHref,
  onRetry,
  variant = "empty",
}: DashboardStateCardProps) {
  return (
    <section
      className={`page-state card col-12 ${variant === "error" ? "page-state-error" : ""}`}
      role={variant === "error" ? "alert" : "status"}
    >
      <span className="page-state-icon" aria-hidden="true">
        <Icon name={variant === "error" ? "close" : "sync"} size={28} />
      </span>
      <h2 className="page-state-title">{title}</h2>
      <p className="page-state-message">{message}</p>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="btn-gold page-state-action">
          {actionLabel}
        </Link>
      )}
      {onRetry && actionLabel && (
        <button type="button" className="btn-gold page-state-action" onClick={onRetry}>
          {actionLabel}
        </button>
      )}
    </section>
  );
}
