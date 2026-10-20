import {
  PoiApproachSide
} from "../generated/prisma/client.js";

import type {
  NodeRepository
} from "../repositories/nodeRepository.js";

import type {
  PoiApproachData,
  PoiData,
  PoiRepository
} from "../repositories/poiRepository.js";

export interface PoiApproachInput {
  fromNodeId?: unknown;
  side?: unknown;
  distanceMeters?: unknown;
  instruction?: unknown;
}

export interface PoiInput {
  code?: unknown;
  name?: unknown;
  type?: unknown;
  description?: unknown;
  nodeId?: unknown;
  active?: unknown;
  approaches?: unknown;
}

export function createPoiService(
  repository: PoiRepository,
  nodeRepository: NodeRepository,
  onNavigationUpdate: () => void = () => {}
) {
  function normalizeString(
    value: unknown
  ) {
    return typeof value === "string"
      ? value.trim()
      : "";
  }

  function normalizeOptionalString(
    value: unknown
  ) {
    const normalized =
      normalizeString(
        value
      );

    return normalized ||
      null;
  }

  async function validateNode(
    nodeId: number
  ) {
    if (
      !Number.isInteger(
        nodeId
      ) ||
      nodeId <= 0
    ) {
      throw new Error(
        "Sensor de referência inválido."
      );
    }

    const node =
      await nodeRepository.findById(
        nodeId
      );

    if (!node) {
      throw new Error(
        "Sensor de referência não encontrado."
      );
    }

    return node;
  }

  function normalizeSide(
    value: unknown
  ): PoiApproachSide {
    const side =
      normalizeString(
        value
      ).toUpperCase();

    if (
      side ===
      PoiApproachSide.LEFT
    ) {
      return PoiApproachSide.LEFT;
    }

    if (
      side ===
      PoiApproachSide.RIGHT
    ) {
      return PoiApproachSide.RIGHT;
    }

    if (
      side ===
      PoiApproachSide.FRONT
    ) {
      return PoiApproachSide.FRONT;
    }

    throw new Error(
      "O lado de aproximação deve ser LEFT, RIGHT ou FRONT."
    );
  }

  function normalizeDistance(
    value: unknown
  ) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return null;
    }

    const distance =
      Number(
        value
      );

    if (
      !Number.isFinite(
        distance
      ) ||
      distance <= 0
    ) {
      throw new Error(
        "A distância até o destino deve ser maior que zero."
      );
    }

    return distance;
  }

  async function normalizeApproaches(
    value: unknown,
    destinationNodeId: number
  ): Promise<PoiApproachData[]> {
    if (
      value === undefined
    ) {
      return [];
    }

    if (
      !Array.isArray(
        value
      )
    ) {
      throw new Error(
        "As orientações de acesso devem ser uma lista."
      );
    }

    const result:
      PoiApproachData[] = [];

    const usedNodes =
      new Set<number>();

    for (
      const item
      of value
    ) {
      if (
        !item ||
        typeof item !==
          "object"
      ) {
        throw new Error(
          "Orientação de acesso inválida."
        );
      }

      const input =
        item as PoiApproachInput;

      const fromNodeId =
        Number(
          input.fromNodeId
        );

      if (
        !Number.isInteger(
          fromNodeId
        ) ||
        fromNodeId <= 0
      ) {
        throw new Error(
          "Sensor de origem da aproximação inválido."
        );
      }

      if (
        fromNodeId ===
        destinationNodeId
      ) {
        throw new Error(
          "O sensor de origem da aproximação deve ser diferente do sensor do destino."
        );
      }

      if (
        usedNodes.has(
          fromNodeId
        )
      ) {
        throw new Error(
          "Existe mais de uma orientação cadastrada para o mesmo sensor de origem."
        );
      }

      await validateNode(
        fromNodeId
      );

      usedNodes.add(
        fromNodeId
      );

      result.push({
        fromNodeId,

        side:
          normalizeSide(
            input.side
          ),

        distanceMeters:
          normalizeDistance(
            input.distanceMeters
          ),

        instruction:
          normalizeOptionalString(
            input.instruction
          )
      });
    }

    return result;
  }

  function list() {
    return repository.findAll();
  }

  function listOperational() {
    return repository.findOperational();
  }

  function get(
    id: number
  ) {
    return repository.findById(
      id
    );
  }

  function getByCode(
    code: string
  ) {
    return repository.findByCode(
      code
        .trim()
        .toUpperCase()
    );
  }

  async function create(
    input: PoiInput
  ) {
    const code =
      normalizeString(
        input.code
      ).toUpperCase();

    const name =
      normalizeString(
        input.name
      );

    const type =
      normalizeString(
        input.type
      ).toUpperCase();

    const description =
      normalizeOptionalString(
        input.description
      );

    const nodeId =
      Number(
        input.nodeId
      );

    if (!code) {
      throw new Error(
        "Informe o código do ponto de interesse."
      );
    }

    if (!name) {
      throw new Error(
        "Informe o nome do ponto de interesse."
      );
    }

    if (!type) {
      throw new Error(
        "Informe o tipo do ponto de interesse."
      );
    }

    await validateNode(
      nodeId
    );

    const approaches =
      await normalizeApproaches(
        input.approaches,
        nodeId
      );

    const data:
      PoiData = {
      code,
      name,
      type,
      description,
      nodeId,

      active:
        input.active ===
        undefined
          ? true
          : Boolean(
              input.active
            ),

      approaches
    };

    const poi =
      await repository.create(
        data
      );

    onNavigationUpdate();

    return poi;
  }

  async function update(
    id: number,
    input: PoiInput
  ) {
    const existing =
      await repository.findById(
        id
      );

    if (!existing) {
      return null;
    }

    const data:
      Partial<PoiData> = {};

    if (
      input.code !==
      undefined
    ) {
      const code =
        normalizeString(
          input.code
        ).toUpperCase();

      if (!code) {
        throw new Error(
          "Informe o código do ponto de interesse."
        );
      }

      data.code =
        code;
    }

    if (
      input.name !==
      undefined
    ) {
      const name =
        normalizeString(
          input.name
        );

      if (!name) {
        throw new Error(
          "Informe o nome do ponto de interesse."
        );
      }

      data.name =
        name;
    }

    if (
      input.type !==
      undefined
    ) {
      const type =
        normalizeString(
          input.type
        ).toUpperCase();

      if (!type) {
        throw new Error(
          "Informe o tipo do ponto de interesse."
        );
      }

      data.type =
        type;
    }

    if (
      input.description !==
      undefined
    ) {
      data.description =
        normalizeOptionalString(
          input.description
        );
    }

    let destinationNodeId =
      existing.nodeId;

    if (
      input.nodeId !==
      undefined
    ) {
      destinationNodeId =
        Number(
          input.nodeId
        );

      await validateNode(
        destinationNodeId
      );

      data.nodeId =
        destinationNodeId;
    }

    if (
      input.active !==
      undefined
    ) {
      data.active =
        Boolean(
          input.active
        );
    }

    if (
      input.approaches !==
      undefined
    ) {
      data.approaches =
        await normalizeApproaches(
          input.approaches,
          destinationNodeId
        );
    }

    const poi =
      await repository.update(
        id,
        data
      );

    onNavigationUpdate();

    return poi;
  }

  async function remove(
    id: number
  ) {
    const existing =
      await repository.findById(
        id
      );

    if (!existing) {
      return null;
    }

    const poi =
      await repository.remove(
        id
      );

    onNavigationUpdate();

    return poi;
  }

  return {
    list,
    listOperational,
    get,
    getByCode,
    create,
    update,
    remove
  };
}

export type PoiService =
  ReturnType<
    typeof createPoiService
  >;