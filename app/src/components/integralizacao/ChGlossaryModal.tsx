"use client";

import { Modal } from "@/components/ui/Modal";
import { ChGlossaryContent } from "@/components/integralizacao/ChGlossaryContent";
import { DEFAULT_CURSO_ID } from "@/lib/db/backend/config";
import { resolveGlossaryCursoBadge } from "@/lib/integralizacao/ch-glossary";
import { getSession } from "@/lib/auth/session";

interface ChGlossaryModalProps {
  open: boolean;
  onClose: () => void;
  cursoId?: string;
}

export function ChGlossaryModal({
  open,
  onClose,
  cursoId,
}: ChGlossaryModalProps) {
  const resolvedCursoId =
    cursoId ?? getSession()?.cursoId ?? DEFAULT_CURSO_ID;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Entenda suas horas"
      headerAside={
        <span className="ch-glossary-modal-badge">
          {resolveGlossaryCursoBadge(resolvedCursoId)}
        </span>
      }
    >
      <ChGlossaryContent cursoId={resolvedCursoId} />
    </Modal>
  );
}
