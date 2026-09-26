import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, Avatar } from "@/components/shell";
import { PromptBox } from "@/components/prompt-box";
import { ProjectCard } from "@/components/project-card";
import { STARTERS } from "@/lib/templates";
import { usePulse } from "@/lib/store";
import type { BuildType, InteractionMode } from "@/lib/types";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const navigate = useNavigate();
  const user = usePulse((s) => s.user);
  const projects = usePulse((s) => s.projects);
  const createProject = usePulse((s) => s.createProject);
  const model = usePulse((s) => s.settings.model);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<InteractionMode>("agent");
  const [buildType, setBuildType] = useState<BuildType>("web");
  const [busy, setBusy] = useState(false);
  const recents = [...projects].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt).slice(0, 6);
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  async function start(text: string, type: BuildType = buildType, m: InteractionMode = mode) {
    const value = text.trim();
    if (!value || busy) return;
    setBusy(true);
    const project = createProject({ prompt: value, buildType: type, mode: m, model });
    await navigate({ to: "/project/$id", params: { id: project.id } });
  }

  return (
    <Shell>
      <header className="flex items-center justify-between px-5 pt-5 md:px-8 md:pt-8">
        <div className="flex items-center gap-3">
          <Avatar name={user?.username} />
          <div>
            <p className="text-xs text-subtle">{hello}</p>
            <p className="text-sm font-semibold">{user?.username ?? "Guest"}</p>
          </div>
        </div>
      </header>
      <section className="mx-auto w-full max-w-2xl px-5 pt-10 md:pt-16">
        <h1 className="text-center text-[1.85rem] font-semibold tracking-tight md:text-[2.35rem]">What do you want to make?</h1>
        <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted">Agent builds it. Chat shapes it first. Models run on your Puter account.</p>
        <div className="mt-8">
          <PromptBox value={prompt} onChange={setPrompt} onSubmit={() => start(prompt)} mode={mode} onMode={setMode} buildType={buildType} onBuildType={setBuildType} disabled={busy} busy={busy} />
        </div>
      </section>
      <section className="mx-auto mt-10 w-full max-w-2xl px-5">
        <h2 className="mb-3 text-xs font-medium tracking-wide text-subtle uppercase">Try these</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {STARTERS.slice(0, 4).map((s) => (
            <button key={s.id} type="button" onClick={() => start(s.prompt, s.buildType, "agent")} className="rounded-2xl bg-surface p-3.5 text-left shadow-[var(--shadow-border)] transition-colors hover:bg-elevated">
              <p className="text-[13px] font-semibold">{s.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{s.blurb}</p>
            </button>
          ))}
        </div>
      </section>
      {recents.length ? (
        <section className="mx-auto mt-10 w-full max-w-2xl px-5">
          <h2 className="mb-3 text-xs font-medium tracking-wide text-subtle uppercase">Recent projects</h2>
          <div className="flex flex-col gap-2.5">{recents.map((p) => <ProjectCard key={p.id} project={p} />)}</div>
        </section>
      ) : null}
    </Shell>
  );
}
