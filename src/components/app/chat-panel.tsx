import { useEffect, useRef, useState } from "react";
import { ArrowUp, Brain, Check, ChevronRight, Copy, Globe2, ImagePlus, Mic, Paperclip, Plus, Square, TerminalSquare, Wrench, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/lib/markdown";
import { cn } from "@/lib/utils";
import { providerLabel, type CatalogModel } from "@/lib/models";
import type { Copy as CopyText } from "@/lib/i18n";
import { useChat, type ChatMessage, type Conversation } from "@/store/chat";

type ToolMode = "auto" | "web" | "sandbox" | "code";

type Props = {
  t: CopyText;
  conversation: Conversation | null;
  model: CatalogModel | undefined;
  streaming: boolean;
  signedIn: boolean;
  failed: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  onSignIn: () => void;
  onOpenModels: () => void;
  workStatus?: string;
};

export function ChatPanel({ t, conversation, model, streaming, signedIn, failed, onSend, onStop, onSignIn, onOpenModels, workStatus = "" }: Props) {
  const messages = conversation?.messages ?? [];
  const scrollerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolMode, setToolMode] = useState<ToolMode>("auto");
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const addWorkspaceFiles = useChat((s) => s.addWorkspaceFiles);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distance < 220 || messages.length <= 2) bottomRef.current?.scrollIntoView({ behavior: streaming ? "auto" : "smooth", block: "end" });
  }, [messages.length, streaming]);

  const submit = async () => {
    if (streaming) return onStop();
    const value = draft.trim();
    if (!value) return;
    setDraft("");
    const names = files.map((f) => f.name);
    const attached = await Promise.all(files.map(async (f) => `${f.name}:\\n${(await f.text()).slice(0, 120000)}`));
    addWorkspaceFiles(await Promise.all(files.map(async (f) => ({ path: f.name, content: (await f.text()).slice(0, 120000), size: f.size, source: "upload" as const, updatedAt: Date.now() }))));
    setFiles([]);
    onSend(names.length ? `${value}\\n\\n[Tool mode: ${toolMode}]\\n\\n[Attached files]\\n${attached.join("\\n\\n")}` : `${value}\\n\\n[Tool mode: ${toolMode}]`);
  };

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={scrollerRef} className="absolute inset-0 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState signedIn={signedIn} failed={failed} onSignIn={onSignIn} onSend={onSend} />
        ) : (
          <div className="mx-auto w-full max-w-[760px] px-5 pb-40 pt-10">
            {messages.map((message) => <Message key={message.id} message={message} model={model} t={t} streaming={streaming} />)}
            {workStatus ? <AgentActivity status={workStatus} streaming={streaming} /> : null}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pb-[max(14px,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto mx-auto w-full max-w-[760px]">
          <Composer
            t={t}
            draft={draft}
            setDraft={setDraft}
            files={files}
            setFiles={setFiles}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            fileRef={fileRef}
            streaming={streaming}
            signedIn={signedIn}
            onSignIn={onSignIn}
            onSend={submit}
            onStop={onStop}
            onOpenModels={onOpenModels}
            modelName={model?.name}
            toolMode={toolMode}
            setToolMode={setToolMode}
            thinking={thinking}
            setThinking={setThinking}
            listening={listening}
            setListening={setListening}
          />
        </div>
      </div>
    </div>
  );
}

function AgentActivity({ status, streaming }: { status: string; streaming: boolean }) {
  const done = /✓|Done|ตรวจแล้ว|เรียบร้อย/.test(status);
  const failed = /✕|Failed|ข้อผิดพลาด/.test(status);
  const label = status.replace(/\s*[✓✕]\s*$/, "").trim();
  return (
    <div className="mt-2 flex items-center gap-2 px-1 py-1.5 text-[12px] leading-5 text-muted" aria-live="polite">
      <span className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-[10px] font-medium text-fg",
        failed && "text-danger",
      )}>
        {done ? <Check className="size-3" /> : failed ? "!" : <ChevronRight className="size-3" />}
      </span>
      <span className={cn("truncate", (done || failed) && "text-fg")}>{label}</span>
      {streaming && !done && !failed ? <span className="ml-auto text-[10px] text-muted">Agent</span> : null}
    </div>
  );
}

function EmptyState({ signedIn, failed, onSignIn, onSend }: { signedIn: boolean; failed: boolean; onSignIn: () => void; onSend: (value: string) => void }) {
  const prompts = ["สร้าง Landing Page", "สร้าง Dashboard", "สร้างเกม", "แปลง Design เป็น Code", "สร้าง Full-stack App", "สร้าง Storefront"];
  return (
    <div className="flex min-h-full items-center justify-center px-5 pb-36 pt-8">
      <div className="w-full max-w-[760px]">
        <div className="mb-8 text-center">
          <MarkLarge />
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Build with Bossnu</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted">Bossnu วางแผน ลงมือ เขียนไฟล์ รันโค้ด ค้นเว็บ และตรวจผลให้เป็นงานเดียว</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {prompts.map((prompt) => <button key={prompt} type="button" onClick={() => onSend(prompt)} className="rounded-xl border border-border bg-surface/70 px-3 py-3 text-left text-xs text-muted transition hover:bg-elevated hover:text-fg">{prompt}</button>)}
        </div>
        {!signedIn ? <div className="mt-4 text-center text-[11px] text-muted">{failed ? "Puter is unavailable." : "Sign in with Puter to start."}<button type="button" onClick={onSignIn} className="ml-1 text-fg underline underline-offset-4">Sign in</button></div> : null}
      </div>
    </div>
  );
}

function MarkLarge() {
  return <div className="mx-auto flex size-12 items-center justify-center rounded-xl border border-border bg-surface"><span className="text-lg font-semibold">B</span></div>;
}

function Message({ message, model, t, streaming }: { message: ChatMessage; model?: CatalogModel; t: CopyText; streaming: boolean }) {
  const [copied, setCopied] = useState(false);
  const user = message.role === "user";
  const empty = !user && !message.content && streaming;
  return (
    <article className={cn("mb-9", user ? "flex justify-end" : "block")}>
      {user ? (
        <div className="max-w-[82%] rounded-2xl bg-elevated px-4 py-3"><p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p></div>
      ) : (
        <div className="max-w-[100%]">
          <div className="mb-2 flex items-center gap-2 text-[11px] text-muted"><span className="font-medium text-fg">BOSSNU</span>{model ? <span>{providerLabel(model.provider)}</span> : null}</div>
          {empty ? <p className="text-sm text-muted">Working…</p> : <Markdown text={message.content} />}
          {message.error ? <p className="mt-3 text-xs text-danger">{t.error}</p> : null}
          {message.content ? <button type="button" className="mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] text-muted hover:bg-elevated hover:text-fg" onClick={async () => { await navigator.clipboard.writeText(message.content); setCopied(true); window.setTimeout(() => setCopied(false), 1200); }}>{copied ? <Check className="size-3" /> : <Copy className="size-3" />}{copied ? t.copied : t.copy}</button> : null}
        </div>
      )}
    </article>
  );
}

function Composer({ t, draft, setDraft, files, setFiles, menuOpen, setMenuOpen, fileRef, streaming, signedIn, onSignIn, onSend, onStop, onOpenModels, modelName, toolMode, setToolMode }: {
  t: CopyText;
  draft: string;
  setDraft: (v: string) => void;
  files: File[];
  setFiles: (v: File[]) => void;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
  streaming: boolean;
  signedIn: boolean;
  onSignIn: () => void;
  onSend: () => void;
  onStop: () => void;
  onOpenModels: () => void;
  modelName?: string;
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;
  thinking: boolean;
  setThinking: (v: boolean) => void;
  listening: boolean;
  setListening: (v: boolean) => void;
}) {
  const disabled = !signedIn;
  const accept = ".png,.webp,.jpg,.jpeg,.pdf,.gif,.txt,.md,.csv,.html,.xml,.css,.js,.json";
  const startVoice = () => {
    const Recognition = (window as typeof window & { SpeechRecognition?: new () => { lang: string; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void; start: () => void; stop: () => void } }).SpeechRecognition;
    if (!Recognition) return;
    if (listening) { setListening(false); return; }
    const recognition = new Recognition();
    recognition.lang = "th-TH";
    recognition.onresult = (e) => setDraft(`${draft} ${e.results[0]?.[0]?.transcript ?? ""}`.trim());
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (disabled) return onSignIn(); onSend(); }} className="rounded-[22px] border border-border bg-surface px-3 py-2 shadow-[0_8px_40px_rgba(0,0,0,.16)]">
      {files.length ? <div className="flex flex-wrap gap-1.5 px-1 pt-1">{files.map((file) => <span key={file.name} className="inline-flex max-w-[220px] items-center gap-1.5 rounded-lg bg-elevated px-2 py-1 text-[11px]"><Paperclip className="size-3 text-muted" /><span className="truncate">{file.name}</span><button type="button" onClick={() => setFiles(files.filter((x) => x !== file))}><X className="size-3 text-muted" /></button></span>)}</div> : null}
      <textarea rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} placeholder={disabled ? "Sign in to start" : "Ask BOSSNU to build, research, code, or fix something…"} className="max-h-40 min-h-[48px] w-full resize-none bg-transparent px-2 py-2 text-sm leading-6 outline-none placeholder:text-muted" />
      <input ref={fileRef} type="file" multiple className="hidden" accept={accept} onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
      <div className="flex items-center justify-between gap-2 px-1 pb-0.5">
        <div className="flex items-center gap-0.5">
          <div className="relative">
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setMenuOpen(!menuOpen)} aria-label="Add"><Plus className="size-4" /></Button>
            {menuOpen ? <div className="absolute bottom-10 left-0 z-50 w-56 rounded-xl border border-border bg-surface p-1.5 shadow-2xl">
              <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-xs hover:bg-elevated"><Paperclip className="size-3.5" /> Upload files</button>
              <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-xs hover:bg-elevated"><ImagePlus className="size-3.5" /> Add image</button>
              <button type="button" onClick={() => { setToolMode("web"); setMenuOpen(false); }} className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-xs hover:bg-elevated", toolMode === "web" && "bg-elevated")}><Globe2 className="size-3.5" /> Web search</button>
              <button type="button" onClick={() => { setToolMode("sandbox"); setMenuOpen(false); }} className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-xs hover:bg-elevated", toolMode === "sandbox" && "bg-elevated")}><TerminalSquare className="size-3.5" /> Sandbox / Bash</button>
              <button type="button" onClick={() => { setToolMode("code"); setMenuOpen(false); }} className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-xs hover:bg-elevated", toolMode === "code" && "bg-elevated")}><Wrench className="size-3.5" /> Coding tools</button>
            </div> : null}
          </div>
          <button type="button" onClick={() => fileRef.current?.click()} className="hidden rounded-lg px-2 py-1.5 text-[11px] text-muted hover:bg-elevated hover:text-fg sm:block">Attach</button>
          <span className="max-w-[120px] truncate rounded-lg px-2 py-1.5 text-[11px] text-muted">{toolMode === "auto" ? "Auto" : toolMode}</span>
          <button type="button" onClick={() => setThinking(!thinking)} className={cn("inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-muted hover:bg-elevated hover:text-fg", thinking && "bg-elevated text-fg")}><Brain className="size-3" />{thinking ? "Thinking" : "Instant"}</button>
          <button type="button" onClick={startVoice} className={cn("inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-muted hover:bg-elevated hover:text-fg", listening && "bg-elevated text-fg")} aria-label="Voice input"><Mic className="size-3" />{listening ? "Listening" : "Voice"}</button>
          <button type="button" onClick={onOpenModels} className="max-w-[180px] truncate rounded-lg px-2 py-1.5 text-[11px] text-muted hover:bg-elevated hover:text-fg">{modelName ?? "Model"}</button>
        </div>
        <Button type="submit" size="icon-sm" disabled={!streaming && (!draft.trim() || disabled)} aria-label={streaming ? t.stop : t.send} onClick={streaming ? onStop : undefined}>{streaming ? <Square className="size-3.5" /> : <ArrowUp className="size-4" />}</Button>
      </div>
    </form>
  );
}
