import { apiRequest } from "./api";

import type {
  Environment,
  EnvironmentPayload,
} from "../types/environment";

export function getEnvironments() {
  return apiRequest<Environment[]>(
    "/api/environments",
    { authenticated: true },
  );
}

export function getEnvironment(
  id: number,
) {
  return apiRequest<Environment>(
    `/api/environments/${id}`,
    { authenticated: true },
  );
}

export function createEnvironment(
  payload: EnvironmentPayload,
) {
  return apiRequest<Environment>(
    "/api/environments",
    {
      method: "POST",
      authenticated: true,
      body: JSON.stringify(payload),
    },
  );
}

export function updateEnvironment(
  id: number,
  payload: EnvironmentPayload,
) {
  return apiRequest<Environment>(
    `/api/environments/${id}`,
    {
      method: "PUT",
      authenticated: true,
      body: JSON.stringify(payload),
    },
  );
}

export function deleteEnvironment(
  id: number,
) {
  return apiRequest<void>(
    `/api/environments/${id}`,
    {
      method: "DELETE",
      authenticated: true,
    },
  );
}