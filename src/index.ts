
import type { NodeId } from "./config/nodes.js";

import { createWebServer } from "./api/server.js";
import { requireAdmin } from "./auth/authMiddleware.js";
import { prisma } from "./database/prisma.js";
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
import { createNavigationService } from "./services/navigationService.js";
import { createNodeService } from "./services/nodeService.js";
import { createPoiService } from "./services/poiService.js";
import { createTopologyService } from "./services/topologyService.js";
import { createVerificationService } from "./services/verificationService.js";

import { createNodeStore } from "./states/nodeStore.js";
import { createTopologyStore } from "./states/topologyStore.js";
import { sleep } from "./utils/time.js";

const store = createNodeStore();
const topology = createTopologyStore();

let emitDashboard = () => {};
let emitNavigationConfigUpdated = (_environmentId: number | null = null) => {};
let sendCheck = (_nodeId: NodeId) => {};

function notifyNavigationUpdate() {
  emitNavigationConfigUpdated(null);
}

const nodeRepository = createNodeRepository();
const edgeRepository = createEdgeRepository();
const environmentRepository = createEnvironmentRepository();
const poiRepository = createPoiRepository();
const verificationRepository = createVerificationRepository();
const alertRepository = createAlertRepository();

const nodeService = createNodeService(
  nodeRepository,
  notifyNavigationUpdate,
);

const topologyService = createTopologyService(
  edgeRepository,
  nodeRepository,
  notifyNavigationUpdate,
);

const environmentService = createEnvironmentService(
  environmentRepository,
  notifyNavigationUpdate,
);

const poiService = createPoiService(
  poiRepository,
  nodeRepository,
  notifyNavigationUpdate,
);

const navigationService = createNavigationService(
  nodeRepository,
  edgeRepository,
  poiRepository,
);

const verificationService = createVerificationService(
  verificationRepository,
  nodeRepository,
);

const alertService = createAlertService(
  alertRepository,
  nodeRepository,
);

async function syncInfrastructure() {
  const sensors = await nodeService.listOperational();

  store.sync(sensors.map(sensor => sensor.code));

  const links = await topologyService.listOperationalLinks();

  topology.sync(links);

  return {
    sensors: sensors.length,
    links: links.length,
  };
}

function syncCurrentAlerts() {
  const currentAlerts = getDashboard(store, topology).alerts;

  alertService.syncDashboardAlerts(currentAlerts);
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
      verificationRunId: run.id,
    });

    return run;
  },
});

const web = createWebServer(
  store,
  topology,
  nodeService,
  topologyService,
  environmentService,
  poiService,
  navigationService,
  verificationService,
  alertService,
  {
    getStatus: coordinator.getStatus,
    run: coordinator.runManual,
  },
  async () => {
    await syncInfrastructure();
    refreshDashboard();
  },
  {
    prisma,
    requireAdmin,
  },
);

emitDashboard = web.sendDashboard;
emitNavigationConfigUpdated = web.sendNavigationConfigUpdated;

const mqtt = createMqttService({
  store,

  onUpdate: () => {
    refreshDashboard();
  },

  onFinished: coordinator.finishNode,
});

sendCheck = mqtt.sendCheck;

async function start() {
  console.log();
  console.log("========================================");
  console.log("        NAVESCENCE - SISTEMA CENTRAL");
  console.log("========================================");
  console.log();

  const infrastructure = await syncInfrastructure();

  console.log(
    `[INFRA] ${infrastructure.sensors} sensores ativos | ${infrastructure.links} conexões`,
  );

  await web.start();
  await mqtt.ready;

  refreshDashboard();

  await sleep(3000);
  await coordinator.start();
}

start().catch(error => {
  console.error(
    "[SISTEMA] Falha ao iniciar NAVESCENCE:",
    error,
  );
});
