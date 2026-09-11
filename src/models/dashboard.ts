import type {
  Diagnostic,
  NodeStatus,
  Presence
} from "./node.js";

export interface NeighborInfo {

  node:
    string;

  mac:
    string;

  averageRssi:
    number | null;

  m15:
    number | null;

  readings:
    number;

  validReadings:
    number;

  discardedReadings:
    number;

}

export interface NodeSummary {

  presence:
    Presence;

  status:
    NodeStatus;

  diagnostic:
    Diagnostic;

  expectedNeighbors:
    string[];

  detectedNeighbors:
    NeighborInfo[];

  lastCommunication:
    string | null;

  lastVerification:
    string | null;

}

export interface Alert {

  node:
    string;

  type:
    string;

  title:
    string;

  message:
    string;

}

export interface DashboardData {

  updatedAt:
    string;

  nodes:
    Record<string, NodeSummary>;

  alerts:
    Alert[];

}