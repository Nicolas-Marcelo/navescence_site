import type { NodeId } from "../config/nodes.js";

export interface TopologyLink {
  nodeA: NodeId;
  nodeB: NodeId;
}

export interface TopologyStore {
  sync(links: TopologyLink[]): void;
  getExpectedNeighbors(nodeId: NodeId): NodeId[];
}

export function createTopologyStore(): TopologyStore {
  const neighbors = new Map<NodeId, Set<NodeId>>();

  function sync(links: TopologyLink[]) {
    neighbors.clear();

    for (const link of links) {
      if (!neighbors.has(link.nodeA)) neighbors.set(link.nodeA, new Set());
      if (!neighbors.has(link.nodeB)) neighbors.set(link.nodeB, new Set());

      neighbors.get(link.nodeA)?.add(link.nodeB);
      neighbors.get(link.nodeB)?.add(link.nodeA);
    }
  }

  function getExpectedNeighbors(nodeId: NodeId) {
    return [...(neighbors.get(nodeId) ?? [])];
  }

  return { sync, getExpectedNeighbors };
}