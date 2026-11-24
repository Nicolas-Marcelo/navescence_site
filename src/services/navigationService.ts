
import { prisma } from "../database/prisma.js";

import type { EdgeRepository } from "../repositories/edgeRepository.js";
import type { NodeRepository } from "../repositories/nodeRepository.js";
import type { PoiRepository } from "../repositories/poiRepository.js";

import { validateEnvironmentImport } from "./environmentImportService.js";

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
  edgeStartNodeId?: string;
  edgeEndNodeId?: string;
  edgePosition?: number;
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
  async function getImportedConfig(
    environmentId: number,
    rawConfig: unknown,
  ): Promise<NavigationConfig> {
    const imported = validateEnvironmentImport(rawConfig);
    const codes = imported.sensors.map(sensor => sensor.nodeId);

    const physicalNodes = await prisma.node.findMany({
      where: { code: { in: codes } },
      select: {
        code: true,
        mac: true,
        name: true,
        active: true,
        maintenance: true,
      },
    });

    const physicalByCode = new Map(
      physicalNodes.map(node => [node.code, node]),
    );

    const missing = imported.sensors.filter(sensor => {
      const node = physicalByCode.get(sensor.nodeId);
      return !node || !node.active || node.maintenance || !node.mac;
    });

    if (missing.length > 0) {
      throw new Error(
        "Sensores inexistentes, indisponíveis ou sem MAC: "
        + missing.map(sensor => sensor.nodeId).join(", "),
      );
    }

    const nodes: NavigationNode[] = imported.sensors.map(sensor => {
      const physical = physicalByCode.get(sensor.nodeId)!;

      return {
        id: sensor.nodeId,
        mac: physical.mac,
        advertisingName: physical.name?.trim() || physical.code,
        x: sensor.x,
        y: sensor.y,
      };
    });

    const edges: NavigationEdge[] = imported.connections.map(edge => ({
      origin: edge.from,
      destination: edge.to,
      distance: edge.distance,
    }));

    const pois: NavigationPoi[] = imported.pois.map(poi => ({
      code: poi.code,
      name: poi.name,
      type: poi.code === "ENTRADA" ? "ACESSO" : "SALA",
      description: null,
      nodeId: poi.nodeId,
      x: poi.x,
      y: poi.y,
      approaches: [],
      ...(poi.edgeStartNodeId ? {
        edgeStartNodeId: poi.edgeStartNodeId,
      } : {}),
      ...(poi.edgeEndNodeId ? {
        edgeEndNodeId: poi.edgeEndNodeId,
      } : {}),
      ...(poi.edgePosition !== undefined ? {
        edgePosition: poi.edgePosition,
      } : {}),
    }));

    const bleNodes: TactileNode[] = nodes.map(node => ({
      id: node.id,
      kind: "BLE",
      x: node.x,
      y: node.y,
      label: node.advertisingName,
    }));

    const tactileMap = buildTactileNavigationMap(
      imported.tactileMap,
      pois.map(poi => ({
        code: poi.code,
        name: poi.name,
        x: poi.x,
        y: poi.y,
        nodeId: poi.nodeId,
      })),
      bleNodes,
    );

    console.log(
      `[NAVEGACAO] Ambiente ${environmentId} | `
      + `${nodes.length} sensores | ${edges.length} conexões | `
      + `${pois.length} POIs | ${tactileMap.nodes.length} nós táteis`,
    );

    return {
      version: 3,
      generatedAt: new Date().toISOString(),
      environmentId,
      nodes,
      edges,
      pois,
      tactileMap,
    };
  }

  async function getTraditionalConfig(
    environmentId?: number,
  ): Promise<NavigationConfig> {
    const [allNodes, allEdges, allPois, savedTactileMap] =
      await Promise.all([
        nodeRepository.findOperational(),
        edgeRepository.findOperational(),
        poiRepository.findOperational(),
        loadTactileMap(),
      ]);

    const nodes = environmentId === undefined
      ? allNodes
      : allNodes.filter(node => node.environmentId === environmentId);

    const invalidNodes = nodes.filter(node =>
      node.x === null || node.y === null ||
      !Number.isFinite(node.x) || !Number.isFinite(node.y)
    );

    if (invalidNodes.length > 0) {
      throw new Error(
        "Sensores operacionais sem coordenadas: "
        + invalidNodes.map(node => node.code).join(", "),
      );
    }

    const validCodes = new Set(nodes.map(node => node.code));

    const edges = allEdges.filter(edge =>
      validCodes.has(edge.nodeA.code) &&
      validCodes.has(edge.nodeB.code)
    );

    const invalidEdges = edges.filter(edge =>
      edge.distance === null ||
      !Number.isFinite(edge.distance) ||
      edge.distance <= 0
    );

    if (invalidEdges.length > 0) {
      throw new Error(
        "Conexões sem distância válida: "
        + invalidEdges.map(edge =>
          `${edge.nodeA.code}-${edge.nodeB.code}`
        ).join(", "),
      );
    }

    const pois = allPois.filter(poi =>
      validCodes.has(poi.node.code)
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
        .filter(approach => validCodes.has(approach.fromNode.code))
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

    const unavailable = new Set(
      tactileMap.nodes
        .filter(node => node.kind === "BLE" && !validCodes.has(node.id))
        .map(node => node.id),
    );

    if (unavailable.size > 0) {
      tactileMap.nodes = tactileMap.nodes.filter(
        node => !unavailable.has(node.id),
      );

      tactileMap.edges = tactileMap.edges.filter(edge =>
        !unavailable.has(edge.from) && !unavailable.has(edge.to)
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

  async function getConfig(
    environmentId?: number,
  ): Promise<NavigationConfig> {
    if (environmentId !== undefined) {
      const environment = await prisma.environment.findUnique({
        where: { id: environmentId },
        select: {
          id: true,
          navigationConfig: true,
        },
      });

      if (!environment) {
        throw new Error(`Ambiente ${environmentId} não encontrado.`);
      }

      if (environment.navigationConfig !== null) {
        return getImportedConfig(
          environment.id,
          environment.navigationConfig,
        );
      }
    }

    return getTraditionalConfig(environmentId);
  }

  return { getConfig };
}

export type NavigationService =
  ReturnType<typeof createNavigationService>;
