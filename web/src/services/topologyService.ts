import { apiRequest } from "./api";

import type {
  TopologyEdge,
  TopologyPayload,
} from "../types/topology";

export function getTopology() {
  return apiRequest<TopologyEdge[]>(
    "/api/topology",
    { authenticated: true },
  );
}

export function createTopologyEdge(
  payload: TopologyPayload,
) {
  return apiRequest<TopologyEdge>(
    "/api/topology",
    {
      method: "POST",
      authenticated: true,
      body: JSON.stringify(payload),
    },
  );
}

export function deleteTopologyEdge(
  id: number,
) {
  return apiRequest<void>(
    `/api/topology/${id}`,
    {
      method: "DELETE",
      authenticated: true,
    },
  );
}