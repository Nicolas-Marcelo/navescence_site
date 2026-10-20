import { apiRequest } from "./api";

import type {
  Poi,
  PoiPayload,
} from "../types/poi";

export function getPois() {
  return apiRequest<Poi[]>(
    "/api/pois",
    { authenticated: true },
  );
}

export function createPoi(
  payload: PoiPayload,
) {
  return apiRequest<Poi>(
    "/api/pois",
    {
      method: "POST",
      authenticated: true,
      body: JSON.stringify(payload),
    },
  );
}

export function updatePoi(
  id: number,
  payload: PoiPayload,
) {
  return apiRequest<Poi>(
    `/api/pois/${id}`,
    {
      method: "PUT",
      authenticated: true,
      body: JSON.stringify(payload),
    },
  );
}

export function deletePoi(
  id: number,
) {
  return apiRequest<void>(
    `/api/pois/${id}`,
    {
      method: "DELETE",
      authenticated: true,
    },
  );
}