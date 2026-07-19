import type { AppCursoId } from "@/lib/auth/account/types";
import {
  isAppCursoId,
  resolveCursoLabel,
} from "@/lib/auth/account/curso-catalog";
import { DEFAULT_CURSO_ID } from "@/lib/db/backend/config";
import type { ChType } from "@/lib/integralizacao/ch-catalog";
import {
  getChCatalogForCurso,
  getIntegrationTotalHours,
} from "@/lib/integralizacao/ch-catalog";

export interface ChGlossaryEntry {
  tipoCh: ChType;
  title: string;
  summary: string;
  description: string;
  examples: string[];
  ppcHours: number;
  regulation?: string;
}

function hoursFor(tipoCh: ChType, cursoId: string): number {
  return (
    getChCatalogForCurso(cursoId).find((entry) => entry.tipoCh === tipoCh)
      ?.totalRequired ?? 0
  );
}

function courseRegulation(cursoId: string): string {
  const label = isAppCursoId(cursoId)
    ? resolveCursoLabel(cursoId)
    : resolveCursoLabel("eng-computacao");
  const total = getIntegrationTotalHours(cursoId).toLocaleString("pt-BR");
  return `${label} — CEFET-MG Divinópolis (PPC · ${total} h totais)`;
}

/** Textos estáveis; horas/regulation mudam por curso. */
const GLOSSARY_COPY: Omit<ChGlossaryEntry, "ppcHours" | "regulation">[] = [
  {
    tipoCh: "Obrigatória",
    title: "Obrigatória",
    summary:
      "Disciplinas e componentes da matriz curricular que você precisa cursar e aprovar.",
    description:
      "No SIGAA, somam-se as horas dos componentes curriculares obrigatórios do PPC — núcleo básico, tecnológico e profissional, incluindo laboratórios, PFC/TCC e estágio quando previstos como obrigatórios na grade. É o bloco principal da integralização.",
    examples: [
      "Disciplinas da grade obrigatória do seu PPC",
      "Laboratórios, PFC/TCC e estágio curricular quando previstos como obrigatórios",
    ],
  },
  {
    tipoCh: "Optativa",
    title: "Optativa (eletiva)",
    summary:
      "Eletivas do catálogo do seu curso, escolhidas por você na matrícula.",
    description:
      "Componentes optativos listados no PPC do seu curso. No SIGAA costumam aparecer no 0º nível da matrícula. Contam aqui apenas eletivas do catálogo do curso — disciplina de outro curso ou IES entra em Complementar, não em Optativa.",
    examples: [
      "Optativas do catálogo do PPC do seu curso",
      "Eletivas homologadas pelo colegiado do curso",
    ],
  },
  {
    tipoCh: "Complementar",
    title: "Complementar (ACC)",
    summary:
      "Atividades Complementares de Curso (ACC) homologadas fora da grade rígida.",
    description:
      "Eixo de Prática Profissional e Integração Curricular do CEFET-MG. Inclui iniciação científica, monitoria, extensão comunitária, prática profissional e outras ACC, com documentação e avaliação do colegiado. O app permite cadastrar horas que o SIGAA ainda não refletiu.",
    examples: [
      "IC/PIC, monitoria em disciplina do CEFET-MG",
      "Curso de idiomas, participação na Semana de C&T, disciplina de outra IES homologada",
    ],
  },
  {
    tipoCh: "Extensão",
    title: "Extensão universitária",
    summary:
      "Ações de extensão (universidade ↔ sociedade), com meta proporcional do PPC.",
    description:
      "Atividades extensionistas registradas no SIGAA e vinculadas à política de extensão do CEFET-MG (DEDC). Projetos, cursos, eventos e campanhas devem ser validados como extensão — não confundir com ACC genérica ou optativa.",
    examples: [
      "Projeto extensionista do CEFET-MG com CH lançada em Extensão",
      "Ação comunitária coordenada pela DEDC e validada no histórico",
    ],
  },
  {
    tipoCh: "Flexibilizada",
    title: "Flexibilizada",
    summary:
      "CH de vivências especiais previstas no PPC e validadas pelo colegiado.",
    description:
      "Horas reconhecidas por experiências ou equivalências fora do fluxo padrão da grade — intercâmbio homologado, validação de competência ou atividade flexibilizada prevista no regulamento do curso.",
    examples: [
      "Intercâmbio ou equivalência de disciplina aprovada pelo colegiado",
      "Atividade flexibilizada prevista no PPC com validação formal",
    ],
  },
];

export function getChGlossaryForCurso(
  cursoId: string = DEFAULT_CURSO_ID
): ChGlossaryEntry[] {
  const regulation = courseRegulation(cursoId);
  return GLOSSARY_COPY.map((entry) => ({
    ...entry,
    ppcHours: hoursFor(entry.tipoCh, cursoId),
    regulation:
      entry.tipoCh === "Complementar"
        ? "DECOM CEFET-MG · Res. CEPE 24/08, CEPE 39/10, CGRAD 17/11 e 19/11"
        : entry.tipoCh === "Extensão"
          ? "Res. CEPE 04/22 · Política de Extensão CEFET-MG"
          : entry.tipoCh === "Optativa"
            ? "Resoluções CEFET-MG · catálogo de optativas do PPC"
            : regulation,
  }));
}

/** @deprecated Prefer `getChGlossaryForCurso(cursoId)` — mantido para Eng. Comp. */
export const CH_GLOSSARY: readonly ChGlossaryEntry[] =
  getChGlossaryForCurso(DEFAULT_CURSO_ID);

export const CH_GLOSSARY_INTRO =
  "O SIGAA agrupa sua formação em cinco tipos de carga horária. Os totais exigidos vêm do PPC do seu curso; o progresso é atualizado pelo histórico escolar e pelas ACC homologadas.";

export function getChGlossaryEntry(
  tipoCh: ChType,
  cursoId: string = DEFAULT_CURSO_ID
): ChGlossaryEntry | undefined {
  return getChGlossaryForCurso(cursoId).find((entry) => entry.tipoCh === tipoCh);
}

export function resolveGlossaryCursoBadge(cursoId: string): string {
  if (isAppCursoId(cursoId)) {
    return `CEFET-MG · ${resolveCursoLabel(cursoId)}`;
  }
  return "CEFET-MG · Eng. Computação";
}
