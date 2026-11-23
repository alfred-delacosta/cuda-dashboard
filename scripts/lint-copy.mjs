/**
 * Copyright Advanced Software and AI Solutions LLC
 * Fails if em or en dashes appear in copy, docs, or source strings.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SKIP = new Set(["node_modules", "dist", ".git", "coverage", ".vite"]);
const EXTS = new Set([
  ".md",
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".html",
  ".css",
  ".yml",
  ".yaml",
  ".txt",
  ".example",
]);

const EM = "\u2014";
const EN = "\u2013";

async function walk(dir, out = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, out);
    } else if (EXTS.has(path.extname(entry.name)) || entry.name === "AGENTS.md") {
      out.push(full);
    }
  }
  return out;
}

const files = await walk(ROOT);
const offenders = [];

for (const file of files) {
  const text = await readFile(file, "utf8");
  if (text.includes(EM) || text.includes(EN)) {
    const rel = path.relative(ROOT, file);
    const lines = text.split(/\r?\n/);
    lines.forEach((line, i) => {
      if (line.includes(EM) || line.includes(EN)) {
        offenders.push(`${rel}:${i + 1}`);
      }
    });
  }
}

if (offenders.length) {
  console.error("lint:copy failed: em/en dashes found:");
  for (const o of offenders) console.error(`  ${o}`);
  process.exit(1);
}

console.log("lint:copy ok");
