/**
 * Suite B28: scraper turma virtual — parse, mock, persist, runSync.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "planner-b28-"));

process.env.DB_PATH = path.join(tmpDir, "test.db");
process.env.SIGAA_SCRAPER_MOCK = "true";

after(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const NOTAS_FIXTURE = `
<table>
  <tr>
    <th title="Avaliação: Prova 1 | Nota Máxima: 30.0">PRO1</th>
    <th title="Avaliação: Seminário | Nota Máxima: 10.0">SEM</th>
    <th title="Avaliação: Prova 2 | Nota Máxima: 30.0">PRO2</th>
    <th title="Avaliação: Nota | Nota Máxima: 30.0">Nota</th>
    <th>Resultado</th>
    <th>Faltas</th>
    <th>Situação</th>
  </tr>
  <tr>
    <td>9,0</td>
    <td>5,8</td>
    <td>10,0</td>
    <td>-</td>
    <td>24,8</td>
    <td>8</td>
    <td>-</td>
  </tr>
</table>
`;

const FREQUENCIA_FIXTURE = `
<table>
  <tr><th>Data</th><th>Frequência</th></tr>
  <tr><td>10/02/2026</td><td>Presente</td></tr>
  <tr><td>12/02/2026</td><td>Faltou</td></tr>
  <tr><td>28/05/2026</td><td>Não registrado</td></tr>
</table>
`;

const GRUPO_FIXTURE = `
<p><b>Nome do Grupo:</b> Grupo 6</p>
<p><b>Número de Participantes:</b> 2</p>
<table>
  <tr><th>Nome</th><th>Matrícula</th><th>E-mail</th><th>Curso</th></tr>
  <tr><td>Kairo Henrique</td><td>2024001234</td><td>kairo@aluno.cefetmg.br</td><td>Eng. Computação</td></tr>
  <tr><td>Maria Silva</td><td>2024005678</td><td>maria@aluno.cefetmg.br</td><td>Eng. Computação</td></tr>
</table>
`;

const GRUPO_AIRBNB_FIXTURE = `
<p><b>Nome do Grupo:</b> Grupo 2 - Airbnb (Brian Chesky e Joe Gebbia)</p>
<p><b>Número de Participantes:</b> 4</p>
<strong>LUCAS LIMA DE OLIVEIRA</strong> Curso: <em>ENGENHARIA DE COMPUTAÇÃO</em> Matrícula: <em>00000000000</em> E-mail: <em>lucas@aluno.cefetmg.br</em>
`;

const GRUPO_LIVE_ONE_LINE_FIXTURE = `
Nome do Grupo: Grupo 6 Número de Participantes: 6 GABRIEL VITOR SILVA Curso: ENGENHARIA DE COMPUTAÇÃO Matrícula: 20193015935 SIGAA Diretoria de Tecnologia
<strong>GABRIEL VITOR SILVA</strong> Curso: <em>ENGENHARIA DE COMPUTAÇÃO</em> Matrícula: <em>20193015935</em> E-mail: <em>gabriel@aluno.cefetmg.br</em>
`;

const TAREFAS_FIXTURE = `
<table>
  <tr><th>Título</th><th>Período</th><th>Possui Nota</th><th>Tipo</th></tr>
  <tr>
    <td><a href="/detalhe">Diagramas UML</a></td>
    <td>15/05/2026 - 20/05/2026 23:59</td>
    <td>Sim (10,0)</td>
    <td>Individual</td>
  </tr>
</table>
`;

const TAREFA_DETALHE_FIXTURE = `
<div>Descrição: Elaborar diagramas UML completos do sistema.</div>
<h3>Instruções</h3>
<ul><li>Modelar casos de uso</li><li>Exportar em PDF</li></ul>
<h3>Entregáveis</h3>
<ul><li>Arquivo PDF</li></ul>
<a href="/material/diagramas.pdf">diagramas.pdf</a>
`;

describe("B28 — parse turma virtual", () => {
  test("extrai notas com tooltip e limite de faltas", async () => {
    const { parseNotasPageHtml } = await import(
      "../src/lib/scraper/turma-virtual/parse-notas-page"
    );
    const result = parseNotasPageHtml(NOTAS_FIXTURE);

    assert.equal(result.notas.length, 3);
    assert.equal(result.notas[0]?.avaliacaoNome, "Prova 1");
    assert.equal(result.notas[0]?.notaMaxima, 30);
    assert.equal(result.notas[0]?.notaObtida, 9);
    assert.equal(result.maxFaltas, 8);
  });

  test("extrai notas do layout Alunos Matriculados (CEFET live)", async () => {
    const { parseNotasPageHtml } = await import(
      "../src/lib/scraper/turma-virtual/parse-notas-page"
    );
    const SIGAA_NOTAS_FIXTURE = `
      <table>
        <tr><th>Matrícula</th><th>Nome</th><th>Unid. 1</th><th>Faltas</th></tr>
        <tr><td></td><td></td>
          <th title="Avaliação: Prova 1 | Nota Máxima: 30.0">PRO1</th>
          <th title="Avaliação: Seminário | Nota Máxima: 10.0">SEM</th>
          <th title="Avaliação: Prova 2 | Nota Máxima: 30.0">PRO2</th>
          <th title="Avaliação: Nota | Nota Máxima: 30.0">Nota</th>
        </tr>
        <tr><td>00000000000</td><td>Kairo</td><td>15,8</td><td>9,0</td><td></td><td></td><td>0</td></tr>
      </table>
    `;
    const result = parseNotasPageHtml(SIGAA_NOTAS_FIXTURE);
    assert.equal(result.notas.length, 3);
    assert.equal(result.notas[0]?.notaObtida, 15.8);
    assert.equal(result.notas[0]?.notaMaxima, 30);
    assert.equal(result.notas[1]?.notaObtida, 9);
    assert.equal(result.notas[1]?.notaMaxima, 10);
    assert.equal(result.notas[2]?.notaObtida, null);
    assert.equal(result.maxFaltas, 0);
  });

  test("extrai nota máxima dos inputs hidden do SIGAA ao vivo", async () => {
    const { parseNotasPageHtml } = await import(
      "../src/lib/scraper/turma-virtual/parse-notas-page"
    );

    const LIVE_FIXTURE = `
      <table>
        <tr><th>Matrícula</th><th>Nome</th><th>Unid. 1</th><th>Faltas</th></tr>
        <tr id="trAval"><th></th><th></th>
          <th>PRO1</th>
          <input type="hidden" id="abrevAval_1" value="PRO1">
          <input type="hidden" id="denAval_1" value="Prova 1">
          <input type="hidden" id="notaAval_1" value="25.0">
          <th>SEM</th>
          <input type="hidden" id="abrevAval_2" value="SEM">
          <input type="hidden" id="denAval_2" value="Seminário Metodologias ágeis">
          <input type="hidden" id="notaAval_2" value="10.0">
          <th>PRO2</th>
          <input type="hidden" id="abrevAval_3" value="PRO2">
          <input type="hidden" id="denAval_3" value="Prova 2">
          <input type="hidden" id="notaAval_3" value="25.0">
          <th>Nota</th>
        </tr>
        <tr>
          <td>00000000000</td><td>Kairo</td>
          <td>15,8</td><td>9,0</td><td></td><td></td><td>0</td>
        </tr>
      </table>
    `;

    const result = parseNotasPageHtml(LIVE_FIXTURE);
    assert.equal(result.notas.length, 3);
    assert.equal(result.notas[0]?.avaliacaoNome, "Prova 1");
    assert.equal(result.notas[0]?.notaMaxima, 25);
    assert.equal(result.notas[0]?.notaObtida, 15.8);
    assert.equal(result.notas[1]?.notaMaxima, 10);
    assert.equal(result.notas[2]?.notaMaxima, 25);
  });

  test("extrai notas com abreviações customizadas (PRIM, SEG, CCEs, EC1)", async () => {
    const { parseNotasPageHtml, countLaunchedNotas } = await import(
      "../src/lib/scraper/turma-virtual/parse-notas-page"
    );

    const SOCIO_FIXTURE = `
      <table>
        <tr><th>Matrícula</th><th>Nome</th><th>Unid. 1</th><th>Faltas</th></tr>
        <tr id="trAval"><th></th><th></th>
          <th>PRIM</th>
          <input type="hidden" id="abrevAval_1" value="PRIM">
          <input type="hidden" id="denAval_1" value="PRIMEIRA AVALIAÇÃO">
          <input type="hidden" id="notaAval_1" value="20.0">
          <th>SEG</th>
          <input type="hidden" id="abrevAval_2" value="SEG">
          <input type="hidden" id="denAval_2" value="Segunda avaliação">
          <input type="hidden" id="notaAval_2" value="30.0">
          <th>TER</th>
          <input type="hidden" id="abrevAval_3" value="TER">
          <input type="hidden" id="denAval_3" value="TERCEIRA AVALIAÇÃO">
          <input type="hidden" id="notaAval_3" value="30.0">
          <th>QUAR</th>
          <input type="hidden" id="abrevAval_4" value="QUAR">
          <input type="hidden" id="denAval_4" value="QUARTA NOTA">
          <input type="hidden" id="notaAval_4" value="20.0">
          <th>Nota</th>
        </tr>
        <tr>
          <td>00000000000</td><td>Kairo</td>
          <td>16,0</td><td>8,0</td><td>21,0</td><td>15,0</td><td>60,0</td><td>0</td>
        </tr>
      </table>
    `;

    const result = parseNotasPageHtml(SOCIO_FIXTURE);
    assert.equal(result.notas.length, 4);
    assert.equal(countLaunchedNotas(result.notas), 4);
    assert.equal(result.notas[0]?.avaliacaoNome, "PRIMEIRA AVALIAÇÃO");
    assert.equal(result.notas[0]?.notaObtida, 16);
    assert.equal(result.notas[0]?.notaMaxima, 20);
    assert.equal(result.notas[3]?.notaObtida, 15);
    assert.equal(result.notas[3]?.notaMaxima, 20);
  });

  test("merge da fila inclui disciplinas do quadro de horários ausentes nos links", async () => {
    const { mergeTurmaVirtualEntries } = await import(
      "../src/lib/scraper/turma-virtual/portal-turma-navigation"
    );

    const merged = mergeTurmaVirtualEntries(
      [
        {
          sigaaNome: "ENGENHARIA DE SOFTWARE (2026.1)",
          sigaaUrl: "https://sig.cefetmg.br/sigaa/ava/index.jsf",
        },
      ],
      [
        {
          codigo: "AEDI",
          nome: "ALGORITMOS E ESTRUTURAS DE DADOS I",
          local: "303",
          codigoHorario: "2M56",
          horarioTraduzido: null,
        },
        {
          codigo: "ENG-SOFT",
          nome: "ENGENHARIA DE SOFTWARE",
          local: "301",
          codigoHorario: "3M12",
          horarioTraduzido: null,
        },
      ],
      "2026.1"
    );

    assert.equal(merged.length, 2);
    assert.ok(
      merged.some(
        (entry) =>
          entry.sigaaNome === "ALGORITMOS E ESTRUTURAS DE DADOS I (2026.1)"
      )
    );
  });

  test("layout CEFET com matrícula+nome na mesma célula", async () => {
    const { parseNotasPageHtml, countLaunchedNotas } = await import(
      "../src/lib/scraper/turma-virtual/parse-notas-page"
    );

    const MERGED_FIXTURE = `
      <table>
        <tr><th>Matrícula Nome</th><th>Unid. 1</th><th>Faltas</th></tr>
        <tr><td></td>
          <th title="Avaliação: Prova 1 | Nota Máxima: 30.0">PRO1</th>
          <th title="Avaliação: Seminário | Nota Máxima: 10.0">SEM</th>
          <th title="Avaliação: Prova 2 | Nota Máxima: 30.0">PRO2</th>
          <th title="Avaliação: Nota | Nota Máxima: 30.0">Nota</th>
          <td></td>
        </tr>
        <tr>
          <td>00000000000 KAIRO HENRIQUE FERREIRA MARTINS</td>
          <td>15,8</td><td>9,0</td><td></td><td></td><td>0</td>
        </tr>
      </table>
    `;

    const result = parseNotasPageHtml(MERGED_FIXTURE);
    assert.equal(countLaunchedNotas(result.notas), 2);
    assert.equal(result.notas.length, 3);
    assert.equal(result.notas[0]?.avaliacaoNome, "Prova 1");
    assert.equal(result.notas[0]?.notaObtida, 15.8);
    assert.equal(result.notas[0]?.notaMaxima, 30);
    assert.equal(result.notas[1]?.avaliacaoNome, "Seminário");
    assert.equal(result.notas[1]?.notaObtida, 9);
    assert.equal(result.notas[1]?.notaMaxima, 10);
  });

  test("lista de alunos matriculados filtra notas pela matrícula do logado", async () => {
    const { readFileSync, existsSync } = await import("node:fs");
    const { parseNotasPageHtml } = await import(
      "../src/lib/scraper/turma-virtual/parse-notas-page"
    );

    const fixturePath =
      ".data/scrape-debug/1782834838405-arquitetura-e-organizacao-de-computadores-i-notas.html";
    if (!existsSync(fixturePath)) {
      console.warn("Fixture AOC ausente — pulando teste de matrícula.");
      return;
    }

    const html = readFileSync(fixturePath, "utf8");
    const firstStudent = parseNotasPageHtml(html);
    const ownGrades = parseNotasPageHtml(html, { matricula: "00000000000" });

    assert.equal(firstStudent.notas[0]?.notaObtida, 15);
    assert.equal(ownGrades.notas[0]?.notaObtida, 12);
    assert.equal(ownGrades.maxFaltas, 6);
  });

  test("extrai frequência por data", async () => {
    const { parseFrequenciaPageHtml } = await import(
      "../src/lib/scraper/turma-virtual/parse-frequencia-page"
    );
    const faltas = parseFrequenciaPageHtml(FREQUENCIA_FIXTURE);

    assert.equal(faltas.length, 3);
    assert.equal(faltas[0]?.status, "presente");
    assert.equal(faltas[1]?.status, "falta");
    assert.equal(faltas[1]?.quantidade, 1);
    assert.equal(faltas[2]?.status, "nao_registrada");
  });

  test("extrai frequência CEFET com quantidade (2 Falta(s))", async () => {
    const { readFileSync } = await import("node:fs");
    const {
      parseFrequenciaPageHtml,
      parseFrequenciaMetaFromHtml,
      sumFaltasQuantidade,
    } = await import(
      "../src/lib/scraper/turma-virtual/parse-frequencia-page"
    );

    const html = readFileSync(
      ".data/scrape-debug/1782772645929-engenharia-de-software-frequencia.html",
      "utf8"
    );
    const faltas = parseFrequenciaPageHtml(html);
    const meta = parseFrequenciaMetaFromHtml(html);

    assert.ok(faltas.length >= 25);
    assert.ok(faltas.some((item) => item.quantidade === 2));
    assert.ok(sumFaltasQuantidade(faltas) >= 10);
    assert.equal(meta.totalAulas, 60);
    assert.equal(meta.minFreqPercent, 75);
    assert.equal(meta.maxFaltas, 15);
  });

  test("calcula max faltas a partir da CH (30 aulas, 75%)", async () => {
    const { computeMaxFaltasFromAulasCh, parseFrequenciaMetaFromHtml } =
      await import("../src/lib/scraper/turma-virtual/parse-frequencia-page");

    assert.equal(computeMaxFaltasFromAulasCh(60, 75), 15);
    assert.equal(computeMaxFaltasFromAulasCh(30, 75), 7);

    const meta = parseFrequenciaMetaFromHtml(`
      frequência mínima às atividades correspondente a 75.0%
      Número de Aulas definidas pela CH do Componente: 30
    `);
    assert.equal(meta.maxFaltas, 7);
  });

  test("extrai membros do grupo", async () => {
    const { parseGrupoPageHtml } = await import(
      "../src/lib/scraper/turma-virtual/parse-grupo-page"
    );
    const grupo = parseGrupoPageHtml(GRUPO_FIXTURE);

    assert.equal(grupo.nomeGrupo, "Grupo 6");
    assert.equal(grupo.membros.length, 2);
    assert.equal(grupo.membros[0]?.matricula, "2024001234");
    assert.equal(grupo.membros[1]?.email, "maria@aluno.cefetmg.br");
  });

  test("extrai nome do grupo com subtítulo (Airbnb) sem lixo do portal", async () => {
    const { parseGrupoPageHtml } = await import(
      "../src/lib/scraper/turma-virtual/parse-grupo-page"
    );
    const grupo = parseGrupoPageHtml(GRUPO_AIRBNB_FIXTURE);

    assert.equal(
      grupo.nomeGrupo,
      "Grupo 2 - Airbnb (Brian Chesky e Joe Gebbia)"
    );
  });

  test("ignora rodapé SIGAA ao extrair nome do grupo em HTML de uma linha", async () => {
    const { parseGrupoPageHtml, sanitizeGrupoNome } = await import(
      "../src/lib/scraper/turma-virtual/parse-grupo-page"
    );
    const grupo = parseGrupoPageHtml(GRUPO_LIVE_ONE_LINE_FIXTURE);

    assert.equal(grupo.nomeGrupo, "Grupo 6");
    assert.equal(
      sanitizeGrupoNome(
        "Grupo 6 Número de Participantes: 6 GABRIEL VITOR SILVA Curso: ENGENHARIA"
      ),
      "Grupo 6"
    );
  });

  test("extrai tarefas com detalhe, instruções e entregáveis", async () => {
    const { parseTarefasListPageHtml } = await import(
      "../src/lib/scraper/turma-virtual/parse-tarefas-page"
    );
    const tarefas = parseTarefasListPageHtml(TAREFAS_FIXTURE, {
      "Diagramas UML": TAREFA_DETALHE_FIXTURE,
    });

    assert.equal(tarefas.length, 1);
    assert.equal(tarefas[0]?.titulo, "Diagramas UML");
    assert.equal(tarefas[0]?.dataFim, "2026-05-20");
    assert.equal(tarefas[0]?.possuiNota, true);
    assert.equal(tarefas[0]?.pontuacaoMaxima, 10);
    assert.equal(tarefas[0]?.instrucoes.length, 2);
    assert.equal(tarefas[0]?.entregaveis.length, 1);
  });

  test("ignora tabela de menu sem linha de notas parseável", async () => {
    const { parseTarefasListPageHtml } = await import(
      "../src/lib/scraper/turma-virtual/parse-tarefas-page"
    );
    const { hasParsableNotas, parseNotasPageHtml } = await import(
      "../src/lib/scraper/turma-virtual/parse-notas-page"
    );

    const MENU_NOTAS_FIXTURE = `
      Menu Turma Virtual Ver Notas Frequência
      <table><tr><th>Matrícula</th><th>Nome</th></tr>
      <tr><td>00000000000</td><td>Kairo</td></tr></table>
    `;

    assert.equal(hasParsableNotas(MENU_NOTAS_FIXTURE), false);
    assert.equal(parseNotasPageHtml(MENU_NOTAS_FIXTURE).notas.length, 0);
    assert.equal(parseTarefasListPageHtml(MENU_NOTAS_FIXTURE).length, 0);
  });

  test("escolhe tabela correta quando há PRO1 em menu e em notas", async () => {
    const { parseNotasPageHtml } = await import(
      "../src/lib/scraper/turma-virtual/parse-notas-page"
    );

    const FIXTURE = `
      <table>
        <tr><td>PRO1</td><td>SEM</td></tr>
        <tr><td>menu</td><td>item</td></tr>
      </table>
      <table>
        <tr><th>Matrícula</th><th>Nome</th><th>Unid. 1</th></tr>
        <tr><td></td><td></td><td>PRO1</td><td>SEM</td><td>PRO2</td><td>Nota</td></tr>
        <tr><td>00000000000</td><td>Kairo</td><td>15,8</td><td>9,0</td><td>10,0</td><td>-</td></tr>
      </table>
    `;

    const result = parseNotasPageHtml(FIXTURE);
    assert.equal(result.notas.length, 3);
    assert.equal(result.notas[0]?.notaObtida, 15.8);
  });

  test("ignora menu JSF da turma virtual como tarefa", async () => {
    const { parseTarefasListPageHtml } = await import(
      "../src/lib/scraper/turma-virtual/parse-tarefas-page"
    );

    const MENU_FIXTURE = `
      Menu Turma Virtual
      Principal Gerenciar Perfil Plano de Curso Participantes
      Frequência Ver Grupo Ver Notas
      Conteúdo/Página web Referências Vídeos Arquivos
      Avaliações Enquetes Tarefas Questionários
      Tarefas Individuais
      Tarefas Em Grupo
      <table><tr><th>Título</th><th>Período</th></tr>
      <tr><td>Menu Turma Virtual</td><td></td></tr>
      <tr><td>Frequência Ver Grupo Ver Notas</td><td></td></tr>
      </table>
    `;

    const tarefas = parseTarefasListPageHtml(MENU_FIXTURE);
    assert.equal(tarefas.length, 0);
  });

  test("ignora descrição colada no título no layout SIGAA ao vivo", async () => {
    const { parseTarefasListPageHtml } = await import(
      "../src/lib/scraper/turma-virtual/parse-tarefas-page"
    );

    const SIGAA_TAREFAS_FIXTURE = `
      Tarefas Individuais
      g.132). Envie o código-fonte alterado (ex4.asm). Atividade em dupla (máx. 3 alunos).
      MIC1 - A Unidade Lógica e Aritmética de 01/06/2026 às 0h00 a 06/07/2026 às 23h59 Não
      MIC1 - A Unidade Lógica e Aritmética de 01/06/2026 às 0h00 a 06/07/2026 às 23h59 Não
    `;

    const tarefas = parseTarefasListPageHtml(SIGAA_TAREFAS_FIXTURE);
    assert.equal(tarefas.length, 1);
    assert.equal(tarefas[0]?.titulo, "MIC1 - A Unidade Lógica e Aritmética");
    assert.equal(tarefas[0]?.dataFim, "2026-07-06");
    assert.equal(tarefas[0]?.tipo, "grupo");
  });

  test("monta snapshot de disciplina a partir das subpáginas", async () => {
    const { parseTurmaDisciplinaPages } = await import(
      "../src/lib/scraper/turma-virtual/parse-turma-disciplina"
    );

    const disciplina = parseTurmaDisciplinaPages({
      sigaaNome: "Engenharia de Software",
      sigaaUrl: "https://sig.cefetmg.br/mock",
      notasHtml: NOTAS_FIXTURE,
      frequenciaHtml: FREQUENCIA_FIXTURE,
      grupoHtml: GRUPO_FIXTURE,
      tarefasHtml: TAREFAS_FIXTURE,
      tarefaDetalhesHtml: { "Diagramas UML": TAREFA_DETALHE_FIXTURE },
    });

    assert.equal(disciplina.notas.length, 3);
    assert.equal(disciplina.faltas.length, 3);
    assert.equal(disciplina.grupoNome, "Grupo 6");
    assert.equal(disciplina.grupo.length, 2);
    assert.equal(disciplina.tarefas.length, 1);
    assert.equal(disciplina.scrapeWarnings.length, 0);
  });

  test("avisa frequência não parseada quando HTML parece mapa mas vem vazio", async () => {
    const { parseTurmaDisciplinaPages } = await import(
      "../src/lib/scraper/turma-virtual/parse-turma-disciplina"
    );
    const { shouldReplaceSyncedFaltas } = await import(
      "../src/lib/sync/turma-sync-replace-policy"
    );

    const disciplina = parseTurmaDisciplinaPages({
      sigaaNome: "Engenharia de Software",
      sigaaUrl: "https://sig.cefetmg.br/mock",
      notasHtml: null,
      frequenciaHtml: `
        <h3>Mapa de Frequências</h3>
        <table class="listing">
          <tr><th>Data</th><th>Frequência</th></tr>
        </table>
      `,
      grupoHtml: null,
      tarefasHtml: null,
      tarefaDetalhesHtml: {},
    });

    assert.equal(disciplina.faltas.length, 0);
    assert.ok(
      disciplina.scrapeWarnings.includes("frequência não parseada"),
      `warnings=${JSON.stringify(disciplina.scrapeWarnings)}`
    );
    assert.equal(shouldReplaceSyncedFaltas(disciplina), false);
  });
});

describe("B28 — scrapeTurmaVirtual (mock)", () => {
  test("mock retorna snapshot completo da turma virtual", async () => {
    const { scrapeTurmaVirtualMock } = await import(
      "../src/lib/scraper/turma-virtual/scrape-turma-virtual"
    );

    const snapshot = scrapeTurmaVirtualMock();

    assert.ok(snapshot.disciplinas.length >= 5);
    const engSoft = snapshot.disciplinas.find((item) =>
      item.sigaaNome.includes("Engenharia de Software")
    );
    assert.ok(engSoft);
    assert.ok(engSoft.notas.length >= 3);
    assert.ok(engSoft.tarefas.some((task) => task.titulo === "Diagramas UML"));
  });
});

describe("B28 — persistTurmaVirtualSnapshot", () => {
  before(async () => {
    const { ensureDbReady } = await import("../src/lib/db/bootstrap");
    ensureDbReady();

    const { persistPortalSnapshot } = await import(
      "../src/lib/sync/persist-portal-snapshot"
    );
    const { buildMockPortalSnapshot } = await import(
      "../src/lib/scraper/portal-discente/mock-portal-snapshot"
    );

    await persistPortalSnapshot(buildMockPortalSnapshot("12345678901"));
  });

  test("persiste notas, faltas e grupo da turma virtual", async () => {
    const { scrapeTurmaVirtualMock } = await import(
      "../src/lib/scraper/turma-virtual/scrape-turma-virtual"
    );
    const { persistTurmaVirtualSnapshot } = await import(
      "../src/lib/sync/persist-turma-virtual-snapshot"
    );
    const {
      getNotasByDisciplina,
      getFaltasByDisciplina,
      getGrupoByDisciplina,
      getTarefasByDisciplina,
      getSemestreAtualByCodigo,
    } = await import("../src/lib/db/queries");

    const snapshot = scrapeTurmaVirtualMock();
    persistTurmaVirtualSnapshot(snapshot);

    const notas = getNotasByDisciplina("ENG-SOFT");
    assert.ok(notas.some((nota) => nota.avaliacao_nome === "PRO1"));

    const faltas = getFaltasByDisciplina("ENG-SOFT");
    assert.ok(faltas.length >= 8);

    const grupo = getGrupoByDisciplina("ENG-SOFT");
    assert.equal(grupo.length, 2);

    const semestre = getSemestreAtualByCodigo("ENG-SOFT");
    assert.ok(semestre?.professor);
    assert.equal(semestre?.max_faltas, 15);
    assert.equal(semestre?.grupo_nome, "Grupo 1");
  });

  test("não sobrescreve nota manual do usuário", async () => {
    const { scrapeTurmaVirtualMock } = await import(
      "../src/lib/scraper/turma-virtual/scrape-turma-virtual"
    );
    const { persistTurmaVirtualSnapshot } = await import(
      "../src/lib/sync/persist-turma-virtual-snapshot"
    );
    const { upsertSyncedNota, getNotasByDisciplina } = await import(
      "../src/lib/db/queries"
    );

    upsertSyncedNota({
      disciplina_id: "LAOCI",
      avaliacao_nome: "PRO1",
      nota_maxima: 10,
      nota_obtida: 7.5,
      manual: 1,
    });

    const snapshot = scrapeTurmaVirtualMock();
    persistTurmaVirtualSnapshot(snapshot);

    const nota = getNotasByDisciplina("LAOCI").find(
      (item) => item.avaliacao_nome === "PRO1"
    );
    assert.equal(nota?.nota_obtida, 7.5);
    assert.equal(nota?.manual, 1);
  });

  test("preserva notas sync quando scrape da disciplina falha", async () => {
    const { scrapeTurmaVirtualMock } = await import(
      "../src/lib/scraper/turma-virtual/scrape-turma-virtual"
    );
    const { persistTurmaVirtualSnapshot } = await import(
      "../src/lib/sync/persist-turma-virtual-snapshot"
    );
    const { upsertSyncedNota, getNotasByDisciplina } = await import(
      "../src/lib/db/queries"
    );

    upsertSyncedNota({
      disciplina_id: "LAEDI",
      avaliacao_nome: "PRO1",
      nota_maxima: 30,
      nota_obtida: 22,
      manual: 0,
    });

    const snapshot = scrapeTurmaVirtualMock();
    const laedi = snapshot.disciplinas.find((item) =>
      item.sigaaNome.includes("Lab. Alg.")
    );
    assert.ok(laedi);
    laedi.notas = [];
    laedi.scrapeWarnings = ["Não foi possível entrar na disciplina."];

    persistTurmaVirtualSnapshot(snapshot);

    const nota = getNotasByDisciplina("LAEDI").find(
      (item) => item.avaliacao_nome === "PRO1"
    );
    assert.equal(nota?.nota_obtida, 22);
  });
});

describe("B28 — runSync integração turma virtual", () => {
  before(async () => {
    const { ensureDbReady } = await import("../src/lib/db/bootstrap");
    ensureDbReady();
  });

  test("runSync persiste portal e turma virtual em modo mock", async () => {
    const { runSync } = await import("../src/lib/sync/run-sync");
    const { getNotasByDisciplina, getGrupoByDisciplina } = await import(
      "../src/lib/db/queries"
    );

    await runSync({
      username: "12345678901",
      password: "mock",
      savePassword: false,
    });

    assert.ok(getNotasByDisciplina("ENG-SOFT").length > 0);
    assert.ok(getGrupoByDisciplina("ENG-SOFT").length > 0);
  });
});
