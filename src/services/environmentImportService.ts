
import {
  validateTactileMap,
  type TactileMap,
} from "./tactileMapService.js";

export interface ImportedSensor {
  nodeId: string;
  x: number;
  y: number;
}

export interface ImportedConnection {
  from: string;
  to: string;
  distance: number;
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

export interface ImportedEnvironment {
  code: string;
  name: string;
  type?: string;
  floor: string;
  description?: string;
}

export interface EnvironmentImport {
  environment: ImportedEnvironment;
  sensors: ImportedSensor[];
  connections: ImportedConnection[];
  pois: ImportedPoi[];
  tactileMap: TactileMap;
}

function object(value: unknown): value is Record<string, unknown> {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function connectionKey(from: string, to: string): string {
  return [from, to].sort().join("|");
}

export function validateEnvironmentImport(
  value: unknown,
): EnvironmentImport {
  if (!object(value)) {
    throw new Error("Configuração de ambiente inválida.");
  }

  const rawEnvironment = value.environment;

  if (!object(rawEnvironment)) {
    throw new Error("Dados do ambiente não encontrados.");
  }

  const code = stringValue(rawEnvironment.code).toUpperCase();
  const name = stringValue(rawEnvironment.name);
  const floor = stringValue(rawEnvironment.floor);
  const type = stringValue(rawEnvironment.type);
  const description = stringValue(rawEnvironment.description);

  if (!/^[A-Z0-9_]{3,30}$/.test(code)) {
    throw new Error("Código do ambiente inválido.");
  }

  if (!name || name.length > 100 ||
      !floor || floor.length > 40 ||
      type.length > 40 || description.length > 200) {
    throw new Error("Dados do ambiente inválidos.");
  }

  if (!Array.isArray(value.sensors) ||
      !Array.isArray(value.connections) ||
      !Array.isArray(value.pois)) {
    throw new Error("Sensores, conexões e POIs devem ser listas.");
  }

  if (value.sensors.length > 100 ||
      value.connections.length > 300 ||
      value.pois.length > 500) {
    throw new Error("Limite de elementos do ambiente excedido.");
  }

  const sensorIds = new Set<string>();

  const sensors: ImportedSensor[] = value.sensors.map(raw => {
    if (!object(raw)) throw new Error("Sensor inválido.");

    const nodeId = stringValue(raw.nodeId).toUpperCase();

    if (!/^NAV_S\d+$/.test(nodeId) ||
        !finite(raw.x) || !finite(raw.y)) {
      throw new Error(`Dados inválidos do sensor ${nodeId}.`);
    }

    if (sensorIds.has(nodeId)) {
      throw new Error(`Sensor duplicado: ${nodeId}.`);
    }

    sensorIds.add(nodeId);
    return { nodeId, x: raw.x, y: raw.y };
  });

  const connectionKeys = new Set<string>();

  const connections: ImportedConnection[] = value.connections.map(raw => {
    if (!object(raw)) throw new Error("Conexão inválida.");

    const from = stringValue(raw.from).toUpperCase();
    const to = stringValue(raw.to).toUpperCase();

    if (!sensorIds.has(from) || !sensorIds.has(to) ||
        from === to || !finite(raw.distance) ||
        raw.distance <= 0) {
      throw new Error(`Conexão inválida: ${from} -> ${to}.`);
    }

    const key = connectionKey(from, to);

    if (connectionKeys.has(key)) {
      throw new Error(`Conexão duplicada: ${key}.`);
    }

    connectionKeys.add(key);
    return { from, to, distance: raw.distance };
  });

  const poiCodes = new Set<string>();

  const pois: ImportedPoi[] = value.pois.map(raw => {
    if (!object(raw)) throw new Error("POI inválido.");

    const poiCode = stringValue(raw.code).toUpperCase();
    const poiName = stringValue(raw.name);
    const nodeId = stringValue(raw.nodeId).toUpperCase();

    if (!/^[A-Z0-9_]{2,40}$/.test(poiCode) ||
        !poiName || poiName.length > 120 ||
        !sensorIds.has(nodeId) ||
        !finite(raw.x) || !finite(raw.y)) {
      throw new Error(`Dados inválidos do POI ${poiCode}.`);
    }

    if (poiCodes.has(poiCode)) {
      throw new Error(`POI duplicado: ${poiCode}.`);
    }

    poiCodes.add(poiCode);

    const poi: ImportedPoi = {
      code: poiCode,
      name: poiName,
      nodeId,
      x: raw.x,
      y: raw.y,
    };

    const hasEdge = raw.edgeStartNodeId !== undefined ||
      raw.edgeEndNodeId !== undefined ||
      raw.edgePosition !== undefined;

    if (hasEdge) {
      const start = stringValue(raw.edgeStartNodeId).toUpperCase();
      const end = stringValue(raw.edgeEndNodeId).toUpperCase();

      if (!sensorIds.has(start) || !sensorIds.has(end) ||
          !finite(raw.edgePosition) ||
          raw.edgePosition < 0 || raw.edgePosition > 1) {
        throw new Error(`Posição no trecho inválida: ${poiCode}.`);
      }

      if (!connectionKeys.has(connectionKey(start, end))) {
        throw new Error(`Trecho não cadastrado para ${poiCode}.`);
      }

      poi.edgeStartNodeId = start;
      poi.edgeEndNodeId = end;
      poi.edgePosition = raw.edgePosition;
    }

    return poi;
  });

  const tactileMap = validateTactileMap(value.tactileMap);
  const tactileIds = new Set(tactileMap.nodes.map(node => node.id));

  for (const sensor of sensors) {
    if (!tactileIds.has(sensor.nodeId)) {
      throw new Error(
        `Sensor ${sensor.nodeId} não está no mapa tátil.`,
      );
    }
  }

  for (const poi of pois) {
    if (!tactileIds.has(`POI:${poi.code}`)) {
      throw new Error(
        `POI ${poi.code} não está no mapa tátil.`,
      );
    }
  }

  for (const access of tactileMap.poiAccesses ?? []) {
    if (!poiCodes.has(access.poiCode)) {
      throw new Error(
        `Acesso sem POI cadastrado: ${access.poiCode}.`,
      );
    }
  }

  return {
    environment: {
      code,
      name,
      floor,
      ...(type ? { type } : {}),
      ...(description ? { description } : {}),
    },
    sensors,
    connections,
    pois,
    tactileMap,
  };
}
