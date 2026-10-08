import type { EdgeRepository } from "../repositories/edgeRepository.js";
import type { NodeRepository } from "../repositories/nodeRepository.js";
import type { PoiRepository } from "../repositories/poiRepository.js";

export interface NavigationNode {
  id: string;
  x: number;
  y: number;
}

export interface NavigationEdge {
  origin: string;
  destination: string;
  distance: number;
}

export interface NavigationPoi {
  code: string;
  name: string;
  type: string;
  description: string | null;
  nodeId: string;
}

export interface NavigationConfig {
  version: number;
  generatedAt: string;
  environmentId: number | null;
  nodes: NavigationNode[];
  edges: NavigationEdge[];
  pois: NavigationPoi[];
}

export function createNavigationService(
  nodeRepository: NodeRepository,
  edgeRepository: EdgeRepository,
  poiRepository: PoiRepository
) {
  async function getConfig(environmentId?: number): Promise<NavigationConfig> {
    const [allNodes, allEdges, allPois] = await Promise.all([
      nodeRepository.findOperational(),
      edgeRepository.findOperational(),
      poiRepository.findOperational()
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
        `Existem sensores operacionais sem coordenadas válidas: ${codes}.`
      );
    }

    const validNodeCodes = new Set(
      nodes.map(node => node.code)
    );

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
        `Existem conexões operacionais sem distância válida: ${connections}.`
      );
    }

    const pois = allPois.filter(poi =>
      validNodeCodes.has(poi.node.code)
    );

    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      environmentId: environmentId ?? null,

      nodes: nodes.map(node => ({
        id: node.code,
        x: node.x as number,
        y: node.y as number
      })),

      edges: edges.map(edge => ({
        origin: edge.nodeA.code,
        destination: edge.nodeB.code,
        distance: edge.distance as number
      })),

      pois: pois.map(poi => ({
        code: poi.code,
        name: poi.name,
        type: poi.type,
        description: poi.description ?? null,
        nodeId: poi.node.code
      }))
    };
  }

  return {
    getConfig
  };
}

export type NavigationService = ReturnType<
  typeof createNavigationService
>;