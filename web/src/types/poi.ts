import type {
  Sensor,
} from "./sensor";

export interface Poi {
  id: number;
  code: string;
  name: string;
  type: string;

  description:
    string | null;

  nodeId:
    number;

  node?:
    Sensor | null;

  x:
    number | null;

  y:
    number | null;

  orientationDegrees:
    number | null;

  active:
    boolean;
}

export interface PoiPayload {
  code?: string;
  name?: string;
  type?: string;

  description?:
    string | null;

  nodeId?:
    number;

  x?:
    number | null;

  y?:
    number | null;

  orientationDegrees?:
    number | null;

  active?:
    boolean;
}