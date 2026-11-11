import { queryOptions } from "@tanstack/react-query";
import { createBackendApi } from "./backend";
import { createDemoApi } from "./demo";
import type { NoticeGuardApi } from "./types";

export * from "./types";

/** Set VITE_NOTICEGUARD_API_URL to your FastAPI base URL to leave demo mode. */
const BACKEND_URL = (import.meta.env["VITE_NOTICEGUARD_API_URL"] as string | undefined)?.trim();

export const api: NoticeGuardApi = BACKEND_URL ? createBackendApi(BACKEND_URL) : createDemoApi();
export const isDemoMode = api.mode === "demo";

export const noticesQuery = () =>
  queryOptions({ queryKey: ["notices"], queryFn: () => api.listNotices() });

export const noticeQuery = (id: string) =>
  queryOptions({ queryKey: ["notice", id], queryFn: () => api.getNotice(id) });

export const noticeFileQuery = (id: string) =>
  queryOptions({
    queryKey: ["notice-file", id],
    queryFn: () => api.getNoticeFile(id),
    staleTime: Infinity,
  });
