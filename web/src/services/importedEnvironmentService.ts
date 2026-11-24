
import { apiRequest } from "./api";

export interface ImportedSensor {
  nodeId: string;
  x: number;
  y: number;
}

export interface ImportedPoi {
  code: string;
  name: string;
  nodeId: string;
  x: number;
  y: number;
  edgeStartNodeId?: string;
  edgeEndNodeId?: string;
  edgePosition?: number;
}

export interface ImportedConnection {
  from: string;
  to: string;
  distance: number;
}

export interface ImportedTactileNode {
  id: string;
  kind: "BLE" | "ACCESS" | "DECISION" | "POI";
  x: number;
  y: number;
  label?: string;
}

export interface ImportedTactileEdge {
  from: string;
  to: string;
  distance: number;
}

export interface ImportedConfiguration {
  environment: {
    code: string;
    name: string;
    type?: string;
    floor: string;
    description?: string;
  };
  sensors: ImportedSensor[];
  pois: ImportedPoi[];
  connections: ImportedConnection[];
  tactileMap: {
    version: number;
    nodes: ImportedTactileNode[];
    edges: ImportedTactileEdge[];
    poiAccesses?: Array<{
      poiCode: string;
      decisionId: string;
      distance: number;
    }>;
  };
}

interface EnvironmentResponse {
  imported: boolean;
  environmentId: number;
  updatedAt: string;
  configuration: ImportedConfiguration;
}

interface UpdateResponse {
  success: boolean;
  updatedAt: string;
  configuration: ImportedConfiguration;
}

const endpoint = "/api/admin/environment-imports/by-id";

export async function getImportedEnvironment(environmentId: number) {
  return apiRequest<EnvironmentResponse>(
    `${endpoint}/${environmentId}`,
    { authenticated: true },
  );
}

export async function updateImportedConfiguration(
  environmentId: number,
  configuration: ImportedConfiguration,
  expectedUpdatedAt: string,
) {
  return apiRequest<UpdateResponse>(
    `${endpoint}/${environmentId}/config`,
    {
      method: "PUT",
      authenticated: true,
      body: JSON.stringify({
        configuration,
        expectedUpdatedAt,
      }),
    },
  );
}

export async function changeImportedEnvironment(
  environmentId: number,
  modify: (configuration: ImportedConfiguration) => void,
) {
  const current = await getImportedEnvironment(environmentId);

  if (!current.imported || !current.configuration) {
    throw new Error("Este ambiente não possui configuração JSON.");
  }

  const configuration = structuredClone(current.configuration);

  modify(configuration);

  const result = await updateImportedConfiguration(
    environmentId,
    configuration,
    current.updatedAt,
  );

  window.dispatchEvent(
    new CustomEvent("navescence:environment-config-updated", {
      detail: { environmentId },
    }),
  );

  return result;
}

export function updateImportedSensor(
  environmentId: number,
  code: string,
  data: { x: number; y: number },
) {
  return changeImportedEnvironment(environmentId, configuration => {
    const sensor = configuration.sensors.find(item => item.nodeId === code);

    if (!sensor) throw new Error(`Sensor ${code} não encontrado.`);

    sensor.x = data.x;
    sensor.y = data.y;

    const tactileNode = configuration.tactileMap.nodes.find(
      item => item.id === code && item.kind === "BLE",
    );

    if (tactileNode) {
      tactileNode.x = data.x;
      tactileNode.y = data.y;
    }
  });
}

export function updateImportedPoi(
  environmentId: number,
  code: string,
  data: {
    name: string;
    nodeId: string;
    x: number;
    y: number;
  },
) {
  return changeImportedEnvironment(environmentId, configuration => {
    const poi = configuration.pois.find(item => item.code === code);

    if (!poi) throw new Error(`POI ${code} não encontrado.`);

    if (!configuration.sensors.some(item => item.nodeId === data.nodeId)) {
      throw new Error("Sensor de referência inexistente neste ambiente.");
    }

    poi.name = data.name;
    poi.nodeId = data.nodeId;
    poi.x = data.x;
    poi.y = data.y;

    const tactileNode = configuration.tactileMap.nodes.find(
      item => item.id === `POI:${code}`,
    );

    if (tactileNode) {
      tactileNode.x = data.x;
      tactileNode.y = data.y;
      tactileNode.label = data.name;
    }
  });
}

export function createImportedPoi(
  environmentId: number,
  data: ImportedPoi,
) {
  return changeImportedEnvironment(environmentId, configuration => {
    const code = data.code.trim().toUpperCase();

    if (configuration.pois.some(item => item.code === code)) {
      throw new Error(`O POI ${code} já existe neste ambiente.`);
    }

    if (!configuration.sensors.some(item => item.nodeId === data.nodeId)) {
      throw new Error("Sensor de referência inexistente.");
    }

    configuration.pois.push({ ...data, code });

    configuration.tactileMap.nodes.push({
      id: `POI:${code}`,
      kind: "POI",
      x: data.x,
      y: data.y,
      label: data.name,
    });

    configuration.tactileMap.edges.push({
      from: data.nodeId,
      to: `POI:${code}`,
      distance: Math.max(
        0.01,
        Math.hypot(
          data.x - configuration.sensors.find(s => s.nodeId === data.nodeId)!.x,
          data.y - configuration.sensors.find(s => s.nodeId === data.nodeId)!.y,
        ),
      ),
    });
  });
}

export function deleteImportedPoi(environmentId: number, code: string) {
  return changeImportedEnvironment(environmentId, configuration => {
    if (!configuration.pois.some(item => item.code === code)) {
      throw new Error(`POI ${code} não encontrado.`);
    }

    configuration.pois = configuration.pois.filter(
      item => item.code !== code,
    );

    configuration.tactileMap.nodes = configuration.tactileMap.nodes.filter(
      item => item.id !== `POI:${code}`,
    );

    configuration.tactileMap.edges = configuration.tactileMap.edges.filter(
      item => item.from !== `POI:${code}` && item.to !== `POI:${code}`,
    );

    configuration.tactileMap.poiAccesses =
      (configuration.tactileMap.poiAccesses ?? []).filter(
        item => item.poiCode !== code,
      );
  });
}
