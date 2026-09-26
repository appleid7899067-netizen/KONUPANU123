import bundled from "@/data/models.json";

export type CatalogModel = {
  id: string;
  pid: string;
  name: string;
  provider: string;
  context?: number | null;
  max_tokens?: number | null;
  tools?: boolean;
  in?: string[];
  out?: string[];
  in_cost?: number | null;
  out_cost?: number | null;
};

export const bundledModels = bundled as CatalogModel[];

export const FEATURED_TARGETS = [
  { id: "grok-4.6", provider: "xai" },
  { id: "gpt-5.6-luna", provider: "openai-responses" },
  { id: "claude-sonnet-4-6", provider: "claude" },
  { id: "gemini-3.5-flash", provider: "gemini" },
  { id: "deepseek-v4-pro-0813", provider: "alibaba" },
  { id: "kimi-k2.5", provider: "moonshotai" },
] as const;

export const PROVIDER_LABEL: Record<string, string> = {
  openrouter: "OpenRouter",
  infron: "Infron",
  alibaba: "Alibaba",
  "together-ai": "Together",
  "openai-completion": "OpenAI",
  "openai-responses": "OpenAI",
  byteplus: "BytePlus",
  "azure-openai": "Azure",
  "azure-openai-responses": "Azure",
  gemini: "Google",
  claude: "Anthropic",
  mistral: "Mistral",
  zai: "Z.AI",
  minimax: "MiniMax",
  xai: "xAI",
  moonshotai: "Moonshot",
  deepseek: "DeepSeek",
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  "x-ai": "xAI",
};

export function providerLabel(id: string) {
  return PROVIDER_LABEL[id] ?? id.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

export function normalizeModel(raw: unknown): CatalogModel | null {
  if (typeof raw === "string") {
    const id = raw.trim();
    if (!id) return null;
    const provider = id.includes(":") ? id.split(":")[0]! : id.includes("/") ? id.split("/")[0]! : "other";
    return { id, pid: id, name: id, provider };
  }
  const rec = asRecord(raw);
  if (!rec) return null;
  const id = String(rec.id ?? rec.model ?? rec.puterId ?? "").trim();
  if (!id) return null;
  const cost = asRecord(rec.cost) ?? asRecord(rec.costs);
  const mods = asRecord(rec.modalities);
  const inputs = Array.isArray(rec.in)
    ? (rec.in as string[])
    : Array.isArray(mods?.input)
      ? (mods!.input as string[])
      : ["text"];
  const outputs = Array.isArray(rec.out)
    ? (rec.out as string[])
    : Array.isArray(mods?.output)
      ? (mods!.output as string[])
      : ["text"];
  return {
    id,
    pid: String(rec.pid ?? rec.puterId ?? id),
    name: String(rec.name ?? id),
    provider: String(rec.provider ?? "other"),
    context: typeof rec.context === "number" ? rec.context : null,
    max_tokens: typeof rec.max_tokens === "number" ? rec.max_tokens : null,
    tools: Boolean(rec.tools ?? rec.tool_call),
    in: inputs,
    out: outputs,
    in_cost:
      typeof rec.in_cost === "number"
        ? rec.in_cost
        : typeof cost?.input === "number"
          ? (cost.input as number)
          : typeof cost?.prompt_tokens === "number"
            ? (cost.prompt_tokens as number)
            : null,
    out_cost:
      typeof rec.out_cost === "number"
        ? rec.out_cost
        : typeof cost?.output === "number"
          ? (cost.output as number)
          : typeof cost?.completion_tokens === "number"
            ? (cost.completion_tokens as number)
            : null,
  };
}

export function mergeCatalog(live: unknown): CatalogModel[] {
  const incoming: CatalogModel[] = [];
  const list = Array.isArray(live) ? live : [];
  for (const item of list) {
    const n = normalizeModel(item);
    if (n) incoming.push(n);
  }
  if (incoming.length < 20) return bundledModels;
  const byId = new Map<string, CatalogModel>();
  for (const m of bundledModels) byId.set(m.id, m);
  for (const m of incoming) byId.set(m.id, { ...byId.get(m.id), ...m });
  return Array.from(byId.values());
}

export function pickFeatured(models: CatalogModel[]): CatalogModel[] {
  const found: CatalogModel[] = [];
  const used = new Set<string>();
  for (const target of FEATURED_TARGETS) {
    const exact = models.find((m) => m.id === target.id && m.provider === target.provider);
    const byId = exact ?? models.find((m) => m.id === target.id);
    const fuzzy =
      byId ??
      models.find(
        (m) =>
          m.id.toLowerCase().includes(target.id.toLowerCase()) &&
          (m.provider === target.provider || m.id.toLowerCase().includes(target.provider)),
      );
    if (fuzzy && !used.has(fuzzy.id)) {
      found.push(fuzzy);
      used.add(fuzzy.id);
    }
  }
  if (found.length < 6) {
    for (const m of models) {
      if (used.has(m.id)) continue;
      if (m.provider === "openrouter" || m.provider === "infron") continue;
      found.push(m);
      used.add(m.id);
      if (found.length >= 6) break;
    }
  }
  return found.slice(0, 6);
}

export function defaultModelId(models: CatalogModel[]): string {
  return pickFeatured(models)[0]?.id ?? models[0]?.id ?? "gpt-5-nano";
}

export function chatModelOptions(model: CatalogModel): { model: string; provider?: string } {
  const id = model.id;
  if (id.startsWith("openrouter:")) return { model: id.slice("openrouter:".length), provider: "openrouter" };
  if (id.startsWith("infron:")) return { model: id.slice("infron:".length), provider: "infron" };
  if (id.startsWith("alibaba:")) return { model: id.slice("alibaba:".length), provider: "alibaba" };
  if (id.startsWith("azure:")) return { model: id };
  return { model: id };
}

export function hasVision(model?: CatalogModel | null) {
  return Boolean(model?.in?.some((m) => /image|vision/i.test(m)));
}

export function hasImageOut(model?: CatalogModel | null) {
  return Boolean(model?.out?.some((m) => /image/i.test(m)));
}
