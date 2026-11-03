import {
  config,
} from "../config/env.js";

import type {
  NodeId,
} from "../config/nodes.js";

import {
  Presence,
  NodeStatus,
} from "../models/node.js";

import type {
  ScanReading,
} from "../models/scan.js";

import type {
  NodeStore,
} from "../states/nodeStore.js";

import {
  sleep,
} from "../utils/time.js";

import type {
  VerificationMode,
  VerificationResult,
} from "./verificationService.js";

interface SaveVerificationData {
  nodeCode: string;
  mode: VerificationMode;
  result: VerificationResult;
  startedAt: Date;
  finishedAt: Date;
  scans: ScanReading[];
}

interface CoordinatorOptions {
  store: NodeStore;

  sendCheck: (
    nodeId: NodeId,
  ) => void;

  sendDashboard:
    () => void;

  saveVerification: (
    data: SaveVerificationData,
  ) => Promise<unknown>;
}

type CoordinatorMode =
  | "IDLE"
  | "AUTOMATIC"
  | "MANUAL";

interface NodeCheckResult {
  nodeId: NodeId;
  result: VerificationResult;
}

export interface CoordinatorStatus {
  mode: CoordinatorMode;
  busy: boolean;
  currentNode: NodeId | null;
  nextAutomaticAt: string | null;
}

export interface ManualVerificationResult {
  target: string;
  startedAt: string;
  finishedAt: string;
  results: NodeCheckResult[];
}

export function createCoordinator(
  options: CoordinatorOptions,
) {
  const {
    store,
    sendCheck,
    sendDashboard,
    saveVerification,
  } = options;

  const pendingChecks =
    new Map<
      NodeId,
      () => void
    >();

  let mode:
    CoordinatorMode =
    "IDLE";

  let currentNode:
    NodeId | null =
    null;

  let nextAutomaticAt:
    number | null =
    Date.now();

  function createCoordinatorError(
    code: string,
    message: string,
  ) {
    const error =
      new Error(
        message,
      ) as Error & {
        code: string;
      };

    error.code =
      code;

    return error;
  }

  function getStatus():
    CoordinatorStatus {
    return {
      mode,

      busy:
        mode !==
        "IDLE",

      currentNode,

      nextAutomaticAt:
        nextAutomaticAt
          ? new Date(
              nextAutomaticAt,
            ).toISOString()
          : null,
    };
  }

  function finishNode(
    nodeId: NodeId,
  ) {
    const finish =
      pendingChecks.get(
        nodeId,
      );

    if (!finish) {
      return;
    }

    finish();

    pendingChecks.delete(
      nodeId,
    );
  }

  function waitForNode(
    nodeId: NodeId,
  ): Promise<boolean> {
    return new Promise(
      resolve => {
        const timeout =
          setTimeout(
            () => {
              pendingChecks.delete(
                nodeId,
              );

              resolve(
                false,
              );
            },

            config
              .coordinator
              .checkTimeout,
          );

        pendingChecks.set(
          nodeId,

          () => {
            clearTimeout(
              timeout,
            );

            resolve(
              true,
            );
          },
        );
      },
    );
  }

  function resetNodeStatus(
    nodeId: NodeId,
  ) {
    if (
      !store.has(
        nodeId,
      )
    ) {
      return;
    }

    if (
      store.get(
        nodeId,
      ).status ===
      NodeStatus.Checking
    ) {
      store.setStatus(
        nodeId,
        NodeStatus.Unknown,
      );
    }
  }

  function getVerificationMode():
    VerificationMode {
    return mode ===
      "MANUAL"
      ? "MANUAL"
      : "AUTOMATIC";
  }

  async function persistVerification(
    nodeId: NodeId,
    result: VerificationResult,
    startedAt: Date,
    finishedAt: Date,
  ) {
    const scans =
      store.has(
        nodeId,
      )
        ? [
            ...store.get(
              nodeId,
            ).scans,
          ]
        : [];

    try {
      await saveVerification({
        nodeCode:
          nodeId,

        mode:
          getVerificationMode(),

        result,

        startedAt,

        finishedAt,

        scans,
      });
    } catch (error) {
      console.error(
        `[BANCO] Falha ao salvar verificação de ${nodeId}:`,
        error,
      );
    }
  }

  async function checkNode(
    nodeId: NodeId,
  ): Promise<NodeCheckResult> {
    const startedAt =
      new Date();

    let result:
      VerificationResult =
      "ERROR";

    currentNode =
      nodeId;

    try {
      if (
        !store.has(
          nodeId,
        )
      ) {
        result =
          "OFFLINE";

        return {
          nodeId,
          result,
        };
      }

      if (
        store.get(
          nodeId,
        ).presence !==
        Presence.Online
      ) {
        result =
          "OFFLINE";

        return {
          nodeId,
          result,
        };
      }

      store.clearScans(
        nodeId,
      );

      sendDashboard();

      const wait =
        waitForNode(
          nodeId,
        );

      sendCheck(
        nodeId,
      );

      const finished =
        await wait;

      if (!finished) {
        resetNodeStatus(
          nodeId,
        );

        result =
          "TIMEOUT";

        return {
          nodeId,
          result,
        };
      }

      await sleep(
        500,
      );

      result =
        "FINISHED";

      return {
        nodeId,
        result,
      };
    } catch (error) {
      console.error(
        `[COORDENADOR] Erro ao verificar ${nodeId}:`,
        error,
      );

      resetNodeStatus(
        nodeId,
      );

      result =
        "ERROR";

      return {
        nodeId,
        result,
      };
    } finally {
      const finishedAt =
        new Date();

      await persistVerification(
        nodeId,
        result,
        startedAt,
        finishedAt,
      );

      currentNode =
        null;

      sendDashboard();
    }
  }

  async function checkNodes(
    nodeIds: NodeId[],
  ) {
    const results:
      NodeCheckResult[] =
      [];

    for (
      let index = 0;
      index <
      nodeIds.length;
      index++
    ) {
      const nodeId =
        nodeIds[
          index
        ];

      if (!nodeId) {
        continue;
      }

      if (
        !store.has(
          nodeId,
        )
      ) {
        continue;
      }

      results.push(
        await checkNode(
          nodeId,
        ),
      );

      if (
        index <
        nodeIds.length -
          1
      ) {
        await sleep(
          config
            .coordinator
            .nodeDelay,
        );
      }
    }

    return results;
  }

  function logRound(
    round: number,
    duration: number,
    results:
      NodeCheckResult[],
  ) {
    const finished =
      results.filter(
        item =>
          item.result ===
          "FINISHED",
      ).length;

    const offline =
      results.filter(
        item =>
          item.result ===
          "OFFLINE",
      ).length;

    const timeout =
      results.filter(
        item =>
          item.result ===
          "TIMEOUT",
      ).length;

    const errors =
      results.filter(
        item =>
          item.result ===
          "ERROR",
      ).length;

    const parts = [
      `${results.length} sensores`,
      `${finished} concluídos`,
      `${offline} offline`,
    ];

    if (
      timeout > 0
    ) {
      parts.push(
        `${timeout} timeout`,
      );
    }

    if (
      errors > 0
    ) {
      parts.push(
        `${errors} erros`,
      );
    }

    parts.push(
      `${(
        duration /
        1000
      ).toFixed(1)}s`,
    );

    console.log(
      `[RODADA ${round}] ${parts.join(" | ")}`,
    );
  }

  function logManualResult(
    results:
      NodeCheckResult[],
  ) {
    const finished =
      results.filter(
        item =>
          item.result ===
          "FINISHED",
      ).length;

    const offline =
      results.filter(
        item =>
          item.result ===
          "OFFLINE",
      ).length;

    const timeout =
      results.filter(
        item =>
          item.result ===
          "TIMEOUT",
      ).length;

    const errors =
      results.filter(
        item =>
          item.result ===
          "ERROR",
      ).length;

    console.log(
      `[VERIFICAÇÃO] ${results.length} sensores | ${finished} concluídos | ${offline} offline | ${timeout} timeout | ${errors} erros`,
    );
  }

  async function runManual(
    target: string,
  ): Promise<
    ManualVerificationResult
  > {
    const normalizedTarget =
      target
        .trim()
        .toUpperCase() ||
      "ALL";

    if (
      mode !==
      "IDLE"
    ) {
      throw createCoordinatorError(
        "BUSY",

        mode ===
          "MANUAL"
          ? "Já existe uma verificação manual em andamento."
          : "O rodízio automático está em execução. Aguarde a rodada terminar.",
      );
    }

    let nodeIds:
      NodeId[];

    if (
      normalizedTarget ===
      "ALL"
    ) {
      nodeIds =
        store.getIds();

      if (
        nodeIds.length ===
        0
      ) {
        throw createCoordinatorError(
          "NO_NODES",
          "Nenhum sensor ativo está cadastrado.",
        );
      }
    } else {
      if (
        !store.has(
          normalizedTarget,
        )
      ) {
        throw createCoordinatorError(
          "NOT_FOUND",
          `O sensor ${normalizedTarget} não está disponível.`,
        );
      }

      nodeIds = [
        normalizedTarget,
      ];
    }

    mode =
      "MANUAL";

    currentNode =
      null;

    nextAutomaticAt =
      null;

    const startedAt =
      new Date()
        .toISOString();

    try {
      const results =
        await checkNodes(
          nodeIds,
        );

      logManualResult(
        results,
      );

      return {
        target:
          normalizedTarget,

        startedAt,

        finishedAt:
          new Date()
            .toISOString(),

        results,
      };
    } finally {
      mode =
        "IDLE";

      currentNode =
        null;

      nextAutomaticAt =
        Date.now() +
        config
          .coordinator
          .roundDelay;

      sendDashboard();
    }
  }

  async function start() {
    console.log(
      `[COORDENADOR] Iniciado | intervalo: ${config.coordinator.roundDelay / 1000}s`,
    );

    let round =
      1;

    nextAutomaticAt =
      Date.now();

    while (true) {
      if (
        mode !==
        "IDLE"
      ) {
        await sleep(
          250,
        );

        continue;
      }

      const remaining =
        (
          nextAutomaticAt ??
          Date.now()
        ) -
        Date.now();

      if (
        remaining > 0
      ) {
        await sleep(
          Math.min(
            remaining,
            500,
          ),
        );

        continue;
      }

      mode =
        "AUTOMATIC";

      currentNode =
        null;

      nextAutomaticAt =
        null;

      const nodeIds =
        store.getIds();

      try {
        if (
          nodeIds.length ===
          0
        ) {
          console.warn(
            "[COORDENADOR] Nenhum sensor ativo cadastrado.",
          );

          continue;
        }

        const startTime =
          Date.now();

        const results =
          await checkNodes(
            nodeIds,
          );

        logRound(
          round,
          Date.now() -
            startTime,
          results,
        );

        round++;
      } finally {
        mode =
          "IDLE";

        currentNode =
          null;

        nextAutomaticAt =
          Date.now() +
          config
            .coordinator
            .roundDelay;

        sendDashboard();
      }
    }
  }

  return {
    start,
    finishNode,
    runManual,
    getStatus,
  };
}

export type Coordinator =
  ReturnType<
    typeof createCoordinator
  >;