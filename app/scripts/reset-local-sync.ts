/**
 * Apaga dados sincronizados (por CPF ou todas as contas em `.data/users/`).
 * Uso:
 *   npx tsx scripts/reset-local-sync.ts           # legado + todas as contas
 *   npx tsx scripts/reset-local-sync.ts 12345678901  # só um CPF
 */
import fs from "node:fs";
import path from "node:path";
import { clearSigaaCredentials } from "../src/lib/crypto/sigaa-credential-store";
import { ensureDbReady } from "../src/lib/db/bootstrap";
import {
  normalizeSigaaUsername,
  resetConnectionsForTests,
  resolveUserDataDir,
  runWithUserDb,
} from "../src/lib/db/connection-manager";
import db, { resolveDbPath } from "../src/lib/db/index";
import {
  clearSyncedStudentData,
  getAluno,
  getHistorico,
  getSemestreAtual,
  setConfig,
} from "../src/lib/db/queries";

const SYNC_CONFIG_KEYS = [
  "sync.last_at",
  "sync.username",
  "sync.historico_at",
  "sigaa.username",
  "sigaa.ch.total_curriculo",
  "sigaa.ch.percent_integralizado",
  "sigaa.ch.total_integralizado",
  "sigaa.ch.from_historico_pdf",
] as const;

function clearScrapeDebugIn(dir: string): number {
  const debugDir = path.join(dir, "scrape-debug");
  if (!fs.existsSync(debugDir)) return 0;

  let removed = 0;
  for (const entry of fs.readdirSync(debugDir)) {
    fs.rmSync(path.join(debugDir, entry), { recursive: true, force: true });
    removed += 1;
  }
  return removed;
}

function resetUserDatabase(username: string): number {
  let debugRemoved = 0;

  runWithUserDb(username, () => {
    ensureDbReady();
    clearSyncedStudentData();
    clearSigaaCredentials();
    for (const key of SYNC_CONFIG_KEYS) {
      setConfig(key, "");
    }
    db.pragma("wal_checkpoint(TRUNCATE)");
    debugRemoved = clearScrapeDebugIn(resolveUserDataDir(username));
  });

  resetConnectionsForTests();
  return debugRemoved;
}

function resetLegacyDatabase(): number {
  delete process.env.DB_PATH;
  ensureDbReady();

  const before = getAluno();
  clearSyncedStudentData();
  clearSigaaCredentials();
  for (const key of SYNC_CONFIG_KEYS) {
    setConfig(key, "");
  }
  db.pragma("wal_checkpoint(TRUNCATE)");
  db.pragma("vacuum");

  const debugRemoved = clearScrapeDebugIn(path.dirname(resolveDbPath()));
  console.log(
    "Legado:",
    before ? `${before.matricula} — ${before.nome}` : "(sem aluno)"
  );
  return debugRemoved;
}

function resetAllUserDirectories(): number {
  const usersRoot = path.join(process.cwd(), ".data", "users");
  if (!fs.existsSync(usersRoot)) return 0;

  let debugRemoved = 0;
  for (const entry of fs.readdirSync(usersRoot)) {
    const userDir = path.join(usersRoot, entry);
    if (!fs.statSync(userDir).isDirectory()) continue;
    debugRemoved += clearScrapeDebugIn(userDir);
    fs.rmSync(userDir, { recursive: true, force: true });
    console.log(`Removido: .data/users/${entry}`);
  }
  resetConnectionsForTests();
  return debugRemoved;
}

function main(): void {
  const target = process.argv[2]?.trim();

  if (target) {
    const slug = normalizeSigaaUsername(target);
    const removed = resetUserDatabase(target);
    console.log(`CPF ${slug}: SQLite + ${removed} arquivo(s) de debug apagados.`);
    return;
  }

  const legacyDebug = resetLegacyDatabase();
  const usersDebug = resetAllUserDirectories();

  console.log("Depois aluno (legado):", getAluno() ?? "(vazio)");
  console.log("historico:", getHistorico().length, "linha(s)");
  console.log("semestre_atual:", getSemestreAtual().length, "disciplina(s)");
  console.log(
    "scrape-debug:",
    legacyDebug + usersDebug,
    "arquivo(s) removido(s)"
  );
  console.log("OK — contas resetadas; pronto para sync full.");
}

main();
