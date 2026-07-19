import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const destLib = path.join(root, "mobile/src/features/simulador/lib");
const destDeps = path.join(destLib, "deps");
fs.mkdirSync(destDeps, { recursive: true });

const copies = [
  ["app/src/lib/simulador/corequisito-schedule-policy.ts", "corequisito-schedule-policy.ts"],
  ["app/src/lib/simulador/corequisito-cluster-viability.ts", "corequisito-cluster-viability.ts"],
  ["app/src/lib/simulador/turma-schedule-placement.ts", "turma-schedule-placement.ts"],
  ["app/src/lib/simulador/enrollment-course-selectability.ts", "enrollment-course-selectability.ts"],
  ["app/src/lib/simulador/enrollment-schedule-conflict-notice.ts", "enrollment-schedule-conflict-notice.ts"],
  ["app/src/lib/simulador/enrollment-ui-messages.ts", "enrollment-ui-messages.ts"],
  ["app/src/lib/simulador/enrollment-multi-variant-preview.ts", "enrollment-multi-variant-preview.ts"],
  ["app/src/lib/simulador/enrollment-schedule-highlights.ts", "enrollment-schedule-highlights.ts"],
  ["app/src/lib/simulador/group-enrollment-courses.ts", "group-enrollment-courses.ts"],
  ["app/src/lib/simulador/sort-enrollment-course-groups.ts", "sort-enrollment-course-groups.ts"],
  ["app/src/lib/simulador/filter-enrollment-courses.ts", "filter-enrollment-courses.ts"],
  ["app/src/lib/simulador/build-schedule-from-simulation.ts", "build-schedule-from-simulation.ts"],
  ["app/src/lib/simulador/resolve-conflict-cells.ts", "resolve-conflict-cells.ts"],
  ["app/src/lib/simulador/enrollment-schedule-stats.ts", "enrollment-schedule-stats.ts"],
  ["app/src/lib/simulador/turma-course-utils.ts", "turma-course-utils.ts"],
  ["app/src/lib/schedule/parse-sigaa-codigo.ts", "deps/parse-sigaa-codigo.ts"],
  ["app/src/lib/schedule/sigaa-slot-map.ts", "deps/sigaa-slot-map.ts"],
  ["app/src/lib/disciplinas/subject-nickname-core.ts", "deps/subject-nickname-core.ts"],
  ["app/src/lib/disciplinas/subject-short-label-registry.ts", "deps/subject-short-label-registry.ts"],
];

for (const [from, to] of copies) {
  fs.copyFileSync(path.join(root, from), path.join(destLib, to));
}

function rewrite(file, isDep) {
  let c = fs.readFileSync(file, "utf8");
  if (isDep) {
    c = c
      .replaceAll("@/lib/types/schedule", "../../types")
      .replaceAll("@/lib/mapa/course-status", "./normalize-code")
      .replaceAll(
        "@/lib/disciplinas/subject-nickname-overrides",
        "../nickname-overrides"
      )
      .replaceAll(
        "@/lib/disciplinas/subject-nickname-core",
        "./subject-nickname-core"
      )
      .replaceAll("@/lib/schedule/sigaa-slot-map", "./sigaa-slot-map");
  } else {
    c = c
      .replaceAll("@/lib/types/schedule", "../types")
      .replaceAll("@/lib/types/turmas-ofertadas-api", "../types")
      .replaceAll("@/lib/types/simulador-api", "../types")
      .replaceAll("@/config/mock/schedule", "../types")
      .replaceAll("@/lib/mapa/course-status", "./deps/normalize-code")
      .replaceAll("@/lib/schedule/parse-sigaa-codigo", "./deps/parse-sigaa-codigo")
      .replaceAll("@/lib/schedule/sigaa-slot-map", "./deps/sigaa-slot-map")
      .replaceAll(
        "@/lib/disciplinas/subject-display-name",
        "./deps/subject-display-name"
      )
      .replaceAll(
        "@/lib/disciplinas/subject-schedule-meta",
        "./deps/subject-schedule-meta"
      )
      .replaceAll("@/lib/simulador/", "./");
  }
  fs.writeFileSync(file, c, "utf8");
}

for (const f of fs.readdirSync(destLib)) {
  if (f.endsWith(".ts")) rewrite(path.join(destLib, f), false);
}
for (const f of fs.readdirSync(destDeps)) {
  if (f.endsWith(".ts")) rewrite(path.join(destDeps, f), true);
}

const leftover = [];
function scan(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) scan(p);
    else if (f.name.endsWith(".ts")) {
      const c = fs.readFileSync(p, "utf8");
      if (c.includes("@/")) leftover.push(`AT:${p}`);
      if (c.includes("Ã")) leftover.push(`MOJIBAKE:${p}`);
    }
  }
}
scan(destLib);
console.log(leftover.length ? leftover.join("\n") : "clean");
