export const ENROLLMENT_DRAG_MIME = "application/x-planner-enrollment-turma";

export function setEnrollmentDragData(
  dataTransfer: DataTransfer,
  turmaSigaaId: string
): void {
  dataTransfer.setData(ENROLLMENT_DRAG_MIME, turmaSigaaId);
  dataTransfer.setData("text/plain", turmaSigaaId);
  dataTransfer.effectAllowed = "copy";
}

export function readEnrollmentDragTurmaId(
  dataTransfer: DataTransfer
): string | null {
  const id =
    dataTransfer.getData(ENROLLMENT_DRAG_MIME) ||
    dataTransfer.getData("text/plain");
  const trimmed = id.trim();
  return trimmed || null;
}

export function isEnrollmentDragEvent(event: React.DragEvent): boolean {
  return (
    event.dataTransfer.types.includes(ENROLLMENT_DRAG_MIME) ||
    event.dataTransfer.types.includes("text/plain")
  );
}
