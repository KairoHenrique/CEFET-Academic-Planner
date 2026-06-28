import type { ChType } from "@/lib/integralizacao/ch-catalog";
import { getChCatalog } from "@/lib/integralizacao/ch-catalog";

export interface ChGlossaryEntry {
  tipoCh: ChType;
  title: string;
  summary: string;
  description: string;
  examples: string[];
  ppcHours: number;
  regulation?: string;
}

const PPC_COURSE =
  "Engenharia de Computação — CEFET-MG Divinópolis (PPC v2, 4.320 h totais)";

function hoursFor(tipoCh: ChType): number {
  return (
    getChCatalog().find((entry) => entry.tipoCh === tipoCh)?.totalRequired ?? 0
  );
}

export const CH_GLOSSARY: readonly ChGlossaryEntry[] = [
  {
    tipoCh: "Obrigatória",
    title: "Obrigatória",
    summary:
      "Disciplinas e componentes da matriz curricular que você precisa cursar e aprovar.",
    description:
      "No SIGAA, somam-se as horas dos componentes curriculares obrigatórios do PPC — núcleo básico, tecnológico e profissional, incluindo laboratórios, PFC e estágio quando previstos como obrigatórios na grade. É o bloco principal da integralização.",
    examples: [
      "Cálculo I, Algoritmos e Estruturas de Dados, Engenharia de Software",
      "Redes de Computadores, Arquitetura de Computadores, PFC e estágio curricular",
    ],
    ppcHours: hoursFor("Obrigatória"),
    regulation: PPC_COURSE,
  },
  {
    tipoCh: "Optativa",
    title: "Optativa (eletiva)",
    summary:
      "Eletivas do catálogo do seu curso, escolhidas por você na matrícula.",
    description:
      "Componentes optativos listados no PPC do Eng. Computação. No SIGAA costumam aparecer no 0º nível da matrícula. Contam aqui apenas eletivas do catálogo do curso — disciplina de outro curso ou IES entra em Complementar, não em Optativa.",
    examples: [
      "Ciência dos Dados, Inteligência Artificial (como optativa do PPC)",
      "Computação Gráfica, Linguagens Formais — quando cursadas como eletiva",
    ],
    ppcHours: hoursFor("Optativa"),
    regulation: "Resoluções CEFET-MG · catálogo de optativas do PPC",
  },
  {
    tipoCh: "Complementar",
    title: "Complementar (ACC)",
    summary:
      "Atividades Complementares de Curso (ACC) homologadas fora da grade rígida.",
    description:
      "Eixo de Prática Profissional e Integração Curricular do CEFET-MG. Inclui iniciação científica (até 360 h), monitoria (até 180 h), extensão comunitária (até 120 h), prática profissional (até 90 h) e outras ACC (até 120 h), com documentação e avaliação do colegiado. O app permite cadastrar horas que o SIGAA ainda não refletiu.",
    examples: [
      "IC/PIC, monitoria em disciplina do CEFET-MG",
      "Curso de idiomas, participação na Semana de C&T, disciplina de outra IES homologada",
    ],
    ppcHours: hoursFor("Complementar"),
    regulation:
      "DECOM CEFET-MG · Res. CEPE 24/08, CEPE 39/10, CGRAD 17/11 e 19/11",
  },
  {
    tipoCh: "Extensão",
    title: "Extensão universitária",
    summary:
      "Ações de extensão (universidade ↔ sociedade), com meta ~10% da CH total.",
    description:
      "Atividades extensionistas registradas no SIGAA e vinculadas à política de extensão do CEFET-MG (DEDC). O PPC exige cerca de 450 h (~10% de 4.320 h). Projetos, cursos, eventos e campanhas devem ser validados como extensão — não confundir com ACC genérica ou optativa.",
    examples: [
      "Projeto extensionista do CEFET-MG com CH lançada em Extensão",
      "Ação comunitária coordenada pela DEDC e validada no histórico",
    ],
    ppcHours: hoursFor("Extensão"),
    regulation: "Res. CEPE 04/22 · Política de Extensão CEFET-MG",
  },
  {
    tipoCh: "Flexibilizada",
    title: "Flexibilizada",
    summary:
      "CH de vivências especiais previstas no PPC e validadas pelo colegiado.",
    description:
      "Horas reconhecidas por experiências ou equivalências fora do fluxo padrão da grade — intercâmbio homologado, validação de competência ou atividade flexibilizada prevista no regulamento do curso. O PPC reserva 30 h nesta categoria.",
    examples: [
      "Intercâmbio ou equivalência de disciplina aprovada pelo colegiado",
      "Atividade flexibilizada prevista no PPC com validação formal",
    ],
    ppcHours: hoursFor("Flexibilizada"),
    regulation: PPC_COURSE,
  },
] as const;

export const CH_GLOSSARY_INTRO =
  "O SIGAA agrupa sua formação em cinco tipos de carga horária. Os totais exigidos vêm do PPC do curso; o progresso é atualizado pelo histórico escolar e pelas ACC homologadas.";

const glossaryByType = new Map(
  CH_GLOSSARY.map((entry) => [entry.tipoCh, entry] as const)
);

export function getChGlossaryEntry(tipoCh: ChType): ChGlossaryEntry | undefined {
  return glossaryByType.get(tipoCh);
}
