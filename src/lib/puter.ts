export type PuterUser = {
  username?: string;
  uuid?: string;
  email?: string;
};

export type PuterChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
};

type PuterChatChunk = {
  text?: string;
  type?: string;
  message?: { content?: unknown };
};

export type PuterAI = {
  chat: (
    prompt: string | PuterChatMessage[],
    options?: Record<string, unknown>,
  ) => Promise<unknown>;
  listModels?: (provider?: string | null) => Promise<unknown>;
};

export type PuterAuth = {
  signIn: (options?: Record<string, unknown>) => Promise<PuterUser | void>;
  signOut: () => void | Promise<void>;
  isSignedIn: () => boolean;
  getUser: () => Promise<PuterUser>;
};

export type PuterKV = {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<unknown>;
};

export type PuterClient = {
  auth: PuterAuth;
  ai: PuterAI;
  kv?: PuterKV;
};

declare global {
  interface Window {
    puter?: PuterClient;
  }
}

const PUTER_SRC = "https://js.puter.com/v2/";

function getPuter(): PuterClient | null {
  if (typeof window === "undefined") return null;
  return window.puter ?? null;
}

export function loadPuterScript(): Promise<PuterClient> {
  const existing = getPuter();
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve, reject) => {
    const ready = () => {
      const start = Date.now();
      const tick = () => {
        const p = getPuter();
        if (p) {
          resolve(p);
          return;
        }
        if (Date.now() - start > 10000) {
          reject(new Error("Puter timed out"));
          return;
        }
        window.setTimeout(tick, 40);
      };
      tick();
    };

    const already = document.querySelector<HTMLScriptElement>(`script[src="${PUTER_SRC}"]`);
    if (already) {
      already.addEventListener("load", ready, { once: true });
      already.addEventListener("error", () => reject(new Error("Puter failed to load")), { once: true });
      ready();
      return;
    }

    const script = document.createElement("script");
    script.src = PUTER_SRC;
    script.async = true;
    script.onload = ready;
    script.onerror = () => reject(new Error("Puter failed to load"));
    document.head.appendChild(script);
  });
}

export function extractText(payload: unknown): string {
  if (payload == null) return "";
  if (typeof payload === "string") return payload;
  if (typeof payload === "number" || typeof payload === "boolean") return String(payload);
  if (Array.isArray(payload)) return payload.map(extractText).filter(Boolean).join("");

  const rec = payload as Record<string, unknown>;
  if (typeof rec.text === "string") return rec.text;
  if (typeof rec.delta === "string") return rec.delta;
  if (rec.delta) {
    const d = extractText(rec.delta);
    if (d) return d;
  }
  if (typeof rec.content === "string") return rec.content;
  if (Array.isArray(rec.content)) return rec.content.map(extractText).join("");
  if (rec.message) return extractText(rec.message);
  if (typeof rec.completion === "string") return rec.completion;
  if (rec.toString && rec.toString !== Object.prototype.toString) {
    const s = String(rec);
    if (s && s !== "[object Object]") return s;
  }
  return "";
}

export async function streamChat(args: {
  puter: PuterClient;
  messages: PuterChatMessage[];
  model: string;
  provider?: string;
  onDelta: (chunk: string) => void;
  isCancelled: () => boolean;
}): Promise<string> {
  const options: Record<string, unknown> = {
    model: args.model,
    stream: true,
  };
  if (args.provider) options.provider = args.provider;

  const response = await args.puter.ai.chat(args.messages, options);

  if (response && typeof response === "object" && Symbol.asyncIterator in (response as object)) {
    let full = "";
    for await (const part of response as AsyncIterable<PuterChatChunk>) {
      if (args.isCancelled()) break;
      const piece = extractText(part);
      if (!piece) continue;
      full += piece;
      args.onDelta(piece);
    }
    return full;
  }

  const text = extractText(response);
  if (text && !args.isCancelled()) args.onDelta(text);
  return text;
}
