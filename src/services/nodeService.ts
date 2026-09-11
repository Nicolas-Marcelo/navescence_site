import type { NodeRepository, NodeData } from "../repositories/nodeRepository.js";

export function createNodeService(repository: NodeRepository) {
  function list() {
    return repository.findAll();
  }

  function listOperational() {
    return repository.findOperational();
  }

  function get(id: number) {
    return repository.findById(id);
  }

  function create(data: NodeData) {
    const code = data.code?.trim().toUpperCase();
    if (!code) throw new Error("O código do sensor é obrigatório.");

    return repository.create({
      ...data,
      code,
      mac: data.mac?.trim().toUpperCase() || null,
      name: data.name?.trim() || null,
      location: data.location?.trim() || null
    });
  }

  async function update(id: number, data: Partial<NodeData>) {
    const node = await repository.findById(id);
    if (!node) return null;

    return repository.update(id, {
      ...data,
      code: data.code?.trim().toUpperCase(),
      mac: data.mac === undefined ? undefined : data.mac?.trim().toUpperCase() || null,
      name: data.name === undefined ? undefined : data.name?.trim() || null,
      location: data.location === undefined ? undefined : data.location?.trim() || null
    });
  }

  async function setStatus(id: number, active?: boolean, maintenance?: boolean) {
    const node = await repository.findById(id);
    if (!node) return null;

    return repository.update(id, { active, maintenance });
  }

  return { list, listOperational, get, create, update, setStatus };
}

export type NodeService = ReturnType<typeof createNodeService>;