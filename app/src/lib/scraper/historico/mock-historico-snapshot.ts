import type { HistoricoSnapshot } from "@/lib/scraper/types/historico";

/** Subconjunto estável para testes e mock offline (códigos PPC reais). */
export function buildMockHistoricoSnapshot(): HistoricoSnapshot {
  return {
    scrapedAt: new Date().toISOString(),
    disciplinas: [
      {
        codigo: "G05CFVR1.01",
        nome: "Cálculo com Funções de uma Variável Real",
        semestre: "2024.1",
        horaAula: 75,
        ch: 90,
        frequencia: 100,
        media: 21,
        conceito: "F",
        situacao: "REP",
        optativo: false,
      },
      {
        codigo: "G05IPCO0.01",
        nome: "Introdução à Programação de Computadores",
        semestre: "2024.1",
        horaAula: 50,
        ch: 60,
        frequencia: 100,
        media: 60,
        conceito: "D",
        situacao: "APR",
        optativo: false,
      },
      {
        codigo: "G05MDIS0.02",
        nome: "Matemática Discreta",
        semestre: "2024.1",
        horaAula: 50,
        ch: 60,
        frequencia: 100,
        media: 34,
        conceito: "F",
        situacao: "REP",
        optativo: false,
      },
    ],
    chResumo: [
      {
        tipo: "Optativa",
        exigido: 360,
        integralizado: 120,
        pendente: 240,
      },
      {
        tipo: "Obrigatória",
        exigido: 3105,
        integralizado: 570,
        pendente: 2535,
      },
    ],
  };
}
