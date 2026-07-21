import fs from "fs";

const html = fs.readFileSync(".data/users/16532523674/scrape-debug/1784488359230-portal-discente-pagina.html", "utf8");
const m = html.match(/<table class=\"(listagem|subFormulario)\"[\s\S]*?<\/table>/gi) || [];
m.forEach((t, i) => {
  if (t.includes("Turmas") || t.includes("Semestre") || t.includes("turma")) {
    console.log("TABLE " + i, t.substring(0, 300));
  }
});
