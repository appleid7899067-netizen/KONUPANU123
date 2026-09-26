import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  loadPuterScript,
  type PuterClient,
  type PuterUser,
} from "@/lib/puter";
import { mergeCatalog } from "@/lib/models";
import { useChat, KV_KEY, LS_KEY, type Conversation } from "@/store/chat";

type PuterContextValue = {
  ready: boolean;
  failed: boolean;
  signedIn: boolean;
  user: PuterUser | null;
  signIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
  puter: PuterClient | null;
};

const PuterContext = createContext<PuterContextValue>({
  ready: false,
  failed: false,
  signedIn: false,
  user: null,
  signIn: async () => false,
  signOut: async () => {},
  puter: null,
});

export function usePuter() {
  return useContext(PuterContext);
}

function parseConversations(raw: unknown): Conversation[] | null {
  if (!raw) return null;
  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(data)) return null;
    return data.filter((c) => c && typeof c.id === "string" && Array.isArray(c.messages));
  } catch {
    return null;
  }
}

export function PuterProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [user, setUser] = useState<PuterUser | null>(null);
  const [puter, setPuter] = useState<PuterClient | null>(null);
  const puterRef = useRef<PuterClient | null>(null);
  const setModels = useChat((s) => s.setModels);
  const setConversations = useChat((s) => s.setConversations);
  const conversations = useChat((s) => s.conversations);

  const hydrateUser = useCallback(async (client: PuterClient) => {
    try {
      const ok = client.auth.isSignedIn();
      setSignedIn(ok);
      if (!ok) {
        setUser(null);
        return;
      }
      const u = await client.auth.getUser();
      setUser(u ?? null);
      if (client.kv) {
        const cloud = parseConversations(await client.kv.get(KV_KEY));
        if (cloud && cloud.length) {
          setConversations(cloud);
          return;
        }
      }
      const local = parseConversations(window.localStorage.getItem(LS_KEY));
      if (local) setConversations(local);
    } catch {
      setSignedIn(false);
      setUser(null);
    }
  }, [setConversations]);

  useEffect(() => {
    let cancelled = false;
    loadPuterScript()
      .then(async (client) => {
        if (cancelled) return;
        puterRef.current = client;
        setPuter(client);
        setReady(true);
        try {
          if (client.ai.listModels) {
            const live = await client.ai.listModels();
            if (!cancelled) setModels(mergeCatalog(live));
          }
        } catch {
          /* bundled catalog already loaded */
        }
        await hydrateUser(client);
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [hydrateUser, setModels]);

  useEffect(() => {
    const local = parseConversations(typeof window === "undefined" ? null : window.localStorage.getItem(LS_KEY));
    if (local && local.length) setConversations(local);
  }, [setConversations]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(conversations));
    } catch {
      /* quota */
    }
    const client = puterRef.current;
    if (!client?.kv || !client.auth.isSignedIn()) return;
    const t = window.setTimeout(() => {
      void client.kv!.set(KV_KEY, JSON.stringify(conversations)).catch(() => {});
    }, 400);
    return () => window.clearTimeout(t);
  }, [conversations]);

  const signIn = useCallback(async () => {
    const client = puterRef.current;
    if (!client) return false;
    try {
      await client.auth.signIn();
      await hydrateUser(client);
      return client.auth.isSignedIn();
    } catch {
      return false;
    }
  }, [hydrateUser]);

  const signOut = useCallback(async () => {
    const client = puterRef.current;
    try {
      await client?.auth.signOut();
    } catch {
      /* ignore */
    }
    setSignedIn(false);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ ready, failed, signedIn, user, signIn, signOut, puter }),
    [ready, failed, signedIn, user, signIn, signOut, puter],
  );

  return <PuterContext.Provider value={value}>{children}</PuterContext.Provider>;
}
