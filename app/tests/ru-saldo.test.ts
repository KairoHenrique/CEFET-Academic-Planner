import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { parseRefeicoesDisponiveisFromHtml } from "../src/lib/scraper/ru/scrape-saldo-ru";
import { resolveRuCronSlot } from "../src/lib/sync/run-ru-saldo-cron";
import { brazilWallTimeToUtcDate } from "../src/lib/time/brazil";

describe("parseRefeicoesDisponiveisFromHtml", () => {
  test("extrai número da página SIPAC", () => {
    const html = `
      <td>Tipo de Vínculo</td><td>Discente Graduação</td>
      <td>Refeições Disponíveis</td><td>5</td>
    `;
    assert.equal(parseRefeicoesDisponiveisFromHtml(html), 5);
  });

  test("aceita label sem acento e dois-pontos", () => {
    assert.equal(
      parseRefeicoesDisponiveisFromHtml("Refeicoes Disponiveis: 12"),
      12
    );
  });
});

describe("resolveRuCronSlot", () => {
  test("09:30 BRT → almoco (~1h antes das 10:30)", () => {
    const now = brazilWallTimeToUtcDate("2026-09-02", "09:30");
    assert.equal(resolveRuCronSlot(now), "almoco");
  });

  test("18:00 BRT → jantar (~1h antes das 19:00)", () => {
    const now = brazilWallTimeToUtcDate("2026-09-02", "18:00");
    assert.equal(resolveRuCronSlot(now), "jantar");
  });

  test("fora da janela → null", () => {
    const now = brazilWallTimeToUtcDate("2026-09-02", "14:00");
    assert.equal(resolveRuCronSlot(now), null);
  });
});
