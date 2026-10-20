import { apiRequest } from "./api";

import type {
  NavigationHistory,
  VerificationHistory,
} from "../types/history";

export function getVerificationHistory() {
  return apiRequest<VerificationHistory[]>(
    "/api/verifications/history?limit=200",
    { authenticated: true },
  );
}

export function getVerificationHistoryItem(
  id: number,
) {
  return apiRequest<VerificationHistory>(
    `/api/verifications/history/${id}`,
    { authenticated: true },
  );
}

export function getTodayNavigationHistory() {
  return apiRequest<NavigationHistory[]>(
    "/api/navigation-history/today",
    { authenticated: true },
  );
}