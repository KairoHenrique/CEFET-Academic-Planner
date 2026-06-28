"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ChGlossaryModal } from "@/components/integralizacao/ChGlossaryModal";

interface ChGlossaryHelpButtonProps {
  callout?: string;
}

export function ChGlossaryHelpButton({
  callout = "Clique para entender cada tipo de carga horária",
}: ChGlossaryHelpButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="ch-glossary-help">
        <p className="recovery-entry-callout ch-glossary-help-callout" role="tooltip">
          {callout}
        </p>
        <button
          type="button"
          className="ch-glossary-help-trigger"
          aria-label="Entenda suas horas. Abrir glossário de carga horária."
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <Icon name="help-circle" size={16} aria-hidden="true" />
        </button>
      </div>

      <ChGlossaryModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
