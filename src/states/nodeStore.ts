
import type { NodeId } from "../config/nodes.js";
import { createNodeState, type NodeState, Presence, NodeStatus } from "../models/node.js";
import type { ScanReading } from "../models/scan.js";
import { nowIso } from "../utils/time.js";

export interface NodeStore {
  get(nodeId: NodeId): NodeState;
  getAll(): Readonly<Record<NodeId, NodeState>>;
  getIds(): NodeId[];
  has(nodeId: NodeId): boolean;
  sync(nodeIds: NodeId[]): void;
  setPresence(nodeId: NodeId, presence: Presence): void;
  setStatus(nodeId: NodeId, status: NodeStatus): void;
  addScan(nodeId: NodeId, scan: ScanReading): void;
  clearScans(nodeId: NodeId): void;
  finishVerification(nodeId: NodeId): void;
}

export function createNodeStore(): NodeStore {
  const states: Record<NodeId, NodeState> = {};

  function get(nodeId: NodeId): NodeState {
    const state = states[nodeId];

    if (!state) {
      throw new Error(`Sensor não encontrado no NodeStore: ${nodeId}`);
    }

    return state;
  }

  function getAll(): Readonly<Record<NodeId, NodeState>> {
    return states;
  }

  function getIds(): NodeId[] {
    return Object.keys(states);
  }

  function has(nodeId: NodeId): boolean {
    return Object.hasOwn(states, nodeId);
  }

  function sync(nodeIds: NodeId[]): void {
    const registered = new Set(nodeIds);

    for (const nodeId of nodeIds) {
      if (!has(nodeId)) {
        states[nodeId] = createNodeState();
      }
    }

    for (const nodeId of Object.keys(states)) {
      if (!registered.has(nodeId)) {
        delete states[nodeId];
      }
    }
  }

  function setPresence(nodeId: NodeId, presence: Presence): void {
    const state = get(nodeId);

    state.presence = presence;
    state.lastCommunication = nowIso();
  }

  function setStatus(nodeId: NodeId, status: NodeStatus): void {
    const state = get(nodeId);

    state.status = status;
    state.lastCommunication = nowIso();
  }

  function addScan(nodeId: NodeId, scan: ScanReading): void {
    const state = get(nodeId);

    state.scans.push(scan);
    state.lastCommunication = nowIso();
  }

  function clearScans(nodeId: NodeId): void {
    const state = get(nodeId);
    state.scans = [];
  }

  function finishVerification(nodeId: NodeId): void {
    const state = get(nodeId);
    state.lastVerification = nowIso();
  }

  return {
    get,
    getAll,
    getIds,
    has,
    sync,
    setPresence,
    setStatus,
    addScan,
    clearScans,
    finishVerification,
  };
}
