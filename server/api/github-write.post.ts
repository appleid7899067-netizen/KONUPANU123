import { defineEventHandler, readBody, setResponseStatus } from "h3";

const API = "https://api.github.com";

export default defineEventHandler(async (event) => {
  if ((event.method || "GET").toUpperCase() !== "POST") {
    setResponseStatus(event, 405);
    return { ok: false, error: "Method Not Allowed" };
  }

  const body = await readBody<{
    owner?: string;
    repo?: string;
    base?: string;
    branch?: string;
    message?: string;
    files?: Array<{ path?: string; content?: string }>;
  }>(event);

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    setResponseStatus(event, 503);
    return { ok: false, error: "GitHub write is not configured. Set GITHUB_TOKEN on the server." };
  }

  const owner = String(body?.owner || "").trim();
  const repo = String(body?.repo || "").trim();
  const base = String(body?.base || "main").trim();
  const branch = String(body?.branch || "").trim();
  const message = String(body?.message || "BOSSNU Agent update").trim();
  const files = Array.isArray(body?.files) ? body.files.slice(0, 30) : [];

  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo) || !/^[A-Za-z0-9._/-]{1,120}$/.test(branch)) {
    setResponseStatus(event, 400);
    return { ok: false, error: "Invalid GitHub repository or branch." };
  }
  if (!files.length) {
    setResponseStatus(event, 400);
    return { ok: false, error: "No files supplied." };
  }

  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "BOSSNU-Agent",
  };

  async function gh(path: string, init?: RequestInit) {
    const response = await fetch(API + path, { ...init, headers: { ...headers, ...(init?.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`GitHub ${response.status}: ${data?.message || "request failed"}`);
    return data;
  }

  try {
    const baseRef = await gh(`/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(base)}`);
    const baseSha = baseRef.object.sha;

    let branchExists = true;
    try {
      await gh(`/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`);
    } catch {
      branchExists = false;
    }

    if (!branchExists) {
      await gh(`/repos/${owner}/${repo}/git/refs`, {
        method: "POST",
        body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
      });
    }

    const results = [];
    for (const file of files) {
      const path = String(file.path || "").replace(/^\/+/, "").replace(/\\/g, "/");
      const content = String(file.content || "");
      if (!path || path.includes("..") || path.length > 240 || content.length > 180000) continue;

      let sha: string | undefined;
      try {
        const existing = await gh(`/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`);
        sha = existing.sha;
      } catch {
        sha = undefined;
      }

      const result = await gh(`/repos/${owner}/${repo}/contents/${path}`, {
        method: "PUT",
        body: JSON.stringify({
          message,
          content: Buffer.from(content, "utf8").toString("base64"),
          branch,
          ...(sha ? { sha } : {}),
        }),
      });
      results.push({ path, commit: result.commit?.sha || null });
    }

    return { ok: true, owner, repo, base, branch, files: results };
  } catch (error) {
    setResponseStatus(event, 502);
    return { ok: false, error: error instanceof Error ? error.message : "GitHub write failed." };
  }
});
