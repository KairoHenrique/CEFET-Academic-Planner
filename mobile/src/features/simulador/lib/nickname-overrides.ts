/**
 * Apelidos curados por nome de disciplina (Eng. Computação — CEFET-MG).
 *
 * A heurística automática (`suggestBaseNickname`) prioriza o código SIGAA, o que
 * gera siglas ruins/ambíguas (ex.: "INT" para Interação Humano-Computador, "CIE"
 * para Ciência dos Dados). Este mapa fornece siglas legíveis e reconhecíveis.
 *
 * A chave é o nome normalizado (minúsculo, sem acentos, sem pontuação) — estável
 * entre PPC e SIGAA. Disciplinas fora do mapa caem na heurística padrão.
 */

/** Normaliza o nome para uso como chave — resistente a acento/pontuação/caixa. */
function normalizeNicknameKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * nome → apelido (máx. 10 chars). Estilo compacto e em caixa alta, consistente
 * com as siglas já usadas no SIGAA (AEDII, AOCII, LAOCII…).
 */
const RAW_NICKNAME_OVERRIDES: Record<string, string> = {
  // 1º período
  "Cálculo com Funções de uma Variável Real": "CALCI",
  "Geometria Analítica e Álgebra Linear": "GAAL",
  "Matemática Discreta": "MATDISC",
  "Introdução à Programação de Computadores": "IPC",
  "Laboratório de Introdução à Programação de Computadores": "LIPC",
  "Contexto Social e Profissional da Engenharia de Computação": "Contexto",
  "Filosofia da Tecnologia": "Filosofia",
  // 2º período
  "Integração e Séries": "Integração",
  "Cálculo com Funções de Várias Variáveis I": "CVVI",
  "Fundamentos de Mecânica": "FUNDMECA",
  "Programação Orientada à Objetos": "POO",
  "Laboratório de Programação Orientada à Objetos": "LPOO",
  "Sistemas Digitais para Computação": "Sistemas",
  "Laboratório de Sistemas Digitais para Computação": "LSistemas",
  "Metodologia Científica": "Metodologia",
  "Introdução à Sociologia": "SOCIO",
  // 3º período
  "Equações Diferenciais Ordinárias": "EDO",
  "Cálculo com Funções de Várias Variáveis II": "CVVII",
  "Fundamentos de Oscilações, Fluidos e Termodinâmica (OFT)": "OFT",
  "Física Experimental - MOFT": "FISMOFT",
  "Algoritmos e Estruturas de Dados I": "AEDI",
  "Laboratório de Algoritmos e Estruturas de Dados I": "LAEDI",
  "Arquitetura e Organização de Computadores I": "AOCI",
  "Laboratório de Arquitetura e Organização de Computadores I": "LAOCI",
  // 4º período
  "Métodos Numéricos Computacionais": "Métodos",
  "Fundamentos de Eletromagnetismo": "ELETMAG",
  "Física Experimental - Eletromagnetismo": "FISEMAG",
  "Algoritmos e Estruturas de Dados II": "AEDII",
  "Linguagens de Programação": "LP",
  "Análise de Circuitos Elétricos": "ANCIRC",
  "Arquitetura e Organização de Computadores II": "AOCII",
  "Laboratório de Arquitetura e Organização de Computadores II": "LAOCII",
  // 5º período
  Estatística: "ESTAT",
  "Banco de Dados I": "BDI",
  "Engenharia de Software": "ENGSOFT",
  "Sinais e Sistemas Lineares": "Sinais",
  Eletrônica: "ELETRON",
  "Laboratório de Eletrônica": "LELET",
  // 6º período
  "Linguagens Formais e Autômatos": "LFA",
  "Teoria de Controle": "Controle",
  "Laboratório de Teoria de Controle": "LControle",
  "Sistemas Operacionais": "SO",
  "Redes de Computadores I": "REDESI",
  "Laboratório de Redes de Computadores I": "LREDI",
  "Inteligência Artificial": "IA",
  // 7º período
  Compiladores: "COMPIL",
  "Microprocesadores e microcontroladores": "MICRO",
  "Laboratório de Microprocesadores e microcontroladores": "LMICRO",
  "Inteligência Computacional": "INTCOMP",
  "Pesquisa Operacional": "PESQOP",
  // 8º período
  "Computação Gráfica": "COMPGRAF",
  "Interação Humano-Computador": "IHC",
  "Sistemas Distribuídos": "SISDIST",
  "Gestão Organizacional": "Gestão",
  "Ciência dos Dados": "CDADOS",
  // 9º/10º período
  "Empreendedorismo e Plano de negócios": "EMPREEND",
  "Metodologia de Pesquisa": "METPESQ",
  "Psicologia Aplicada às Organizações": "PSICO",
  "Atividade de PFC 1": "PFC1",
  "Atividade de PFC 2": "PFC2",
  "Atividade de Estágio Supervisionado": "ESTAGIO",
};

const NICKNAME_OVERRIDES: Map<string, string> = new Map(
  Object.entries(RAW_NICKNAME_OVERRIDES).map(([name, nick]) => [
    normalizeNicknameKey(name),
    nick,
  ])
);

/** Apelidos curados podem passar do limite automático (10) — cap de segurança. */
const OVERRIDE_MAX_LENGTH = 12;

/** Retorna a sigla curada do nome, ou `null` se não houver override. */
export function resolveNicknameOverride(name: string): string | null {
  const key = normalizeNicknameKey(name);
  if (!key) return null;

  const nick = NICKNAME_OVERRIDES.get(key);
  if (!nick) return null;

  return nick
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, OVERRIDE_MAX_LENGTH);
}
