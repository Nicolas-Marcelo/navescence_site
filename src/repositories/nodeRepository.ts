import { prisma } from "../database/prisma.js";

export interface NodeData {
  code: string;
  mac?: string | null;
  name?: string | null;
  location?: string | null;
  x?: number | null;
  y?: number | null;
  active?: boolean;
  maintenance?: boolean;
  environmentId?: number | null;
}

export function createNodeRepository() {
  function findAll() {
    return prisma.node.findMany({
      include: { environment: true },
      orderBy: { code: "asc" }
    });
  }

  function findOperational() {
    return prisma.node.findMany({
      where: { active: true, maintenance: false },
      orderBy: { code: "asc" }
    });
  }

  function findById(id: number) {
    return prisma.node.findUnique({
      where: { id },
      include: { environment: true }
    });
  }

  function findByCode(code: string) {
    return prisma.node.findUnique({ where: { code } });
  }

  function create(data: NodeData) {
    return prisma.node.create({
      data,
      include: { environment: true }
    });
  }

  function update(id: number, data: Partial<NodeData>) {
    return prisma.node.update({
      where: { id },
      data,
      include: { environment: true }
    });
  }

  return { findAll, findOperational, findById, findByCode, create, update };
}

export type NodeRepository = ReturnType<typeof createNodeRepository>;