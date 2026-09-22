import { mkdirSync, existsSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = process.env.ZIONCORE_DATA_DIR || join(root, "data");

function pathFor(name) {
  return join(dataDir, `${name}.json`);
}

export function load(name, fallback) {
  mkdirSync(dataDir, { recursive: true });
  const p = pathFor(name);
  if (!existsSync(p)) return structuredClone(fallback);
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return structuredClone(fallback);
  }
}

export function save(name, value) {
  mkdirSync(dataDir, { recursive: true });
  const p = pathFor(name);
  const tmp = `${p}.tmp`;
  writeFileSync(tmp, JSON.stringify(value, null, 2));
  try {
    renameSync(tmp, p);
  } catch {
    writeFileSync(p, JSON.stringify(value, null, 2));
  }
  return value;
}

export function id(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
