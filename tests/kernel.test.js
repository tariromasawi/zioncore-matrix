import { test } from "node:test";
import assert from "node:assert/strict";
import { createCase, runDiscovery, preserveRecord, draftLegal } from "../src/cases.js";
import { genesis, appendEvidence, verifyChain } from "../src/ledger.js";
import { listConnectors } from "../src/connectors.js";
import { buildManifest, loadPublicKey } from "../src/hallmark.js";
import { planeNote } from "../src/planes.js";
test("genesis chain verifies", () => { genesis(); appendEvidence({ recordId: "t", sourceUrl: "https://example.com", body: "hello" }); assert.equal(verifyChain().ok, true); });
test("no fabricated web search", async () => {
  const c = createCase({ displayName: "test", publicUrls: ["https://github.com/tariromasawi"] });
  const recs = await runDiscovery(c.caseId, {});
  assert.equal(recs.find((r) => r.connectorId === "public_web").status, "UNAVAILABLE");
});
test("preserve hashes", async () => {
  const c = createCase({ displayName: "p", publicUrls: ["https://example.org"] });
  const recs = await runDiscovery(c.caseId, {});
  const stored = preserveRecord(recs.find((r) => r.url).id);
  assert.equal(stored.status, "PRESERVED");
  assert.ok(stored.evidenceHash);
});
test("legal draft stays draft", () => { assert.equal(draftLegal({}).status, "DRAFT"); });
test("public web unavailable", () => { assert.equal(listConnectors().find((c) => c.id === "public_web").available, false); });
test("hallmark and planes", () => { assert.ok(loadPublicKey()); assert.equal(buildManifest().ownerEmail, "tariro@masawi.org"); assert.match(planeNote().disclaimer, /not scientifically verified/); });
