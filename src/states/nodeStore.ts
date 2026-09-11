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

  function get(nodeId: NodeId) {
    return states[nodeId];
  }

  function getAll() {
    return states;
  }

  function getIds() {
    return Object.keys(states);
  }

  function has(nodeId: NodeId) {
    return nodeId in states;
  }

  function sync(nodeIds: NodeId[]) {
    const registered = new Set(nodeIds);

    for (const nodeId of nodeIds) {
      if (!states[nodeId]) states[nodeId] = createNodeState();
    }

    for (const nodeId of Object.keys(states)) {
      if (!registered.has(nodeId)) delete states[nodeId];
    }
  }

  function setPresence(nodeId: NodeId, presence: Presence) {
    states[nodeId].presence = presence;
    states[nodeId].lastCommunication = nowIso();
  }

  function setStatus(nodeId: NodeId, status: NodeStatus) {
    states[nodeId].status = status;
    states[nodeId].lastCommunication = nowIso();
  }

  function addScan(nodeId: NodeId, scan: ScanReading) {
    states[nodeId].scans.push(scan);
    states[nodeId].lastCommunication = nowIso();
  }

  function clearScans(nodeId: NodeId) {
    states[nodeId].scans = [];
  }

  function finishVerification(nodeId: NodeId) {
    states[nodeId].lastVerification = nowIso();
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
    finishVerification
  };
}