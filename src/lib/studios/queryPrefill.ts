import type { Studio } from "@/types";

export function resolveStudioQueryPrefill(studios: Studio[], query: { studioId?: string; user_id?: string }) {
  return studios.some((studio) => studio.id === query.studioId) ? query.studioId ?? "" : "";
}
