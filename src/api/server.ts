import express from "express";
import { createServer as createHttpServer } from "node:http";

import { config } from "../config/env.js";

import type { NodeStore } from "../states/nodeStore.js";
import type { TopologyStore } from "../states/topologyStore.js";

import type { AlertService } from "../services/alertService.js";
import type { EnvironmentService } from "../services/environmentService.js";
import type { NodeService } from "../services/nodeService.js";
import type { PoiService } from "../services/poiService.js";
import type { TopologyService } from "../services/topologyService.js";
import type { VerificationService } from "../services/verificationService.js";

import { createSocket } from "../socket/socket.js";
import { registerRoutes, type VerificationControl } from "./routes.js";

export function createWebServer(
  store: NodeStore,
  topology: TopologyStore,
  nodeService: NodeService,
  topologyService: TopologyService,
  environmentService: EnvironmentService,
  poiService: PoiService,
  verificationService: VerificationService,
  alertService: AlertService,
  verificationControl: VerificationControl,
  syncInfrastructure: () => Promise<void>
) {
  const app = express();
  const httpServer = createHttpServer(app);

  app.use(express.json());
  app.use(express.static("public"));

  registerRoutes(
    app,
    store,
    topology,
    nodeService,
    topologyService,
    environmentService,
    poiService,
    verificationService,
    alertService,
    verificationControl,
    syncInfrastructure
  );

  const socket = createSocket(
    httpServer,
    store,
    topology
  );

  function start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const onError = (error: Error) => reject(error);

      httpServer.once("error", onError);

      httpServer.listen(config.web.port, () => {
        httpServer.off("error", onError);

        console.log();
        console.log(`Interface: http://localhost:${config.web.port}`);
        console.log(`API Nodes: http://localhost:${config.web.port}/api/nodes`);
        console.log(`API Sensores: http://localhost:${config.web.port}/api/sensors`);
        console.log(`API Ambientes: http://localhost:${config.web.port}/api/environments`);
        console.log(`API POIs: http://localhost:${config.web.port}/api/pois`);
        console.log(`API Topologia: http://localhost:${config.web.port}/api/topology`);
        console.log(`API Verificações: http://localhost:${config.web.port}/api/verifications/status`);
        console.log(`API Histórico: http://localhost:${config.web.port}/api/verifications/history`);
        console.log(`API Alertas: http://localhost:${config.web.port}/api/alerts`);
        console.log(`API Dashboard: http://localhost:${config.web.port}/api/dashboard`);

        resolve();
      });
    });
  }

  return {
    start,
    sendDashboard: socket.sendDashboard
  };
}