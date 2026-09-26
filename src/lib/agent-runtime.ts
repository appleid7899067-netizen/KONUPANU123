export type AgentAction =
  | { type: "write_file"; path: string; content: string }
  | { type: "delete_file"; path: string }
  | { type: "read_file"; path: string }
  | { type: "web_fetch"; url: string };

export type AgentPlan = {
  goal: string;
  actions: AgentAction[];
  verify: string[];
};

const MAX_ACTIONS = 8;
const MAX_FILE_SIZE = 180_000;

function cleanPath(path: string) {
  return path.trim().replace(/^\/+/, "").replace(/\\/g, "/");
}

export function parseAgentPlan(raw: string): AgentPlan | null {
  const text = raw.trim();
  const fenced = text.match(/\`\`\`(?:json)?\s*([\s\S]*?)\`\`\`/i);
  const candidate = fenced?.[1] ?? text;
  try {
    const value = JSON.parse(candidate) as Partial<AgentPlan>;
    if (!value || typeof value !== "object" || !Array.isArray(value.actions)) return null;
    const actions = value.actions
      .slice(0, MAX_ACTIONS)
      .map((action) => {
        if (!action || typeof action !== "object" || typeof action.type !== "string") return null;
        if (action.type === "write_file" && typeof action.path === "string" && typeof action.content === "string") {
          const path = cleanPath(action.path);
          if (!path || path.includes("..") || action.content.length > MAX_FILE_SIZE) return null;
          return { type: "write_file", path, content: action.content } as AgentAction;
        }
        if (action.type === "delete_file" && typeof action.path === "string") {
          const path = cleanPath(action.path);
          if (!path || path.includes("..")) return null;
          return { type: "delete_file", path } as AgentAction;
        }
        if (action.type === "read_file" && typeof action.path === "string") {
          return { type: "read_file", path: cleanPath(action.path) } as AgentAction;
        }
        if (action.type === "web_fetch" && typeof action.url === "string" && /^https?:\/\//i.test(action.url)) {
          return { type: "web_fetch", url: action.url } as AgentAction;
        }
        return null;
      })
      .filter((action): action is AgentAction => Boolean(action));
    return {
      goal: typeof value.goal === "string" ? value.goal : "",
      actions,
      verify: Array.isArray(value.verify) ? value.verify.filter((v): v is string => typeof v === "string").slice(0, 8) : [],
    };
  } catch {
    return null;
  }
}

export function buildAgentPlannerPrompt(goal: string, files: Array<{ path: string; content: string }>) {
  const snapshot = files.slice(0, 40).map((file) => `FILE: ${file.path}\n${file.content.slice(0, 5000)}`).join("\n\n");
  return `You are BOSSNU Agent Mode. Plan concrete work for the user's goal.

Return ONLY valid JSON with this shape:
{"goal":"...","actions":[{"type":"write_file","path":"...","content":"..."},{"type":"delete_file","path":"..."},{"type":"read_file","path":"..."},{"type":"web_fetch","url":"https://..."}],"verify":["..."]}

Rules:
- Prefer editing existing workspace files over inventing unrelated files.
- write_file must contain the COMPLETE resulting file.
- Never use absolute paths or "..".
- Maximum 8 actions.
- web_fetch is for public HTTP(S) pages only.
- Do not claim that bash, deployment, GitHub commits, or private APIs were executed. Those require connected tools.
- Keep the plan directly tied to the user's goal.

USER GOAL:
${goal}

WORKSPACE:
${snapshot || "(empty)"}
`;
}

export function applyAgentActions(
  plan: AgentPlan,
  files: Array<{ path: string; content: string; size: number; source: "upload" | "agent"; updatedAt: number }>,
) {
  const map = new Map(files.map((file) => [file.path, file]));
  const evidence: string[] = [];
  const reads: string[] = [];
  const writes: string[] = [];

  for (const action of plan.actions) {
    if (action.type === "write_file") {
      map.set(action.path, {
        path: action.path,
        content: action.content,
        size: action.content.length,
        source: "agent",
        updatedAt: Date.now(),
      });
      writes.push(action.path);
      evidence.push(`wrote ${action.path} (${action.content.length} bytes)`);
    } else if (action.type === "delete_file") {
      if (map.delete(action.path)) {
        evidence.push(`deleted ${action.path}`);
      } else {
        evidence.push(`delete skipped: ${action.path} was not present`);
      }
    } else if (action.type === "read_file") {
      const file = map.get(action.path);
      if (file) {
        reads.push(`FILE ${file.path}:\n${file.content.slice(0, 12000)}`);
        evidence.push(`read ${file.path}`);
      } else {
        evidence.push(`read failed: ${action.path} not found`);
      }
    }
  }

  return { files: Array.from(map.values()), evidence, reads, writes };
}

export async function executeWebFetches(plan: AgentPlan) {
  const results: string[] = [];
  for (const action of plan.actions.filter((item): item is Extract<AgentAction, { type: "web_fetch" }> => item.type === "web_fetch").slice(0, 3)) {
    try {
      const response = await fetch(action.url, { headers: { Accept: "text/plain,text/html,application/json" } });
      const body = (await response.text()).slice(0, 12000);
      results.push(`WEB ${action.url} [${response.status}]\n${body}`);
    } catch (error) {
      results.push(`WEB ${action.url} [failed] ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }
  return results;
}
