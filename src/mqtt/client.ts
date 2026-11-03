import mqtt from "mqtt";

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
  NodeStore,
} from "../states/nodeStore.js";

import {
  parseScan,
} from "./parser.js";

import {
  subscriptions,
  topics,
  getCommandTopic,
} from "./topics.js";

interface MqttOptions {
  store: NodeStore;

  onUpdate:
    () => void;

  onFinished: (
    nodeId: NodeId,
  ) => void;
}

export function createMqttService(
  options: MqttOptions,
) {
  const {
    store,
    onUpdate,
    onFinished,
  } = options;

  const brokerUrl =
    `mqtt://${config.mqtt.host}:${config.mqtt.port}`;

  const client =
    mqtt.connect(
      brokerUrl,
      {
        clientId:
          `NAVESCENCE_CENTRAL_${Date.now()}`,

        username:
          config.mqtt.user,

        password:
          config.mqtt.password,

        clean:
          true,

        reconnectPeriod:
          3000,

        connectTimeout:
          10_000,
      },
    );

  const pendingPresence =
    new Map<
      NodeId,
      Presence
    >();

  let connectedOnce =
    false;

  let markReady:
    (() => void) |
    null =
    null;

  const ready =
    new Promise<void>(
      resolve => {
        markReady =
          resolve;
      },
    );

  client.on(
    "connect",
    () => {
      client.subscribe(
        subscriptions,

        error => {
          if (error) {
            console.error(
              "[MQTT] Erro ao assinar tópicos:",
              error.message,
            );

            return;
          }

          console.log(
            `[MQTT] Conectado em ${brokerUrl} | ${subscriptions.length} tópicos`,
          );

          if (
            !connectedOnce
          ) {
            connectedOnce =
              true;

            markReady?.();
          }
        },
      );
    },
  );

  client.on(
    "message",
    (
      topic,
      buffer,
    ) => {
      const message =
        buffer
          .toString()
          .trim();

      const nodeId =
        topic.split(
          "/",
        )[2];

      if (!nodeId) {
        return;
      }

      if (
        topic.startsWith(
          topics.presence,
        )
      ) {
        handlePresence(
          nodeId,
          message,
        );

        return;
      }

      if (
        !store.has(
          nodeId,
        )
      ) {
        return;
      }

      if (
        topic.startsWith(
          topics.status,
        )
      ) {
        handleStatus(
          nodeId,
          message,
        );

        return;
      }

      if (
        topic.startsWith(
          topics.scan,
        )
      ) {
        handleScan(
          nodeId,
          message,
        );
      }
    },
  );

  function parsePresence(
    message: string,
  ): Presence | null {
    const value =
      message
        .trim()
        .toUpperCase();

    if (
      value ===
      Presence.Online
    ) {
      return Presence.Online;
    }

    if (
      value ===
      Presence.Offline
    ) {
      return Presence.Offline;
    }

    return null;
  }

  function handlePresence(
    nodeId: NodeId,
    message: string,
  ) {
    const presence =
      parsePresence(
        message,
      );

    if (!presence) {
      console.warn(
        `[MQTT] Presença inválida de ${nodeId}: ${message}`,
      );

      return;
    }

    if (
      !store.has(
        nodeId,
      )
    ) {
      pendingPresence.set(
        nodeId,
        presence,
      );

      return;
    }

    applyPresence(
      nodeId,
      presence,
    );
  }

  function applyPresence(
    nodeId: NodeId,
    presence: Presence,
  ) {
    if (
      !store.has(
        nodeId,
      )
    ) {
      return;
    }

    store.setPresence(
      nodeId,
      presence,
    );

    pendingPresence.delete(
      nodeId,
    );

    onUpdate();
  }

  function applyPendingPresence() {
    let updated =
      false;

    for (
      const [
        nodeId,
        presence,
      ] of pendingPresence
    ) {
      if (
        !store.has(
          nodeId,
        )
      ) {
        continue;
      }

      store.setPresence(
        nodeId,
        presence,
      );

      pendingPresence.delete(
        nodeId,
      );

      updated =
        true;
    }

    if (updated) {
      onUpdate();
    }
  }

  function handleStatus(
    nodeId: NodeId,
    message: string,
  ) {
    const status =
      message
        .trim()
        .toUpperCase();

    if (
      status ===
      NodeStatus.Checking
    ) {
      store.setStatus(
        nodeId,
        NodeStatus.Checking,
      );
    } else if (
      status ===
      NodeStatus.Finished
    ) {
      store.setStatus(
        nodeId,
        NodeStatus.Finished,
      );

      store.finishVerification(
        nodeId,
      );

      onFinished(
        nodeId,
      );
    } else if (
      status ===
      NodeStatus.Busy
    ) {
      store.setStatus(
        nodeId,
        NodeStatus.Busy,
      );
    } else {
      console.warn(
        `[MQTT] Status inválido de ${nodeId}: ${message}`,
      );

      return;
    }

    onUpdate();
  }

  function handleScan(
    nodeId: NodeId,
    message: string,
  ) {
    try {
      const scan =
        parseScan(
          message,
        );

      store.addScan(
        nodeId,
        scan,
      );

      onUpdate();
    } catch (error) {
      console.error(
        `[MQTT] Scan inválido recebido de ${nodeId}:`,
        error,
      );
    }
  }

  function sendCheck(
    nodeId: NodeId,
  ) {
    client.publish(
      getCommandTopic(
        nodeId,
      ),

      "VERIFICAR",

      {
        qos: 1,
      },
    );
  }

  const pendingTimer =
    setInterval(
      applyPendingPresence,
      1000,
    );

  pendingTimer.unref();

  client.on(
    "error",
    error => {
      console.error(
        "[MQTT] Erro:",
        error.message,
      );
    },
  );

  client.on(
    "offline",
    () => {
      console.warn(
        "[MQTT] Broker indisponível.",
      );
    },
  );

  client.on(
    "reconnect",
    () => {
      console.log(
        "[MQTT] Reconectando...",
      );
    },
  );

  return {
    ready,

    sendCheck,

    isConnected:
      () =>
        client.connected,
  };
}