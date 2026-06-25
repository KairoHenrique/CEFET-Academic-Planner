import { ensureDbReady } from "./bootstrap";
import { seedPpcIfEmpty } from "./seed-ppc";

ensureDbReady();
const total = seedPpcIfEmpty();
console.log(`✅ Seed PPC concluído! ${total} disciplinas no SQLite.`);
