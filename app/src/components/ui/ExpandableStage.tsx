"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/Icon";

interface ExpandableStageProps {
  expanded: boolean;
  onCollapse: () => void;
  /** Rótulo acessível do popup (ex.: "Grafo de Pré-requisitos"). */
  title: string;
  children: ReactNode;
}

/**
 * Move a MESMA subárvore React entre o fluxo inline e um popup em top-layer
 * (`<dialog>`), sem desmontar — preserva estado (drag/seleção do simulador e o
 * viewport do grafo). O top-layer nativo escapa de ancestrais com `transform`
 * (ex.: `.dashboard-page` com `animate-fade-in`), onde um `position: fixed`
 * comum ficaria preso à página. `createPortal` apenas troca o container do DOM;
 * como o portal permanece na mesma posição da árvore, o React não remonta os
 * filhos.
 */
export function ExpandableStage({
  expanded,
  onCollapse,
  title,
  children,
}: ExpandableStageProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [inlineHost, setInlineHost] = useState<HTMLDivElement | null>(null);
  const [dialogBody, setDialogBody] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (expanded && !dialog.open) dialog.showModal();
    else if (!expanded && dialog.open) dialog.close();
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [expanded]);

  const handleClose = useCallback(() => onCollapse(), [onCollapse]);

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDialogElement>) => {
      if (event.target === dialogRef.current) onCollapse();
    },
    [onCollapse]
  );

  const target = expanded ? dialogBody : inlineHost;

  return (
    <>
      <div ref={setInlineHost} className="expandable-inline" />
      <dialog
        ref={dialogRef}
        className="expandable-dialog"
        aria-label={title}
        onClose={handleClose}
        onCancel={handleClose}
        onClick={handleBackdropClick}
      >
        <div ref={setDialogBody} className="expandable-dialog-body" />
      </dialog>
      {target ? createPortal(children, target) : null}
    </>
  );
}

interface ExpandToggleButtonProps {
  expanded: boolean;
  onToggle: () => void;
  /** Complemento do rótulo acessível (ex.: "grafo", "grade"). */
  label: string;
}

export function ExpandToggleButton({
  expanded,
  onToggle,
  label,
}: ExpandToggleButtonProps) {
  const description = expanded ? `Recolher ${label}` : `Expandir ${label}`;
  return (
    <button
      type="button"
      className="expand-toggle"
      onClick={onToggle}
      aria-pressed={expanded}
      aria-label={description}
      title={description}
    >
      <Icon name={expanded ? "minimize" : "maximize"} size={15} />
      <span className="expand-toggle-text">
        {expanded ? "Recolher" : "Expandir"}
      </span>
    </button>
  );
}
