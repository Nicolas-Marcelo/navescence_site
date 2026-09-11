import {
  Diagnostic,
  NodeStatus,
  Presence,
  type NodeState
} from "../models/node.js";

export interface DiagnosticResult {
  status: Diagnostic;
  missingNeighbors: string[];
}

export function getDiagnostic(
  state: NodeState,
  expectedNeighbors: string[],
  detectedNeighbors: string[]
): DiagnosticResult {

  if (state.presence === Presence.Offline) {
    return {
      status: Diagnostic.Offline,
      missingNeighbors: []
    };
  }

  if (state.presence !== Presence.Online) {
    return {
      status: Diagnostic.Unknown,
      missingNeighbors: []
    };
  }

  if (state.status === NodeStatus.Checking) {
    return {
      status: Diagnostic.Checking,
      missingNeighbors: []
    };
  }

  if (state.status !== NodeStatus.Finished) {
    return {
      status: Diagnostic.Unknown,
      missingNeighbors: []
    };
  }

  const detected = new Set(detectedNeighbors);

  const missingNeighbors = expectedNeighbors.filter(
    node => !detected.has(node)
  );

  if (missingNeighbors.length > 0) {
    return {
      status: Diagnostic.MissingNeighbor,
      missingNeighbors
    };
  }

  return {
    status: Diagnostic.Ok,
    missingNeighbors: []
  };
}