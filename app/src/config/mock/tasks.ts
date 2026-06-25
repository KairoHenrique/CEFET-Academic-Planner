export type TaskType = "individual" | "grupo";

export interface AcademicTask {
  id: number;
  title: string;
  subject: string;
  subjectCode: string;
  subjectColor: string;
  date: string;
  type: TaskType;
  done: boolean;
  description: string;
  instructions: string[];
  deliverables: string[];
  hasGrade: boolean;
  maxGrade?: number;
}

export const academicTasks: AcademicTask[] = [
  {
    id: 1,
    title: "Diagramas UML",
    subject: "Eng. de Software",
    subjectCode: "ENG-SOFT",
    subjectColor: "var(--jersey-sky)",
    date: "20/05/2026",
    type: "individual",
    done: false,
    description:
      "Elaborar diagramas UML da modelagem do sistema proposto no projeto da disciplina, cobrindo casos de uso, classes e sequência dos fluxos principais.",
    instructions: [
      "Identificar atores e casos de uso do sistema.",
      "Modelar classes com atributos, métodos e relacionamentos.",
      "Descrever ao menos dois fluxos com diagrama de sequência.",
      "Exportar os diagramas em PDF ou imagem legível.",
    ],
    deliverables: [
      "Arquivo PDF com todos os diagramas",
      "Breve texto explicando as decisões de modelagem",
    ],
    hasGrade: true,
    maxGrade: 10,
  },
  {
    id: 2,
    title: "MIC1 — A Unidade Lógica e Aritmética",
    subject: "Lab. Arq. e Org. de Comp. I",
    subjectCode: "LAOCI",
    subjectColor: "var(--gold-400)",
    date: "06/07/2026",
    type: "individual",
    done: false,
    description:
      "Implementar em linguagem de montagem uma ULA capaz de executar operações lógicas e aritméticas básicas, conforme especificação do roteiro do laboratório.",
    instructions: [
      "Ler o roteiro completo na turma virtual antes de iniciar.",
      "Implementar as operações AND, OR, NOT, ADD e SUB.",
      "Testar cada operação com entradas conhecidas.",
      "Documentar o código com comentários explicando cada bloco.",
    ],
    deliverables: [
      "Código-fonte da ULA (.asm ou conforme roteiro)",
      "Relatório com capturas dos testes realizados",
    ],
    hasGrade: true,
    maxGrade: 10,
  },
  {
    id: 3,
    title: "Projeto Final",
    subject: "Eng. de Software",
    subjectCode: "ENG-SOFT",
    subjectColor: "var(--jersey-sky)",
    date: "16/06/2026",
    type: "grupo",
    done: false,
    description:
      "Desenvolver em equipe a versão final do sistema planejado ao longo do semestre, integrando requisitos, arquitetura, implementação e documentação técnica.",
    instructions: [
      "Definir papéis no grupo e registrar na turma virtual.",
      "Integrar os módulos desenvolvidos nas sprints anteriores.",
      "Preparar apresentação de 15 minutos com demo ao vivo.",
      "Submeter documentação de arquitetura e manual do usuário.",
    ],
    deliverables: [
      "Repositório com código-fonte completo",
      "Documento de arquitetura (PDF)",
      "Apresentação em slides",
      "Vídeo ou demo gravada (opcional, conforme professor)",
    ],
    hasGrade: true,
    maxGrade: 30,
  },
  {
    id: 4,
    title: "Seminário Metodologia Ágil",
    subject: "Eng. de Software",
    subjectCode: "ENG-SOFT",
    subjectColor: "var(--jersey-sky)",
    date: "26/04/2026",
    type: "grupo",
    done: true,
    description:
      "Apresentar em grupo um seminário comparando metodologias ágeis (Scrum, Kanban e XP), com foco em aplicação em projetos acadêmicos.",
    instructions: [
      "Pesquisar fontes acadêmicas sobre cada metodologia.",
      "Preparar slides com exemplos práticos.",
      "Distribuir a fala entre os integrantes do grupo.",
    ],
    deliverables: ["Slides da apresentação", "Lista de referências bibliográficas"],
    hasGrade: true,
    maxGrade: 10,
  },
  {
    id: 5,
    title: "1ª Avaliação",
    subject: "Lab. Arq. e Org. de Comp. I",
    subjectCode: "LAOCI",
    subjectColor: "var(--gold-400)",
    date: "18/06/2026",
    type: "individual",
    done: false,
    description:
      "Prova presencial sobre representação de dados, portas lógicas, circuitos combinacionais e introdução à ULA.",
    instructions: [
      "Revisar listas de exercícios das aulas 1 a 6.",
      "Estudar tabelas verdade e simplificação de expressões booleanas.",
      "Levar calculadora não programável, se permitido no edital.",
      "Chegar com 15 minutos de antecedência.",
    ],
    deliverables: ["Prova escrita em sala de aula"],
    hasGrade: true,
    maxGrade: 10,
  },
];

export function getTaskById(id: number): AcademicTask | undefined {
  return academicTasks.find((task) => task.id === id);
}

export function getTasksBySubjectCode(code: string): AcademicTask[] {
  return academicTasks.filter(
    (task) => task.subjectCode.toLowerCase() === code.toLowerCase()
  );
}
