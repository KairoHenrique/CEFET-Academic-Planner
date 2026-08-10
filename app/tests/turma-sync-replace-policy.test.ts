import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { TurmaVirtualDisciplinaSnapshot } from "@/lib/scraper/types/turma-virtual";
import {
  shouldReplaceSyncedFaltas,
  shouldReplaceSyncedGrupo,
  shouldReplaceSyncedNotas,
} from "@/lib/sync/turma-sync-replace-policy";

function disciplina(
  overrides: Partial<TurmaVirtualDisciplinaSnapshot>
): TurmaVirtualDisciplinaSnapshot {
  return {
    sigaaNome: "Disciplina",
    sigaaUrl: null,
    professor: null,
    maxFaltas: null,
    notas: [],
    faltas: [],
    grupoNome: null,
    grupo: [],
    tarefas: [],
    scrapeWarnings: [],
    ...overrides,
  };
}

describe("turma-sync-replace-policy", () => {
  test("substitui notas quando o scrape trouxe avaliações", () => {
    assert.equal(
      shouldReplaceSyncedNotas(
        disciplina({
          notas: [
            {
              avaliacaoNome: "PRO1",
              notaMaxima: 10,
              notaObtida: 8,
            },
          ],
        })
      ),
      true
    );
  });

  test("preserva notas quando a página de notas falhou", () => {
    assert.equal(
      shouldReplaceSyncedNotas(
        disciplina({
          scrapeWarnings: ["notas indisponíveis"],
        })
      ),
      false
    );
    assert.equal(
      shouldReplaceSyncedNotas(
        disciplina({
          scrapeWarnings: ["Não foi possível entrar na disciplina."],
        })
      ),
      false
    );
    assert.equal(
      shouldReplaceSyncedNotas(
        disciplina({
          scrapeWarnings: ["notas não parseadas"],
        })
      ),
      false
    );
  });

  test("preserva faltas e grupo quando seções falham no scrape", () => {
    assert.equal(
      shouldReplaceSyncedFaltas(
        disciplina({ scrapeWarnings: ["frequência indisponível"] })
      ),
      false
    );
    assert.equal(
      shouldReplaceSyncedFaltas(
        disciplina({ scrapeWarnings: ["frequência não parseada"] })
      ),
      false
    );
    assert.equal(
      shouldReplaceSyncedGrupo(
        disciplina({ scrapeWarnings: ["grupo indisponível"] })
      ),
      false
    );
  });
});
