import { getPostgresPool } from "../src/lib/db/postgres/pool";
import { listAllDistinctPushTokens } from "../src/lib/push/push-token-repository";
import { notifyCpfDevices } from "../src/lib/push/expo-push-send";

async function main() {
  const text = process.argv[2];
  
  if (!text) {
    console.error("Uso: npm run tsx scripts/push-promo.ts <texto_da_promocao>");
    process.exit(1);
  }

  const pool = getPostgresPool();
  const tokens = await listAllDistinctPushTokens(pool);
  console.log(`Tokens found: ${tokens.length}`);

  if (tokens.length > 0) {
    await notifyCpfDevices({
      tokens,
      title: "🎁 Presente pra você!",
      body: text,
      data: {
        type: "promo"
      }
    });
    console.log("Push de promoção enviado para todos!");
  } else {
    console.log("Nenhum token encontrado.");
  }
  process.exit(0);
}
main();
