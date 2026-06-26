interface SubjectScheduleCellProps {
  schedule?: string;
}

export function SubjectScheduleCell({ schedule }: SubjectScheduleCellProps) {
  const hasSchedule = Boolean(schedule?.trim());

  if (!hasSchedule) {
    return (
      <span className="subject-schedule-cell subject-schedule-cell--empty">—</span>
    );
  }

  return <span className="subject-schedule-cell">{schedule}</span>;
}
