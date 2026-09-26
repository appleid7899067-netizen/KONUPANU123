import type { ReactNode } from "react";
import { MessageSquarePlus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Copy } from "@/lib/i18n";
import type { Conversation } from "@/store/chat";

type Props = {
  t: Copy;
  conversations: Conversation[];
  activeId: string | null;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  footer: ReactNode;
};

export function Sidebar({ t, conversations, activeId, onNew, onSelect, onDelete, footer }: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-bg">
      <div className="flex items-center justify-between px-3 py-3">
        <button type="button" onClick={onNew} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-elevated">
          <Mark className="size-7 rounded-lg" />
          <span className="text-sm font-semibold tracking-tight">BOSSNU</span>
        </button>
        <Button variant="ghost" size="icon-sm" onClick={onNew} aria-label={t.newChat}><MessageSquarePlus className="size-4" /></Button>
      </div>

      <div className="px-3 pb-3">
        <button type="button" className="flex w-full items-center gap-2 rounded-lg bg-surface px-3 py-2 text-xs text-muted hover:text-fg">
          <Search className="size-3.5" />
          Search
          <span className="ml-auto text-[10px] text-subtle">⌘K</span>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2">
        <p className="px-2 pb-2 text-[10px] font-medium uppercase tracking-[.12em] text-subtle">Chats</p>
        {conversations.length === 0 ? (
          <p className="px-2 py-5 text-xs text-muted">{t.emptyChats}</p>
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((c) => (
              <li key={c.id} className="group relative">
                <button type="button" onClick={() => onSelect(c.id)} className={cn("w-full rounded-lg px-2.5 py-2 text-left text-xs", activeId === c.id ? "bg-elevated text-fg" : "text-muted hover:bg-surface hover:text-fg")}>
                  <span className="block truncate">{c.title || t.untitled}</span>
                </button>
                <button type="button" aria-label={t.delete} onClick={() => onDelete(c.id)} className="absolute right-1 top-1/2 hidden size-7 -translate-y-1/2 items-center justify-center rounded-md text-subtle hover:bg-bg hover:text-fg group-hover:flex">
                  <Trash2 className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-border px-3 py-3">{footer}</div>
    </div>
  );
}

export function Mark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface", className)} aria-hidden>
      <svg viewBox="0 0 24 24" className="size-4" fill="none">
        <path d="M12 3.5 20.5 12 12 20.5 3.5 12 12 3.5Z" stroke="currentColor" strokeWidth="1.4" />
        <path d="M12 3.5V20.5M3.5 12H20.5" stroke="currentColor" strokeWidth="1" opacity=".45" />
      </svg>
    </span>
  );
}
