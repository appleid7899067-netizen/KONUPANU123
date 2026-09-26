import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Download, GitBranch, Menu, PanelRight, Search, Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ChatPanel } from "@/components/app/chat-panel";
import { Mark, Sidebar } from "@/components/app/sidebar";
import { ModelPicker } from "@/components/app/model-picker";
import { usePuter } from "@/components/puter-provider";
import { copy } from "@/lib/i18n";
import { chatModelOptions, pickFeatured, type CatalogModel } from "@/lib/models";
import { streamChat, type PuterChatMessage } from "@/lib/puter";
import { useChat } from "@/store/chat";
import { cn } from "@/lib/utils";

export function AppShell() {
  const { ready, failed, signedIn, user, signIn, signOut, puter } = usePuter();
  const locale = useChat((s) => s.locale);
  const setLocale = useChat((s) => s.setLocale);
  const t = copy[locale];
  const models = useChat((s) => s.models);
  const modelId = useChat((s) => s.modelId);
  const setModelId = useChat((s) => s.setModelId);
  const conversations = useChat((s) => s.conversations);
  const activeId = useChat((s) => s.activeId);
  const streaming = useChat((s) => s.streaming);
  const newChat = useChat((s) => s.newChat);
  const selectChat = useChat((s) => s.selectChat);
  const deleteChat = useChat((s) => s.deleteChat);
  const appendUser = useChat((s) => s.appendUser);
  const patchAssistant = useChat((s) => s.patchAssistant);
  const setStreaming = useChat((s) => s.setStreaming);
  const workStatus = useChat((s) => s.workStatus);
  const setWorkStatus = useChat((s) => s.setWorkStatus);
  const workspaceFiles = useChat((s) => s.workspaceFiles);
  const selectedWorkspaceFile = useChat((s) => s.selectedWorkspaceFile);
  const selectWorkspaceFile = useChat((s) => s.selectWorkspaceFile);
  const hydrateWorkspace = useChat((s) => s.hydrateWorkspace);

  const [navOpen, setNavOpen] = useState(false);
  const [modelsOpen, setModelsOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [workspaceTab, setWorkspaceTab] = useState<"workspace" | "diff" | "checks" | "preview">("workspace");
  const [modeOpen, setModeOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [directMode, setDirectMode] = useState(false);
  const [workspaceNotice, setWorkspaceNotice] = useState("");
  const [diffScope, setDiffScope] = useState<"turn" | "branch">("turn");
  const cancelRef = useRef(false);

  const featured = useMemo(() => pickFeatured(models), [models]);
  const model = models.find((m) => m.id === modelId) ?? featured[0];
  const conversation = conversations.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    hydrateWorkspace();
  }, [hydrateWorkspace]);

  const stop = () => {
    cancelRef.current = true;
    setStreaming(false);
  };

  const send = async (text: string) => {
    if (!signedIn) {
      await signIn();
      return;
    }
    if (!puter || streaming) return;

    const { conversation: convo, assistant } = appendUser(text);
    const selected = models.find((m) => m.id === (convo.modelId || modelId)) ?? model;
    cancelRef.current = false;
    setStreaming(true);

    const history: PuterChatMessage[] = convo.messages
      .filter((m) => m.id !== assistant.id && m.content)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const pool = [selected, ...featured, ...models.filter((m) => m.id !== selected?.id)].filter(Boolean) as CatalogModel[];
      let lastError: unknown = null;
      let done = false;

      for (let attempt = 0; attempt < Math.min(4, pool.length); attempt++) {
        if (cancelRef.current) break;
        const candidate = pool[attempt]!;
        setWorkStatus(
          attempt === 0
            ? locale === "th" ? "กำลังทำงาน…" : "Working…"
            : locale === "th" ? `กำลังลองโมเดลสำรอง ${attempt}/3…` : `Trying fallback ${attempt}/3…`,
        );

        try {
          let assembled = "";
          const opts = chatModelOptions(candidate);
          await streamChat({
            puter,
            messages: history,
            model: opts.model,
            provider: opts.provider,
            isCancelled: () => cancelRef.current,
            onDelta: (chunk) => {
              assembled += chunk;
              patchAssistant(convo.id, assistant.id, { content: assembled, modelId: candidate.id });
            },
          });
          if (assembled.trim()) {
            done = true;
            setWorkStatus(locale === "th" ? "เรียบร้อย ✓" : "Done ✓");
            break;
          }
          lastError = new Error("empty response");
        } catch (error) {
          lastError = error;
        }
      }

      if (!done && !cancelRef.current) {
        const message = lastError instanceof Error ? lastError.message : t.error;
        patchAssistant(convo.id, assistant.id, {
          content: locale === "th" ? `งานยังไม่สำเร็จ: ${message}` : `The task did not complete: ${message}`,
          error: true,
        });
        setWorkStatus(locale === "th" ? "เกิดข้อผิดพลาด ✕" : "Failed ✕");
      }
    } finally {
      setStreaming(false);
      window.setTimeout(() => setWorkStatus(""), 1000);
    }
  };

  const filteredChats = conversations.filter((chat) => {
    const q = searchQuery.trim().toLowerCase();
    return !q || chat.title.toLowerCase().includes(q) || chat.messages.some((m) => m.content.toLowerCase().includes(q));
  });

  const downloadWorkspace = () => {
    const payload = JSON.stringify({ app: "BOSSNU", exportedAt: new Date().toISOString(), conversation }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `bossnu-workspace-${conversation?.id ?? "session"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setWorkspaceNotice("Workspace exported");
    window.setTimeout(() => setWorkspaceNotice(""), 1800);
  };

  const footer = (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Mark className="size-8" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-fg">{signedIn ? user?.username ?? "Puter" : "Guest"}</p>
          <p className="truncate text-[10px] text-muted">{signedIn ? "Connected" : "Sign in to start"}</p>
        </div>
        {signedIn ? <Button variant="ghost" size="icon-sm" onClick={() => void signOut()} aria-label="Sign out"><X className="size-4" /></Button> : null}
      </div>
      {!signedIn ? <Button className="w-full" onClick={() => void signIn()} disabled={!ready && !failed}>{failed ? "Puter unavailable" : "Sign in"}</Button> : null}
    </div>
  );

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-bg text-fg">
      <aside className="hidden w-[232px] shrink-0 border-r border-border bg-bg lg:block">
        <Sidebar t={t} conversations={conversations} activeId={activeId} onNew={newChat} onSelect={selectChat} onDelete={deleteChat} footer={footer} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative flex h-14 shrink-0 items-center px-3">
          <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={() => setNavOpen(true)} aria-label="Menu"><Menu className="size-4" /></Button>
          <div className="relative">
            <button type="button" onClick={() => setModeOpen((v) => !v)} className="flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-elevated">
              <Mark className="size-7 rounded-md" />
              <span className="text-sm font-medium">BOSSNU</span>
              <span className="text-xs text-muted">{directMode ? "Direct chat" : "Agent Mode"}</span>
              <ChevronDown className="size-3.5 text-muted" />
            </button>
            {modeOpen ? (
              <div className="absolute left-0 top-11 z-40 w-64 rounded-xl border border-border bg-surface p-1.5 shadow-2xl">
                <button type="button" className={cn("w-full rounded-lg px-3 py-2.5 text-left", !directMode && "bg-elevated")} onClick={() => { setDirectMode(false); setModeOpen(false); }}>
                  <span className="block text-sm font-medium">Agent Mode</span>
                  <span className="mt-0.5 block text-[11px] text-muted">Plan, use tools, write files and iterate</span>
                </button>
                <button type="button" className="w-full rounded-lg px-3 py-2.5 text-left text-muted hover:bg-elevated hover:text-fg" onClick={() => { setDirectMode(true); setModeOpen(false); }}>
                  <span className="block text-sm">Direct chat</span>
                  <span className="mt-0.5 block text-[11px]">Simple one-shot conversation</span>
                </button>
              </div>
            ) : null}
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" aria-label="Search" onClick={() => setSearchOpen(true)}><Search className="size-4" /></Button>
            <Button variant="ghost" size="icon-sm" aria-label="Settings" onClick={() => setSettingsOpen(true)}><Settings2 className="size-4" /></Button>
            <Button variant={workspaceOpen ? "secondary" : "ghost"} size="icon-sm" aria-label="Workspace" onClick={() => setWorkspaceOpen((v) => !v)}><PanelRight className="size-4" /></Button>
          </div>
        </header>

        {searchOpen ? (
          <div className="absolute right-3 top-14 z-50 w-[min(92vw,420px)] rounded-2xl border border-border bg-surface p-3 shadow-2xl">
            <div className="flex items-center gap-2"><Search className="size-4 text-muted" /><input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search chats and messages" className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none" /><button type="button" onClick={() => { setSearchQuery(""); setSearchOpen(false); }}><X className="size-4 text-muted" /></button></div>
            <div className="mt-2 max-h-72 overflow-y-auto border-t border-border pt-2">
              {filteredChats.length ? filteredChats.map((chat) => <button key={chat.id} type="button" onClick={() => { selectChat(chat.id); setSearchOpen(false); }} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-elevated"><span className="block truncate text-xs">{chat.title || "Untitled chat"}</span><span className="text-[10px] text-muted">{chat.messages.length} messages</span></button>) : <p className="px-3 py-6 text-center text-xs text-muted">No matching chats</p>}
            </div>
          </div>
        ) : null}
        {settingsOpen ? (
          <div className="absolute right-3 top-14 z-50 w-[min(92vw,360px)] rounded-2xl border border-border bg-surface p-4 shadow-2xl">
            <div className="flex items-center justify-between"><div><p className="text-sm font-medium">BOSSNU settings</p><p className="mt-1 text-xs text-muted">Agent Mode workspace</p></div><button type="button" onClick={() => setSettingsOpen(false)}><X className="size-4 text-muted" /></button></div>
            <div className="mt-4 space-y-2">
              <div className="rounded-xl bg-elevated p-3"><p className="text-xs font-medium">Puter</p><p className="mt-1 text-[11px] text-muted">{signedIn ? "Connected" : "Not connected"}</p></div>
              <button type="button" onClick={() => { setSettingsOpen(false); setWorkspaceOpen(true); }} className="w-full rounded-xl bg-elevated p-3 text-left"><p className="text-xs font-medium">Workspace</p><p className="mt-1 text-[11px] text-muted">Open files, Diff, Checks and Preview</p></button>
              <div className="rounded-xl bg-elevated p-3"><p className="text-xs font-medium">Language</p><div className="mt-2 flex gap-2"><button type="button" onClick={() => setLocale("th")} className="rounded-md bg-surface px-3 py-1.5 text-[11px]">ไทย</button><button type="button" onClick={() => setLocale("en")} className="rounded-md bg-surface px-3 py-1.5 text-[11px]">English</button></div></div>
            </div>
          </div>
        ) : null}

        <ChatPanel
          t={t}
          conversation={conversation}
          model={model}
          streaming={streaming}
          signedIn={signedIn}
          failed={failed}
          onSend={(value) => void send(value)}
          onStop={stop}
          onSignIn={() => void signIn()}
          onOpenModels={() => setModelsOpen(true)}
          workStatus={workStatus}
        />
      </div>

      {workspaceOpen ? (
        <aside className="hidden w-[360px] shrink-0 border-l border-border bg-bg xl:flex xl:flex-col">
          <div className="flex h-14 items-center gap-2 border-b border-border px-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Workspace</p>
              <p className="text-[11px] text-muted">Session files and development tools</p>
            </div>
            <Button variant="ghost" size="icon-sm" title="Download workspace" aria-label="Download workspace" onClick={downloadWorkspace}><Download className="size-4" /></Button>
            <Button variant="ghost" size="icon-sm" title="Workspace settings" aria-label="Workspace settings"><Settings2 className="size-4" /></Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setWorkspaceOpen(false)} aria-label="Close workspace"><X className="size-4" /></Button>
          </div>
          <div className="grid grid-cols-4 border-b border-border">
            {(["workspace","diff","checks","preview"] as const).map((tab) => (
              <button key={tab} type="button" onClick={() => setWorkspaceTab(tab)} className={workspaceTab === tab ? "border-b-2 border-fg py-3 text-[11px] font-medium" : "py-3 text-[11px] text-muted hover:text-fg"}>
                {tab === "workspace" ? "Workspace" : tab === "diff" ? "Diff" : tab === "checks" ? "Checks" : "Preview"}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{workspaceNotice ? <div className="mb-3 rounded-lg bg-elevated px-3 py-2 text-[11px]">{workspaceNotice}</div> : null}
            {workspaceTab === "workspace" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-surface p-4">
                  <div className="flex items-center gap-2"><GitBranch className="size-4" /><span className="text-sm font-medium">GitHub</span></div>
                  <p className="mt-1.5 text-xs leading-5 text-muted">Connect a repository and BOSSNU can work on an isolated copy, then prepare changes for review.</p>
                  <Button variant="secondary" className="mt-3 w-full" onClick={() => { setWorkspaceNotice("GitHub repository connection is not configured yet."); window.setTimeout(() => setWorkspaceNotice(""), 2200); }}><GitBranch className="size-3.5" /> Connect repository</Button>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted"><span>Branch</span><span>working</span></div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between"><span className="text-[11px] font-medium uppercase tracking-wide text-muted">Files</span><span className="text-[10px] text-subtle">Session</span></div>
                  <div className="overflow-hidden rounded-xl border border-border bg-surface"><div className="max-h-48 divide-y divide-border overflow-y-auto">{workspaceFiles.map((file) => <button key={file.path} type="button" onClick={() => selectWorkspaceFile(file.path)} className={cn("flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs hover:bg-elevated", selectedWorkspaceFile === file.path && "bg-elevated")}><span className="size-2 rounded-sm bg-muted" /><span className="min-w-0 flex-1 truncate">{file.path}</span><span className="text-[10px] text-muted">{Math.ceil(file.size / 1024)} KB</span></button>)}</div>{workspaceFiles.length === 0 ? <div className="px-4 py-10 text-center"><p className="text-sm text-fg">No files yet</p><p className="mt-1 text-xs leading-5 text-muted">Upload files or ask the agent to create one.</p></div> : null}{selectedWorkspaceFile ? <div className="border-t border-border"><div className="px-3 py-2 text-[11px] font-medium">{selectedWorkspaceFile}</div><pre className="max-h-64 overflow-auto border-t border-border bg-bg p-3 text-[10px] leading-5 text-muted">{workspaceFiles.find((file) => file.path === selectedWorkspaceFile)?.content}</pre></div> : null}</div>
                </div>
              </div>
            )}
            {workspaceTab === "diff" && (
              <div className="space-y-3">
                <div className="flex rounded-lg bg-elevated p-1">
                  <button type="button" onClick={() => setDiffScope("turn")} className={cn("flex-1 rounded-md px-3 py-2 text-center text-[11px]", diffScope === "turn" && "bg-surface")}>Last turn</button>
                  <button type="button" onClick={() => setDiffScope("branch")} className={cn("flex-1 rounded-md px-3 py-2 text-center text-[11px]", diffScope === "branch" && "bg-surface")}>Full branch</button>
                </div>
                <div className="rounded-xl border border-border bg-surface"><div className="border-b border-border px-3 py-2 text-[11px] text-muted">{workspaceFiles.length} workspace file{workspaceFiles.length === 1 ? "" : "s"}</div>{workspaceFiles.length ? workspaceFiles.map((file) => <div key={file.path} className="border-b border-border last:border-0"><div className="flex items-center gap-2 px-3 py-2"><span className="font-mono text-[10px]">M</span><span className="min-w-0 flex-1 truncate text-xs">{file.path}</span><span className="text-[10px] text-muted">{file.source}</span></div><pre className="max-h-28 overflow-auto bg-bg px-3 py-2 text-[9px] leading-4 text-muted">{file.content.slice(0, 2400)}</pre></div>) : <div className="px-4 py-8 text-center"><p className="text-sm">{diffScope === "turn" ? "No changes in this turn yet" : "No branch changes yet"}</p><p className="mt-1 text-xs text-muted">Upload or modify files to populate the workspace diff.</p></div>}</div>
              </div>
            )}
            {workspaceTab === "checks" && (
              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-surface p-4"><p className="text-sm font-medium">Checks</p><p className="mt-1 text-xs leading-5 text-muted">Live status for the current local workspace.</p></div>
                <div className="rounded-xl border border-border bg-surface p-4"><div className="flex items-center justify-between"><span className="text-xs">Workspace files</span><span className="text-[11px] text-muted">{workspaceFiles.length ? "Ready" : "Waiting"}</span></div><p className="mt-1 text-[11px] text-muted">{workspaceFiles.length ? workspaceFiles.length + " file" + (workspaceFiles.length === 1 ? "" : "s") + " available for review." : "Upload a file to start a workspace check."}</p></div>
                <div className="rounded-xl border border-border bg-surface p-4"><div className="flex items-center justify-between"><span className="text-xs">GitHub CI</span><span className="text-[11px] text-muted">Not connected</span></div><p className="mt-1 text-[11px] text-muted">No repository CI endpoint is configured, so BOSSNU will not invent a pass/fail result.</p></div>
              </div>
            )}
            {workspaceTab === "preview" && (
              <div className="space-y-3">
                {selectedWorkspaceFile && selectedWorkspaceFile.toLowerCase().endsWith(".html") ? <div className="overflow-hidden rounded-xl border border-border bg-white"><iframe title="BOSSNU workspace preview" sandbox="" srcDoc={workspaceFiles.find((file) => file.path === selectedWorkspaceFile)?.content ?? ""} className="h-[520px] w-full border-0" /></div> : <div className="rounded-xl border border-border bg-surface p-8 text-center"><p className="text-sm">Preview</p><p className="mt-1 text-xs leading-5 text-muted">Select an HTML workspace file to render a live local preview.</p></div>}
              </div>
            )}
          </div>