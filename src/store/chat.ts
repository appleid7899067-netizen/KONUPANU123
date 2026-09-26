import { create } from "zustand";
import { uid } from "@/lib/utils";
import type { CatalogModel } from "@/lib/models";
import { bundledModels, defaultModelId } from "@/lib/models";
import type { Locale } from "@/lib/i18n";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  modelId?: string;
  createdAt: number;
  error?: boolean;
};

export type Conversation = {
  id: string;
  title: string;
  modelId: string;
  messages: ChatMessage[];
  updatedAt: number;
};

type ChatState = {
  locale: Locale;
  models: CatalogModel[];
  modelId: string;
  conversations: Conversation[];
  activeId: string | null;
  streaming: boolean;
  workStatus: string;
  setLocale: (locale: Locale) => void;
  setModels: (models: CatalogModel[]) => void;
  setModelId: (id: string) => void;
  setConversations: (conversations: Conversation[], activeId?: string | null) => void;
  newChat: () => string;
  selectChat: (id: string) => void;
  deleteChat: (id: string) => void;
  appendUser: (content: string) => { conversation: Conversation; user: ChatMessage; assistant: ChatMessage };
  patchAssistant: (conversationId: string, messageId: string, patch: Partial<ChatMessage>) => void;
  setStreaming: (v: boolean) => void;
  setWorkStatus: (status: string) => void;
};

const STORAGE_LOCALE = "prism.locale";

function titleFrom(text: string) {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length > 42 ? `${t.slice(0, 42)}…` : t;
}

export const useChat = create<ChatState>((set, get) => ({
  locale: "th",
  models: bundledModels,
  modelId: defaultModelId(bundledModels),
  conversations: [],
  activeId: null,
  streaming: false,
  workStatus: "",

  setLocale: (locale) => {
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_LOCALE, locale);
    set({ locale });
  },

  setModels: (models) => {
    const current = get().modelId;
    const still = models.some((m) => m.id === current);
    set({ models, modelId: still ? current : defaultModelId(models) });
  },

  setModelId: (id) => {
    const activeId = get().activeId;
    set((s) => ({
      modelId: id,
      conversations: s.conversations.map((c) =>
        c.id === activeId ? { ...c, modelId: id, updatedAt: Date.now() } : c,
      ),
    }));
  },

  setConversations: (conversations, activeId) => {
    const nextActive =
      activeId !== undefined
        ? activeId
        : get().activeId && conversations.some((c) => c.id === get().activeId)
          ? get().activeId
          : (conversations[0]?.id ?? null);
    const modelId =
      conversations.find((c) => c.id === nextActive)?.modelId ?? get().modelId;
    set({ conversations, activeId: nextActive, modelId });
  },

  newChat: () => {
    const id = uid();
    const convo: Conversation = {
      id,
      title: "",
      modelId: get().modelId,
      messages: [],
      updatedAt: Date.now(),
    };
    set((s) => ({ conversations: [convo, ...s.conversations], activeId: id }));
    return id;
  },

  selectChat: (id) => {
    const found = get().conversations.find((c) => c.id === id);
    if (!found) return;
    set({ activeId: id, modelId: found.modelId });
  },

  deleteChat: (id) => {
    set((s) => {
      const conversations = s.conversations.filter((c) => c.id !== id);
      const activeId = s.activeId === id ? (conversations[0]?.id ?? null) : s.activeId;
      return { conversations, activeId };
    });
  },

  appendUser: (content) => {
    let { activeId, conversations, modelId } = get();
    if (!activeId) {
      activeId = get().newChat();
      conversations = get().conversations;
    }
    const user: ChatMessage = {
      id: uid(),
      role: "user",
      content,
      createdAt: Date.now(),
    };
    const assistant: ChatMessage = {
      id: uid(),
      role: "assistant",
      content: "",
      modelId,
      createdAt: Date.now(),
    };
    let conversation = conversations.find((c) => c.id === activeId);
    if (!conversation) {
      conversation = {
        id: activeId,
        title: titleFrom(content),
        modelId,
        messages: [user, assistant],
        updatedAt: Date.now(),
      };
    } else {
      conversation = {
        ...conversation,
        title: conversation.title || titleFrom(content),
        modelId,
        messages: [...conversation.messages, user, assistant],
        updatedAt: Date.now(),
      };
    }
    set({
      conversations: [conversation, ...conversations.filter((c) => c.id !== conversation!.id)],
      activeId: conversation.id,
    });
    return { conversation, user, assistant };
  },

  patchAssistant: (conversationId, messageId, patch) => {
    set((s) => ({
      conversations: s.conversations.map((c) => {
        if (c.id !== conversationId) return c;
        return {
          ...c,
          updatedAt: Date.now(),
          messages: c.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
        };
      }),
    }));
  },

  setStreaming: (streaming) => set({ streaming, workStatus: streaming ? get().workStatus : "" }),
  setWorkStatus: (workStatus) => set({ workStatus }),
}));

export const KV_KEY = "prism.v1.conversations";
export const LS_KEY = "prism.v1.conversations";
