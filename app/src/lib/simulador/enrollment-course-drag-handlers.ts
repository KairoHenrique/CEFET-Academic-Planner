import {
  readEnrollmentDragTurmaId,
  setEnrollmentDragData,
} from "@/lib/simulador/enrollment-drag-drop";

export function bindEnrollmentCourseDragHandlers(input: {
  turmaSigaaId: string;
  draggable: boolean;
  onDragStart?: (turmaSigaaId: string) => void;
  onDragEnd?: () => void;
}): {
  draggable: boolean;
  onDragStart: (event: React.DragEvent<HTMLElement>) => void;
  onDragEnd: (event: React.DragEvent<HTMLElement>) => void;
} {
  return {
    draggable: input.draggable,
    onDragStart: (event) => {
      if (!input.draggable) {
        event.preventDefault();
        return;
      }

      setEnrollmentDragData(event.dataTransfer, input.turmaSigaaId);
      event.dataTransfer.dropEffect = "copy";
      event.currentTarget.classList.add("enrollment-course--dragging");
      input.onDragStart?.(input.turmaSigaaId);
    },
    onDragEnd: (event) => {
      event.currentTarget.classList.remove("enrollment-course--dragging");
      input.onDragEnd?.();
    },
  };
}

export { readEnrollmentDragTurmaId };
