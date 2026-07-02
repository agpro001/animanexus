import { supabase } from "@/integrations/supabase/client";

async function authHeader(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch { return {}; }
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
}

export async function fileToBase64(file: File): Promise<string> {
  const url = await fileToDataUrl(file);
  return url.split(",")[1] ?? "";
}

export function audioFormatFromMime(mime: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

export async function analyze<T = Record<string, unknown>>(kind: string, payload: Record<string, unknown>): Promise<{ result?: T; error?: string }> {
  try {
    const r = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({ kind, ...payload }),
    });
    if (!r.ok) {
      if (r.status === 429) return { error: "Rate limited — please wait a moment and try again." };
      if (r.status === 401) return { error: "Please sign in to use AI features." };
      if (r.status === 402) return { error: "PAYWALL" };
      return { error: `AI request failed (${r.status})` };
    }
    const j = (await r.json()) as { result?: T };
    return { result: j.result };
  } catch (e) {
    return { error: String(e) };
  }
}