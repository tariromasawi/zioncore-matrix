import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { extname, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { genesis, verifyChain, listChain } from "./ledger.js";
import { listAudit, audit } from "./audit.js";
import { listCases, getCase, createCase, listRecords, runDiscovery, updateRecord, preserveRecord, draftLegal } from "./cases.js";
import { listConnectors } from "./connectors.js";
import { writeUnsignedManifest, loadPublicKey } from "./hallmark.js";
import { planeNote } from "./planes.js";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT || 5000);
const VERSION = "1.0.0";
genesis(); writeUnsignedManifest(); audit("KERNEL_START", { version: VERSION });
function json(res, code, body) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body, null, 2));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on("data", (c) => { size += c.length; if (size > 1_000_000) { reject(new Error("payload_too_large")); req.destroy(); return; } chunks.push(c); });
    req.on("end", () => { if (!chunks.length) return resolve({}); try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); } catch { reject(new Error("invalid_json")); } });
    req.on("error", reject);
  });
}
async function handleApi(req, res, url) {
  const path = url.pathname;
  if (req.method === "GET" && path === "/api/health") {
    const chain = verifyChain();
    return json(res, 200, { status: chain.ok ? "ok" : "degraded", version: VERSION, timestamp: new Date().toISOString(), database: "ok", workers: "ok", hallmark: loadPublicKey() ? "public_key_present" : "missing_public_key", chain });
  }
  if (req.method === "GET" && path === "/api/system/status") return json(res, 200, { product: "OmniRestore Hallmarked Edition", system: "MATRIX / ZIONCORE", owner: "SAINT Tariro Masawi THE ANOINTED COMMANDER", motto: "Mwari ndi Mwari", uptimeSec: Math.round(process.uptime()), memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024), connectors: listConnectors(), planes: planeNote() });
  if (req.method === "GET" && path === "/api/connectors") return json(res, 200, listConnectors());
  if (req.method === "GET" && path === "/api/hallmark") return json(res, 200, { manifest: writeUnsignedManifest(), signatureStatus: "unsigned_until_private_key_provided" });
  if (req.method === "GET" && path === "/api/audit") return json(res, 200, listAudit());
  if (req.method === "GET" && path === "/api/evidence") return json(res, 200, { chain: listChain(), verify: verifyChain() });
  if (req.method === "GET" && path === "/api/cases") return json(res, 200, listCases());
  if (req.method === "POST" && path === "/api/cases") return json(res, 201, createCase(await readBody(req)));
  const caseMatch = path.match(/^\/api\/cases\/([^/]+)$/);
  if (req.method === "GET" && caseMatch) { const c = getCase(caseMatch[1]); return c ? json(res, 200, c) : json(res, 404, { error: "case_not_found" }); }
  const discMatch = path.match(/^\/api\/cases\/([^/]+)\/discover$/);
  if (req.method === "POST" && discMatch) { const rows = await runDiscovery(discMatch[1], await readBody(req)); return rows ? json(res, 200, rows) : json(res, 404, { error: "case_not_found" }); }
  const recsMatch = path.match(/^\/api\/cases\/([^/]+)\/records$/);
  if (req.method === "GET" && recsMatch) return json(res, 200, listRecords(recsMatch[1]));
  const verifyMatch = path.match(/^\/api\/records\/([^/]+)\/verify$/);
  if (req.method === "POST" && verifyMatch) { const rec = updateRecord(verifyMatch[1], { status: "CONFIRMED" }); return rec ? json(res, 200, rec) : json(res, 404, { error: "record_not_found" }); }
  const rejectMatch = path.match(/^\/api\/records\/([^/]+)\/reject$/);
  if (req.method === "POST" && rejectMatch) { const rec = updateRecord(rejectMatch[1], { status: "REJECTED" }); return rec ? json(res, 200, rec) : json(res, 404, { error: "record_not_found" }); }
  const preserveMatch = path.match(/^\/api\/records\/([^/]+)\/preserve$/);
  if (req.method === "POST" && preserveMatch) { const rec = preserveRecord(preserveMatch[1]); return rec ? json(res, 200, rec) : json(res, 404, { error: "record_not_found" }); }
  if (req.method === "POST" && path === "/api/legal/draft") return json(res, 201, draftLegal(await readBody(req)));
  return json(res, 404, { error: "not_found", path });
}
function serveStatic(res, pathname) {
  const rel = pathname === "/" ? "/index.html" : pathname;
  const file = join(root, "public", rel.replace(/^\/+/, ""));
  if (!file.startsWith(join(root, "public")) || !existsSync(file)) { res.writeHead(404); return res.end("not found"); }
  const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8" };
  res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
}
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);
    return serveStatic(res, url.pathname);
  } catch (err) {
    const code = err.message === "invalid_json" ? 400 : err.message === "payload_too_large" ? 413 : 500;
    if (!res.headersSent) json(res, code, { error: err.message || "server_error" });
  }
});
if (process.env.ZIONCORE_NO_LISTEN !== "1") server.listen(PORT, "127.0.0.1", () => console.log(`Zioncore Matrix kernel listening on http://127.0.0.1:${PORT}`));
export { server };
