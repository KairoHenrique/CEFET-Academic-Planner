"use client";

import { Modal } from "@/components/ui/Modal";
import { ChGlossaryContent } from "@/components/integralizacao/ChGlossaryContent";

interface ChGlossaryModalProps {
  open: boolean;
  onClose: () => void;
}

export function ChGlossaryModal({ open, onClose }: ChGlossaryModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Entenda suas horas"
      headerAside={
        <span className="ch-glossary-modal-badge">CEFET-MG · Eng. Computação</span>
      }
    >
      <ChGlossaryContent />
    </Modal>
  );
}
