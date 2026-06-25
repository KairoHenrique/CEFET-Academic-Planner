"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";

const timeSlots = [
  "7:00–8:40",
  "8:55–10:35",
  "10:50–12:30",
  "13:50–15:30",
  "15:50–17:30",
  "19:00–20:40",
  "20:55–22:35",
];

const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

type SlotData = { name: string; room: string; color: string } | null;

const schedule: SlotData[][] = [
  [null, null, null, { name: "AEDI", room: "303", color: "#3AA0E8" }, null, null, null],
  [null, { name: "AOCI", room: "314", color: "#D4A843" }, null, null, null, { name: "Empreend.", room: "303", color: "#3FB950" }, { name: "Sociologia", room: "619", color: "#A371F7" }],
  [{ name: "Eng. Soft.", room: "301", color: "#F47067" }, { name: "LAEDI", room: "604", color: "#3AA0E8" }, null, null, null, null, null],
  [null, { name: "LAOCI", room: "314", color: "#D4A843" }, { name: "Eng. Soft.", room: "303", color: "#F47067" }, null, null, null, null],
  [null, null, { name: "AEDI", room: "620", color: "#3AA0E8" }, null, null, null, null],
];

export function WeeklySchedulePreview() {
  return (
    <div className="card">
      <SectionHeader
        title="Grade da Semana"
        icon="calendar"
        href="/calendario"
        linkLabel="Ver calendário completo"
      />

      <div className="schedule-wrapper">
        <table className="schedule-table">
          <thead>
            <tr>
              <th />
              {timeSlots.map((slot) => (
                <th key={slot}>{slot}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day, dayIdx) => (
              <tr key={day}>
                <td className="day-label">{day}</td>
                {timeSlots.map((_, slotIdx) => {
                  const slot = schedule[dayIdx]?.[slotIdx];
                  return (
                    <td key={slotIdx}>
                      {slot ? (
                        <ScheduleSlot slot={slot} />
                      ) : (
                        <div className="schedule-slot-empty" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScheduleSlot({ slot }: { slot: NonNullable<SlotData> }) {
  return (
    <div
      className="schedule-slot"
      style={{ "--slot-color": slot.color } as React.CSSProperties}
    >
      <div className="schedule-slot-name">{slot.name}</div>
      <div className="schedule-slot-room">{slot.room}</div>
    </div>
  );
}
