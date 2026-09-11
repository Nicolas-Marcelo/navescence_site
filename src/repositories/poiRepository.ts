import { prisma } from "../database/prisma.js";

export interface PoiData {
  code: string;
  name: string;
  type: string;
  description?: string | null;
  nodeId: number;
  active?: boolean;
}

export function createPoiRepository() {
  function findAll() {
    return prisma.pointOfInterest.findMany({
      include: {
        node: {
          include: {
            environment: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    });
  }

  function findOperational() {
    return prisma.pointOfInterest.findMany({
      where: {
        active: true,
        node: {
          is: {
            active: true,
            maintenance: false
          }
        }
      },
      include: {
        node: {
          include: {
            environment: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    });
  }

  function findById(id: number) {
    return prisma.pointOfInterest.findUnique({
      where: { id },
      include: {
        node: {
          include: {
            environment: true
          }
        }
      }
    });
  }

  function findByCode(code: string) {
    return prisma.pointOfInterest.findUnique({
      where: { code },
      include: {
        node: {
          include: {
            environment: true
          }
        }
      }
    });
  }

  function create(data: PoiData) {
    return prisma.pointOfInterest.create({
      data,
      include: {
        node: {
          include: {
            environment: true
          }
        }
      }
    });
  }

  function update(id: number, data: Partial<PoiData>) {
    return prisma.pointOfInterest.update({
      where: { id },
      data,
      include: {
        node: {
          include: {
            environment: true
          }
        }
      }
    });
  }

  function remove(id: number) {
    return prisma.pointOfInterest.delete({
      where: { id }
    });
  }

  return {
    findAll,
    findOperational,
    findById,
    findByCode,
    create,
    update,
    remove
  };
}

export type PoiRepository = ReturnType<typeof createPoiRepository>;