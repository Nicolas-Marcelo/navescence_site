
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type TactileKind = "BLE" | "DECISION" | "POI";

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

export interface TactileMap {
  version: number;
  nodes: TactileNode[];
  edges: TactileEdge[];
}

const directory = join(process.cwd(), "config");
const filePath = join(directory, "tactile-map.json");

export function validateTactileMap(value: unknown): TactileMap {
  if (!value || typeof value !== "object") {
    throw new Error("Mapa tátil inválido.");
  }

  const data = value as Partial<TactileMap>;

  if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
    throw new Error("O mapa precisa conter nodes e edges.");
  }

  if (data.nodes.length > 2000 || data.edges.length > 5000) {
    throw new Error("Mapa tátil excede os limites permitidos.");
  }

  const ids = new Set<string>();

  const nodes: TactileNode[] = data.nodes.map(node => {
    if (!node || typeof node.id !== "string" ||
        !/^[A-Za-z0-9_:\-]{1,80}$/.test(node.id)) {
      throw new Error("Identificador de nó tátil inválido.");
    }

    if (!["BLE", "DECISION", "POI"].includes(node.kind)) {
      throw new Error(`Tipo inválido: ${node.id}`);
    }

    if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) {
      throw new Error(`Coordenadas inválidas: ${node.id}`);
    }

    if (ids.has(node.id)) throw new Error(`Nó duplicado: ${node.id}`);
    ids.add(node.id);

    if (node.kind === "BLE" && !/^NAV_S\d+$/i.test(node.id)) {
      throw new Error(`Código BLE inválido: ${node.id}`);
    }

    if (node.kind === "POI" && !node.id.startsWith("POI:")) {
      throw new Error(`O POI deve utilizar POI:codigo: ${node.id}`);
    }

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
    if (!edge || !ids.has(edge.from) ||
        !ids.has(edge.to) || edge.from === edge.to) {
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

  return {
    version: Number.isInteger(data.version) && data.version! > 0
      ? data.version!
      : 1,
    nodes,
    edges,
  };
}

export async function loadTactileMap(): Promise<TactileMap> {
  try {
    const content = await readFile(filePath, "utf8");
    return validateTactileMap(JSON.parse(content));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { version: 1, nodes: [], edges: [] };
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
