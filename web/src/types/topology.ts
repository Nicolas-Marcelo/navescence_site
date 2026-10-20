import type { Sensor } from "./sensor";

export interface TopologyEdge {
  id: number;
  nodeAId: number;
  nodeBId: number;
  distance: number | null;
  nodeA?: Sensor;
  nodeB?: Sensor;
}

export interface TopologyPayload {
  nodeA: string;
  nodeB: string;
  distance: number | null;
}