import { loadPpcSeedData } from "../src/lib/db/ppc-seed-loader";

const comp = loadPpcSeedData("eng-computacao");
const ipc = comp.filter(s => s.disciplina.nome.toLowerCase().includes("program"));
console.log(ipc.map(s => s.disciplina));
