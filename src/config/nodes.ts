export type NodeId = string;

const topology: Record<NodeId, NodeId[]> = {
  NAV_S01: ["NAV_S02"],
  NAV_S02: ["NAV_S01"]
};

export function getExpectedNeighbors(nodeId: NodeId): NodeId[] {
  return topology[nodeId] ?? [];
}