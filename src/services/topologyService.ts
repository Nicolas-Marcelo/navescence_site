import type { EdgeRepository } from "../repositories/edgeRepository.js";
import type { NodeRepository } from "../repositories/nodeRepository.js";

export interface EdgeData {
  nodeA: string;
  nodeB: string;
  distance?: number | null;
}

export function createTopologyService(edgeRepository: EdgeRepository, nodeRepository: NodeRepository) {
  function list() {
    return edgeRepository.findAll();
  }

  async function listOperationalLinks() {
    const edges = await edgeRepository.findOperational();
    return edges.map(edge => ({ nodeA: edge.nodeA.code, nodeB: edge.nodeB.code }));
  }

  async function getNeighbors(nodeId: number) {
    const node = await nodeRepository.findById(nodeId);
    if (!node) return null;

    const edges = await edgeRepository.findByNodeId(nodeId);

    return edges.map(edge => {
      const neighbor = edge.nodeAId === nodeId ? edge.nodeB : edge.nodeA;

      return {
        edgeId: edge.id,
        id: neighbor.id,
        code: neighbor.code,
        name: neighbor.name,
        distance: edge.distance
      };
    });
  }

  async function setNeighbors(nodeId: number, neighborCodes: string[]) {
    const node = await nodeRepository.findById(nodeId);
    if (!node) return null;

    const codes = [...new Set(
      neighborCodes
        .map(code => String(code).trim().toUpperCase())
        .filter(code => code && code !== node.code)
    )];

    const neighbors = [];

    for (const code of codes) {
      const neighbor = await nodeRepository.findByCode(code);
      if (!neighbor) throw new Error(`O sensor ${code} não existe.`);
      neighbors.push(neighbor);
    }

    const currentEdges = await edgeRepository.findByNodeId(nodeId);
    const desiredIds = new Set(neighbors.map(neighbor => neighbor.id));

    for (const edge of currentEdges) {
      const neighborId = edge.nodeAId === nodeId ? edge.nodeBId : edge.nodeAId;
      if (!desiredIds.has(neighborId)) await edgeRepository.remove(edge.id);
    }

    for (const neighbor of neighbors) {
      const existing = await edgeRepository.findBetween(nodeId, neighbor.id);
      if (existing) continue;

      const nodeAId = Math.min(nodeId, neighbor.id);
      const nodeBId = Math.max(nodeId, neighbor.id);

      await edgeRepository.create(nodeAId, nodeBId, null);
    }

    return getNeighbors(nodeId);
  }

  async function create(data: EdgeData) {
    const codeA = data.nodeA?.trim().toUpperCase();
    const codeB = data.nodeB?.trim().toUpperCase();

    if (!codeA || !codeB) throw new Error("Os dois sensores são obrigatórios.");
    if (codeA === codeB) throw new Error("Um sensor não pode ser vizinho dele mesmo.");

    const nodeA = await nodeRepository.findByCode(codeA);
    const nodeB = await nodeRepository.findByCode(codeB);

    if (!nodeA || !nodeB) throw new Error("Um dos sensores informados não existe.");

    const existing = await edgeRepository.findBetween(nodeA.id, nodeB.id);
    if (existing) throw new Error("Essa conexão já está cadastrada.");

    const distance = data.distance === undefined || data.distance === null ? null : Number(data.distance);
    if (distance !== null && (!Number.isFinite(distance) || distance <= 0)) throw new Error("A distância deve ser maior que zero.");

    const nodeAId = Math.min(nodeA.id, nodeB.id);
    const nodeBId = Math.max(nodeA.id, nodeB.id);

    return edgeRepository.create(nodeAId, nodeBId, distance);
  }

  async function remove(id: number) {
    const edge = await edgeRepository.findById(id);
    if (!edge) return null;

    await edgeRepository.remove(id);
    return edge;
  }

  return { list, listOperationalLinks, getNeighbors, setNeighbors, create, remove };
}

export type TopologyService = ReturnType<typeof createTopologyService>;