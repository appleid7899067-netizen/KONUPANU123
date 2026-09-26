import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { mkdtemp, rm, writeFile, readFile, readdir, mkdir, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, dirname } from "node:path";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";

const MAX_CODE = 180_000;
const MAX_FILES = 80;
const MAX_FILE_SIZE = 120_000;
const MAX_OUTPUT = 40_000;
const TIMEOUT_MS = 20_000;
const SAFE_NAME = /^[A-Za-z0-9._/-]+$/;

type InputFile = { path?: string; content?: string };
type Body = {
  action?: "exec" | "write" | "read" | "list" | "mkdir" | "remove" | "grep" | "hash";
  language?: string;
  code?: string;
  command?: string;
  path?: string;
  pattern?: string;
  files?: InputFile[];
};

function safePath(value: unknown) {
  const raw = String(value ?? "").replace(/\\/g, "/").replace(/^\/+/, "");
  if (!raw || raw.includes("\0") || raw.split("/").includes("..") || !SAFE_NAME.test(raw)) return null;
  return raw;
}

function trimOutput(value: unknown) {
  return String(value ?? "").slice(0, MAX_OUTPUT);
}

async function materialize(root: string, files: InputFile[] = []) {
  for (const item of files.slice(0, MAX_FILES)) {
    const path = safePath(item.path);
    const content = String(item.content ?? "");
    if (!path || content.length > MAX_FILE_SIZE) continue;
    const target = join(root, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content, "utf8");
  }
}

function runner(language: string) {
  const l = language.trim().toLowerCase();
  if (["js", "javascript", "node", "nodejs"].includes(l)) return { cmd: "node", args: ["-e"] };
  if (["ts", "typescript"].includes(l)) return { cmd: "node", args: ["--experimental-strip-types", "-e"] };
  if (["py", "python", "python3"].includes(l)) return { cmd: "python3", args: ["-c"] };
  if (["sh", "shell", "bash"].includes(l)) return { cmd: "bash", args: ["-lc"] };
  if (["php"].includes(l)) return { cmd: "php", args: ["-r"] };
  return null;
}

async function execute(root: string, language: string, code: string) {
  if (code.length > MAX_CODE) throw new Error("Code exceeds sandbox limit.");
  const r = runner(language);
  if (!r) throw new Error(`Unsupported sandbox language: ${language}`);

  const started = Date.now();
  const env = {
    PATH: process.env.PATH || "",
    HOME: root,
    TMPDIR: root,
    TEMP: root,
    TMP: root,
    LANG: "C.UTF-8",
    LC_ALL: "C.UTF-8",
    NODE_ENV: "sandbox",
  };

  return await new Promise<{ stdout: string; stderr: string; code: number | null; signal: string | null; durationMs: number }>((resolve) => {
    const child = spawn(r.cmd, [...r.args, code], {
      cwd: root,
      env,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    const timer = setTimeout(() => child.kill("SIGKILL"), TIMEOUT_MS);
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({
        stdout: trimOutput(stdout),
        stderr: trimOutput(stderr),
        code,
        signal,
        durationMs: Date.now() - started,
      });
    });
  });
}

async function listTree(root: string, dir = ""): Promise<string[]> {
  const target = join(root, dir);
  const entries = await readdir(target, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const path = join(dir, entry.name).replace(/\\/g, "/");
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    if (entry.isDirectory()) out.push(...await listTree(root, path));
    else out.push(path);
  }
  return out.slice(0, MAX_FILES);
}

export default defineEventHandler(async (event) => {
  if ((event.method || "GET").toUpperCase() !== "POST") {
    setResponseStatus(event, 405);
    return { ok: false, error: "Method Not Allowed" };
  }

  const body = await readBody<Body>(event);
  const action = body?.action || "exec";
  const root = await mkdtemp(join(tmpdir(), "bossnu-sandbox-"));

  try {
    await materialize(root, body?.files);

    if (action === "exec") {
      const language = String(body?.language || "javascript");
      const code = String(body?.code || "");
      const result = await execute(root, language, code);
      return { ok: result.code === 0, action, language, ...result };
    }

    if (action === "write") {
      const path = safePath(body?.path);
      if (!path) { setResponseStatus(event, 400); return { ok: false, error: "Invalid path." }; }
      const content = String(body?.code ?? "");
      if (content.length > MAX_FILE_SIZE) { setResponseStatus(event, 413); return { ok: false, error: "File too large." }; }
      const target = join(root, path);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, content, "utf8");
      return { ok: true, action, path, size: content.length };
    }

    if (action === "read") {
      const path = safePath(body?.path);
      if (!path) { setResponseStatus(event, 400); return { ok: false, error: "Invalid path." }; }
      const content = await readFile(join(root, path), "utf8");
      return { ok: true, action, path, content: trimOutput(content), size: content.length };
    }

    if (action === "list") {
      return { ok: true, action, files: await listTree(root) };
    }

    if (action === "mkdir") {
      const path = safePath(body?.path);
      if (!path) { setResponseStatus(event, 400); return { ok: false, error: "Invalid path." }; }
      await mkdir(join(root, path), { recursive: true });
      return { ok: true, action, path };
    }

    if (action === "remove") {
      const path = safePath(body?.path);
      if (!path) { setResponseStatus(event, 400); return { ok: false, error: "Invalid path." }; }
      await rm(join(root, path), { recursive: true, force: true });
      return { ok: true, action, path };
    }

    if (action === "grep") {
      const pattern = String(body?.pattern || "");
      if (!pattern || pattern.length > 300) { setResponseStatus(event, 400); return { ok: false, error: "Invalid pattern." }; }
      const files = await listTree(root);
      const hits: string[] = [];
      for (const path of files) {
        try {
          const content = await readFile(join(root, path), "utf8");
          content.split("\n").forEach((line, i) => {
            if (line.toLowerCase().includes(pattern.toLowerCase()) && hits.length < 200) hits.push(`${path}:${i + 1}: ${line.slice(0, 300)}`);
          });
        } catch {}
      }
      return { ok: true, action, pattern, hits };
    }

    if (action === "hash") {
      const path = safePath(body?.path);
      if (!path) { setResponseStatus(event, 400); return { ok: false, error: "Invalid path." }; }
      const content = await readFile(join(root, path));
      return { ok: true, action, path, sha256: createHash("sha256").update(content).digest("hex"), size: content.length };
    }

    setResponseStatus(event, 400);
    return { ok: false, error: `Unknown sandbox action: ${action}` };
  } catch (error) {
    setResponseStatus(event, 500);
    return { ok: false, action, error: error instanceof Error ? error.message : "Sandbox failed." };
  } finally {
    await rm(root, { recursive: true, force: true }).catch(() => {});
  }
});
