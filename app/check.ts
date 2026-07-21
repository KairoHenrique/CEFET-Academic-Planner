import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    const profs = await client.query("SELECT * FROM app_profiles WHERE auth_id IN (SELECT id FROM auth.users WHERE email LIKE '%13931178641%') OR cpf = '13931178641' LIMIT 1").catch(() => null);
    
    // As app_profiles might not have CPF, let's just query everything related to the ID.
    // Or let's check all profiles
    const allProfs = await client.query("SELECT * FROM app_profiles");
    const prof = allProfs.rows.find(p => p.cpf === '13931178641');
    if (!prof) {
        console.log("No profile found with this CPF. Checking auth.users...");
    } else {
        console.log("Found profile!", prof.user_id);
        const histRes = await client.query("SELECT * FROM historico WHERE user_id = $1", [prof.user_id]);
        console.log(`Total historico for ${prof.user_id}:`, histRes.rows.length);
    }
  } finally {
    client.release();
    pool.end();
  }
}

main().catch(console.error);
