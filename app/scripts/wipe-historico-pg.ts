import { Client } from "pg";

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL.");
    const result = await client.query("DELETE FROM historico;");
    console.log(`Deleted ${result.rowCount} rows from historico table in production.`);
  } catch (err) {
    console.error("Error connecting or querying:", err);
  } finally {
    await client.end();
  }
}

run();
