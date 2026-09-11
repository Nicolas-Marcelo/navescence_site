import { prisma } from "../database/prisma.js";

export interface EnvironmentData {
  code: string;
  name: string;
  type?: string | null;
  floor?: string;
  description?: string | null;
}

export function createEnvironmentRepository() {
  function findAll() {
    return prisma.environment.findMany({
      include: { _count: { select: { nodes: true } } },
      orderBy: { name: "asc" }
    });
  }

  function findById(id: number) {
    return prisma.environment.findUnique({
      where: { id },
      include: {
        nodes: { orderBy: { code: "asc" } },
        _count: { select: { nodes: true } }
      }
    });
  }

  function create(data: EnvironmentData) {
    return prisma.environment.create({ data });
  }

  function update(id: number, data: Partial<EnvironmentData>) {
    return prisma.environment.update({ where: { id }, data });
  }

  function remove(id: number) {
    return prisma.environment.delete({ where: { id } });
  }

  return { findAll, findById, create, update, remove };
}

export type EnvironmentRepository = ReturnType<typeof createEnvironmentRepository>;