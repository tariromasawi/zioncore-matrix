import { createHash, sign as cryptoSign, verify as cryptoVerify } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export function loadPublicKey() {
  const p = process.env.HALLMARK_PUBLIC_KEY_PATH || join(root, "keys", "hallmark.pub");
  if (!existsSync(p)) return null;
  return readFileSync(p, "utf8");
}
export function buildManifest({ files = {}, version = "1.0.0", buildId = "local" } = {}) {
  return {
    schemaVersion: "1.0",
    product: "OmniRestore Hallmarked Edition",
    owner: "SAINT Tariro Masawi THE ANOINTED COMMANDER",
    ownerEmail: "tariro@masawi.org",
    version,
    buildId,
    createdAt: new Date().toISOString(),
    files,
    publicKey: loadPublicKey(),
    license: "House of Masawi — see LICENSE",
    attribution: "House of Masawi. Mwari ndi Mwari.",
    matrixConstants: { primary: "77-99-33", expanded: "777-999-333" }
  };
}
export function signManifest(manifest) {
  const keyPath = process.env.HALLMARK_PRIVATE_KEY_PATH;
  if (!keyPath || !existsSync(keyPath)) {
    return { signed: false, reason: "HALLMARK_PRIVATE_KEY_PATH not set" };
  }
  const privateKey = readFileSync(keyPath, "utf8");
  const payload = Buffer.from(JSON.stringify(manifest));
  const signature = cryptoSign(null, payload, privateKey).toString("base64");
  return { signed: true, signature };
}
export function writeUnsignedManifest() {
  const manifest = buildManifest({ files: { "src/index.js": "present", "matrix-index.json": "present" } });
  writeFileSync(join(root, "hallmark_manifest.json"), JSON.stringify(manifest, null, 2));
  return manifest;
}
if (process.argv.includes("--sign")) {
  const manifest = writeUnsignedManifest();
  console.log(JSON.stringify({ manifestWritten: true, sign: signManifest(manifest) }, null, 2));
}
