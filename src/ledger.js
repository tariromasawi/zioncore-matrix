import { createHash } from "node:crypto";
import { load, save, id } from "./store.js";
import { audit } from "./audit.js";

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

export function genesis() {
  const chain = load("evidence_chain", []);
  if (chain.length) return chain[0];
  const entry = {
    evidenceId: id("ev"),
    type: "GENESIS",
    previousHash: "0".repeat(64),
    payload: "ZIONCORE-MATRIX-GENESIS | Mwari ndi Mwari | EOCC",
    createdAt: new Date().toISOString()
  };
  entry.currentHash = sha256(`${entry.previousHash}|${entry.payload}|${entry.createdAt}`);
  save("evidence_chain", [entry]);
  audit("EVIDENCE_STORED", { evidenceId: entry.evidenceId, type: "GENESIS" });
  return entry;
}

export function appendEvidence({ recordId, sourceUrl, mimeType = "text/plain", body = "" }) {
  const chain = load("evidence_chain", []);
  if (!chain.length) genesis();
  const latest = load("evidence_chain", []);
  const previousHash = latest[latest.length - 1].currentHash;
  const contentHash = sha256(body);
  const createdAt = new Date().toISOString();
  const entry = {
    evidenceId: id("ev"),
    recordId: recordId || null,
    sourceUrl: sourceUrl || null,
    mimeType,
    size: Buffer.byteLength(body),
    contentHash,
    previousHash,
    createdAt
  };
  entry.currentHash = sha256(`${previousHash}|${contentHash}|${createdAt}|${entry.evidenceId}`);
  latest.push(entry);
  save("evidence_chain", latest);
  audit("EVIDENCE_STORED", { evidenceId: entry.evidenceId, recordId });
  return entry;
}

export function verifyChain() {
  const chain = load("evidence_chain", []);
  if (!chain.length) return { ok: true, length: 0, reason: "empty" };
  for (let i = 0; i < chain.length; i++) {
    const e = chain[i];
    const expected =
      i === 0
        ? sha256(`${e.previousHash}|${e.payload}|${e.createdAt}`)
        : sha256(`${e.previousHash}|${e.contentHash}|${e.createdAt}|${e.evidenceId}`);
    if (e.currentHash !== expected) return { ok: false, brokenAt: i, evidenceId: e.evidenceId };
    if (i > 0 && e.previousHash !== chain[i - 1].currentHash) return { ok: false, brokenAt: i, reason: "link_mismatch" };
  }
  return { ok: true, length: chain.length, tip: chain[chain.length - 1].currentHash };
}

export function listChain() {
  return load("evidence_chain", []);
}
