import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowUp, Check, Copy, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/lib/markdown";
import { cn } from "@/lib/utils";
import { providerLabel, type CatalogModel } from "@/lib/models";
import type { Copy as CopyText } from "@/lib/i18n";
import type { ChatMessage, Conversation } from "@/store/chat";

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
  hero?: ReactNode;
  workStatus?: string;
};

export function ChatPanel({
  t,
  conversation,
  model,
  streaming,
  signedIn,
  failed,
  onSend,
  onStop,
  onSignIn,
  onOpenModels,
  hero,
  workStatus = "",
}: Props) {
  const messages = conversation?.messages ?? [];
  const empty = messages.length === 0;
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distance < 180 || messages.length <= 2) {
      bottomRef.current?.scrollIntoView({ block: "end", behavior: streaming ? "auto" : "smooth" });
    }
  }, [messages.length, streaming]);

  return (
    <div className="relative min-h-0 flex-1">
      <div className="absolute inset-0 flex flex-col">
        <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto">
          {empty ? (
            hero
          ) : (
            <div className="mx-auto w-full max-w-2xl px-4 py-6">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} t={t} streaming={streaming} model={model} />
              ))}
              {workStatus ? <div className="mb-3 text-xs text-muted">{workStatus}</div> : null}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
        <div className="shrink-0 border-t border-border bg-bg px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4">
          <div className="mx-auto w-full max-w-2xl">
            {!signedIn ? (
              <p className="mb-2 text-center text-xs text-muted">{failed ? t.puterMissing : t.needSignIn}</p>
            ) : null}
            <Composer
              t={t}
              streaming={streaming}
              onSend={signedIn ? onSend : () => void onSignIn()}
              onStop={onStop}
              placeholder={signedIn ? t.composer : t.signIn}
              modelName={model?.name}
              onOpenModels={onOpenModels}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  t,
  streaming,
  model,
}: {
  message: ChatMessage;
  t: CopyText;
  streaming: boolean;
  model?: CatalogModel;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const isEmptyAssistant = !isUser && !message.content && streaming;

  return (
    <article className={cn("mb-6", isUser ? "ml-8 sm:ml-16" : "mr-4 sm:mr-12")}>
      <div className="mb-1.5 flex items-center gap-2 text-[11px] text-muted">
        <span className="font-medium text-fg/80">{isUser ? t.you : model?.name ?? t.app}</span>
        {!isUser && model ? <span>{providerLabel(model.provider)}</span> : null}
      </div>
      <div
        className={cn(
          "rounded-lg px-4 py-3",
          isUser
            ? "bg-elevated text-fg shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-fg)_8%,transparent)]"
            : "bg-transparent px-0 py-0",
        )}
      >
        {isEmptyAssistant ? (
          <Thinking t={t} />
        ) : isUser ? (
          <p className="text-sm leading-normal whitespace-pre-wrap">{message.content}</p>
        ) : (
          <Markdown text={message.content} />
        )}
        {message.error ? <p className="mt-2 text-xs text-danger">{t.error}</p> : null}
      </div>
      {!isUser && message.content ? (
        <button
          type="button"
          className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-sm px-2 text-[11px] text-muted hover:bg-elevated hover:text-fg"
          onClick={async () => {
            await navigator.clipboard.writeText(message.content);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
          }}
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? t.copied : t.copy}
        </button>
      ) : null}
    </article>
  );
}

function Thinking({ t }: { t: CopyText }) {
  return (
    <p className="flex items-center gap-2 text-sm text-muted">
      <span className="flex gap-1">
        <i className="size-1.5 rounded-full bg-fg animate-[pulse-dot_1.2s_ease-in-out_infinite]" />
        <i className="size-1.5 rounded-full bg-fg animate-[pulse-dot_1.2s_ease-in-out_0.15s_infinite]" />
        <i className="size-1.5 rounded-full bg-fg animate-[pulse-dot_1.2s_ease-in-out_0.3s_infinite]" />
      </span>
      {t.thinking}
    </p>
  );
}

function Composer({
  t,
  streaming,
  onSend,
  onStop,
  placeholder,
  modelName,
  onOpenModels,
}: {
  t: CopyText;
  streaming: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  placeholder: string;
  modelName?: string;
  onOpenModels: () => void;
}) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const canSend = useMemo(() => value.trim().length > 0 && !streaming, [value, streaming]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [value]);

  return (
    <form
      className="rounded-xl bg-surface p-2 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-fg)_12%,transparent)]"
      onSubmit={(e) => {
        e.preventDefault();
        if (streaming) {
          onStop();
          return;
        }
        const text = value.trim();
        if (!text) return;
        setValue("");
        onSend(text);
      }}
    >
      <Textarea
        ref={ref}
        rows={1}
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
          }
        }}
      />
      <div className="flex items-center justify-between gap-2 px-1 pt-1 pb-0.5">
        <button
          type="button"
          onClick={onOpenModels}
          className="max-w-[60%] truncate rounded-sm px-2 py-1.5 text-left text-[11px] text-muted hover:bg-elevated hover:text-fg"
        >
          {modelName ?? t.selectModel}
        </button>
        <Button
          type="submit"
          size="icon-sm"
          disabled={!streaming && !canSend}
          aria-label={streaming ? t.stop : t.send}
          variant={streaming ? "secondary" : "default"}
        >
          {streaming ? <Square className="size-3.5" /> : <ArrowUp className="size-4" />}
        </Button>
      </div>
    </form>
  );
}
