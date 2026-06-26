interface SubjectRoomCellProps {
  room: string;
}

export function SubjectRoomCell({ room }: SubjectRoomCellProps) {
  const hasRoom = room.trim().length > 0 && room !== "—";

  if (!hasRoom) {
    return <span className="subject-room-cell subject-room-cell--empty">—</span>;
  }

  return (
    <span className="subject-room-cell" title="Sala(s)">
      {room}
    </span>
  );
}
