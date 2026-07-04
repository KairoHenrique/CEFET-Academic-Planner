"use client";

import { Icon, type IconName } from "@/components/ui/Icon";

export type EnrollmentStatusTone =
  | "danger"
  | "muted"
  | "success"
  | "gold"
  | "info"
  | "purple";

interface EnrollmentCourseStatusPillProps {
  icon: IconName;
  label: string;
  tone: EnrollmentStatusTone;
}

export function EnrollmentCourseStatusPill({
  icon,
  label,
  tone,
}: EnrollmentCourseStatusPillProps) {
  return (
    <span className={`enrollment-status-pill enrollment-status-pill--${tone}`}>
      <Icon name={icon} size={12} aria-hidden />
      <span>{label}</span>
    </span>
  );
}
