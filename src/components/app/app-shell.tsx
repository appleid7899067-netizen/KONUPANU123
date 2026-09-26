import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Download, GitBranch, Github, Menu, PanelRight, Search, Settings2, X } from "lucide-react";
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
import { WorkspacePreview } from "@/components/app/workspace-preview";
import { applyAgentActions, buildAgentPlannerPrompt, executeGitHubWrites, executeSandboxActions, executeWebFetches, parseAgentPlan } from "@/lib/agent-runtime";

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
  const addWorkspaceFiles = useChat((s) => s.addWorkspaceFiles);

  const [navOpen, setNavOpen] = useState(false);
  const [modelsOpen, setModelsOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [workspaceTab, setWorkspaceTab] = useState<"workspace" | "diff" | "checks" | "preview">("workspace");
  const githubAppSlug = (import.meta.env.VITE_GITHUB_APP_SLUG as string | undefined)?.trim();

  const installGitHubApp = () => {
    if (!githubAppSlug) {
      setWorkspaceNotice("ยังไม่ได้ตั้งค่า VITE_GITHUB_APP_SLUG บนระบบ deploy");
      return;
    }
    const returnTo = window.location.href;
    const url = new URL(`https://github.com/apps/${encodeURIComponent(githubAppSlug)}/installations/new`);
    url.searchParams.set("state", btoa(JSON.stringify({ returnTo, source: "bossnu" })));
    window.location.href = url.toString();
  };
  const [modeOpen, setModeOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [directMode, setDirectMode] = useState(false);
  const [workspaceNotice, setWorkspaceNotice] = useState("");
  const [diffScope, setDiffScope] = useState<"turn" | "branch">("turn");
  const [repoInput, setRepoInput] = useState("appleid7899067-netizen/KONUPANU123");
  const [repoBranch, setRepoBranch] = useState("main");
  const [repoRef, setRepoRef] = useState("");
  const [repoLoading, setRepoLoading] = useState(false);
  const [repoSha, setRepoSha] = useState("");
  const [repoChecks, setRepoChecks] = useState<{ state: string; total: number; success: number; failed: number; pending: number } | null>(null);
  const [repoCompare, setRepoCompare] = useState<{ status: string; ahead: number; behind: number; files: Array<{ filename: string; status: string; additions: number; deletions: number }> } | null>(null);
  const [checksLoading, setChecksLoading] = useState(false);
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
    if (!signedIn) { await signIn(); return; }
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
        setWorkStatus(attempt === 0
          ? locale === "th" ? (directMode ? "กำลังตอบ…" : "กำลังวิเคราะห์เป้าหมาย…") : (directMode ? "Responding…" : "Analyzing goal…")
          : locale === "th" ? `กำลังลองโมเดลสำรอง ${attempt}/3…` : `Trying fallback ${attempt}/3…`);
        try {
          const opts = chatModelOptions(candidate);

          if (!directMode) {
            let planRaw = "";
            await streamChat({
              puter,
              messages: [
                { role: "system", content: "You are Bossnu Agent planner. Return only the JSON plan requested by the user. Do not pretend to execute tools." },
                { role: "user", content: buildAgentPlannerPrompt(text, workspaceFiles.map((file) => ({ path: file.path, content: file.content }))) },
              ],
              model: opts.model,
              provider: opts.provider,
              isCancelled: () => cancelRef.current,
              onDelta: (chunk) => { planRaw += chunk; },
            });

            const plan = parseAgentPlan(planRaw);
            if (plan) {
              setWorkStatus(locale === "th" ? "กำลังลงมือแก้ไขไฟล์…" : "Applying workspace changes…");
              const applied = applyAgentActions(plan, workspaceFiles);
              if (applied.writes.length || applied.evidence.some((item) => item.startsWith("deleted"))) addWorkspaceFiles(applied.files);

              setWorkStatus(locale === "th" ? "กำลังตรวจผลการทำงาน…" : "Verifying tool results…");
              const webEvidence = await executeWebFetches(plan);
              const sandboxEvidence = await executeSandboxActions(plan, applied.files.map((file) => ({ path: file.path, content: file.content })));
              if (sandboxEvidence.length) setWorkStatus(locale === "th" ? "กำลังตรวจผลจาก Sandbox…" : "Verifying sandbox output…");
              const githubEvidence = await executeGitHubWrites(plan, applied.files.map((file) => ({ path: file.path, content: file.content })));
              if (githubEvidence.length) setWorkStatus(locale === "th" ? "กำลังตรวจ GitHub…" : "Verifying GitHub…");
              const evidence = [...applied.evidence, ...webEvidence, ...sandboxEvidence, ...githubEvidence];
              const verification = plan.verify.length ? `Requested verification:\n- ${plan.verify.join("\n- ")}` : "";
              const finalPrompt = [
                "You are Bossnu completing an Agent Mode task.",
                "Use the evidence below. Do not claim actions that are not evidenced.",
                "If a requested capability was not available, say so plainly.",
                `User goal: ${text}`,
                `Plan goal: ${plan.goal}`,
                `Evidence:\n- ${evidence.join("\n- ")}`,
                ...applied.reads,
                ...webEvidence,
                verification,
                "Reply naturally in Thai unless the user clearly used another language. Be concise and state exactly what changed and what remains.",
              ].join("\n\n");

              let assembled = "";
              await streamChat({
                puter,
                messages: [{ role: "system", content: "You are Bossnu. Report verified work only." }, { role: "user", content: finalPrompt }],
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
                setWorkStatus(locale === "th" ? "ตรวจแล้ว • เรียบร้อย ✓" : "Verified • Done ✓");
                break;
              }
            } else {
              setWorkStatus(locale === "th" ? "แผน Agent ไม่ถูกต้อง กำลังตอบแบบตรง…" : "Agent plan invalid, switching to direct response…");
            }
          }

          let assembled = "";
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
        } catch (error) { lastError = error; }
      }

      if (!done && !cancelRef.current) {
        const message = lastError instanceof Error ? lastError.message : t.error;
        patchAssistant(convo.id, assistant.id, { content: locale === "th" ? `งานยังไม่สำเร็จ: ${message}` : `The task did not complete: ${message}`, error: true });
        setWorkStatus(locale === "th" ? "เกิดข้อผิดพลาด ✕" : "Failed ✕");
      }
    } finally {
      setStreaming(false);
      window.setTimeout(() => setWorkStatus(""), 1600);
    }
  };

  const filteredChats = conversations.filter((chat) => {
    const q = searchQuery.trim().toLowerCase();
    return !q || chat.title.toLowerCase().includes(q) || chat.messages.some((m) => m.content.toLowerCase().includes(q));
  });

  const connectGitHubRepository = async () => {
    const cleanedRepo = repoInput.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "");
    const repoParts = cleanedRepo.split("/").filter(Boolean);
    const owner = repoParts[0];
    const repo = repoParts[1];
    if (!owner || !repo) {
      setWorkspaceNotice("ใส่ repo แบบ owner/name เช่น appleid7899067-netizen/KONUPANU123");
      return;
    }
    const branch = repoBranch.trim() || "main";
    setRepoLoading(true);
    setWorkspaceNotice("กำลังเชื่อม GitHub และโหลดไฟล์จริง…");
    try {
      const meta = await fetch(`https://api.github.com/repos/${owner}/${repo}`).then((res) => {
        if (!res.ok) throw new Error(`GitHub ${res.status}`);
        return res.json() as Promise<{ default_branch?: string }>;
      });
      const resolvedBranch = branch || meta.default_branch || "main";
      const tree = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(resolvedBranch)}?recursive=1`).then((res) => {
        if (!res.ok) throw new Error(`Git tree ${res.status}`);
        return res.json() as Promise<{ tree?: Array<{ path: string; type: string; size?: number }> }>;
      });
      const candidates = (tree.tree ?? [])
        .filter((item) => item.type === "blob")
        .filter((item) => {
          const parts = item.path.split("/");
          return !parts.some((part) => ["node_modules", ".git", "dist", "build", ".next", ".output", "coverage"].includes(part));
        })
        .filter((item) => {
          const lower = item.path.toLowerCase();
          return ![".png",".jpg",".jpeg",".gif",".webp",".ico",".pdf",".zip",".woff",".woff2",".ttf",".eot",".mp4",".webm",".mov",".mp3",".wav",".wasm"].some((ext) => lower.endsWith(ext));
        })
        .filter((item) => (item.size ?? 0) <= 180_000)
        .slice(0, 30);
      const files = [];
      for (const item of candidates) {
        const response = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(resolvedBranch)}/${item.path.split("/").map(encodeURIComponent).join("/")}`);
        if (!response.ok) continue;
        const content = await response.text();
        files.push({ path: item.path, content, size: content.length, source: "agent" as const, updatedAt: Date.now() });
      }
      addWorkspaceFiles(files);
      setRepoRef(`${owner}/${repo}@${resolvedBranch}`);
      setRepoBranch(resolvedBranch);
      setWorkspaceNotice(files.length ? `เชื่อมแล้ว • โหลด ${files.length} ไฟล์` : "เชื่อมแล้ว แต่ไม่พบไฟล์ข้อความที่โหลดได้");
    } catch (error) {
      setWorkspaceNotice(`GitHub เชื่อมไม่สำเร็จ: ${error instanceof Error ? error.message : "unknown error"}`);
    } finally {
      setRepoLoading(false);
      window.setTimeout(() => setWorkspaceNotice(""), 2600);
    }
  };

  const refreshGitHubState = async () => {
    const cleanedRepo = repoInput.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "");
    const repoParts = cleanedRepo.split("/").filter(Boolean);
    const owner = repoParts[0];
    const repo = repoParts[1];
    if (!owner || !repo) return;
    const branch = repoBranch.trim() || "main";
    setChecksLoading(true);
    try {
      const refData = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`).then((res) => res.json() as Promise<{ object?: { sha?: string } }>);
      const sha = refData.object?.sha ?? "";
      setRepoSha(sha);
      if (sha) {
        const status = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${sha}/status`).then((res) => res.json() as Promise<{ state?: string; total_count?: number; statuses?: Array<{ state?: string }> }>);
        const statuses = status.statuses ?? [];
        setRepoChecks({ state: status.state ?? "unknown", total: status.total_count ?? statuses.length, success: statuses.filter((x) => x.state === "success").length, failed: statuses.filter((x) => x.state === "failure" || x.state === "error").length, pending: statuses.filter((x) => x.state === "pending").length });
      }
      const meta = await fetch(`https://api.github.com/repos/${owner}/${repo}`).then((res) => res.json() as Promise<{ default_branch?: string }>);
      const base = meta.default_branch ?? "main";
      if (branch !== base) {
        const compare = await fetch(`https://api.github.com/repos/${owner}/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(branch)}`).then((res) => res.json() as Promise<{ status?: string; ahead_by?: number; behind_by?: number; files?: Array<{ filename: string; status: string; additions: number; deletions: number }> }>);
        setRepoCompare({ status: compare.status ?? "unknown", ahead: compare.ahead_by ?? 0, behind: compare.behind_by ?? 0, files: compare.files ?? [] });
      } else {
        setRepoCompare(null);
      }
    } catch (error) {
      setWorkspaceNotice(`GitHub refresh failed: ${error instanceof Error ? error.message : "unknown error"}`);
    } finally {
      setChecksLoading(false);
    }
  };

  const downloadWorkspace = async () => {
    if (!workspaceFiles.length) {
      setWorkspaceNotice("Workspace ว่าง");
      return;
    }
    const zip = buildStoreZip(workspaceFiles.map((file) => ({ path: file.path, content: file.content })));
    const url = URL.createObjectURL(new Blob([zip], { type: "application/zip" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `bossnu-workspace-${conversation?.id ?? "session"}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setWorkspaceNotice(`Exported ${workspaceFiles.length} files`);
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
              <span className="text-sm font-medium">Bossnu</span>
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
            <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Bossnu settings</p><p className="mt-1 text-xs text-muted">Agent Mode workspace</p></div><button type="button" onClick={() => setSettingsOpen(false)}><X className="size-4 text-muted" /></button></div>
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
                  <p className="mt-1.5 text-xs leading-5 text-muted">Connect a repository and Bossnu can work on an isolated copy, then prepare changes for review.</p>
                  <div className="mt-3 space-y-2">
                    <Button className="w-full justify-center" onClick={installGitHubApp} disabled={!githubAppSlug}>
                      <Github className="size-4" /> {githubAppSlug ? "GitHub OAuth • เลือกรีโพ" : "GitHub App ยังไม่ได้ตั้งค่า"}
                    </Button>
                    <p className="text-[10px] leading-4 text-muted">กดแล้ว GitHub จะให้ยืนยันสิทธิ์และเลือกได้ทั้ง All repositories หรือ Only select repositories ตามสิทธิ์ของ GitHub App</p>
                    <input value={repoInput} onChange={(e) => setRepoInput(e.target.value)} placeholder="owner/repository" className="h-9 w-full rounded-lg border border-border bg-bg px-3 text-xs outline-none focus:border-fg/30" />
                    <div className="flex gap-2">
                      <input value={repoBranch} onChange={(e) => setRepoBranch(e.target.value)} placeholder="main" className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 text-xs outline-none focus:border-fg/30" />
                      <Button variant="secondary" onClick={() => void connectGitHubRepository()} disabled={repoLoading}>
                        <GitBranch className="size-3.5" /> {repoLoading ? "กำลังโหลด…" : "Connect"}
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted"><span>Repository</span><span className="max-w-[210px] truncate">{repoRef || "ยังไม่ได้เชื่อม"}</span></div>
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
                <div className="rounded-xl border border-border bg-surface">
                  <div className="flex items-center justify-between border-b border-border px-3 py-2"><span className="text-[11px] text-muted">{repoCompare ? `${repoCompare.files.length} GitHub files • +${repoCompare.ahead}/-${repoCompare.behind}` : `${workspaceFiles.length} workspace files`}</span><button type="button" onClick={() => void refreshGitHubState()} className="text-[10px] text-muted">{checksLoading ? "…" : "Refresh"}</button></div>
                  {repoCompare?.files.length ? repoCompare.files.map((file) => <div key={file.filename} className="flex items-center gap-2 border-b border-border px-3 py-2"><span className="font-mono text-[10px]">{file.status === "added" ? "A" : file.status === "removed" ? "D" : "M"}</span><span className="min-w-0 flex-1 truncate text-xs">{file.filename}</span><span className="text-[10px] text-muted">+{file.additions} -{file.deletions}</span></div>) : <div className="px-4 py-8 text-center"><p className="text-sm">No GitHub branch diff</p><p className="mt-1 text-xs text-muted">Full branch reads GitHub compare data when a non-default branch is connected.</p></div>}
                </div>
              </div>
            )}
            {workspaceTab === "checks" && (
              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-surface p-4"><div className="flex items-center justify-between"><p className="text-sm font-medium">Checks</p><button type="button" onClick={() => void refreshGitHubState()} className="text-[10px] text-muted">{checksLoading ? "Refreshing…" : "Refresh"}</button></div><p className="mt-1 text-xs leading-5 text-muted">Live GitHub commit status for the connected branch.</p></div>
                <div className="rounded-xl border border-border bg-surface p-4"><div className="flex items-center justify-between"><span className="text-xs">Commit</span><span className="font-mono text-[10px] text-muted">{repoSha ? repoSha.slice(0, 8) : "Not connected"}</span></div><div className="mt-3 flex items-center justify-between"><span className="text-xs">GitHub CI</span><span className="text-[11px]">{repoChecks?.state ?? "unknown"}</span></div><p className="mt-1 text-[11px] text-muted">{repoChecks ? `${repoChecks.success} passed • ${repoChecks.failed} failed • ${repoChecks.pending} pending • ${repoChecks.total} total` : "Connect a repository branch and refresh to read its real status."}</p></div>
                <div className="rounded-xl border border-border bg-surface p-4"><div className="flex items-center justify-between"><span className="text-xs">Workspace files</span><span className="text-[11px] text-muted">{workspaceFiles.length ? "Ready" : "Waiting"}</span></div><p className="mt-1 text-[11px] text-muted">{workspaceFiles.length ? `${workspaceFiles.length} file${workspaceFiles.length === 1 ? "" : "s"} available.` : "No local workspace files."}</p></div>
              </div>
            )}
            {workspaceTab === "preview" && (
              <WorkspacePreview file={workspaceFiles.find((file) => file.path === selectedWorkspaceFile)} />
            )}
          </div>
        </aside>
      ) : null}

      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" title="Bossnu" className="w-[280px] p-0">
          <Sidebar t={t} conversations={conversations} activeId={activeId} onNew={() => { newChat(); setNavOpen(false); }} onSelect={(id) => { selectChat(id); setNavOpen(false); }} onDelete={deleteChat} footer={footer} />
        </SheetContent>
      </Sheet>

      <Sheet open={modelsOpen} onOpenChange={setModelsOpen}>
        <SheetContent side="right" title="Models" className="w-[min(100%,30rem)] p-0">
          <ModelPicker models={models} selectedId={model?.id ?? modelId} featured={featured} t={t} onSelect={(id) => { setModelId(id); setModelsOpen(false); }} />
        </SheetContent>
      </Sheet>
    </div>
  );
}


function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i]!;
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(n: number) {
  return new Uint8Array([n & 255, (n >>> 8) & 255]);
}

function u32(n: number) {
  return new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]);
}

function buildStoreZip(files: Array<{ path: string; content: string }>) {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.path);
    const data = encoder.encode(file.content);
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length + data.length);
    const view = new DataView(local.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x800, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, data.length, true);
    view.setUint32(22, data.length, true);
    view.setUint16(26, name.length, true);
    local.set(name, 30);
    local.set(data, 30 + name.length);
    chunks.push(local);

    const c = new Uint8Array(46 + name.length);
    const cv = new DataView(c.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x800, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    c.set(name, 46);
    central.push(c);
    offset += local.length;
  }
  const centralOffset = offset;
  const centralSize = central.reduce((n, item) => n + item.length, 0);
  chunks.push(...central);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, centralOffset, true);
  chunks.push(end);
  const total = chunks.reduce((n, item) => n + item.length, 0);
  const output = new Uint8Array(total);
  let cursor = 0;
  for (const item of chunks) {
    output.set(item, cursor);
    cursor += item.length;
  }
  return output;
}
