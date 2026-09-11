import mqtt from "mqtt";

import { config } from "../config/env.js";
import type { NodeId } from "../config/nodes.js";
import { Presence, NodeStatus } from "../models/node.js";
import type { NodeStore } from "../states/nodeStore.js";

import { parseScan } from "./parser.js";
import { subscriptions, topics, getCommandTopic } from "./topics.js";

interface MqttOptions {
  store: NodeStore;
  onUpdate: () => void;
  onFinished: (nodeId: NodeId) => void;
}

export function createMqttService(options: MqttOptions) {
  const { store, onUpdate, onFinished } = options;
  const brokerUrl = `mqtt://${config.mqtt.host}:${config.mqtt.port}`;

  const client = mqtt.connect(brokerUrl, {
    clientId: `NAVESCENCE_CENTRAL_${Date.now()}`,
    username: config.mqtt.user,
    password: config.mqtt.password,
    clean: true,
    reconnectPeriod: 3000,
    connectTimeout: 10_000
  });

  let connectedOnce = false;
  let markReady: (() => void) | null = null;

  const ready = new Promise<void>(resolve => {
    markReady = resolve;
  });

  client.on("connect", () => {
    console.log();
    console.log("NAVESCENCE - SISTEMA CENTRAL");
    console.log(`Broker: ${brokerUrl}`);
    console.log("MQTT conectado!");

    client.subscribe(subscriptions, error => {
      if (error) {
        console.error("Erro ao assinar tópicos:", error.message);
        return;
      }

      console.log("Monitorando:");
      for (const topic of subscriptions) console.log(`  ${topic}`);

      if (!connectedOnce) {
        connectedOnce = true;
        markReady?.();
      }
    });
  });

  client.on("message", (topic, buffer) => {
    const message = buffer.toString().trim();
    const nodeId = topic.split("/")[2];

    if (!nodeId || !store.has(nodeId)) return;

    if (topic.startsWith(topics.presence)) {
      handlePresence(nodeId, message);
      return;
    }

    if (topic.startsWith(topics.status)) {
      handleStatus(nodeId, message);
      return;
    }

    if (topic.startsWith(topics.scan)) handleScan(nodeId, message);
  });

  function handlePresence(nodeId: NodeId, message: string) {
    const presence = message.toUpperCase();

    if (presence === Presence.Online) store.setPresence(nodeId, Presence.Online);
    else if (presence === Presence.Offline) store.setPresence(nodeId, Presence.Offline);
    else {
      console.warn(`[MQTT] Presença inválida de ${nodeId}: ${message}`);
      return;
    }

    console.log(`[PRESENCA] ${nodeId} -> ${presence}`);
    onUpdate();
  }

  function handleStatus(nodeId: NodeId, message: string) {
    const status = message.toUpperCase();

    if (status === NodeStatus.Checking) store.setStatus(nodeId, NodeStatus.Checking);
    else if (status === NodeStatus.Finished) {
      store.setStatus(nodeId, NodeStatus.Finished);
      store.finishVerification(nodeId);
      onFinished(nodeId);
    } else if (status === NodeStatus.Busy) store.setStatus(nodeId, NodeStatus.Busy);
    else {
      console.warn(`[MQTT] Status inválido de ${nodeId}: ${message}`);
      return;
    }

    console.log(`[STATUS] ${nodeId} -> ${status}`);
    onUpdate();
  }

  function handleScan(nodeId: NodeId, message: string) {
    const scan = parseScan(message);

    store.addScan(nodeId, scan);

    console.log(
      `[SCAN] ${nodeId} encontrou ` +
      `${scan.name ?? "SEM_NOME"} | ` +
      `${scan.mac ?? "SEM_MAC"} | ` +
      `M15: ${scan.m15 ?? "?"} dBm`
    );

    onUpdate();
  }

  function sendCheck(nodeId: NodeId) {
    client.publish(getCommandTopic(nodeId), "VERIFICAR", { qos: 1 });
  }

  client.on("error", error => console.error("Erro MQTT:", error.message));
  client.on("offline", () => console.log("Broker MQTT indisponível."));
  client.on("reconnect", () => console.log("Tentando reconectar ao MQTT..."));

  return {
    ready,
    sendCheck,
    isConnected: () => client.connected
  };
}