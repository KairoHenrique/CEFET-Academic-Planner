import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const command = process.argv[2];

const allowed = new Set(["build", "deploy", "preview", "upload"]);

if (!command || !allowed.has(command)) {
  console.error(
    "Uso: node scripts/opennext-cloudflare.mjs <build|deploy|preview|upload>"
  );
  process.exit(1);
}

process.env.PLANNER_CLOUD = "true";

/** Windows sem Developer Mode falha em symlinkSync — copia o alvo. */
function patchOpenNextWindowsSymlinkFallback() {
  if (process.platform !== "win32") {
    return;
  }

  const copyTracedPath = path.join(
    process.cwd(),
    "node_modules/@opennextjs/aws/dist/build/copyTracedFiles.js"
  );

  if (!fs.existsSync(copyTracedPath)) {
    console.warn("[opennext-cloudflare] copyTracedFiles.js não encontrado; skip patch");
    return;
  }

  const marker = "OPENNEXT_WIN_SYMLINK_FALLBACK";
  let source = fs.readFileSync(copyTracedPath, "utf8");
  if (source.includes(marker)) {
    return;
  }

  const needle = `            catch (e) {
                if (e.code !== "EEXIST") {
                    throw e;
                }
            }`;

  const replacement = `            catch (e) {
                /* ${marker} */
                if (e.code === "EPERM" || e.code === "ENOTSUP") {
                    cpSync(from, to, { recursive: true, dereference: true });
                } else if (e.code !== "EEXIST") {
                    throw e;
                }
            }`;

  if (!source.includes(needle)) {
    console.warn(
      "[opennext-cloudflare] padrão symlink não encontrado; build pode falhar no Windows"
    );
    return;
  }

  fs.writeFileSync(copyTracedPath, source.replace(needle, replacement));
  console.log("[opennext-cloudflare] patch Windows symlink → copy aplicado");
}

/** Turbopack patch do OpenNext assume paths Unix; no Windows ChunkLoadError no Worker. */
function patchOpenNextWindowsTurbopackPaths() {
  if (process.platform !== "win32") {
    return;
  }

  const turbopackPath = path.join(
    process.cwd(),
    "node_modules/@opennextjs/cloudflare/dist/cli/build/patches/plugins/turbopack.js"
  );

  if (!fs.existsSync(turbopackPath)) {
    console.warn("[opennext-cloudflare] turbopack.js não encontrado; skip patch");
    return;
  }

  let source = fs.readFileSync(turbopackPath, "utf8");
  let changed = false;

  if (!source.includes("OPENNEXT_WIN_TURBOPACK_PATHS")) {
    const pathReplacements = [
      [
        'const dotNextDir = filePath.replace(/\\/server\\/chunks\\/.*$/, "");',
        `/* OPENNEXT_WIN_TURBOPACK_PATHS */ const dotNextDir = filePath.replace(/[\\\\/]server[\\\\/]chunks[\\\\/].*$/, "");`,
      ],
      [
        'chunk.replace(/.*\\/\\.next\\//, "")',
        'chunk.replace(/.*[\\\\/]\\.next[\\\\/]/, "")',
      ],
      [
        'absPath.replace(/.*\\/\\.next\\//, "")',
        'absPath.replace(/.*[\\\\/]\\.next[\\\\/]/, "")',
      ],
    ];

    for (const [from, to] of pathReplacements) {
      if (!source.includes(from)) {
        console.warn(
          `[opennext-cloudflare] turbopack path patch ausente: ${from.slice(0, 40)}...`
        );
        return;
      }
      source = source.replaceAll(from, to);
    }
    changed = true;
  }

  if (!source.includes("OPENNEXT_WIN_TURBOPACK_CHUNKS")) {
    const before = source;
    source = source.replace(
      /(\w+)\.includes\("\.next\/server\/chunks\/"\)/g,
      '/* OPENNEXT_WIN_TURBOPACK_CHUNKS */ (/.next[\\/]server[\\/]chunks[\\/]/.test($1.replace(/\\\\/g, "/")))'
    );
    if (source === before) {
      console.warn("[opennext-cloudflare] turbopack chunk filter não encontrado");
      return;
    }
    changed = true;
  }

  if (!source.includes("OPENNEXT_WIN_TURBOPACK_REQUIRE")) {
    const requireNeedle =
      'chunk.replace(/.*[\\\\/]\\.next[\\\\/]/, "")}": return require("${chunk}");`)';
    const requireReplacement =
      '/* OPENNEXT_WIN_TURBOPACK_REQUIRE */ chunk.replace(/.*[\\\\/]\\.next[\\\\/]/, "")}": return require("${chunk.replace(/\\\\/g, \\"/\\")}");`)';
    if (source.includes(requireNeedle)) {
      source = source.replace(requireNeedle, requireReplacement);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(turbopackPath, source);
    console.log("[opennext-cloudflare] patch Windows turbopack aplicado");
  }
}

function runOpenNext(subcommand) {
  const result = spawnSync("opennextjs-cloudflare", [subcommand], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  return result.status ?? 1;
}

patchOpenNextWindowsSymlinkFallback();
patchOpenNextWindowsTurbopackPaths();

if (command === "build") {
  process.exit(runOpenNext("build"));
}

if (command === "deploy") {
  const wranglerPath = path.join(process.cwd(), "wrangler.jsonc");
  const wranglerBackup = fs.readFileSync(wranglerPath, "utf8");
  const inject = spawnSync("node", ["scripts/inject-wrangler-vars.mjs"], {
    stdio: "inherit",
    cwd: process.cwd(),
  });
  if ((inject.status ?? 1) !== 0) {
    process.exit(inject.status ?? 1);
  }

  const buildStatusDeploy = runOpenNext("build");
  if (buildStatusDeploy !== 0) {
    fs.writeFileSync(wranglerPath, wranglerBackup);
    process.exit(buildStatusDeploy);
  }

  const deployStatus = runOpenNext("deploy");
  fs.writeFileSync(wranglerPath, wranglerBackup);
  process.exit(deployStatus);
}

const buildStatus = runOpenNext("build");
if (buildStatus !== 0) {
  process.exit(buildStatus);
}

process.exit(runOpenNext(command));
