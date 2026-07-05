/** Catálogo B39/B68d — tabelas globais (sem `user_id`) vs tenant (por aluno). */

export const GLOBAL_DATA_TABLES = [
  "disciplinas",
  "requisitos",
  "calendario_academico",
  "turmas_ofertadas",
  "app_config",
] as const;

export const TENANT_DATA_TABLES = [
  "aluno",
  "historico",
  "semestre_atual",
  "notas",
  "faltas",
  "tarefas",
  "grupo_membros",
  "integralizacao",
  "eventos_calendario",
  "configuracoes",
] as const;

export const ACCOUNT_TABLES = ["app_profiles", "trial_por_cpf"] as const;

export type GlobalDataTable = (typeof GLOBAL_DATA_TABLES)[number];
export type TenantDataTable = (typeof TENANT_DATA_TABLES)[number];

export function isGlobalDataTable(table: string): table is GlobalDataTable {
  return (GLOBAL_DATA_TABLES as readonly string[]).includes(table);
}

export function isTenantDataTable(table: string): table is TenantDataTable {
  return (TENANT_DATA_TABLES as readonly string[]).includes(table);
}

/** Chave única em `app_config` — policy operacional §6.6 SCOPE-CLOUD. */
export const SYNC_POLICY_OVERRIDES_KEY = "sync.policy.overrides";

/** Estado global do orquestrador (prefixo). */
export const SYNC_ORCHESTRATOR_STATE_PREFIX = "sync.state.";
