import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Files, GitBranch, LogOut, Menu, PanelRight, Play, Search, Settings2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ChatPanel } from "@/components/app/chat-panel";
import { Mark, Sidebar } from "@/components/app/sidebar";
import { ModelPicker } from "@/components/app/model-picker";
import { usePuter } from "@/components/puter-provider";
import { copy } from "@/lib/i18n";
import { chatModelOptions, pickFeatured, providerLabel } from "@/lib/models";
import { streamChat, type PuterChatMessage } from "@/lib/puter";
import { useChat } from "@/store/chat";

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

  const [navOpen, setNavOpen] = useState(false);
  const [modelsOpen, setModelsOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [workspaceTab, setWorkspaceTab] = useState<"workspace" | "diff" | "checks" | "preview">("workspace");
  const cancelRef = useRef(false);

  useEffect(() => {
    const v = window.localStorage.getItem("prism.locale");
    if (v === "en" || v === "th") setLocale(v);
  }, [setLocale]);

  const featured = useMemo(() => pickFeatured(models), [models]);
  const model = models.find((m) => m.id === modelId) ?? featured[0];
  const conversation = conversations.find((c) => c.id === activeId) ?? null;
  const providerCount = useMemo(() => new Set(models.map((m) => m.provider)).size, [models]);

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
    const opts = selected ? chatModelOptions(selected) : { model: modelId };
    cancelRef.current = false;
    setStreaming(true);
    const history: PuterChatMessage[] = convo.messages
      .filter((m) => m.id !== assistant.id && m.content)
      .map((m) => ({ role: m.role, content: m.content }));
    try {
      const fallbackPool = [
        selected,
        ...featured,
        ...models.filter((m) => m.id !== selected?.id && m.provider !== "openrouter"),
      ].filter(Boolean);
      let lastError: unknown = null;
      let succeeded = false;

      for (let attempt = 0; attempt < Math.min(4, fallbackPool.length); attempt++) {
        if (cancelRef.current) break;
        const candidate = fallbackPool[attempt]!;
        const candidateOpts = chatModelOptions(candidate);
        setWorkStatus(
          attempt === 0
            ? (locale === "th" ? "กำลังเชื่อมต่อโมเดล…" : "Connecting to model…")
            : (locale === "th" ? `โมเดลไม่พร้อม กำลังลองสำรอง ${attempt}/3…` : `Model unavailable, trying fallback ${attempt}/3…`),
        );
        try {
          let assembled = "";
          await streamChat({
            puter,
            messages: history,
            model: candidateOpts.model,
            provider: candidateOpts.provider,
            isCancelled: () => cancelRef.current,
            onDelta: (chunk) => {
              assembled += chunk;
              patchAssistant(convo.id, assistant.id, { content: assembled, modelId: candidate.id });
            },
          });
          if (assembled.trim()) {
            succeeded = true;
            setWorkStatus(locale === "th" ? "เรียบร้อย ✓" : "Complete ✓");
            break;
          }
          lastError = new Error("empty response");
        } catch (err) {
          lastError = err;
        }
      }

      if (!succeeded && !cancelRef.current) {
        const message = lastError instanceof Error ? lastError.message : t.error;
        patchAssistant(convo.id, assistant.id, {
          content: locale === "th" ? `โมเดลที่เลือกใช้งานไม่ได้ และโมเดลสำรองก็ไม่ตอบกลับ: ${message}` : `The selected model and fallbacks failed: ${message}`,
          error: true,
        });
        setWorkStatus(locale === "th" ? "เกิดข้อผิดพลาด ✕" : "Request failed ✕");
      }
    } finally {
      setStreaming(false);
      window.setTimeout(() => setWorkStatus(""), 900);
    }
  };

  const footer = (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm text-fg">{signedIn ? user?.username ?? t.signedInAs : t.guest}</p>
          <p className="text-[11px] text-muted">{t.userPays}</p>
        </div>
        {signedIn ? (
          <Button variant="ghost" size="icon-sm" onClick={() => void signOut()} aria-label={t.signOut}>
            <LogOut className="size-4" />
          </Button>
        ) : null}
      </div>
      {!signedIn ? (
        <Button className="w-full" onClick={() => void signIn()} disabled={!ready && !failed}>
          {t.signIn}
        </Button>
      ) : null}
      <div className="flex rounded-sm bg-elevated p-0.5">
        <button
          type="button"
          onClick={() => setLocale("th")}
          className={`h-8 flex-1 rounded-xs text-xs ${locale === "th" ? "bg-surface text-fg" : "text-muted"}`}
        >
          TH
        </button>
        <button
          type="button"
          onClick={() => setLocale("en")}
          className={`h-8 flex-1 rounded-xs text-xs ${locale === "en" ? "bg-surface text-fg" : "text-muted"}`}
        >
          EN
        </button>
      </div>
    </div>
  );

  const hero = (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 pt-6 pb-6 sm:pt-16 sm:pb-8">
      <div className="animate-[rise_500ms_var(--ease-out-smooth)_both]">
        <div className="mb-5 flex items-center gap-3">
          <Mark className="size-11 rounded-md" />
          <h1 className="font-display text-3xl tracking-[-0.03em] text-fg">{t.app}</h1>
        </div>
        <p className="max-w-md text-lg leading-snug text-fg">{t.tagline}</p>
        <p className="mt-2 max-w-md text-sm leading-normal text-muted">{t.sub}</p>
        <div className="mt-5 flex flex-wrap gap-2 text-[11px] text-muted">
          <span className="rounded-full bg-elevated px-2.5 py-1 tabular-nums">
            {models.length.toLocaleString()} {t.catalogCount}
          </span>
          <span className="rounded-full bg-elevated px-2.5 py-1 tabular-nums">
            {providerCount} {t.providers}
          </span>
          <span className="rounded-full bg-elevated px-2.5 py-1">{t.userPays}</span>
        </div>
        {!signedIn ? (
          <div className="mt-6 flex flex-wrap gap-2">
            <Button size="lg" onClick={() => void signIn()} disabled={failed}>
              {ready ? t.signIn : t.signingIn}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => setModelsOpen(true)}>
              {t.browse}
            </Button>
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted">{t.startWith}</p>
        )}
      </div>

      <div className="mt-8">
        <p className="mb-3 text-[11px] font-medium tracking-wide text-muted uppercase">{t.featured}</p>
        <div className="grid grid-cols-2 gap-2">
          {featured.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setModelId(m.id);
                setModelsOpen(false);
              }}
              className="rounded-lg bg-surface p-4 text-left shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-fg)_10%,transparent)] transition-[box-shadow] duration-150 hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-fg)_22%,transparent)] animate-[rise_500ms_var(--ease-out-smooth)_both]"
              style={{ animationDelay: `${80 + i * 40}ms` }}
            >
              <p className="text-[11px] text-muted">{providerLabel(m.provider)}</p>
              <p className="mt-1 text-sm font-medium text-fg">{m.name}</p>
              <p className="mt-1 truncate font-mono text-[11px] text-subtle">{m.id}</p>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setModelsOpen(true)}
          className="mt-3 text-sm text-muted hover:text-fg"
        >
          {t.orPick} →
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-bg text-fg">
      <aside className="hidden w-[250px] shrink-0 border-r border-border bg-surface lg:block">
        <Sidebar
          t={t}
          conversations={conversations}
          activeId={activeId}
          onNew={() => newChat()}
          onSelect={selectChat}
          onDelete={deleteChat}
          footer={footer}
        />
      </aside>

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-2 sm:px-3">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            aria-label="Menu"
            onClick={() => setNavOpen(true)}
          >
            <Menu className="size-4" />
          </Button>
          <Mark className="lg:hidden" />
          <button
            type="button"
            onClick={() => setModelsOpen(true)}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-elevated sm:flex-none"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-fg">Agent Mode</span>
              <span className="hidden truncate text-[11px] text-muted sm:block">{model?.name ?? t.selectModel}</span>
              <span className="hidden truncate text-[11px] text-muted sm:block">
                {model ? providerLabel(model.provider) : t.models}
              </span>
            </span>
            <ChevronDown className="size-3.5 shrink-0 text-subtle" />
          </button>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" aria-label="Search"><Search className="size-4" /></Button>
            <Button variant="ghost" size="icon-sm" aria-label="Settings"><Settings2 className="size-4" /></Button>
            <Button variant={workspaceOpen ? "secondary" : "ghost"} size="icon-sm" aria-label="Workspace" onClick={() => setWorkspaceOpen((v) => !v)}><PanelRight className="size-4" /></Button>
          </div>
        </header>

        <ChatPanel
          t={t}
          conversation={conversation}
          model={model}
          streaming={streaming}
          signedIn={signedIn}
          failed={failed}
          onSend={(text) => void send(text)}
          onStop={stop}
          onSignIn={() => void signIn()}
          onOpenModels={() => setModelsOpen(true)}
          hero={hero}
          workStatus={workStatus}
        />
      </div>
      {workspaceOpen ? (
        <aside className="hidden w-[330px] shrink-0 border-l border-border bg-surface xl:flex xl:flex-col">
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <div><p className="text-sm font-medium text-fg">Workspace</p><p className="text-[11px] text-muted">BOSSNU Agent</p></div>
            <Button variant="ghost" size="icon-sm" aria-label="Close workspace" onClick={() => setWorkspaceOpen(false)}><X className="size-4" /></Button>
          </div>
          <div className="grid grid-cols-4 border-b border-border">
            {(["workspace","diff","checks","preview"] as const).map((id) => (
              <button key={id} type="button" onClick={() => setWorkspaceTab(id)} className={workspaceTab === id ? "border-b-2 border-fg px-2 py-3 text-[11px] text-fg" : "px-2 py-3 text-[11px] text-muted hover:text-fg"}>{id === "workspace" ? "Workspace" : id === "diff" ? "Diff" : id === "checks" ? "Checks" : "Preview"}</button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {workspaceTab === "workspace" ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-elevated p-4">
                  <div className="flex items-center gap-2 text-sm font-medium"><GitBranch className="size-4" /> Repository</div>
                  <p className="mt-2 text-xs text-muted">Connect a GitHub repository to work with project files.</p>
                  <Button size="sm" variant="secondary" className="mt-3 w-full"><GitBranch className="size-3.5" /> Connect GitHub</Button>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between"><span className="text-[11px] font-medium uppercase tracking-wide text-muted">Files</span><Upload className="size-3.5 text-muted" /></div>
                  <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center"><Files className="mx-auto size-5 text-muted" /><p className="mt-2 text-xs text-muted">Session files will appear here.</p></div>
                </div>
              </div>
            ) : workspaceTab === "diff" ? (
              <div className="rounded-lg bg-elevated/50 p-6 text-center"><Files className="mx-auto size-5 text-muted" /><p className="mt-3 text-sm text-fg">No changes yet</p><p className="mt-1 text-xs text-muted">File changes will appear here.</p></div>
            ) : workspaceTab === "checks" ? (
              <div className="rounded-lg bg-elevated/50 p-6 text-center"><p className="mx-auto flex size-5 items-center justify-center rounded-full border border-border text-[10px]">✓</p><p className="mt-3 text-sm text-fg">Checks</p><p className="mt-1 text-xs text-muted">Commit and deployment checks will appear here.</p></div>
            ) : (
              <div className="rounded-lg bg-elevated/50 p-6 text-center"><Play className="mx-auto size-5 text-muted" /><p className="mt-3 text-sm text-fg">Preview</p><p className="mt-1 text-xs text-muted">A live preview can appear here when the app is built.</p></div>
            )}
          </div>
        </aside>
      ) : null

      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" title={t.app} className="p-0">
          <Sidebar
            t={t}
            conversations={conversations}
            activeId={activeId}
            onNew={() => {
              newChat();
              setNavOpen(false);
            }}
            onSelect={(id) => {
              selectChat(id);
              setNavOpen(false);
            }}
            onDelete={deleteChat}
            footer={footer}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={modelsOpen} onOpenChange={setModelsOpen}>
        <SheetContent side="bottom" title={t.selectModel} className="h-[88dvh] sm:inset-y-0 sm:right-0 sm:left-auto sm:h-full sm:w-[min(100%,28rem)] sm:rounded-l-lg sm:rounded-t-none">
          <ModelPicker
            models={models}
            selectedId={model?.id ?? modelId}
            featured={featured}
            t={t}
            onSelect={(id) => {
              setModelId(id);
              setModelsOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
