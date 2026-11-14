import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const report = JSON.parse(
  fs.readFileSync(path.join(root, "docs/asset-audit.json"), "utf8"),
);
function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
    );
}
const errors = [];
const sources = walk(path.join(root, "src")).filter((p) =>
  /\.(jsx?|tsx?|css)$/.test(p),
);
const referenced = new Set();
for (const source of sources) {
  const text = fs.readFileSync(source, "utf8");
  for (const match of text.matchAll(
    /from\s*["'](\.[^"']+\.(?:png|jpe?g|webp|svg|json))["']/g,
  )) {
    const file = path.resolve(path.dirname(source), match[1]);
    referenced.add(path.relative(root, file).split(path.sep).join("/"));
    if (!fs.existsSync(file))
      errors.push(
        `Missing import: ${path.relative(root, source)} → ${match[1]}`,
      );
  }
}
for (const resource of report.resources) {
  const exists = fs.existsSync(path.join(root, resource.path));
  const removed = ["removed-unused", "replaced"].includes(resource.status);
  if (removed && exists)
    errors.push(`Removed resource returned: ${resource.path}`);
  if (!removed && !exists)
    errors.push(`Retained resource missing: ${resource.path}`);
  if (resource.status === "retained-runtime" && !referenced.has(resource.path))
    errors.push(
      `Runtime resource no longer referenced; review inventory: ${resource.path}`,
    );
}
const pack = path.join(root, "museum_break_final_assets");
const manifest = JSON.parse(
  fs.readFileSync(path.join(pack, "assets_manifest.json"), "utf8"),
);
for (const asset of Object.values(manifest.assets))
  if (!fs.existsSync(path.join(pack, asset.path)))
    errors.push(`Dangling asset manifest path: ${asset.path}`);
const loader = fs.readFileSync(
  path.join(root, "src/lib/game/spriteAssets.js"),
  "utf8",
);
const renderer = fs.readFileSync(
  path.join(root, "src/lib/game/renderer.js"),
  "utf8",
);
for (const [, key] of loader.matchAll(/^\s+(\w+): img\(/gm))
  if (!new RegExp(`\\bS\\.${key}\\b`).test(renderer))
    errors.push(`Loaded sprite has no renderer consumer: ${key}`);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  const removed = report.resources.filter((r) =>
    ["removed-unused", "replaced"].includes(r.status),
  );
  console.log(
    `Asset audit passed: ${referenced.size} referenced assets/metadata; ${removed.length} removed images/resources; no missing imports, unused sprite loads or dangling pack entries.`,
  );
  console.log(
    "Native catalog/configuration resources are retained conservatively; this check does not replace native builds.",
  );
}
