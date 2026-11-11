import type { AdminSession } from "@/lib/api/types";

const KEY = "noticeguard.admin-session";

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}

export function setAdminSession(session: AdminSession) {
  window.sessionStorage.setItem(KEY, JSON.stringify(session));
}

export function clearAdminSession() {
  window.sessionStorage.removeItem(KEY);
}
