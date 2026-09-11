import { prisma } from "../database/prisma.js";

export interface VerificationReadingData {
  neighborCode?: string | null;
  mac?: string | null;
  readings?: number | null;
  validReadings?: number | null;
  discardedReadings?: number | null;
  averageRssi?: number | null;
  m15?: number | null;
  minRssi?: number | null;
  maxRssi?: number | null;
  advertising?: string | null;
}

export interface VerificationRunData {
  nodeId?: number | null;
  nodeCode: string;
  mode: string;
  result: string;
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;
  readings: VerificationReadingData[];
}

export function createVerificationRepository() {
  function create(data: VerificationRunData) {
    return prisma.verificationRun.create({
      data: {
        nodeId: data.nodeId ?? null,
        nodeCode: data.nodeCode,
        mode: data.mode,
        result: data.result,
        startedAt: data.startedAt,
        finishedAt: data.finishedAt,
        durationMs: data.durationMs,
        readings: {
          create: data.readings
        }
      },
      include: {
        readings: true
      }
    });
  }

  function findRecent(limit = 50) {
    return prisma.verificationRun.findMany({
      take: limit,
      orderBy: {
        startedAt: "desc"
      },
      include: {
        node: true,
        readings: true
      }
    });
  }

  function findById(id: number) {
    return prisma.verificationRun.findUnique({
      where: { id },
      include: {
        node: true,
        readings: true
      }
    });
  }

  return {
    create,
    findRecent,
    findById
  };
}

export type VerificationRepository = ReturnType<
  typeof createVerificationRepository
>;