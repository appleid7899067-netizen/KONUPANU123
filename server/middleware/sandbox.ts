import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const MAX_CODE = 120_000;
const MAX_FILES = 30;
const MAX_FILE = 120_000;
const TIMEOUT = 12_000;

type Runtime = { command: string; args: (file: string) => string[]; filename: string };

const runtimes: Record<string, Runtime> = {
  javascript: { command: "node", args: (f) => [f], filename: "main.js" },
  typescript: { command: "npx", args: (f) => ["--yes", "tsx", f], filename: "main.ts" },
  python: { command: "python3", args: (f) => [f], filename: "main.py" },
  ruby: { command: "ruby", args: (f) => [f], filename: "main.rb" },
  php: { command: "php", args: (f) => [f], filename: "main.php" },
  bash: { command: "bash", args: (f) => [f], filename: "main.sh" },
  go: { command: "go", args: (f) => ["run", f], filename: "main.go" },
  rust: { command: "rustc", args: (f) => [f, "-o", "main-bin"], filename: "main.rs" },
  java: { command: "java", args: (f) => ["--source", "17", f], filename: "Main.java" },
};

function json(value: unknown) {
  return JSON.stringify(value);
}

export default defineEventHandler(async (event) => {
  if ((event.method || "GET").toUpperCase() !== "POST") {
    setResponseStatus(event, 405);
    return { ok: false, error: "Method Not Allowed" };
  }

  const body = await readBody<{
    language?: string;
    code?: string;
    files?: Array<{ path?: string; content?: string }>;
    command?: string;
  }>(event);

  const language = String(body?.language || "javascript").toLowerCase();
  const code = String(body?.code || "");
  if (!code || code.length > MAX_CODE) {
    setResponseStatus(event, 400);
    return { ok: false, error: "Code is empty or too large." };
  }

  const runtime = runtimes[language];
  if (!runtime) {
    setResponseStatus(event, 400);
    return {
      ok: false,
      error: `Runtime "${language}" is not installed in this deployment.`,
      supported: Object.keys(runtimes),
    };
  }

  const root = await mkdtemp(join(tmpdir(), "bossnu-sandbox-"));
  const safeEnv = {
    PATH: process.env.PATH || "/usr/local/bin:/usr/bin:/bin",
    HOME: root,
    TMPDIR: root,
    NODE_ENV: "sandbox",
  };

  try {
    const filePath = join(root, runtime.filename);
    await writeFile(filePath, code, "utf8");

    for (const file of (body.files || []).slice(0, MAX_FILES)) {
      const rawPath = String(file.path || "").replace(/\\/g, "/").replace(/^\/+/, "");
      if (!rawPath || rawPath.includes("..") || rawPath.length > 180) continue;
      const content = String(file.content || "");
      if (content.length > MAX_FILE) continue;
      const target = join(root, rawPath);
      await mkdirSafe(dirname(target));
      await writeFile(target, content, "utf8");
    }

    const started = Date.now();
    const result = await execFileAsync(runtime.command, runtime.args(filePath), {
      cwd: root,
      env: safeEnv,
      timeout: TIMEOUT,
      maxBuffer: 400_000,
      windowsHide: true,
    }).catch((error: any) => ({
      stdout: String(error?.stdout || ""),
      stderr: String(error?.stderr || error?.message || "Execution failed"),
      code: typeof error?.code === "number" ? error.code : 1,
      timedOut: Boolean(error?.killed || error?.signal === "SIGTERM"),
    }));

    return {
      ok: !("code" in result) || result.code === 0,
      language,
      stdout: result.stdout || "",
      stderr: result.stderr || "",
      code: typeof result.code === "number" ? result.code : 0,
      durationMs: Date.now() - started,
      sandbox: "process-isolated",
      limits: { timeoutMs: TIMEOUT, maxCodeBytes: MAX_CODE },
    };
  } catch (error) {
    setResponseStatus(event, 500);
    return { ok: false, error: error instanceof Error ? error.message : "Sandbox execution failed." };
  } finally {
    await rm(root, { recursive: true, force: true }).catch(() => undefined);
  }
});

async function mkdirSafe(path: string) {
  const { mkdir } = await import("node:fs/promises");
  await mkdir(path, { recursive: true });
}
