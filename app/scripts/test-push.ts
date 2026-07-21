import { getPostgresPool } from "../src/lib/db/postgres/pool";
import { listAllDistinctPushTokens } from "../src/lib/push/push-token-repository";
import { notifyCpfDevices } from "../src/lib/push/expo-push-send";

async function main() {
  const pool = getPostgresPool();
  const tokens = await listAllDistinctPushTokens(pool);
  console.log("Tokens found:", tokens);

  if (tokens.length > 0) {
    await notifyCpfDevices({
      tokens,
      title: "🎉 Aprovado em Cálculo 2!",
      body: "Nota final: 8.5 (Turma Média: 6.0). Parabéns, você passou!"
    });
    console.log("Push sent!");
  } else {
    console.log("No tokens");
  }
  process.exit(0);
}
main();
