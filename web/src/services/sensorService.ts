import { apiRequest } from "./api";

import type {
  DashboardData,
  Sensor,
  SensorPayload,
} from "../types/sensor";

export function getSensors() {
  return apiRequest<Sensor[]>(
    "/api/sensors",
    { authenticated: true },
  );
}

export function getDashboard() {
  return apiRequest<DashboardData>(
    "/api/dashboard",
    { authenticated: true },
  );
}

export function createSensor(
  payload: SensorPayload,
) {
  return apiRequest<Sensor>(
    "/api/sensors",
    {
      method: "POST",
      authenticated: true,
      body: JSON.stringify(payload),
    },
  );
}

export function updateSensor(
  id: number,
  payload: SensorPayload,
) {
  return apiRequest<Sensor>(
    `/api/sensors/${id}`,
    {
      method: "PUT",
      authenticated: true,
      body: JSON.stringify(payload),
    },
  );
}