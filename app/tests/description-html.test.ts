import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { readFileSync } from "node:fs";
import {
  formatPlainDescriptionToHtml,
  formatSigaaDescriptionHtml,
  prepareDescriptionHtml,
} from "../src/lib/format/description-html";
import { parseTarefaDetalheHtml } from "../src/lib/scraper/turma-virtual/parse-tarefas-page";

describe("description-html", () => {
  test("formata MIC1 com seções, lista e link", () => {
    const fixturePath =
      ".data/scrape-debug/1782772633590-laboratorio-de-arquitetura-e-organizacao-de-computadores-i-atividade-mic1-a-unidade-logica-e-aritmetica.html";
    const html = readFileSync(fixturePath, "utf8");
    const result = parseTarefaDetalheHtml(html);

    assert.ok(result.descricao?.includes('class="desc-heading"'));
    assert.ok(result.descricao?.includes('<ul class="desc-list">'));
    assert.ok(result.descricao?.includes("decoder_2to4.bdf"));
    assert.ok(result.descricao?.includes('href="https://github.com/christianherrera77/ALU_VALIDATION"'));
    assert.equal((result.descricao?.match(/<\/li>/g) ?? []).length >= 10, true);
  });

  test("reformata texto puro legado em lista compacta", () => {
    const plain = `1) Primeira etapa

- item A
- item B

2) Segunda etapa

https://example.com/doc`;

    const html = formatPlainDescriptionToHtml(plain);
    assert.match(html, /class="desc-heading"/);
    assert.match(html, /<ul class="desc-list">/);
    assert.match(html, /href="https:\/\/example\.com\/doc"/);
    assert.doesNotMatch(html, /\n\n\n/);
  });

  test("sanitiza HTML gerado para exibição", () => {
    const html = formatSigaaDescriptionHtml(
      "<div>1) Teste</div><div>- alpha</div><script>alert(1)</script>"
    );
    const safe = prepareDescriptionHtml(html);
    assert.doesNotMatch(safe, /<script/i);
    assert.match(safe, /alpha/);
  });
});
