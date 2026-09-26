import { useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, formatContext, formatCost } from "@/lib/utils";
import { hasVision, providerLabel, type CatalogModel } from "@/lib/models";
import type { Copy } from "@/lib/i18n";

type Props = {
  models: CatalogModel[];
  selectedId: string;
  t: Copy;
  onSelect: (id: string) => void;
  featured?: CatalogModel[];
};

export function ModelPicker({ models, selectedId, t, onSelect, featured = [] }: Props) {
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState<string | "all">("all");

  const providers = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of models) counts.set(m.provider, (counts.get(m.provider) ?? 0) + 1);
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [models]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return models.filter((m) => {
      if (provider !== "all" && m.provider !== provider) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        providerLabel(m.provider).toLowerCase().includes(q)
      );
    });
  }, [models, provider, query]);

  const visible = filtered.slice(0, 120);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchModels}
            className="pl-10"
            aria-label={t.searchModels}
          />
        </div>
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          <FilterChip active={provider === "all"} onClick={() => setProvider("all")}>
            {t.allProviders}
            <span className="tabular-nums text-subtle">{models.length}</span>
          </FilterChip>
          {providers.slice(0, 12).map(([id, count]) => (
            <FilterChip key={id} active={provider === id} onClick={() => setProvider(id)}>
              {providerLabel(id)}
              <span className="tabular-nums text-subtle">{count}</span>
            </FilterChip>
          ))}
        </div>
      </div>

      {!query && provider === "all" && featured.length > 0 ? (
        <div className="px-4 pb-3">
          <p className="mb-2 text-[11px] font-medium tracking-wide text-muted uppercase">{t.featured}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {featured.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelect(m.id)}
                className={cn(
                  "rounded-md bg-elevated p-3 text-left shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-fg)_10%,transparent)] transition-[box-shadow,background-color] duration-150 hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-fg)_22%,transparent)]",
                  selectedId === m.id && "shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-fg)_40%,transparent)]",
                )}
              >
                <p className="text-[11px] text-muted">{providerLabel(m.provider)}</p>
                <p className="mt-0.5 text-sm font-medium text-fg">{m.name}</p>
                <ModelMeta model={m} t={t} />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        <p className="px-2 pb-1 text-[11px] text-muted tabular-nums">
          {visible.length}
          {filtered.length > visible.length ? ` / ${filtered.length}` : ""} {t.results}
        </p>
        {visible.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted">{t.noResults}</p>
        ) : (
          <ul>
            {visible.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => onSelect(m.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-md px-2 py-2.5 text-left transition-colors duration-150 hover:bg-elevated",
                    selectedId === m.id && "bg-elevated",
                  )}
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-sm bg-bg text-[10px] font-medium tracking-wide text-muted uppercase">
                    {providerLabel(m.provider).slice(0, 2)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-fg">{m.name}</span>
                    <span className="mt-0.5 block truncate font-mono text-[11px] text-subtle">{m.id}</span>
                    <ModelMeta model={m} t={t} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs transition-colors duration-150",
        active ? "bg-primary text-bg" : "bg-elevated text-muted hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

function ModelMeta({ model, t }: { model: CatalogModel; t: Copy }) {
  const ctx = formatContext(model.context);
  const cost = formatCost(model.in_cost);
  return (
    <span className="mt-1 flex flex-wrap gap-1">
      {ctx ? <Badge>{ctx} {t.context}</Badge> : null}
      {model.tools ? <Badge>{t.tools}</Badge> : null}
      {hasVision(model) ? <Badge>{t.vision}</Badge> : null}
      {cost ? <Badge>{cost}/1M</Badge> : null}
    </span>
  );
}
