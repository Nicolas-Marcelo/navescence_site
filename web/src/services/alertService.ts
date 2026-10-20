import { apiRequest } from "./api";

import type {
  SystemAlert,
} from "../types/alert";

export function getAlerts(
  status?: string,
) {
  const query =
    status
      ? `?status=${encodeURIComponent(status)}&limit=500`
      : "?limit=500";

  return apiRequest<SystemAlert[]>(
    `/api/alerts${query}`,
    { authenticated: true },
  );
}

export function getAlert(
  id: number,
) {
  return apiRequest<SystemAlert>(
    `/api/alerts/${id}`,
    { authenticated: true },
  );
}