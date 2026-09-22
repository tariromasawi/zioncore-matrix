export async function healthCheck() {
  const res = await fetch("https://api.github.com/rate_limit", { headers: { "User-Agent": "zioncore-matrix", Accept: "application/vnd.github+json" } });
  return { id: "github", available: res.ok, status: res.status, requiresAuth: false };
}
export async function discover({ username = "tariromasawi" } = {}) {
  const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&type=owner`, { headers: { "User-Agent": "zioncore-matrix", Accept: "application/vnd.github+json" } });
  if (!res.ok) return [{ platform: "github", status: "UNAVAILABLE", title: "GitHub API", description: String(res.status) }];
  const repos = await res.json();
  return repos.map((r) => ({ platform: "github", type: "REPOSITORY", title: r.name, url: r.html_url, description: r.description, status: "FOUND", ownershipStatus: r.private ? "PRIVATE" : "OWNED_PUBLIC", connectorId: "github", provenance: "github_rest_users_repos" }));
}
