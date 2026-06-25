"use client";

import { Icon } from "@/components/ui/Icon";

interface ModuleShellProps {
  label: string;
  editMode: boolean;
  hidden: boolean;
  draggable?: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggle: () => void;
  children: React.ReactNode;
}

export function ModuleShell({
  label,
  editMode,
  hidden,
  draggable = false,
  onMoveUp,
  onMoveDown,
  onToggle,
  children,
}: ModuleShellProps) {
  if (hidden && !editMode) return null;

  return (
    <div className={`module-shell ${hidden ? "module-hidden" : ""}`}>
      {editMode && (
        <div className="module-toolbar">
          <span className="module-toolbar-label">
            {draggable && <Icon name="grip" size={14} />}
            {label}
          </span>
          <div className="module-toolbar-actions">
            <button
              type="button"
              className="module-btn"
              onClick={onMoveUp}
              aria-label={`Mover ${label} para cima`}
            >
              <Icon name="chevron-up" size={14} />
            </button>
            <button
              type="button"
              className="module-btn"
              onClick={onMoveDown}
              aria-label={`Mover ${label} para baixo`}
            >
              <Icon name="chevron-down" size={14} />
            </button>
            <button
              type="button"
              className="module-btn"
              onClick={onToggle}
              aria-label={hidden ? `Mostrar ${label}` : `Ocultar ${label}`}
            >
              <Icon name={hidden ? "unlock" : "close"} size={14} />
            </button>
          </div>
        </div>
      )}
      {!hidden && children}
    </div>
  );
}

interface ModuleLayoutBarProps {
  editMode: boolean;
  onToggleEdit: () => void;
  onReset: () => void;
}

export function ModuleLayoutBar({
  editMode,
  onToggleEdit,
  onReset,
}: ModuleLayoutBarProps) {
  return (
    <div className="module-layout-bar col-12">
      <button
        type="button"
        className={`btn-outline ${editMode ? "active" : ""}`}
        onClick={onToggleEdit}
      >
        <Icon name="dashboard" size={14} />
        {editMode ? "Concluir personalização" : "Personalizar módulos"}
      </button>
      {editMode && (
        <>
          <span className="module-layout-hint">
            Arraste os módulos para reorganizar
          </span>
          <button type="button" className="btn-outline" onClick={onReset}>
            Restaurar padrão
          </button>
        </>
      )}
    </div>
  );
}
