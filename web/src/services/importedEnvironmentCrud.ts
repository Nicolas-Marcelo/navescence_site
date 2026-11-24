
type JsonObject = Record<string, unknown>;

interface SensorConfig {
  nodeId: string;
  x: number;
  y: number;
}

interface PoiConfig {
  code: string;
  name: string;
  nodeId: string;
  x: number;
  y: number;
  edgeStartNodeId?: string;
  edgeEndNodeId?: string;
  edgePosition?: number;
}

interface ConnectionConfig {
  from: string;
  to: string;
  distance: number;
}

interface TactileNode {
  id: string;
  kind: "BLE" | "ACCESS" | "DECISION" | "POI";
  x: number;
  y: number;
  label?: string;
}

interface TactileEdge {
  from: string;
  to: string;
  distance: number;
}

interface EnvironmentConfig {
  environment: {
    code: string;
    name: string;
    type?: string;
    floor: string;
    description?: string;
  };
  sensors: SensorConfig[];
  pois: PoiConfig[];
  connections: ConnectionConfig[];
  tactileMap: {
    version: number;
    nodes: TactileNode[];
    edges: TactileEdge[];
    poiAccesses?: Array<{
      poiCode: string;
      decisionId: string;
      distance: number;
    }>;
  };
}

interface PhysicalSensor {
  physicalId: number | null;
  nodeId: string;
  name: string;
  mac: string | null;
  active: boolean;
  maintenance: boolean;
}

interface EnvironmentResponse {
  imported: boolean;
  environmentId: number;
  updatedAt: string;
  configuration: EnvironmentConfig;
  physicalSensors: PhysicalSensor[];
}

let selectedImportedEnvironmentId: number | null = null;

export function setImportedMutationEnvironment(id: number | null) {
  selectedImportedEnvironmentId = id;
}

export function getImportedMutationEnvironment() {
  return selectedImportedEnvironmentId;
}

function object(value: unknown): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Dados inválidos.");
  }

  return value as JsonObject;
}

function string(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function number(value: unknown, field: string): number {
  if (value === null || value === undefined || value === "") {
    throw new Error(`Informe ${field}.`);
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Valor inválido para ${field}.`);
  }

  return parsed;
}

function connectionKey(a: string, b: string) {
  return [a, b].sort().join("|");
}

async function request<T>(
  path: string,
  method: string,
  token: string | null,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {};

  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const result: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message = result && typeof result === "object"
      ? (result as JsonObject).message ?? (result as JsonObject).error
      : null;

    throw new Error(
      typeof message === "string" ? message : `Erro HTTP ${response.status}`,
    );
  }

  return result as T;
}

function findSensorCode(
  data: EnvironmentResponse,
  id: number,
): string {
  const sensor = data.physicalSensors.find(
    item => item.physicalId === id,
  );

  if (!sensor) {
    throw new Error("Sensor não encontrado no ambiente selecionado.");
  }

  return sensor.nodeId;
}

function findPoi(
  configuration: EnvironmentConfig,
  id: number,
) {
  const index = -id - 1;

  if (!Number.isInteger(index) || index < 0) {
    throw new Error("Identificador de POI importado inválido.");
  }

  const poi = configuration.pois[index];

  if (!poi) throw new Error("POI não encontrado.");

  return poi;
}

function sensorExists(configuration: EnvironmentConfig, code: string) {
  return configuration.sensors.some(sensor => sensor.nodeId === code);
}

function distance(a: SensorConfig, x: number, y: number) {
  return Math.max(0.01, Math.hypot(a.x - x, a.y - y));
}

function removeTactilePoi(configuration: EnvironmentConfig, code: string) {
  const id = `POI:${code}`;

  configuration.tactileMap.nodes = configuration.tactileMap.nodes.filter(
    node => node.id !== id,
  );

  configuration.tactileMap.edges = configuration.tactileMap.edges.filter(
    edge => edge.from !== id && edge.to !== id,
  );

  configuration.tactileMap.poiAccesses =
    (configuration.tactileMap.poiAccesses ?? []).filter(
      access => access.poiCode !== code,
    );
}

function createTactilePoi(configuration: EnvironmentConfig, poi: PoiConfig) {
  const reference = configuration.sensors.find(
    sensor => sensor.nodeId === poi.nodeId,
  );

  if (!reference) throw new Error("Sensor de referência inexistente.");

  const id = `POI:${poi.code}`;

  configuration.tactileMap.nodes.push({
    id,
    kind: "POI",
    x: poi.x,
    y: poi.y,
    label: poi.name,
  });

  configuration.tactileMap.edges.push({
    from: reference.nodeId,
    to: id,
    distance: distance(reference, poi.x, poi.y),
  });
}

function updateTactilePoi(
  configuration: EnvironmentConfig,
  previousCode: string,
  previousNodeId: string,
  poi: PoiConfig,
) {
  const oldId = `POI:${previousCode}`;
  const newId = `POI:${poi.code}`;

  const node = configuration.tactileMap.nodes.find(item => item.id === oldId);

  if (!node) {
    throw new Error("Nó do POI não encontrado no mapa tátil.");
  }

  node.id = newId;
  node.x = poi.x;
  node.y = poi.y;
  node.label = poi.name;

  for (const edge of configuration.tactileMap.edges) {
    if (edge.from === oldId) edge.from = newId;
    if (edge.to === oldId) edge.to = newId;
  }

  for (const access of configuration.tactileMap.poiAccesses ?? []) {
    if (access.poiCode === previousCode) {
      access.poiCode = poi.code;
    }
  }

  const access = configuration.tactileMap.poiAccesses?.find(
    item => item.poiCode === poi.code,
  );

  if (access) {
    const tactileEdge = configuration.tactileMap.edges.find(edge =>
      (edge.from === access.decisionId && edge.to === newId) ||
      (edge.from === newId && edge.to === access.decisionId)
    );

    if (tactileEdge) tactileEdge.distance = access.distance;
    return;
  }

  const reference = configuration.sensors.find(
    sensor => sensor.nodeId === poi.nodeId,
  );

  if (!reference) throw new Error("Sensor de referência inexistente.");

  const directEdge = configuration.tactileMap.edges.find(edge =>
    (edge.from === previousNodeId && edge.to === newId) ||
    (edge.from === newId && edge.to === previousNodeId)
  );

  if (directEdge) {
    if (directEdge.from === previousNodeId) directEdge.from = poi.nodeId;
    if (directEdge.to === previousNodeId) directEdge.to = poi.nodeId;
    directEdge.distance = distance(reference, poi.x, poi.y);
  }
}

function mutate(
  data: EnvironmentResponse,
  path: string,
  method: string,
  payload: JsonObject,
) {
  const config = data.configuration;
  const sensorMatch = path.match(/^\/api\/sensors(?:\/(\d+))?$/);
  const poiMatch = path.match(/^\/api\/pois(?:\/(-?\d+))?$/);
  const edgeMatch = path.match(/^\/api\/topology(?:\/(-?\d+))?$/);

  if (sensorMatch) {
    const id = sensorMatch[1] ? Number(sensorMatch[1]) : null;

    if (method === "POST") {
      const code = string(payload.code).toUpperCase();

      if (!code) throw new Error("Informe o código do sensor.");
      if (sensorExists(config, code)) {
        throw new Error("Este sensor já está associado ao ambiente.");
      }

      if (!data.physicalSensors.some(sensor => sensor.nodeId === code)) {
        throw new Error(
          "Para utilizar um novo ESP32, cadastre primeiro o dispositivo físico. "
          + "A inclusão neste ambiente reutiliza sensores já existentes.",
        );
      }

      const x = number(payload.x, "a coordenada X");
      const y = number(payload.y, "a coordenada Y");

      config.sensors.push({ nodeId: code, x, y });
      config.tactileMap.nodes.push({
        id: code, kind: "BLE", x, y, label: code,
      });

      return;
    }

    if (id === null) throw new Error("Sensor não informado.");

    const code = findSensorCode(data, id);
    const sensor = config.sensors.find(item => item.nodeId === code);

    if (!sensor) throw new Error("Sensor não encontrado.");

    if (method === "PUT") {
      const newCode = string(payload.code).toUpperCase();

      if (newCode && newCode !== code) {
        throw new Error(
          "Não é possível renomear o identificador físico do ESP32 "
          + "somente neste ambiente.",
        );
      }

      const physical = data.physicalSensors.find(
        item => item.nodeId === code,
      );

      if (
        (payload.name !== undefined &&
          string(payload.name) !== string(physical?.name)) ||
        (payload.mac !== undefined &&
          string(payload.mac).toUpperCase() !==
          string(physical?.mac).toUpperCase()) ||
        (payload.active !== undefined &&
          Boolean(payload.active) !== physical?.active) ||
        (payload.maintenance !== undefined &&
          Boolean(payload.maintenance) !== physical?.maintenance)
      ) {
        throw new Error(
          "Nome, MAC e estado operacional pertencem ao dispositivo físico "
          + "compartilhado. Nesta configuração, altere apenas sua posição.",
        );
      }

      const x = number(payload.x, "a coordenada X");
      const y = number(payload.y, "a coordenada Y");

      sensor.x = x;
      sensor.y = y;

      const tactileNode = config.tactileMap.nodes.find(
        item => item.id === code && item.kind === "BLE",
      );

      if (tactileNode) {
        tactileNode.x = x;
        tactileNode.y = y;
      }

      return;
    }

    if (method === "DELETE") {
      if (config.connections.some(edge =>
        edge.from === code || edge.to === code
      )) {
        throw new Error(
          "Remova primeiro as conexões deste sensor no ambiente.",
        );
      }

      if (config.pois.some(poi => poi.nodeId === code ||
          poi.edgeStartNodeId === code || poi.edgeEndNodeId === code)) {
        throw new Error(
          "Existem POIs associados a este sensor. Reassocie ou remova os POIs.",
        );
      }

      const tactileEdges = config.tactileMap.edges.filter(edge =>
        edge.from === code || edge.to === code,
      );

      if (tactileEdges.length > 0) {
        throw new Error(
          "O sensor ainda possui conexões no mapa tátil. "
          + "Atualize o mapa antes de removê-lo.",
        );
      }

      config.sensors = config.sensors.filter(item => item.nodeId !== code);
      config.tactileMap.nodes = config.tactileMap.nodes.filter(
        item => item.id !== code,
      );

      return;
    }
  }

  if (poiMatch) {
    const id = poiMatch[1] ? Number(poiMatch[1]) : null;

    if (method === "POST") {
      const code = string(payload.code).toUpperCase();
      const name = string(payload.name);
      const physicalId = number(payload.nodeId, "o sensor de referência");
      const nodeId = findSensorCode(data, physicalId);

      if (!code || !name) {
        throw new Error("Código e nome do POI são obrigatórios.");
      }

      if (config.pois.some(poi => poi.code === code)) {
        throw new Error("Já existe um POI com este código.");
      }

      const poi: PoiConfig = {
        code, name, nodeId,
        x: number(payload.x, "a coordenada X"),
        y: number(payload.y, "a coordenada Y"),
      };

      config.pois.push(poi);
      createTactilePoi(config, poi);
      return;
    }

    if (id === null) throw new Error("POI não informado.");

    const poi = findPoi(config, id);

    if (method === "DELETE") {
      removeTactilePoi(config, poi.code);
      config.pois = config.pois.filter(item => item !== poi);
      return;
    }

    if (method === "PUT") {
      const oldCode = poi.code;
      const oldNodeId = poi.nodeId;
      const code = string(payload.code).toUpperCase();
      const name = string(payload.name);
      const nodeId = findSensorCode(
        data,
        number(payload.nodeId, "o sensor de referência"),
      );

      if (!code || !name) {
        throw new Error("Código e nome do POI são obrigatórios.");
      }

      if (config.pois.some(item =>
        item !== poi && item.code === code
      )) {
        throw new Error("Já existe outro POI com este código.");
      }

      poi.code = code;
      poi.name = name;
      poi.nodeId = nodeId;
      poi.x = number(payload.x, "a coordenada X");
      poi.y = number(payload.y, "a coordenada Y");

      updateTactilePoi(config, oldCode, oldNodeId, poi);
      return;
    }
  }

  if (edgeMatch) {
    const id = edgeMatch[1] ? Number(edgeMatch[1]) : null;

    if (method === "POST") {
      const from = string(payload.nodeA).toUpperCase();
      const to = string(payload.nodeB).toUpperCase();

      if (!sensorExists(config, from) || !sensorExists(config, to) ||
          from === to) {
        throw new Error("Selecione dois sensores diferentes deste ambiente.");
      }

      const key = connectionKey(from, to);

      if (config.connections.some(edge =>
        connectionKey(edge.from, edge.to) === key
      )) {
        throw new Error("Esta conexão já existe.");
      }

      const edge = {
        from,
        to,
        distance: number(payload.distance, "a distância"),
      };

      if (edge.distance <= 0) {
        throw new Error("A distância deve ser maior que zero.");
      }

      config.connections.push(edge);
      config.tactileMap.edges.push({
        from, to, distance: edge.distance,
      });
      return;
    }

    if (method === "DELETE" && id !== null) {
      const index = -id - 1;
      const edge = config.connections[index];

      if (!edge) throw new Error("Conexão não encontrada.");

      const key = connectionKey(edge.from, edge.to);

      const direct = config.tactileMap.edges.find(item =>
        connectionKey(item.from, item.to) === key
      );

      if (!direct) {
        throw new Error(
          "Esta conexão possui segmentos intermediários no mapa tátil. "
          + "Sua exclusão precisa atualizar também esses segmentos.",
        );
      }

      config.connections.splice(index, 1);
      config.tactileMap.edges = config.tactileMap.edges.filter(
        item => item !== direct,
      );
      return;
    }
  }

  throw new Error("Operação não suportada para este ambiente.");
}

export async function handleImportedMutation(
  path: string,
  method: string,
  body: unknown,
  token: string | null,
): Promise<unknown> {
  const environmentId = selectedImportedEnvironmentId;

  if (environmentId === null) {
    throw new Error("Nenhum ambiente importado selecionado.");
  }

  const endpoint = `/api/admin/environment-imports/by-id/${environmentId}`;

  const current = await request<EnvironmentResponse>(
    endpoint, "GET", token,
  );

  if (!current.imported || !current.configuration) {
    throw new Error("O ambiente não possui configuração importada.");
  }

  if (!current.updatedAt) {
    throw new Error("Versão do ambiente não disponível. Atualize o backend.");
  }

  const configuration: EnvironmentConfig =
    structuredClone(current.configuration);

  const working: EnvironmentResponse = {
    ...current,
    configuration,
  };

mutate(working, path, method, body == null ? {} : object(body));

  await request(
    `${endpoint}/config`,
    "PUT",
    token,
    {
      configuration,
      expectedUpdatedAt: current.updatedAt,
    },
  );

  window.dispatchEvent(
    new CustomEvent("navescence:environment-config-updated", {
      detail: { environmentId },
    }),
  );

  return { success: true };
}

export function isImportedMutationPath(path: string, method: string) {
  return selectedImportedEnvironmentId !== null &&
    ["POST", "PUT", "DELETE"].includes(method) &&
    /^\/api\/(sensors|pois|topology)(?:\/-?\d+)?$/.test(path);
}
