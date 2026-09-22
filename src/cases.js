import { load, save, id } from "./store.js";
import { audit } from "./audit.js";
import { discover } from "./connectors.js";
import { appendEvidence } from "./ledger.js";
export function listCases() { return load("cases", []); }
export function getCase(caseId) { return listCases().find((c) => c.caseId === caseId) || null; }
export function createCase(input = {}) {
  const cases = listCases();
  const now = new Date().toISOString();
  const row = { caseId: id("case"), displayName: String(input.displayName || "Untitled identity case"), legalNameOptional: input.legalNameOptional || null, aliases: input.aliases || [], emails: input.emails || [], domains: input.domains || [], usernames: input.usernames || [], publicUrls: input.publicUrls || [], knownProjects: input.knownProjects || [], createdAt: now, updatedAt: now };
  cases.push(row); save("cases", cases); audit("RESTORATION_STARTED", { caseId: row.caseId }); return row;
}
export function listRecords(caseId) { return load("records", []).filter((r) => !caseId || r.caseId === caseId); }
export function addRecords(caseId, discovered) {
  const records = load("records", []);
  const now = new Date().toISOString();
  const created = discovered.map((d) => ({ id: id("rec"), caseId, discoveredAt: now, lastSeenAt: now, contentHash: null, evidenceHash: null, sensitivity: "NORMAL", metadata: {}, createdAt: now, updatedAt: now, ...d }));
  records.push(...created); save("records", records); return created;
}
export function updateRecord(recordId, patch) {
  const records = load("records", []);
  const idx = records.findIndex((r) => r.id === recordId);
  if (idx < 0) return null;
  records[idx] = { ...records[idx], ...patch, updatedAt: new Date().toISOString() };
  save("records", records); return records[idx];
}
export async function runDiscovery(caseId, body = {}) {
  const c = getCase(caseId); if (!c) return null;
  const urls = [...(c.publicUrls || []), ...(body.urls || [])];
  return addRecords(caseId, await discover({ caseId, urls, notes: body.notes }));
}
export function preserveRecord(recordId) {
  const rec = updateRecord(recordId, { status: "PRESERVED" }); if (!rec) return null;
  const evidence = appendEvidence({ recordId, sourceUrl: rec.url, body: JSON.stringify({ title: rec.title, url: rec.url, source: rec.source, provenance: rec.provenance }) });
  return updateRecord(recordId, { evidenceHash: evidence.currentHash, status: "PRESERVED" });
}
export function draftLegal({ recordId, requestType = "factual_correction", platform = "unknown" }) {
  const requests = load("legal_requests", []);
  const rec = load("records", []).find((r) => r.id === recordId);
  const row = { id: id("leg"), targetUrl: rec?.url || null, platform, requestType, dateDrafted: new Date().toISOString(), dateSubmitted: null, referenceNumber: null, status: "DRAFT", response: null, nextAction: "USER_REVIEW — no request is sent until you approve.", disclaimer: "OmniRestore drafts workflows; it does not file, delete, or guarantee outcomes." };
  requests.push(row); save("legal_requests", requests); audit("REQUEST_DRAFTED", { id: row.id, recordId }); return row;
}
