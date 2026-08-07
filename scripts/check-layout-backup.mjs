import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadModule(relativePath) {
  const source = readFileSync(join(root, relativePath), "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: relativePath,
  }).outputText;

  const module = { exports: {} };
  const evaluator = new Function("exports", "require", "module", transpiled);
  evaluator(module.exports, require, module);
  return module.exports;
}

const {
  createLayoutBackup,
  parseLayoutBackupJson,
  remapBackupToLayout,
  sanitizeBackupFilename,
  validateLayoutBackup,
} = loadModule("lib/layout-backup.ts");

const sample = {
  project: {
    id: "project-1",
    name: "Summer Orchard 2026",
    variety: "Hayward",
    projectLeader: "Ana",
    createdAt: "2026-01-01T00:00:00.000Z",
    createdBy: "tester",
  },
  orchard: {
    id: "orchard-1",
    name: "Te Puke",
    address: "123 Road",
  },
  blocks: [{ id: "block-1", orchardId: "orchard-1", name: "Block A" }],
  layout: {
    id: "layout-1",
    projectId: "project-1",
    orchardId: "orchard-1",
    blockIds: ["block-1"],
    status: "draft",
    lastEditedBy: "tester",
    lastEditedAt: "2026-01-01T00:00:00.000Z",
  },
  grids: [
    {
      id: "grid-1",
      layoutId: "layout-1",
      blockId: "block-1",
      order: 1,
      rows: 2,
      bayColumns: 2,
      cells: [],
      position: { x: 0, y: 0 },
      rotation: 0,
      layer: 1,
    },
  ],
  treatments: [
    {
      id: "treatment-1",
      layoutId: "layout-1",
      name: "Control",
      labelName: "C",
      color: "#22C55E",
      color2: "#3B82F6",
    },
  ],
  vines: [
    {
      id: "vine-1",
      gridId: "grid-1",
      rowNumber: 1,
      bayIndex: 1,
      slot: 1,
      gender: "female",
      treatmentId: "treatment-1",
      number: 1,
      layer: 2,
    },
  ],
  rows: [
    {
      id: "row-1",
      gridId: "grid-1",
      index: 1,
      displayNumber: 1,
    },
  ],
  mapObjects: [],
  mapTexts: [],
};

const backup = createLayoutBackup(sample);
const parsed = parseLayoutBackupJson(JSON.stringify(backup));

assert.equal(parsed.ok, true);
if (!parsed.ok) {
  throw new Error("Expected valid backup");
}

assert.equal(
  sanitizeBackupFilename(" Summer Orchard 2026.json "),
  "Summer Orchard 2026"
);

const remapped = remapBackupToLayout(parsed.backup.data, "layout-target");
assert.equal(remapped.layout.id, "layout-target");
assert.equal(remapped.treatments[0].layoutId, "layout-target");
assert.equal(remapped.grids[0].layoutId, "layout-target");
assert.equal(remapped.treatments[0].color2, "#3B82F6");

const invalid = validateLayoutBackup({ format: "other", version: 1, data: {} });
assert.equal(invalid.ok, false);

console.log("layout-backup checks passed");
