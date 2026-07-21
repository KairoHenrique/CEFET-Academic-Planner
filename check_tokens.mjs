import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.PLANNER_DATABASE });
const res = await pool.query('SELECT user_id, expo_push_token, created_at FROM push_device_tokens');
console.log(res.rows);
process.exit(0);
