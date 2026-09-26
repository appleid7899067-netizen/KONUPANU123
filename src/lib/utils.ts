import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function formatContext(tokens?: number | null) {
  if (!tokens || tokens <= 0) return null;
  if (tokens >= 1_000_000) {
    const n = tokens / 1_000_000;
    return `${Number.isInteger(n) ? n : n.toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    const n = Math.round(tokens / 1000);
    return `${n}K`;
  }
  return String(tokens);
}

export function formatCost(cents?: number | null) {
  if (cents == null) return null;
  if (cents === 0) return "0";
  if (cents < 1) return `$${(cents / 100).toFixed(4)}`;
  if (cents < 100) return `$${(cents / 100).toFixed(2)}`;
  return `$${(cents / 100).toFixed(2)}`;
}
