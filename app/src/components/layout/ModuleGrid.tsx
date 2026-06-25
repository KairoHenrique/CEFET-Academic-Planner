"use client";

import { useState } from "react";
import { ModuleShell, ModuleLayoutBar } from "@/components/layout/ModuleLayout";
import type { ModuleDefinition } from "@/hooks/useModuleLayout";

interface ModuleLayoutState {
  hydrated: boolean;
  editMode: boolean;
  setEditMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  order: string[];
  hidden: string[];
  moveModule: (id: string, direction: -1 | 1) => void;
  reorderModule: (sourceId: string, targetId: string) => void;
  toggleModule: (id: string) => void;
  resetLayout: () => void;
}

interface ModuleGridProps {
  layout: ModuleLayoutState;
  modules: ModuleDefinition[];
  renderModule: (id: string) => React.ReactNode;
  showLayoutBar?: boolean;
  beforeModules?: React.ReactNode;
}

export function ModuleGrid({
  layout,
  modules,
  renderModule,
  showLayoutBar = true,
  beforeModules,
}: ModuleGridProps) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const finishDrag = () => {
    setDragId(null);
    setDropTargetId(null);
  };

  const handleDrop = (targetId: string) => {
    if (dragId && dragId !== targetId) {
      layout.reorderModule(dragId, targetId);
    }
    finishDrag();
  };

  return (
    <>
      {showLayoutBar && (
        <ModuleLayoutBar
          editMode={layout.editMode}
          onToggleEdit={() => layout.setEditMode((v) => !v)}
          onReset={layout.resetLayout}
        />
      )}

      {beforeModules}

      {layout.order.map((moduleId) => {
        const module = modules.find((m) => m.id === moduleId);
        if (!module) return null;

        const hidden = layout.hidden.includes(module.id);
        if (hidden && !layout.editMode) return null;

        const isDragging = dragId === module.id;
        const isDropTarget = dropTargetId === module.id && dragId !== module.id;

        return (
          <div
            key={module.id}
            className={`${module.colClass} module-slot ${
              isDragging ? "module-dragging" : ""
            } ${isDropTarget ? "module-drop-target" : ""}`}
            draggable={layout.editMode && !hidden}
            onDragStart={(e) => {
              setDragId(module.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragEnd={finishDrag}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragId && dragId !== module.id) {
                setDropTargetId(module.id);
              }
            }}
            onDragLeave={() => {
              if (dropTargetId === module.id) setDropTargetId(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(module.id);
            }}
          >
            <ModuleShell
              label={module.label}
              editMode={layout.editMode}
              hidden={hidden}
              draggable={layout.editMode && !hidden}
              onMoveUp={() => layout.moveModule(module.id, -1)}
              onMoveDown={() => layout.moveModule(module.id, 1)}
              onToggle={() => layout.toggleModule(module.id)}
            >
              {renderModule(module.id)}
            </ModuleShell>
          </div>
        );
      })}
    </>
  );
}
