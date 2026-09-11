import type { NodeRepository } from "../repositories/nodeRepository.js";
import type { PoiData, PoiRepository } from "../repositories/poiRepository.js";

export interface PoiInput {
  code?: unknown;
  name?: unknown;
  type?: unknown;
  description?: unknown;
  nodeId?: unknown;
  active?: unknown;
}

export function createPoiService(
  repository: PoiRepository,
  nodeRepository: NodeRepository
) {
  function normalizeString(value: unknown) {
    return typeof value === "string"
      ? value.trim()
      : "";
  }

  function normalizeOptionalString(value: unknown) {
    const normalized = normalizeString(value);

    return normalized || null;
  }

  async function validateNode(nodeId: number) {
    if (!Number.isInteger(nodeId) || nodeId <= 0) {
      throw new Error("Sensor de referência inválido.");
    }

    const node = await nodeRepository.findById(nodeId);

    if (!node) {
      throw new Error("Sensor de referência não encontrado.");
    }

    return node;
  }

  function list() {
    return repository.findAll();
  }

  function listOperational() {
    return repository.findOperational();
  }

  function get(id: number) {
    return repository.findById(id);
  }

  function getByCode(code: string) {
    return repository.findByCode(
      code.trim().toUpperCase()
    );
  }

  async function create(input: PoiInput) {
    const code = normalizeString(input.code).toUpperCase();
    const name = normalizeString(input.name);
    const type = normalizeString(input.type).toUpperCase();
    const description = normalizeOptionalString(input.description);
    const nodeId = Number(input.nodeId);

    if (!code) {
      throw new Error("Informe o código do ponto de interesse.");
    }

    if (!name) {
      throw new Error("Informe o nome do ponto de interesse.");
    }

    if (!type) {
      throw new Error("Informe o tipo do ponto de interesse.");
    }

    await validateNode(nodeId);

    const data: PoiData = {
      code,
      name,
      type,
      description,
      nodeId,
      active: input.active === undefined
        ? true
        : Boolean(input.active)
    };

    return repository.create(data);
  }

  async function update(id: number, input: PoiInput) {
    const existing = await repository.findById(id);

    if (!existing) {
      return null;
    }

    const data: Partial<PoiData> = {};

    if (input.code !== undefined) {
      const code = normalizeString(input.code).toUpperCase();

      if (!code) {
        throw new Error("Informe o código do ponto de interesse.");
      }

      data.code = code;
    }

    if (input.name !== undefined) {
      const name = normalizeString(input.name);

      if (!name) {
        throw new Error("Informe o nome do ponto de interesse.");
      }

      data.name = name;
    }

    if (input.type !== undefined) {
      const type = normalizeString(input.type).toUpperCase();

      if (!type) {
        throw new Error("Informe o tipo do ponto de interesse.");
      }

      data.type = type;
    }

    if (input.description !== undefined) {
      data.description = normalizeOptionalString(input.description);
    }

    if (input.nodeId !== undefined) {
      const nodeId = Number(input.nodeId);

      await validateNode(nodeId);

      data.nodeId = nodeId;
    }

    if (input.active !== undefined) {
      data.active = Boolean(input.active);
    }

    return repository.update(id, data);
  }

  async function remove(id: number) {
    const existing = await repository.findById(id);

    if (!existing) {
      return null;
    }

    return repository.remove(id);
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

export type PoiService = ReturnType<typeof createPoiService>;