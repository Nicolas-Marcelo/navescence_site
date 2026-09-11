import type { NodeId } from "./config/nodes.js";

import { createWebServer } from "./api/server.js";
import { createMqttService } from "./mqtt/client.js";

import { createAlertRepository } from "./repositories/alertRepository.js";
import { createEdgeRepository } from "./repositories/edgeRepository.js";
import { createEnvironmentRepository } from "./repositories/environmentRepository.js";
import { createNodeRepository } from "./repositories/nodeRepository.js";
import { createPoiRepository } from "./repositories/poiRepository.js";
import { createVerificationRepository } from "./repositories/verificationRepository.js";

import { createAlertService } from "./services/alertService.js";
import { createCoordinator } from "./services/coordinator.js";
import { getDashboard } from "./services/dashboard.js";
import { createEnvironmentService } from "./services/environmentService.js";
import { createNodeService } from "./services/nodeService.js";
import { createPoiService } from "./services/poiService.js";
import { createTopologyService } from "./services/topologyService.js";
import { createVerificationService } from "./services/verificationService.js";

import { createNodeStore } from "./states/nodeStore.js";
import { createTopologyStore } from "./states/topologyStore.js";

import { sleep } from "./utils/time.js";

const store = createNodeStore();
const topology = createTopologyStore();

const nodeRepository = createNodeRepository();
const edgeRepository = createEdgeRepository();
const environmentRepository = createEnvironmentRepository();
const poiRepository = createPoiRepository();
const verificationRepository = createVerificationRepository();
const alertRepository = createAlertRepository();

const nodeService = createNodeService(
  nodeRepository
);

const topologyService = createTopologyService(
  edgeRepository,
  nodeRepository
);

const environmentService = createEnvironmentService(
  environmentRepository
);

const poiService = createPoiService(
  poiRepository,
  nodeRepository
);

const verificationService = createVerificationService(
  verificationRepository,
  nodeRepository
);

const alertService = createAlertService(
  alertRepository,
  nodeRepository
);

async function syncInfrastructure() {
  const sensors = await nodeService.listOperational();

  store.sync(
    sensors.map(sensor => sensor.code)
  );

  const links = await topologyService.listOperationalLinks();

  topology.sync(links);

  console.log(
    `Sensores ativos: ${store.getIds().join(", ") || "nenhum"}`
  );

  console.log(
    `Conexões ativas: ${links.length}`
  );
}

let emitDashboard = () => {};
let sendCheck = (_nodeId: NodeId) => {};

function syncCurrentAlerts() {
  const currentAlerts = getDashboard(
    store,
    topology
  ).alerts;

  alertService.syncDashboardAlerts(
    currentAlerts
  );
}

function refreshDashboard() {
  emitDashboard();
  syncCurrentAlerts();
}

const coordinator = createCoordinator({
  store,

  sendCheck: nodeId => {
    sendCheck(nodeId);
  },

  sendDashboard: () => {
    refreshDashboard();
  },

  saveVerification: async data => {
    const run = await verificationService.save(data);

    await alertService.syncVerificationResult({
      nodeCode: data.nodeCode,
      result: data.result,
      verificationRunId: run.id
    });

    return run;
  }
});

const web = createWebServer(
  store,
  topology,
  nodeService,
  topologyService,
  environmentService,
  poiService,
  verificationService,
  alertService,
  {
    getStatus: coordinator.getStatus,
    run: coordinator.runManual
  },
  async () => {
    await syncInfrastructure();
    refreshDashboard();
  }
);

emitDashboard = web.sendDashboard;

const mqtt = createMqttService({
  store,

  onUpdate: () => {
    refreshDashboard();
  },

  onFinished: coordinator.finishNode
});

sendCheck = mqtt.sendCheck;

async function start() {
  await syncInfrastructure();

  await web.start();

  await mqtt.ready;

  refreshDashboard();

  await sleep(3000);

  await coordinator.start();
}

start().catch(error => {
  console.error(
    "Erro ao iniciar NAVESCENCE:",
    error
  );
});