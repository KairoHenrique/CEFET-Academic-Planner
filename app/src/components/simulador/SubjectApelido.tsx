"use client";

interface SubjectApelidoProps {
  label: string;
  className?: string;
}

/** Apelido curto (AEDI, LAOCI) — estilo mapa, sem código PPC. */
export function SubjectApelido({ label, className }: SubjectApelidoProps) {
  return (
    <span className={["course-node-code", className].filter(Boolean).join(" ")}>
      {label}
    </span>
  );
}
