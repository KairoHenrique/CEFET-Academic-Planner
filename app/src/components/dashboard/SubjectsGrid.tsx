"use client";

const subjects = [
  {
    name: "Algoritmos e Estruturas de Dados I",
    code: "AEDI",
    room: "303/620",
    grade: null as number | null,
    gradeMax: 100,
    absences: 4,
    maxAbsences: 15,
    tasks: 1,
    color: "#1A8FE3",
  },
  {
    name: "Arq. e Org. de Computadores I",
    code: "AOCI",
    room: "314",
    grade: null as number | null,
    gradeMax: 100,
    absences: 2,
    maxAbsences: 15,
    tasks: 0,
    color: "#D4A843",
  },
  {
    name: "Engenharia de Software",
    code: "Eng. Soft.",
    room: "301/303",
    grade: 24.8,
    gradeMax: 100,
    absences: 8,
    maxAbsences: 15,
    tasks: 2,
    color: "#F47067",
  },
  {
    name: "Empreendedorismo e Plano de Negócios",
    code: "Empreend.",
    room: "301",
    grade: null as number | null,
    gradeMax: 100,
    absences: 0,
    maxAbsences: 7,
    tasks: 0,
    color: "#3FB950",
  },
  {
    name: "Introdução à Sociologia",
    code: "Sociologia",
    room: "306",
    grade: null as number | null,
    gradeMax: 100,
    absences: 0,
    maxAbsences: 7,
    tasks: 0,
    color: "#A371F7",
  },
  {
    name: "Lab. Alg. e Estruturas de Dados I",
    code: "LAEDI",
    room: "604",
    grade: null as number | null,
    gradeMax: 100,
    absences: 2,
    maxAbsences: 11,
    tasks: 0,
    color: "#79C0FF",
  },
  {
    name: "Lab. Arq. e Org. de Comp. I",
    code: "LAOCI",
    room: "304",
    grade: 9.0,
    gradeMax: 25,
    absences: 4,
    maxAbsences: 7,
    tasks: 2,
    color: "#E3B341",
  },
];

function getAbsenceStatus(current: number, max: number) {
  const ratio = current / max;
  if (ratio >= 0.8) return { label: "Crítico", badgeClass: "danger" };
  if (ratio >= 0.5) return { label: "Atenção", badgeClass: "warning" };
  return { label: "Seguro", badgeClass: "success" };
}

function SubjectCard({
  subject,
}: {
  subject: (typeof subjects)[0];
}) {
  const absenceStatus = getAbsenceStatus(subject.absences, subject.maxAbsences);
  const absenceRatio = (subject.absences / subject.maxAbsences) * 100;

  return (
    <div
      className="subject-card"
      style={{ borderLeft: `3px solid ${subject.color}` }}
    >
      <div className="subject-name">{subject.name}</div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--space-4)",
          marginTop: "var(--space-3)",
          marginBottom: "var(--space-3)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "0.7rem",
              color: "var(--text-tertiary)",
              marginBottom: 4,
            }}
          >
            Nota
          </div>
          <div
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              fontFamily: "var(--font-display)",
            }}
          >
            {subject.grade !== null ? (
              <>
                <span style={{ color: "var(--text-primary)" }}>
                  {subject.grade}
                </span>
                <span
                  style={{
                    color: "var(--text-tertiary)",
                    fontSize: "0.8rem",
                  }}
                >
                  {" "}
                  / {subject.gradeMax}
                </span>
              </>
            ) : (
              <span style={{ color: "var(--text-tertiary)" }}>—</span>
            )}
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: "0.7rem",
              color: "var(--text-tertiary)",
              marginBottom: 4,
            }}
          >
            Faltas
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
            }}
          >
            <span
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                fontFamily: "var(--font-display)",
              }}
            >
              {subject.absences}
              <span
                style={{
                  color: "var(--text-tertiary)",
                  fontSize: "0.8rem",
                }}
              >
                {" "}
                / {subject.maxAbsences}
              </span>
            </span>
            <span className={`badge ${absenceStatus.badgeClass}`}>
              {absenceStatus.label}
            </span>
          </div>
        </div>
      </div>

      <div
        className="progress-bar"
        style={{ marginBottom: "var(--space-3)" }}
      >
        <div
          className={`progress-bar-fill ${absenceStatus.badgeClass}`}
          style={{ width: `${absenceRatio}%` }}
        />
      </div>

      <div className="subject-meta">
        <span>🏫 {subject.room}</span>
        {subject.tasks > 0 && (
          <span style={{ color: "var(--warning)" }}>
            📋 {subject.tasks} tarefa{subject.tasks > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}

export function SubjectsGrid() {
  return (
    <div>
      <div className="card-header" style={{ marginBottom: "var(--space-4)" }}>
        <h3>📚 Disciplinas do Semestre</h3>
        <a
          href="/disciplinas"
          style={{
            fontSize: "0.8rem",
            color: "var(--gold-400)",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Ver todas →
        </a>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "var(--space-4)",
        }}
        className="stagger-children"
      >
        {subjects.map((subject) => (
          <SubjectCard key={subject.code} subject={subject} />
        ))}
      </div>
    </div>
  );
}
