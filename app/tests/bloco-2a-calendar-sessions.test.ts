/**
 * Calendário: expansão de datas institucionais e aulas recorrentes.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

describe("Calendário — datas institucionais expandidas", () => {
  test("intervalo gera marco de início e fim", async () => {
    const { expandAcademicRowsToCalendarEvents } = await import(
      "../src/lib/calendar/expand-academic-calendar-events"
    );

    const events = expandAcademicRowsToCalendarEvents([
      {
        id: 1,
        evento: "Rematrícula",
        data_inicio: "2026-01-29",
        data_fim: "2026-02-01",
        semestre: "2026.1",
      },
    ]);

    assert.equal(events.length, 2);
    assert.equal(events[0]?.title, "Matrícula Fase 2 — Início");
    assert.equal(events[0]?.date, "2026-01-29");
    assert.equal(events[1]?.title, "Matrícula Fase 2 — Fim");
    assert.equal(events[1]?.date, "2026-02-01");
    assert.match(events[0]?.description ?? "", /29\/01\/26/);
    assert.match(events[0]?.description ?? "", /29\/01\/26 – 01\/02\/26/);
  });

  test("Período Letivo inclui semestre no título", async () => {
    const { expandAcademicRowsToCalendarEvents } = await import(
      "../src/lib/calendar/expand-academic-calendar-events"
    );

    const events = expandAcademicRowsToCalendarEvents([
      {
        id: 2,
        evento: "Período Letivo",
        data_inicio: "2026-03-02",
        data_fim: "2026-07-06",
        semestre: "2026.1",
      },
    ]);

    assert.equal(events[0]?.title, "Período Letivo 2026.1 — Início");
    assert.equal(events[1]?.title, "Período Letivo 2026.1 — Fim");
    assert.match(events[0]?.description ?? "", /02\/03\/26 – 06\/07\/26/);
  });
});

function semestreRow(
  overrides: Partial<{
    disciplina_id: string;
    nome: string;
    codigo_horario: string | null;
    horario_traduzido: string | null;
    turma_data_inicio: string | null;
    turma_data_fim: string | null;
  }> = {}
) {
  return {
    disciplina_id: "ENG-SOFT",
    nome: "ENGENHARIA DE SOFTWARE",
    carga_horaria: 60,
    local: "101",
    codigo_horario: "4M12 6M56" as string | null,
    horario_traduzido: null as string | null,
    cor: "#F47067",
    apelido: "Eng. Software",
    nome_exibicao: null,
    local_exibicao: null,
    horario_exibicao: null,
    professor_exibicao: null,
    horas_semanais_exibicao: null,
    grupo_nome: null,
    professor: null,
    max_faltas: null,
    nota_maxima: null,
    nota_aprovacao: null,
    arquivos_baixados: null,
    pdf_auto_download: null,
    turma_data_inicio: "2026-02-23" as string | null,
    turma_data_fim: "2026-03-05" as string | null,
    ...overrides,
  };
}

describe("Calendário — aulas até fim da turma", () => {
  test("gera aulas na quarta e sexta até data fim", async () => {
    const { expandClassSessionEvents } = await import(
      "../src/lib/calendar/expand-class-session-events"
    );

    const events = expandClassSessionEvents({
      semestreRows: [semestreRow()],
      academicRows: [],
    });

    assert.ok(events.length > 0);
    assert.ok(events.every((event) => event.type === "aula"));
    assert.ok(events.every((event) => event.date <= "2026-03-05"));
    assert.ok(events.some((event) => event.date === "2026-02-25"));
    assert.ok(events.some((event) => event.date === "2026-02-27"));
  });

  test("usa horario_traduzido quando codigo_horario está vazio", async () => {
    const { expandClassSessionEvents } = await import(
      "../src/lib/calendar/expand-class-session-events"
    );

    const events = expandClassSessionEvents({
      semestreRows: [
        semestreRow({
          codigo_horario: null,
          horario_traduzido: "Qua 07:00 · Sex 15:50",
          turma_data_inicio: "2026-02-23",
          turma_data_fim: "2026-03-05",
        }),
      ],
      academicRows: [],
    });

    assert.ok(events.length > 0);
    assert.ok(events.some((event) => event.date === "2026-02-25"));
    assert.ok(events.some((event) => event.date === "2026-02-27"));
  });

  test("fallback de período letivo aproximado sem turma_data nem Período Letivo", async () => {
    const { expandClassSessionEvents } = await import(
      "../src/lib/calendar/expand-class-session-events"
    );

    const events = expandClassSessionEvents({
      semestreRows: [
        semestreRow({
          turma_data_inicio: null,
          turma_data_fim: null,
        }),
      ],
      academicRows: [
        {
          id: 99,
          evento: "Matrícula OnLine",
          data_inicio: "2026-07-20",
          data_fim: "2026-07-22",
          semestre: "2026.2",
        },
      ],
    });

    assert.ok(events.length > 0);
    assert.ok(events.every((event) => event.date >= "2026-08-01"));
    assert.ok(events.every((event) => event.date <= "2026-12-20"));
  });
});

describe("Calendário — bounds aproximados do semestre", () => {
  test("infere janela .1 e .2", async () => {
    const { inferDefaultPeriodoLetivoBounds } = await import(
      "../src/lib/calendar/infer-periodo-letivo-bounds"
    );

    assert.deepEqual(inferDefaultPeriodoLetivoBounds("2026.1"), {
      dataInicio: "2026-03-01",
      dataFim: "2026-07-15",
    });
    assert.deepEqual(inferDefaultPeriodoLetivoBounds("2026.2"), {
      dataInicio: "2026-08-01",
      dataFim: "2026-12-20",
    });
    assert.equal(inferDefaultPeriodoLetivoBounds("invalid"), null);
  });
});

describe("Portal — vigência da turma no horário", () => {
  test("extrai intervalo do texto SIGAA", async () => {
    const { extractTurmaPeriodFromHorarioText } = await import(
      "../src/lib/scraper/portal-discente/parse-portal-horario"
    );

    const period = extractTurmaPeriodFromHorarioText(
      "6M56 2T12 (23/02/2026 - 04/07/2026) 101"
    );

    assert.ok(period);
    assert.equal(period?.dataInicio, "2026-02-23");
    assert.equal(period?.dataFim, "2026-07-04");
  });
});

describe("Calendário — eventos manuais", () => {
  test("intervalo mantém um evento com dateEnd", async () => {
    const { expandManualCalendarEvents } = await import(
      "../src/lib/calendar/expand-manual-calendar-events"
    );

    const [event] = expandManualCalendarEvents([
      {
        id: 1,
        titulo: "Projeto",
        descricao: null,
        data: "2026-01-22",
        data_fim: "2026-01-25",
        hora_inicio: "14:00",
        hora_fim: "16:00",
        recorrencia: "none",
        recorrencia_ate: null,
        recorrencia_dias: null,
        tipo: "estudo",
        disciplina_id: null,
        cor: "#D4A843",
        concluida: 0,
        manual: 1,
      },
    ]);

    assert.equal(event?.date, "2026-01-22");
    assert.equal(event?.dateEnd, "2026-01-25");
    assert.equal(event?.timeStart, "14:00");
    assert.equal(event?.timeEnd, "16:00");
  });

  test("recorrência diária gera uma ocorrência por dia", async () => {
    const { expandManualCalendarEvents } = await import(
      "../src/lib/calendar/expand-manual-calendar-events"
    );

    const events = expandManualCalendarEvents([
      {
        id: 2,
        titulo: "Leitura",
        descricao: null,
        data: "2026-03-02",
        data_fim: null,
        hora_inicio: "19:00",
        hora_fim: "20:00",
        recorrencia: "daily",
        recorrencia_ate: "2026-03-04",
        recorrencia_dias: null,
        tipo: "estudo",
        disciplina_id: null,
        cor: "#D4A843",
        concluida: 0,
        manual: 1,
      },
    ]);

    assert.equal(events.length, 3);
    assert.equal(events[0]?.id, "evento-2-2026-03-02");
    assert.equal(events[2]?.date, "2026-03-04");
    assert.equal(events[1]?.timeStart, "19:00");
  });

  test("recorrência semanal gera ocorrências nos dias marcados", async () => {
    const { expandManualCalendarEvents } = await import(
      "../src/lib/calendar/expand-manual-calendar-events"
    );

    const events = expandManualCalendarEvents([
      {
        id: 3,
        titulo: "Monitoria",
        descricao: null,
        data: "2026-03-02",
        data_fim: null,
        hora_inicio: "19:00",
        hora_fim: "20:00",
        recorrencia: "weekly",
        recorrencia_ate: "2026-03-13",
        recorrencia_dias: "0,2,4",
        tipo: "monitoria",
        disciplina_id: null,
        cor: "#39D0D8",
        concluida: 0,
        manual: 1,
      },
    ]);

    assert.equal(events.length, 6);
    assert.deepEqual(
      events.map((event) => event.date),
      [
        "2026-03-02",
        "2026-03-04",
        "2026-03-06",
        "2026-03-09",
        "2026-03-11",
        "2026-03-13",
      ]
    );
  });

  test("validação exige data limite na recorrência", async () => {
    const { parseCreateCalendarEventBody } = await import(
      "../src/lib/api/validate"
    );

    assert.throws(
      () =>
        parseCreateCalendarEventBody({
          title: "Rotina",
          date: "2026-03-02",
          type: "estudo",
          recurrence: "daily",
        }),
      /Informe até quando repetir/i
    );
  });
});
