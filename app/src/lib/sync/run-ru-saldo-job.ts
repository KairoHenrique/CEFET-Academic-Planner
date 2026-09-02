import { loginSigaaOnPage } from "@/lib/scraper/auth";
import { scrapeSaldoRu } from "@/lib/scraper/ru/scrape-saldo-ru";
import { withSyncBrowser } from "@/lib/scraper/session-context";
import { persistRuSaldo } from "@/lib/sync/persist-ru-saldo";

export async function runRuSaldoJob(input: {
  username: string;
  password: string;
}): Promise<{ message: string; refeicoesDisponiveis: number }> {
  let refeicoesDisponiveis = 0;

  await withSyncBrowser(async (page) => {
    await loginSigaaOnPage(page, {
      username: input.username,
      password: input.password,
    });
    const snapshot = await scrapeSaldoRu(page);
    refeicoesDisponiveis = snapshot.refeicoesDisponiveis;
    await persistRuSaldo({
      username: input.username,
      refeicoesDisponiveis,
    });
  });

  return {
    refeicoesDisponiveis,
    message: `Saldo do RU atualizado: ${refeicoesDisponiveis} refeições.`,
  };
}
