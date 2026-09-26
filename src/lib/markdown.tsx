import { Fragment, type ReactNode } from "react";

function inline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("`")) {
      nodes.push(
        <code
          key={key++}
          className="rounded-xs bg-elevated px-1 py-0.5 font-mono text-[0.85em] text-fg"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**")) {
      nodes.push(
        <strong key={key++} className="font-medium text-fg">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("*")) {
      nodes.push(
        <em key={key++} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    } else {
      const label = token.slice(1, token.indexOf("]"));
      const href = token.slice(token.indexOf("(") + 1, -1);
      nodes.push(
        <a
          key={key++}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-border-strong underline-offset-2"
        >
          {label}
        </a>,
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ text }: { text: string }) {
  const blocks = text.split(/```/);
  const out: ReactNode[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const chunk = blocks[i] ?? "";
    if (i % 2 === 1) {
      const nl = chunk.indexOf("\n");
      const code = nl === -1 ? chunk : chunk.slice(nl + 1).replace(/\n$/, "");
      out.push(
        <pre
          key={`c${i}`}
          className="my-3 overflow-x-auto rounded-md bg-elevated p-3 font-mono text-xs leading-relaxed text-fg"
        >
          <code>{code}</code>
        </pre>,
      );
      continue;
    }
    const lines = chunk.split("\n");
    let list: string[] = [];
    const flushList = (key: string) => {
      if (!list.length) return;
      out.push(
        <ul key={key} className="my-2 list-disc space-y-1 pl-5 text-sm leading-normal text-fg">
          {list.map((item, idx) => (
            <li key={idx}>{inline(item)}</li>
          ))}
        </ul>,
      );
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
        out.push(
          <h3 key={`h${i}-${idx}`} className="mt-3 mb-1 text-sm font-medium text-fg">
            {inline(line.slice(4))}
          </h3>,
        );
        return;
      }
      if (line.startsWith("## ")) {
        out.push(
          <h2 key={`h${i}-${idx}`} className="mt-4 mb-1 font-display text-lg text-fg">
            {inline(line.slice(3))}
          </h2>,
        );
        return;
      }
      out.push(
        <p key={`p${i}-${idx}`} className="text-sm leading-normal text-fg/95">
          {inline(line)}
        </p>,
      );
    });
    flushList(`l${i}-end`);
  }
  return <div className="space-y-0.5">{out.length ? out : <Fragment>{inline(text)}</Fragment>}</div>;
}
