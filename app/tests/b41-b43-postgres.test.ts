import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadPpcSeedData } from "../src/lib/db/ppc-seed-loader";
import {
  isPostgresBackend,
  resolveDefaultCursoId,
  resolvePlannerDatabaseBackend,
} from "../src/lib/db/backend/config";

describe("B41 — seed PPC global", () => {
  it("carrega disciplinas_db.json com disciplinas e requisitos", () => {
    const items = loadPpcSeedData();
    assert.ok(items.length > 40, "esperado PPC EngComp com dezenas de disciplinas");
    assert.ok(items.every((item) => item.disciplina.codigo.length > 0));
    assert.ok(items.some((item) => item.requisitos.length > 0));
  });

  it("curso padrão eng-computacao", () => {
    assert.equal(resolveDefaultCursoId(), "eng-computacao");
  });
});

describe("B42 — backend postgres", () => {
  it("sqlite por padrão sem PLANNER_DATABASE=postgres", () => {
    const prevDb = process.env.PLANNER_DATABASE;
    const prevUrl = process.env.DATABASE_URL;
    delete process.env.PLANNER_DATABASE;
    delete process.env.DATABASE_URL;
    assert.equal(resolvePlannerDatabaseBackend(), "sqlite");
    assert.equal(isPostgresBackend(), false);
    process.env.PLANNER_DATABASE = prevDb;
    process.env.DATABASE_URL = prevUrl;
  });
});

describe("B43 — sync stub cloud", () => {
  it("modo postgres detectável via env", () => {
    const prevDb = process.env.PLANNER_DATABASE;
    const prevUrl = process.env.DATABASE_URL;
    process.env.PLANNER_DATABASE = "postgres";
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/postgres";
    assert.equal(isPostgresBackend(), true);
    process.env.PLANNER_DATABASE = prevDb;
    process.env.DATABASE_URL = prevUrl;
  });
});
