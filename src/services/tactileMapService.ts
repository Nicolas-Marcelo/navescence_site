
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type TactileKind = "BLE" | "DECISION" | "ACCESS" | "POI";

export interface TactileNode {
  id: string;
  kind: TactileKind;
  x: number;
  y: number;
  label?: string;
}

export interface TactileEdge {
  from: string;
  to: string;
  distance: number;
}

export interface TactilePoiAccess {
  poiCode: string;
  decisionId: string;
  distance: number;
}

export interface TactileMap {
  version: number;
  nodes: TactileNode[];
  edges: TactileEdge[];
  poiAccesses?: TactilePoiAccess[];
}

export interface TactilePoiSource {
  code: string;
  name: string;
  x: number | null;
  y: number | null;
  nodeId: string;
}

const directory = join(process.cwd(), "config");
const filePath = join(directory, "tactile-map.json");

function validId(value: unknown): value is string {
  return typeof value === "string" &&
    /^[A-Za-z0-9_:\-]{1,80}$/.test(value);
}

function isAccessKind(kind: TactileKind | undefined): boolean {
  return kind === "DECISION" || kind === "ACCESS";
}

export function validateTactileMap(value: unknown): TactileMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Mapa tátil inválido.");
  }

  const data = value as Partial<TactileMap>;

  if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
    throw new Error("O mapa precisa conter nodes e edges.");
  }

  const accesses = data.poiAccesses ?? [];

  if (!Array.isArray(accesses)) {
    throw new Error("poiAccesses deve ser uma lista.");
  }

  if (data.nodes.length > 2000 || data.edges.length > 5000 ||
      accesses.length > 2000) {
    throw new Error("Mapa tátil excede os limites permitidos.");
  }

  const ids = new Set<string>();
  const kinds = new Map<string, TactileKind>();

  const nodes: TactileNode[] = data.nodes.map(node => {
    if (!node || !validId(node.id)) {
      throw new Error("Identificador de nó tátil inválido.");
    }

    if (!["BLE", "DECISION", "ACCESS", "POI"].includes(node.kind)) {
      throw new Error(`Tipo inválido: ${node.id}`);
    }

    if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) {
      throw new Error(`Coordenadas inválidas: ${node.id}`);
    }

    if (ids.has(node.id)) {
      throw new Error(`Nó duplicado: ${node.id}`);
    }

    if (node.kind === "BLE" && !/^NAV_S\d+$/i.test(node.id)) {
      throw new Error(`Código BLE inválido: ${node.id}`);
    }

    if (node.kind === "POI" && !node.id.startsWith("POI:")) {
      throw new Error(`Código POI inválido: ${node.id}`);
    }

    if (node.kind === "ACCESS" && !/^A\d+$/i.test(node.id)) {
      throw new Error(`Código de acesso inválido: ${node.id}`);
    }

    ids.add(node.id);
    kinds.set(node.id, node.kind);

    return {
      id: node.id,
      kind: node.kind,
      x: node.x,
      y: node.y,
      ...(typeof node.label === "string"
        ? { label: node.label.slice(0, 120) }
        : {}),
    };
  });

  const connections = new Set<string>();

  const edges: TactileEdge[] = data.edges.map(edge => {
    if (!edge || !ids.has(edge.from) || !ids.has(edge.to) ||
        edge.from === edge.to) {
      throw new Error("Conexão tátil com nós inválidos.");
    }

    if (!Number.isFinite(edge.distance) || edge.distance <= 0) {
      throw new Error("A distância da conexão deve ser positiva.");
    }

    const key = [edge.from, edge.to].sort().join("|");

    if (connections.has(key)) {
      throw new Error(`Conexão duplicada: ${key}`);
    }

    connections.add(key);

    return {
      from: edge.from,
      to: edge.to,
      distance: edge.distance,
    };
  });

  const usedPois = new Set<string>();

  const poiAccesses: TactilePoiAccess[] = accesses.map(access => {
    if (!access || typeof access.poiCode !== "string" ||
        !validId(access.poiCode)) {
      throw new Error("Código do POI inválido no mapa tátil.");
    }

    const poiCode = access.poiCode.trim().toUpperCase();
    const accessKind = kinds.get(access.decisionId);

    if (!isAccessKind(accessKind)) {
      throw new Error(
        `Acesso do POI ${poiCode}: referência ${access.decisionId} inexistente ou inválida.`,
      );
    }

    if (!Number.isFinite(access.distance) || access.distance <= 0) {
      throw new Error(`Distância inválida para o POI ${poiCode}.`);
    }

    if (usedPois.has(poiCode)) {
      throw new Error(`O POI ${poiCode} possui mais de um acesso cadastrado.`);
    }

    usedPois.add(poiCode);

    return {
      poiCode,
      decisionId: access.decisionId,
      distance: access.distance,
    };
  });

  return {
    version: Number.isInteger(data.version) && data.version! > 0
      ? data.version!
      : 1,
    nodes,
    edges,
    poiAccesses,
  };
}

export async function loadTactileMap(): Promise<TactileMap> {
  try {
    const content = await readFile(filePath, "utf8");
    return validateTactileMap(JSON.parse(content));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { version: 1, nodes: [], edges: [], poiAccesses: [] };
    }

    throw error;
  }
}

export async function saveTactileMap(value: unknown): Promise<TactileMap> {
  const map = validateTactileMap(value);

  await mkdir(directory, { recursive: true });

  const temporary = `${filePath}.tmp`;
  await writeFile(temporary, JSON.stringify(map, null, 2) + "\n", "utf8");
  await rename(temporary, filePath);

  return map;
}

export function buildTactileNavigationMap(
  map: TactileMap,
  pois: TactilePoiSource[],
  operationalNodes: TactileNode[],
): TactileMap {
  const nodes = map.nodes.map(node => ({ ...node }));
  const edges = map.edges.map(edge => ({ ...edge }));
  const existing = new Map(nodes.map(node => [node.id, node]));

  for (const node of operationalNodes) {
    const current = existing.get(node.id);

    if (current?.kind === "BLE") {
      current.x = node.x;
      current.y = node.y;
      current.label = node.label;
    }
  }

  const availablePois = new Map(
    pois.map(poi => [poi.code.toUpperCase(), poi]),
  );

  for (const access of map.poiAccesses ?? []) {
    const poi = availablePois.get(access.poiCode);
    if (!poi) continue;

    const reference = existing.get(access.decisionId);

    if (!reference || !isAccessKind(reference.kind)) {
      continue;
    }

    if (poi.x === null || poi.y === null) continue;
    if (!Number.isFinite(poi.x) || !Number.isFinite(poi.y)) continue;

    const id = `POI:${poi.code.toUpperCase()}`;
    const current = existing.get(id);

    if (current && current.kind !== "POI") {
      throw new Error(`Conflito de identificador tátil: ${id}`);
    }

    if (!current) {
      const node: TactileNode = {
        id,
        kind: "POI",
        x: poi.x,
        y: poi.y,
        label: poi.name,
      };

      nodes.push(node);
      existing.set(id, node);
    } else {
      current.x = poi.x;
      current.y = poi.y;
      current.label = poi.name;
    }

    const connection = edges.find(edge =>
      (edge.from === access.decisionId && edge.to === id) ||
      (edge.from === id && edge.to === access.decisionId)
    );

    if (connection) {
      connection.distance = access.distance;
    } else {
      edges.push({
        from: access.decisionId,
        to: id,
        distance: access.distance,
      });
    }
  }

  return {
    version: map.version,
    nodes,
    edges,
    poiAccesses: map.poiAccesses ?? [],
  };
}
