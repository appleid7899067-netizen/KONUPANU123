import type { ReactNode } from "react";
import { MessageSquarePlus, Trash2 } from "lucide-react";
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
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex items-center gap-2 px-3 pt-4 pb-3">
        <Mark />
        <div className="min-w-0">
          <p className="font-display text-xl leading-tight text-fg">{t.app}</p>
          <p className="truncate text-[11px] text-muted">{t.tagline}</p>
        </div>
      </div>
      <div className="px-3 pb-3">
        <Button className="w-full" onClick={onNew}>
          <MessageSquarePlus />
          {t.newChat}
        </Button>
      </div>
      <p className="px-4 pb-1 text-[11px] font-medium tracking-wide text-muted uppercase">{t.conversations}</p>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {conversations.length === 0 ? (
          <p className="px-2 py-6 text-sm text-muted">{t.emptyChats}</p>
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((c) => (
              <li key={c.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className={cn(
                    "w-full rounded-md px-3 py-2.5 pr-10 text-left text-sm transition-colors duration-150",
                    activeId === c.id ? "bg-elevated text-fg" : "text-muted hover:bg-elevated hover:text-fg",
                  )}
                >
                  <span className="block truncate">{c.title || t.untitled}</span>
                </button>
                <button
                  type="button"
                  aria-label={t.delete}
                  onClick={() => onDelete(c.id)}
                  className="absolute top-1/2 right-1 hidden size-9 -translate-y-1/2 items-center justify-center rounded-sm text-subtle hover:bg-bg hover:text-fg group-hover:flex"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="border-t border-border p-3">{footer}</div>
    </div>
  );
}

export function Mark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-sm bg-elevated shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-fg)_12%,transparent)]",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-4 text-fg" fill="none">
        <path d="M12 3.5 21 12 12 20.5 3 12 12 3.5Z" stroke="currentColor" strokeWidth="1.4" />
        <path d="M12 3.5 12 20.5M3 12h18" stroke="currentColor" strokeWidth="1" opacity=".55" />
      </svg>
    </span>
  );
}
