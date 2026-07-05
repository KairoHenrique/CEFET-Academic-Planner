const base = "https://acme-hub.khfm.workers.dev";
const secret = process.argv[2];
if (!secret) {
  console.error("usage: node smoke-cron.mjs <CRON_SECRET>");
  process.exit(1);
}

async function hit(path, method = "GET") {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { authorization: `Bearer ${secret}` },
  });
  const text = await res.text();
  console.log(`${method} ${path} -> ${res.status}`);
  console.log(text.slice(0, 400));
  return res.ok;
}

const healthOk = await hit("/api/health?deep=1");
const emailsOk = await hit("/api/cron/account-emails", "POST");
process.exit(healthOk && emailsOk ? 0 : 1);
