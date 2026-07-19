import { getPostgresPool } from "../src/lib/db/postgres/pool";
import { listAllDistinctPushTokens } from "../src/lib/push/push-token-repository";
import { notifyCpfDevices } from "../src/lib/push/expo-push-send";

async function main() {
  const version = process.argv[2];
  const feature = process.argv[3];
  
  if (!version) {
    console.error("Uso: npm run tsx scripts/push-app-update.ts <versao> [destaque]");
    process.exit(1);
  }

  const bodyText = feature 
    ? `A versão ${version} acabou de sair com ${feature}! Toque para baixar.`
    : `A versão ${version} acabou de sair! Toque para baixar.`;

  const pool = getPostgresPool();
  const tokens = await listAllDistinctPushTokens(pool);
  console.log(`Tokens found: ${tokens.length}`);

  if (tokens.length > 0) {
    await notifyCpfDevices({
      tokens,
      title: "🚀 Nova Versão Disponível",
      body: bodyText,
      data: {
        type: "app-updated"
      }
    });
    console.log("Push de atualização enviado para todos!");
  } else {
    console.log("Nenhum token encontrado.");
  }
  process.exit(0);
}
main();
