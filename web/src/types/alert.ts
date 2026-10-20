export type AlertStatus =
  | "ACTIVE"
  | "RESOLVED";

export type AlertSeverity =
  | "CRITICAL"
  | "WARNING"
  | "INFO";

export interface AlertReading {
  neighborCode?: string | null;
  mac?: string | null;
  readings?: number | null;
  validReadings?: number | null;
  discardedReadings?: number | null;
  averageRssi?: number | null;
  m15?: number | null;
}

export interface AlertVerification {
  id: number;
  mode: string;
  result: string;
  durationMs?: number | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  readings?: AlertReading[];
}

export interface SystemAlert {
  id: number;
  nodeCode?: string | null;
  type: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title?: string | null;
  message?: string | null;
  openedAt: string;
  lastSeenAt?: string | null;
  resolvedAt?: string | null;
  verificationRun?: AlertVerification | null;
}