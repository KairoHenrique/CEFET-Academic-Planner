import type { ChType } from "@/lib/integralizacao/ch-catalog";

export interface ChGlossaryEntry {
  tipoCh: ChType;
  title: string;
  summary: string;
  description: string;
  examples: string[];
}

export const CH_GLOSSARY: readonly ChGlossaryEntry[] = [
  {
    tipoCh: "Obrigatória",
    title: "Obrigatória",
    summary: "Disciplinas obrigatórias da grade do seu curso (PPC).",
    description:
      "Horas das matérias núcleo que compõem a formação prevista no PPC — você precisa cursá-las para integralizar.",
    examples: [
      "Cálculo I, Algoritmos, Física I",
      "Matérias núcleo de Moda ou Mecatrônica conforme PPC",
    ],
  },
  {
    tipoCh: "Optativa",
    title: "Optativa (eletiva)",
    summary:
      "Disciplinas escolhidas dentro do catálogo de optativas do seu curso.",
    description:
      "Eletivas listadas no PPC do seu curso. Não confunda com disciplinas de qualquer outro curso da faculdade.",
    examples: [
      "Eletiva de IA, Empreendedorismo",
      "Optativa prevista no catálogo do PPC",
    ],
  },
  {
    tipoCh: "Complementar",
    title: "Complementar",
    summary:
      "CH fora do núcleo estrito da grade — enriquecimento e atividades reconhecidas.",
    description:
      "Atividades formais que ampliam sua formação além do núcleo obrigatório, quando homologadas ou reconhecidas.",
    examples: [
      "Disciplina de outro curso ou campus",
      "Curso de idiomas, workshop ou certificação homologada",
    ],
  },
  {
    tipoCh: "Extensão",
    title: "Extensão",
    summary:
      "Ações de extensão universitária ligadas à instituição e à comunidade.",
    description:
      "Projetos e atividades que conectam universidade e sociedade, validados como extensão no CEFET.",
    examples: [
      "Projeto de extensão no CEFET",
      "Evento ou campanha extensionista validada pela coordenação",
    ],
  },
  {
    tipoCh: "Flexibilizada",
    title: "Flexibilizada",
    summary:
      "CH por experiências práticas ou atividades especiais previstas no regulamento.",
    description:
      "Estágio, monitoria, IC, intercâmbio ou equivalências reconhecidas conforme regras do curso.",
    examples: [
      "Estágio curricular supervisionado",
      "Monitoria, iniciação científica ou intercâmbio validado",
    ],
  },
] as const;

const glossaryByType = new Map(
  CH_GLOSSARY.map((entry) => [entry.tipoCh, entry] as const)
);

export function getChGlossaryEntry(tipoCh: ChType): ChGlossaryEntry | undefined {
  return glossaryByType.get(tipoCh);
}
