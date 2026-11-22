
import type { EdgeRepository } from "../repositories/edgeRepository.js";
import type { NodeRepository } from "../repositories/nodeRepository.js";
import type { PoiRepository } from "../repositories/poiRepository.js";

import {
  buildTactileNavigationMap,
  loadTactileMap,
  type TactileMap,
  type TactileNode,
} from "./tactileMapService.js";

export interface NavigationNode {
  id: string;
  mac: string | null;
  advertisingName: string;
  x: number;
  y: number;
}

export interface NavigationEdge {
  origin: string;
  destination: string;
  distance: number;
}

export interface NavigationPoiApproach {
  fromNodeId: string;
  side: "LEFT" | "RIGHT" | "FRONT";
  distanceMeters: number | null;
  instruction: string | null;
}

export interface NavigationPoi {
  code: string;
  name: string;
  type: string;
  description: string | null;
  nodeId: string;
  x: number | null;
  y: number | null;
  approaches: NavigationPoiApproach[];
}

export interface NavigationConfig {
  version: number;
  generatedAt: string;
  environmentId: number | null;
  nodes: NavigationNode[];
  edges: NavigationEdge[];
  pois: NavigationPoi[];
  tactileMap: TactileMap;
}

export function createNavigationService(
  nodeRepository: NodeRepository,
  edgeRepository: EdgeRepository,
  poiRepository: PoiRepository,
) {
  async function getConfig(environmentId?: number): Promise<NavigationConfig> {
    const [allNodes, allEdges, allPois, savedTactileMap] = await Promise.all([
      nodeRepository.findOperational(),
      edgeRepository.findOperational(),
      poiRepository.findOperational(),
      loadTactileMap(),
    ]);

    const nodes = environmentId === undefined
      ? allNodes
      : allNodes.filter(node => node.environmentId === environmentId);

    const invalidNodes = nodes.filter(node =>
      node.x === null ||
      node.y === null ||
      !Number.isFinite(node.x) ||
      !Number.isFinite(node.y)
    );

    if (invalidNodes.length > 0) {
      const codes = invalidNodes.map(node => node.code).join(", ");

      throw new Error(
        `Existem sensores operacionais sem coordenadas válidas: ${codes}.`,
      );
    }

    const validNodeCodes = new Set(nodes.map(node => node.code));

    const edges = allEdges.filter(edge =>
      validNodeCodes.has(edge.nodeA.code) &&
      validNodeCodes.has(edge.nodeB.code)
    );

    const invalidEdges = edges.filter(edge =>
      edge.distance === null ||
      !Number.isFinite(edge.distance) ||
      edge.distance <= 0
    );

    if (invalidEdges.length > 0) {
      const connections = invalidEdges
        .map(edge => `${edge.nodeA.code}-${edge.nodeB.code}`)
        .join(", ");

      throw new Error(
        `Existem conexões operacionais sem distância válida: ${connections}.`,
      );
    }

    const pois = allPois.filter(poi =>
      validNodeCodes.has(poi.node.code)
    );

    const navigationNodes: NavigationNode[] = nodes.map(node => ({
      id: node.code,
      mac: node.mac ?? null,
      advertisingName: node.name?.trim() || node.code,
      x: node.x as number,
      y: node.y as number,
    }));

    const navigationEdges: NavigationEdge[] = edges.map(edge => ({
      origin: edge.nodeA.code,
      destination: edge.nodeB.code,
      distance: edge.distance as number,
    }));

    const navigationPois: NavigationPoi[] = pois.map(poi => ({
      code: poi.code,
      name: poi.name,
      type: poi.type,
      description: poi.description ?? null,
      nodeId: poi.node.code,
      x: poi.x ?? null,
      y: poi.y ?? null,

      approaches: poi.approaches
        .filter(approach => validNodeCodes.has(approach.fromNode.code))
        .map(approach => ({
          fromNodeId: approach.fromNode.code,
          side: approach.side,
          distanceMeters: approach.distanceMeters ?? null,
          instruction: approach.instruction ?? null,
        })),
    }));

    const tactileBleNodes: TactileNode[] = navigationNodes.map(node => ({
      id: node.id,
      kind: "BLE",
      x: node.x,
      y: node.y,
      label: node.advertisingName,
    }));

    const tactileMap = buildTactileNavigationMap(
      savedTactileMap,
      navigationPois.map(poi => ({
        code: poi.code,
        name: poi.name,
        x: poi.x,
        y: poi.y,
        nodeId: poi.nodeId,
      })),
      tactileBleNodes,
    );

    // O mapa tátil não deve apontar para sensores
    // indisponíveis na configuração de navegação.
    const unavailableBleNodes = tactileMap.nodes.filter(node =>
      node.kind === "BLE" && !validNodeCodes.has(node.id)
    );

    if (unavailableBleNodes.length > 0) {
      const ids = new Set(
        unavailableBleNodes.map(node => node.id),
      );

      tactileMap.nodes = tactileMap.nodes.filter(node =>
        !ids.has(node.id)
      );

      tactileMap.edges = tactileMap.edges.filter(edge =>
        !ids.has(edge.from) && !ids.has(edge.to)
      );
    }

    return {
      version: 3,
      generatedAt: new Date().toISOString(),
      environmentId: environmentId ?? null,
      nodes: navigationNodes,
      edges: navigationEdges,
      pois: navigationPois,
      tactileMap,
    };
  }

  return { getConfig };
}

export type NavigationService = ReturnType<typeof createNavigationService>;
