import { Fragment, type ReactNode, useState } from "react";
import { Play, Square } from "lucide-react";

function inline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("`")) nodes.push(<code key={key++} className="rounded-xs bg-elevated px-1 py-0.5 font-mono text-[0.85em] text-fg">{token.slice(1, -1)}</code>);
    else if (token.startsWith("**")) nodes.push(<strong key={key++} className="font-medium text-fg">{token.slice(2, -2)}</strong>);
    else if (token.startsWith("*")) nodes.push(<em key={key++} className="italic">{token.slice(1, -1)}</em>);
    else {
      const label = token.slice(1, token.indexOf("]"));
      const href = token.slice(token.indexOf("(") + 1, -1);
      nodes.push(<a key={key++} href={href} target="_blank" rel="noreferrer" className="underline decoration-border-strong underline-offset-2">{label}</a>);
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState("");

  const run = async () => {
    setRunning(true);
    setOutput("กำลังรัน…");
    try {
      const response = await fetch("/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: language || "javascript", code }),
      });
      const data = await response.json();
      if (!response.ok || data?.ok === false) throw new Error(data?.error || `HTTP ${response.status}`);
      setOutput([data?.stdout, data?.stderr].filter(Boolean).join("\n") || `จบการทำงาน (exit ${data?.code ?? 0}, ${data?.durationMs ?? 0}ms)`);
    } catch (error) {
      setOutput(`รันไม่สำเร็จ: ${error instanceof Error ? error.message : "unknown error"}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-border bg-elevated">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="font-mono text-[11px] text-muted">{language || "code"}</span>
        <button type="button" onClick={run} disabled={running} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-muted hover:bg-surface hover:text-fg disabled:opacity-50">
          {running ? <Square className="size-3" /> : <Play className="size-3" />} {running ? "Running" : "Run"}
        </button>
      </div>
      <pre className="max-h-[520px] overflow-auto px-4 py-3 font-mono text-[13px] leading-[1.65] text-fg"><code>{code}</code></pre>
      {output ? <pre className="whitespace-pre-wrap border-t border-border bg-black/20 px-4 py-3 font-mono text-[12px] leading-5 text-muted">{output}</pre> : null}
    </div>
  );
}

const aliases: Record<string, string> = {
  js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
  py: "python", sh: "bash", shell: "bash", rb: "ruby", rs: "rust",
  csharp: "csharp", "c#": "csharp", cpp: "cpp", java: "java", php: "php",
  swift: "swift", kotlin: "kotlin", go: "go",
};

export function Markdown({ text }: { text: string }) {
  const blocks = text.split(/\`\`\`/);
  const out: ReactNode[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const chunk = blocks[i] ?? "";
    if (i % 2 === 1) {
      const nl = chunk.indexOf("\n");
      const header = nl === -1 ? "" : chunk.slice(0, nl).trim().toLowerCase();
      const code = nl === -1 ? chunk : chunk.slice(nl + 1).replace(/\n$/, "");
      out.push(<CodeBlock key={`c${i}`} code={code} language={aliases[header] || header || "javascript"} />);
      continue;
    }

    const lines = chunk.split("\n");
    let list: string[] = [];
    const flushList = (key: string) => {
      if (!list.length) return;
      out.push(<ul key={key} className="my-2 list-disc space-y-1 pl-5 text-sm leading-normal text-fg">{list.map((item, idx) => <li key={idx}>{inline(item)}</li>)}</ul>);
      list = [];
    };

    lines.forEach((line, idx) => {
      const bullet = line.match(/^\s*[-*]\s+(.*)$/);
      if (bullet) {
        list.push(bullet[1] ?? "");
        return;
      }
      flushList(`l${i}-${idx}`);
      if (!line.trim()) {
        out.push(<div key={`s${i}-${idx}`} className="h-2" />);
        return;
      }
      if (line.startsWith("### ")) {
        out.push(<h3 key={`h${i}-${idx}`} className="mt-3 mb-1 text-sm font-medium text-fg">{inline(line.slice(4))}</h3>);
        return;
      }
      if (line.startsWith("## ")) {
        out.push(<h2 key={`h${i}-${idx}`} className="mt-4 mb-1 font-display text-lg text-fg">{inline(line.slice(3))}</h2>);
        return;
      }
      out.push(<p key={`p${i}-${idx}`} className="text-sm leading-normal text-fg/95">{inline(line)}</p>);
    });
    flushList(`l${i}-end`);
  }

  return <div className="space-y-0.5">{out.length ? out : <Fragment>{inline(text)}</Fragment>}</div>;
}
