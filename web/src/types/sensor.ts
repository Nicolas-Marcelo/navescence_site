import type { Environment } from "./environment";

export type SensorPresence =
  | "ONLINE"
  | "OFFLINE"
  | "UNKNOWN"
  | "NOT_MONITORED";

export type SensorRuntimeStatus =
  | "VERIFICANDO"
  | "FINALIZADO"
  | "DESCONHECIDO"
  | string;

export interface DetectedNeighbor {
  node?: string;
  mac?: string;
  readings?: number;
  validReadings?: number;
  discardedReadings?: number;
  averageRssi?: number;
  rssiAverage?: number;
  m15?: number;
  minRssi?: number;
  maxRssi?: number;
}

export interface DashboardNode {
  presence: SensorPresence;
  status: SensorRuntimeStatus;
  diagnostic?: string;
  expectedNeighbor?: string;
  expectedNeighbors?: string[];
  neighbor?: DetectedNeighbor | null;
  detectedNeighbors?: DetectedNeighbor[];
  lastCommunication?: string | null;
  lastVerification?: string | null;
}

export interface DashboardData {
  nodes: Record<string, DashboardNode>;
  alerts?: unknown[];
}

export interface Sensor {
  id: number;
  code: string;
  mac: string | null;
  name: string | null;
  environmentId: number | null;
  environment?: Environment | null;
  location: string | null;
  x: number | null;
  y: number | null;
  active: boolean;
  maintenance: boolean;
  updatedAt?: string;
}

export interface SensorPayload {
  code: string;
  mac: string | null;
  name: string | null;
  environmentId: number | null;
  location: string | null;
  x: number | null;
  y: number | null;
  active: boolean;
  maintenance: boolean;
}