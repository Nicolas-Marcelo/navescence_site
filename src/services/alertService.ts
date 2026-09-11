import type { AlertRepository, AlertFilters } from "../repositories/alertRepository.js";
import type { NodeRepository } from "../repositories/nodeRepository.js";
import type { VerificationResult } from "./verificationService.js";

interface CurrentDashboardAlert {
  node: string;
  type: string;
  title: string;
  message: string;
}

interface VerificationAlertData {
  nodeCode: string;
  result: VerificationResult;
  verificationRunId?: number | null;
}

const dashboardAlertTypes = [
  "NODE_OFFLINE",
  "MISSING_NEIGHBOR"
];

export function createAlertService(
  repository: AlertRepository,
  nodeRepository: NodeRepository
) {
  let syncQueue = Promise.resolve();

  function getSeverity(type: string) {
    if (type === "NODE_OFFLINE") return "CRITICAL";
    if (type === "VERIFICATION_ERROR") return "CRITICAL";
    if (type === "MISSING_NEIGHBOR") return "WARNING";
    if (type === "VERIFICATION_TIMEOUT") return "WARNING";

    return "INFO";
  }

  async function getNodeId(nodeCode: string) {
    const node = await nodeRepository.findByCode(nodeCode);
    return node?.id ?? null;
  }

  async function openOrUpdate(
    nodeCode: string,
    type: string,
    title: string,
    message: string,
    verificationRunId?: number | null
  ) {
    const existing = await repository.findActiveByNodeAndType(nodeCode, type);
    const nodeId = await getNodeId(nodeCode);
    const now = new Date();

    if (existing) {
      return repository.updateActive(existing.id, {
        nodeId,
        verificationRunId: verificationRunId ?? existing.verificationRunId,
        severity: getSeverity(type),
        title,
        message,
        lastSeenAt: now
      });
    }

    return repository.create({
      nodeId,
      nodeCode,
      verificationRunId: verificationRunId ?? null,
      type,
      severity: getSeverity(type),
      status: "ACTIVE",
      title,
      message,
      openedAt: now,
      lastSeenAt: now
    });
  }

  async function resolveByNodeAndType(nodeCode: string, type: string) {
    const existing = await repository.findActiveByNodeAndType(nodeCode, type);
    if (!existing) return null;

    return repository.resolve(existing.id);
  }

  async function syncDashboardAlertsInternal(currentAlerts: CurrentDashboardAlert[]) {
    const current = currentAlerts.filter(alert => dashboardAlertTypes.includes(alert.type));
    const active = await repository.findActiveByTypes(dashboardAlertTypes);

    const currentKeys = new Set(
      current.map(alert => `${alert.node}:${alert.type}`)
    );

    for (const alert of current) {
      await openOrUpdate(
        alert.node,
        alert.type,
        alert.title,
        alert.message
      );
    }

    for (const alert of active) {
      const key = `${alert.nodeCode}:${alert.type}`;

      if (!currentKeys.has(key)) {
        await repository.resolve(alert.id);
      }
    }
  }

  function syncDashboardAlerts(currentAlerts: CurrentDashboardAlert[]) {
    syncQueue = syncQueue
      .then(() => syncDashboardAlertsInternal(currentAlerts))
      .catch(error => {
        console.error("[ALERTAS] Erro ao sincronizar alertas:", error);
      });

    return syncQueue;
  }

  async function syncVerificationResult(data: VerificationAlertData) {
    if (data.result === "TIMEOUT") {
      await openOrUpdate(
        data.nodeCode,
        "VERIFICATION_TIMEOUT",
        `${data.nodeCode} excedeu o tempo de verificação`,
        "O sensor não concluiu a verificação dentro do tempo limite.",
        data.verificationRunId
      );

      return;
    }

    if (data.result === "ERROR") {
      await openOrUpdate(
        data.nodeCode,
        "VERIFICATION_ERROR",
        `Falha na verificação de ${data.nodeCode}`,
        "O sistema encontrou um erro durante a execução da verificação.",
        data.verificationRunId
      );

      return;
    }

    await resolveByNodeAndType(data.nodeCode, "VERIFICATION_TIMEOUT");
    await resolveByNodeAndType(data.nodeCode, "VERIFICATION_ERROR");
  }

  function list(filters: AlertFilters = {}) {
    const limit = Math.min(
      Math.max(filters.limit ?? 200, 1),
      500
    );

    return repository.findAll({
      ...filters,
      limit
    });
  }

  function get(id: number) {
    return repository.findById(id);
  }

  return {
    syncDashboardAlerts,
    syncVerificationResult,
    list,
    get
  };
}

export type AlertService = ReturnType<typeof createAlertService>;