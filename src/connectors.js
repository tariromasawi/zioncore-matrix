import { audit } from "./audit.js";
export const CONNECTORS = [
  { id: "local_upload", name: "Local uploads", capabilities: ["DISCOVERY_READ"], requiresAuth: false, available: true },
  { id: "user_urls", name: "User-provided URLs", capabilities: ["DISCOVERY_READ"], requiresAuth: false, available: true },
  { id: "public_web", name: "Public web search", capabilities: ["DISCOVERY_READ"], requiresAuth: false, available: false, reason: "No search API key configured. Reports UNAVAILABLE rather than fabricating results." },
  { id: "github", name: "GitHub", capabilities: ["DISCOVERY_READ"], requiresAuth: true, available: Boolean(process.env.GITHUB_TOKEN), reason: process.env.GITHUB_TOKEN ? null : "GITHUB_TOKEN not set" },
  { id: "wayback", name: "Internet Archive / Wayback", capabilities: ["DISCOVERY_READ"], requiresAuth: false, available: true }
];
export function listConnectors() {
  return CONNECTORS.map(({ id, name, capabilities, requiresAuth, available, reason }) => ({ id, name, capabilities, requiresAuth, available, reason: reason || null }));
}
export async function discover({ caseId, urls = [], notes = "" }) {
  const results = [];
  for (const url of urls.slice(0, 20)) {
    try {
      const parsed = new URL(url);
      results.push({ type: "WEB_REFERENCE", title: parsed.hostname, description: notes || "User-supplied public URL", source: "user_urls", url: parsed.toString(), canonicalUrl: parsed.toString(), connectorId: "user_urls", identityConfidence: 0.4, relevanceScore: 0.5, status: "REVIEW_REQUIRED", ownershipStatus: "UNKNOWN", provenance: "user_supplied" });
    } catch {
      results.push({ type: "WEB_REFERENCE", title: "Invalid URL", description: url, source: "user_urls", url: null, connectorId: "user_urls", status: "UNAVAILABLE", provenance: "rejected_invalid_url" });
    }
  }
  const publicWeb = CONNECTORS.find((c) => c.id === "public_web");
  if (!publicWeb.available) {
    results.push({ type: "SYSTEM", title: "Public web search unavailable", description: publicWeb.reason, source: "public_web", connectorId: "public_web", status: "UNAVAILABLE", provenance: "connector_unavailable" });
  }
  audit("RECORD_FOUND", { caseId, count: results.length });
  return results;
}
