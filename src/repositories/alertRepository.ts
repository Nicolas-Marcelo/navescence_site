import { prisma } from "../database/prisma.js";

export interface AlertData {
  nodeId?: number | null;
  nodeCode: string;
  verificationRunId?: number | null;
  type: string;
  severity: string;
  status?: string;
  title: string;
  message: string;
  openedAt?: Date;
  lastSeenAt?: Date;
  resolvedAt?: Date | null;
}

export interface AlertFilters {
  status?: string;
  type?: string;
  nodeCode?: string;
  limit?: number;
}

export function createAlertRepository() {
  function findAll(filters: AlertFilters = {}) {
    return prisma.alert.findMany({
      where: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.nodeCode ? { nodeCode: filters.nodeCode } : {})
      },
      take: filters.limit ?? 200,
      orderBy: { openedAt: "desc" },
      include: {
        node: true,
        verificationRun: true
      }
    });
  }

  function findById(id: number) {
    return prisma.alert.findUnique({
      where: { id },
      include: {
        node: true,
        verificationRun: {
          include: {
            readings: true
          }
        }
      }
    });
  }

  function findActiveByTypes(types: string[]) {
    return prisma.alert.findMany({
      where: {
        status: "ACTIVE",
        type: { in: types }
      },
      orderBy: { openedAt: "desc" }
    });
  }

  function findActiveByNodeAndType(nodeCode: string, type: string) {
    return prisma.alert.findFirst({
      where: {
        nodeCode,
        type,
        status: "ACTIVE"
      },
      orderBy: { openedAt: "desc" }
    });
  }

  function create(data: AlertData) {
    const now = new Date();

    return prisma.alert.create({
      data: {
        nodeId: data.nodeId ?? null,
        nodeCode: data.nodeCode,
        verificationRunId: data.verificationRunId ?? null,
        type: data.type,
        severity: data.severity,
        status: data.status ?? "ACTIVE",
        title: data.title,
        message: data.message,
        openedAt: data.openedAt ?? now,
        lastSeenAt: data.lastSeenAt ?? now,
        resolvedAt: data.resolvedAt ?? null
      }
    });
  }

  function updateActive(
    id: number,
    data: {
      nodeId?: number | null;
      verificationRunId?: number | null;
      severity?: string;
      title?: string;
      message?: string;
      lastSeenAt?: Date;
    }
  ) {
    return prisma.alert.update({
      where: { id },
      data
    });
  }

  function resolve(id: number, resolvedAt = new Date()) {
    return prisma.alert.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolvedAt,
        lastSeenAt: resolvedAt
      }
    });
  }

  return {
    findAll,
    findById,
    findActiveByTypes,
    findActiveByNodeAndType,
    create,
    updateActive,
    resolve
  };
}

export type AlertRepository = ReturnType<typeof createAlertRepository>;