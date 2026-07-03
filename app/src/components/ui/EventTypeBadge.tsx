import { eventTypeLabels, type CalendarEventType } from "@/lib/calendar/event-types";
import { EVENT_TYPE_COLORS } from "@/lib/colors/event-type-colors";

interface EventTypeBadgeProps {
  type: CalendarEventType;
  color?: string;
}

export function EventTypeBadge({ type, color }: EventTypeBadgeProps) {
  const accent = color ?? EVENT_TYPE_COLORS[type];

  return (
    <span
      className="event-type-badge"
      style={
        {
          "--event-type-accent": accent,
        } as React.CSSProperties
      }
    >
      {eventTypeLabels[type]}
    </span>
  );
}
