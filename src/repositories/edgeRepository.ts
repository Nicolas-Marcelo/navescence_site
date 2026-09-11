import { prisma } from "../database/prisma.js";

export function createEdgeRepository() {
  function findAll() {
    return prisma.edge.findMany({
      include: { nodeA: true, nodeB: true },
      orderBy: { id: "asc" }
    });
  }

  function findOperational() {
    return prisma.edge.findMany({
      where: {
        nodeA: { is: { active: true, maintenance: false } },
        nodeB: { is: { active: true, maintenance: false } }
      },
      include: { nodeA: true, nodeB: true },
      orderBy: { id: "asc" }
    });
  }

  function findById(id: number) {
    return prisma.edge.findUnique({
      where: { id },
      include: { nodeA: true, nodeB: true }
    });
  }

  function findByNodeId(nodeId: number) {
    return prisma.edge.findMany({
      where: { OR: [{ nodeAId: nodeId }, { nodeBId: nodeId }] },
      include: { nodeA: true, nodeB: true },
      orderBy: { id: "asc" }
    });
  }

  function findBetween(nodeAId: number, nodeBId: number) {
    return prisma.edge.findFirst({
      where: {
        OR: [
          { nodeAId, nodeBId },
          { nodeAId: nodeBId, nodeBId: nodeAId }
        ]
      }
    });
  }

  function create(nodeAId: number, nodeBId: number, distance: number | null) {
    return prisma.edge.create({
      data: { nodeAId, nodeBId, distance },
      include: { nodeA: true, nodeB: true }
    });
  }

  function remove(id: number) {
    return prisma.edge.delete({ where: { id } });
  }

  return { findAll, findOperational, findById, findByNodeId, findBetween, create, remove };
}

export type EdgeRepository = ReturnType<typeof createEdgeRepository>;