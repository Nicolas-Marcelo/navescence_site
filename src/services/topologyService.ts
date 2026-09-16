import type {
  EdgeRepository
} from "../repositories/edgeRepository.js";

import type {
  NodeRepository
} from "../repositories/nodeRepository.js";

export interface EdgeData {
  nodeA: string;
  nodeB: string;
  distance: number;
}

export function createTopologyService(
  edgeRepository: EdgeRepository,
  nodeRepository: NodeRepository
) {
  function list() {
    return edgeRepository.findAll();
  }

  async function listOperationalLinks() {
    const edges =
      await edgeRepository.findOperational();

    return edges.map(edge => ({
      nodeA: edge.nodeA.code,
      nodeB: edge.nodeB.code
    }));
  }

  async function create(
    data: EdgeData
  ) {
    const codeA =
      data.nodeA
        ?.trim()
        .toUpperCase();

    const codeB =
      data.nodeB
        ?.trim()
        .toUpperCase();

    if (
      !codeA ||
      !codeB
    ) {
      throw new Error(
        "Os dois sensores são obrigatórios."
      );
    }

    if (
      codeA === codeB
    ) {
      throw new Error(
        "Um sensor não pode ser vizinho dele mesmo."
      );
    }

    const nodeA =
      await nodeRepository.findByCode(
        codeA
      );

    const nodeB =
      await nodeRepository.findByCode(
        codeB
      );

    if (
      !nodeA ||
      !nodeB
    ) {
      throw new Error(
        "Um dos sensores informados não existe."
      );
    }

    const existing =
      await edgeRepository.findBetween(
        nodeA.id,
        nodeB.id
      );

    if (existing) {
      throw new Error(
        "Essa conexão já está cadastrada."
      );
    }

    const distance =
      Number(
        data.distance
      );

    if (
      !Number.isFinite(
        distance
      ) ||
      distance <= 0
    ) {
      throw new Error(
        "A distância deve ser informada e ser maior que zero."
      );
    }

    const nodeAId =
      Math.min(
        nodeA.id,
        nodeB.id
      );

    const nodeBId =
      Math.max(
        nodeA.id,
        nodeB.id
      );

    return edgeRepository.create(
      nodeAId,
      nodeBId,
      distance
    );
  }

  async function remove(
    id: number
  ) {
    const edge =
      await edgeRepository.findById(
        id
      );

    if (!edge) {
      return null;
    }

    await edgeRepository.remove(
      id
    );

    return edge;
  }

  return {
    list,
    listOperationalLinks,
    create,
    remove
  };
}

export type TopologyService =
  ReturnType<
    typeof createTopologyService
  >;