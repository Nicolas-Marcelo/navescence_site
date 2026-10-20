export interface EnvironmentCount {
  nodes: number;
}

export interface Environment {
  id: number;
  code: string;
  name: string;
  type: string | null;
  floor: string | null;
  description: string | null;
  _count?: EnvironmentCount;
}

export interface EnvironmentPayload {
  code: string;
  name: string;
  type: string | null;
  floor: string;
  description: string | null;
}