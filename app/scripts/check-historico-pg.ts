import { Client } from "pg";

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    
    // Contar total de registros
    const countResult = await client.query("SELECT COUNT(*) FROM historico;");
    const count = countResult.rows[0].count;
    console.log(`Total de registros no historico (Produção): ${count}`);

    if (count > 0) {
      // Contar agrupado por user_id
      const groupResult = await client.query(`
        SELECT user_id, COUNT(*) as qtd 
        FROM historico 
        GROUP BY user_id
      `);
      console.log("\nRegistros por usuário:");
      for (const row of groupResult.rows) {
        console.log(`- Usuário ${row.user_id}: ${row.qtd} disciplinas`);
      }

      // Buscar TODAS as disciplinas APROVADAS do Igor (3f79d961-e9da-4033-826d-9cc4827148a0)
      const igorResult = await client.query(`
        SELECT 
          disciplina_id, 
          status, 
          nota_final 
        FROM historico 
        WHERE user_id = '3f79d961-e9da-4033-826d-9cc4827148a0'
        ORDER BY disciplina_id
      `);
      
      console.log("\nMatérias do Igor no banco de produção:");
      for (const row of igorResult.rows) {
        console.log(`- [${row.disciplina_id}] Status: ${row.status} (Nota: ${row.nota_final})`);
      }
    }
  } catch (err) {
    console.error("Error connecting or querying:", err);
  } finally {
    await client.end();
  }
}

run();
