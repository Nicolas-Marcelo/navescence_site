export interface VerificationReading {
  id?: number;
  neighborCode?: string | null;
  mac?: string | null;
  readings?: number | null;
  validReadings?: number | null;
  discardedReadings?: number | null;
  averageRssi?: number | null;
  m15?: number | null;
  minRssi?: number | null;
  maxRssi?: number | null;
}

export interface VerificationHistory {
  id: number;
  nodeCode: string;
  mode: string;
  result: string;
  durationMs?: number | null;
  startedAt: string;
  finishedAt?: string | null;

  node?: {
    name?: string | null;
    mac?: string | null;
  };

  readings?: VerificationReading[];
}

export interface NavigationEvent {
  id: number;
  nodeCode: string;
  label?: string | null;
  occurredAt: string;
}

export interface NavigationHistory {
  id: number;
  originNodeCode: string;
  destinationNodeCode: string;
  destinationName?: string | null;
  status: string;
  startedAt: string;
  finishedAt?: string | null;
  events?: NavigationEvent[];
}