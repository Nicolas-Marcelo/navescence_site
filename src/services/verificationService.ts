import type { ScanReading } from "../models/scan.js";

import type { NodeRepository } from "../repositories/nodeRepository.js";

import type {
  VerificationRepository,
  VerificationReadingData
} from "../repositories/verificationRepository.js";

export type VerificationMode =
  | "AUTOMATIC"
  | "MANUAL";

export type VerificationResult =
  | "FINISHED"
  | "OFFLINE"
  | "TIMEOUT"
  | "ERROR";

export interface SaveVerificationData {
  nodeCode: string;
  mode: VerificationMode;
  result: VerificationResult;
  startedAt: Date;
  finishedAt: Date;
  scans: ScanReading[];
}

export function createVerificationService(
  repository: VerificationRepository,
  nodeRepository: NodeRepository
) {
  async function save(data: SaveVerificationData) {
    const node =
      await nodeRepository.findByCode(
        data.nodeCode
      );

    const readings: VerificationReadingData[] =
      data.scans.map(scan => ({
        neighborCode:
          scan.name ?? null,

        mac:
          scan.mac ?? null,

        readings:
          scan.readings ?? null,

        validReadings:
          scan.validReadings ?? null,

        discardedReadings:
          scan.discardedReadings ?? null,

        averageRssi:
          scan.averageRssi ?? null,

        m15:
          scan.m15 ?? null,

        minRssi:
          scan.minRssi ?? null,

        maxRssi:
          scan.maxRssi ?? null,

        advertising:
          scan.advertising ?? null
      }));

    return repository.create({
      nodeId: node?.id ?? null,
      nodeCode: data.nodeCode,
      mode: data.mode,
      result: data.result,
      startedAt: data.startedAt,
      finishedAt: data.finishedAt,
      durationMs:
        data.finishedAt.getTime() -
        data.startedAt.getTime(),
      readings
    });
  }

  function listRecent(limit = 50) {
    const normalizedLimit =
      Math.min(
        Math.max(limit, 1),
        200
      );

    return repository.findRecent(
      normalizedLimit
    );
  }

  function get(id: number) {
    return repository.findById(id);
  }

  return {
    save,
    listRecent,
    get
  };
}

export type VerificationService = ReturnType<
  typeof createVerificationService
>;