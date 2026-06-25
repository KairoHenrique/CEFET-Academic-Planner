"use client";

export function WeeklySchedulePreview() {
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

  // Schedule data: [dayIndex][slotIndex] = { name, room, color }
  type SlotData = { name: string; room: string; color: string } | null;
  const schedule: SlotData[][] = [
    // Segunda
    [null, null, null, { name: "AEDI", room: "303", color: "#1A8FE3" }, null, null, null],
    // Terça
    [null, { name: "AOCI", room: "314", color: "#D4A843" }, null, null, null, { name: "Empreend.", room: "303", color: "#3FB950" }, { name: "Sociologia", room: "619", color: "#A371F7" }],
    // Quarta
    [{ name: "Eng. Soft.", room: "301", color: "#F47067" }, { name: "LAEDI", room: "604", color: "#1A8FE3" }, null, null, null, null, null],
    // Quinta
    [null, { name: "LAOCI", room: "314", color: "#D4A843" }, { name: "Eng. Soft.", room: "303", color: "#F47067" }, null, null, null, null],
    // Sexta
    [null, null, { name: "AEDI", room: "620", color: "#1A8FE3" }, null, null, null, null],
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h3>🗓️ Grade da Semana</h3>
        <a
          href="/calendario"
          style={{
            fontSize: "0.8rem",
            color: "var(--gold-400)",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Ver calendário completo →
        </a>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: "4px",
            minWidth: 800,
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  padding: "var(--space-2) var(--space-3)",
                  fontSize: "0.75rem",
                  color: "var(--text-tertiary)",
                  fontWeight: 500,
                  textAlign: "left",
                  width: 80,
                }}
              />
              {timeSlots.map((slot) => (
                <th
                  key={slot}
                  style={{
                    padding: "var(--space-2) var(--space-3)",
                    fontSize: "0.7rem",
                    color: "var(--text-tertiary)",
                    fontWeight: 500,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {slot}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day, dayIdx) => (
              <tr key={day}>
                <td
                  style={{
                    padding: "var(--space-2) var(--space-3)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {day}
                </td>
                {timeSlots.map((_, slotIdx) => {
                  const slot = schedule[dayIdx]?.[slotIdx];
                  return (
                    <td
                      key={slotIdx}
                      style={{
                        padding: 0,
                        textAlign: "center",
                      }}
                    >
                      {slot ? (
                        <div
                          style={{
                            background: `${slot.color}18`,
                            border: `1px solid ${slot.color}40`,
                            borderRadius: "var(--radius-sm)",
                            padding: "var(--space-2) var(--space-2)",
                            transition: "all var(--transition-fast)",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = `${slot.color}30`;
                            e.currentTarget.style.transform = "scale(1.03)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = `${slot.color}18`;
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              color: slot.color,
                              lineHeight: 1.2,
                            }}
                          >
                            {slot.name}
                          </div>
                          <div
                            style={{
                              fontSize: "0.65rem",
                              color: "var(--text-tertiary)",
                              marginTop: 2,
                            }}
                          >
                            {slot.room}
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            height: 44,
                            borderRadius: "var(--radius-sm)",
                            background: "var(--bg-tertiary)",
                            opacity: 0.3,
                          }}
                        />
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
