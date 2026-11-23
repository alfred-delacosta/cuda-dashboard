/**
 * Copyright Advanced Software and AI Solutions LLC
 * Copy recommendation JSON next to compiled core modules.
 */
import { cpSync, mkdirSync } from "node:fs";
import path from "node:path";

const src = path.join("src", "core", "data", "cuda-recommendations.json");
const destDir = path.join("dist", "core", "data");
const dest = path.join(destDir, "cuda-recommendations.json");

mkdirSync(destDir, { recursive: true });
cpSync(src, dest);
console.log(`copied ${src} -> ${dest}`);
