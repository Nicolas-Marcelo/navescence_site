import type { NodeId } from "../config/nodes.js";
import { Diagnostic } from "../models/node.js";
import type { Alert, DashboardData, NeighborInfo, NodeSummary } from "../models/dashboard.js";
import type { NodeStore } from "../states/nodeStore.js";
import type { TopologyStore } from "../states/topologyStore.js";
import { nowIso } from "../utils/time.js";
import { getDiagnostic } from "./diagnostics.js";

function getDetectedNeighbors(nodeId: NodeId, store: NodeStore): NeighborInfo[] {
  const state = store.get(nodeId);
  const neighbors: NeighborInfo[] = [];

  for (const scan of state.scans) {
    if (!scan.name || !store.has(scan.name)) continue;

    neighbors.push({
      node: scan.name,
      mac: scan.mac ?? "UNKNOWN",
      averageRssi: scan.averageRssi ?? null,
      m15: scan.m15 ?? null,
      readings: scan.readings ?? 0,
      validReadings: scan.validReadings ?? 0,
      discardedReadings: scan.discardedReadings ?? 0
    });
  }

  return neighbors;
}

function createAlerts(nodeId: NodeId, diagnostic: Diagnostic, missingNeighbors: string[]): Alert[] {
  const alerts: Alert[] = [];

  if (diagnostic === Diagnostic.Offline) {
    alerts.push({
      node: nodeId,
      type: "NODE_OFFLINE",
      title: `${nodeId} está offline`,
      message: "O sensor não está conectado ao sistema central."
    });
  }

  if (diagnostic === Diagnostic.MissingNeighbor) {
    alerts.push({
      node: nodeId,
      type: "MISSING_NEIGHBOR",
      title: `${nodeId} não detectou todos os vizinhos esperados`,
      message: `Não detectados: ${missingNeighbors.join(", ")}.`
    });
  }

  return alerts;
}

export function getDashboard(store: NodeStore, topology: TopologyStore): DashboardData {
  const nodes: Record<string, NodeSummary> = {};
  const alerts: Alert[] = [];

  for (const nodeId of store.getIds()) {
    const state = store.get(nodeId);
    const expectedNeighbors = topology.getExpectedNeighbors(nodeId);
    const detectedNeighbors = getDetectedNeighbors(nodeId, store);
    const detectedNames = detectedNeighbors.map(neighbor => neighbor.node);
    const result = getDiagnostic(state, expectedNeighbors, detectedNames);

    nodes[nodeId] = {
      presence: state.presence,
      status: state.status,
      diagnostic: result.status,
      expectedNeighbors,
      detectedNeighbors,
      lastCommunication: state.lastCommunication,
      lastVerification: state.lastVerification
    };

    alerts.push(...createAlerts(nodeId, result.status, result.missingNeighbors));
  }

  return { updatedAt: nowIso(), nodes, alerts };
}