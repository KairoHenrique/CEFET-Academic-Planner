import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseIngestSnapshotBody } from "../src/lib/sync-ingest/parse-ingest-snapshot";
import { buildIngestSnapshotFromPortal } from "../src/lib/device-sync/build-ingest-snapshot";
import type { PortalDiscenteSnapshot } from "../src/lib/scraper/types/portal-discente";
import {
  assertSyncIngestRateLimit,
  resetSyncIngestRateLimitForTests,
} from "../src/lib/sync-ingest/ingest-rate-limit";
import { ApiError } from "../src/lib/api/errors";

describe("B82 sync ingest", () => {
  it("parseia snapshot mínimo válido", () => {
    const parsed = parseIngestSnapshotBody({
      source: "device",
      snapshot: {
        aluno: {
          matricula: "2020123456",
          nome: "Aluno Teste",
          curso: "Engenharia de Computação",
          email: null,
          semestre_entrada: "2020.1",
          rg: null,
          status: "ATIVO",
        },
        disciplinas: [
          {
            codigo: "COM101",
            nome: "Algoritmos",
            tipo: null,
            carga_horaria: 60,
            periodo: 1,
            ementa: null,
          },
        ],
        requisitos: [],
        historico: [],
        semestreAtual: [
          {
            disciplina_id: "COM101",
            local: "C1",
            codigo_horario: "2M12",
            horario_traduzido: "Seg 07:00",
            cor: "#0060B1",
            apelido: null,
            nome_exibicao: null,
            local_exibicao: null,
            horario_exibicao: null,
            professor_exibicao: null,
            horas_semanais_exibicao: null,
            grupo_nome: null,
            professor: null,
            max_faltas: null,
            nota_maxima: 100,
            nota_aprovacao: 60,
            arquivos_baixados: null,
            pdf_auto_download: null,
            turma_data_inicio: null,
            turma_data_fim: null,
          },
        ],
        notasSynced: [],
        faltasSynced: [],
        tarefasSynced: [],
        grupoMembros: [],
        integralizacaoSynced: [],
        config: [{ chave: "sync.last_at", valor: "2026-09-08T12:00:00.000Z" }],
      },
    });

    assert.equal(parsed.source, "device");
    assert.equal(parsed.snapshot.aluno?.matricula, "2020123456");
    assert.equal(parsed.snapshot.semestreAtual.length, 1);
  });

  it("rejeita senha no body", () => {
    assert.throws(
      () =>
        parseIngestSnapshotBody({
          password: "secret",
          snapshot: { aluno: { matricula: "1", nome: "A" } },
        }),
      (error: unknown) =>
        error instanceof ApiError && error.code === "VALIDATION_ERROR"
    );
  });

  it("aplica rate limit por user", () => {
    resetSyncIngestRateLimitForTests();
    const userId = "user-test-b82";
    for (let i = 0; i < 6; i++) {
      assertSyncIngestRateLimit(userId);
    }
    assert.throws(
      () => assertSyncIngestRateLimit(userId),
      (error: unknown) =>
        error instanceof ApiError && error.code === "RATE_LIMITED"
    );
  });
});

describe("B83 build ingest from portal", () => {
  it("monta snapshot a partir do portal", () => {
    const portal: PortalDiscenteSnapshot = {
      scrapedAt: "2026-09-08T12:00:00.000Z",
      aluno: {
        matricula: "2020123456",
        nome: "Aluno Teste",
        curso: "Engenharia de Computação",
        email: "a@test.com",
        semestreEntrada: "2020.1",
        rg: null,
        status: "ATIVO",
      },
      integralizacao: [
        {
          tipoCh: "Obrigatória",
          concluido: 1000,
          pendente: 2000,
          totalNecessario: 3000,
        },
      ],
      integralizacaoResumo: {
        totalCurriculo: 3600,
        percentIntegralizado: 40,
      },
      semestreAtual: [
        {
          codigo: "COM101",
          nome: "Algoritmos",
          local: "C1",
          codigoHorario: "2M12",
          horarioTraduzido: "Seg 07:00",
        },
      ],
      semestreLetivo: "2026.2",
      atividades: [
        {
          disciplinaCodigo: "COM101",
          titulo: "Lista 1",
          dataFim: "01/01/2099",
          horaFim: "23:59",
          tipo: "individual",
          descricao: null,
          enviada: false,
        },
      ],
    };

    const snapshot = buildIngestSnapshotFromPortal(portal);
    assert.equal(snapshot.aluno?.nome, "Aluno Teste");
    assert.equal(snapshot.semestreAtual.length, 1);
    assert.equal(snapshot.tarefasSynced.length, 1);
    assert.equal(snapshot.integralizacaoSynced.length, 1);
    assert.ok(
      snapshot.config.some((entry) => entry.chave === "sync.last_at")
    );
  });
});
