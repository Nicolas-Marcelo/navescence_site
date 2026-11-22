
import express, { type RequestHandler } from "express";
import { createServer as createHttpServer } from "node:http";

import type { PrismaClient } from "../generated/prisma/client.js";

import { config } from "../config/env.js";

import type { NodeStore } from "../states/nodeStore.js";
import type { TopologyStore } from "../states/topologyStore.js";
import type { AlertService } from "../services/alertService.js";
import type { EnvironmentService } from "../services/environmentService.js";
import type { NavigationService } from "../services/navigationService.js";
import type { NodeService } from "../services/nodeService.js";
import type { PoiService } from "../services/poiService.js";
import type { TopologyService } from "../services/topologyService.js";
import type { VerificationService } from "../services/verificationService.js";

import { createSocket } from "../socket/socket.js";
import { registerSecurityHeaders } from "../security/securityHeaders.js";

import {
  loginRateLimit,
  mutationRateLimit,
  registrationRateLimit,
  verificationRateLimit,
} from "../security/rateLimits.js";

import {
  registerInfrastructureSecurity,
} from "../security/infrastructureSecurity.js";

import { registerAuthRoutes } from "./authRoutes.js";
import { registerNavigationHistoryRoutes } from "./navigationHistoryRoutes.js";
import { registerNavigationRoutes } from "./navigationRoutes.js";
import { registerSensorDeleteRoutes } from "./sensorDeleteRoutes.js";
import { registerRoutes, type VerificationControl } from "./routes.js";

import {
  createEnvironmentImportRouter,
} from "../routes/environmentImportRoutes.js";

export interface EnvironmentImportDependencies {
  prisma: PrismaClient;
  requireAdmin: RequestHandler;
}

export function createWebServer(
  store: NodeStore,
  topology: TopologyStore,
  nodeService: NodeService,
  topologyService: TopologyService,
  environmentService: EnvironmentService,
  poiService: PoiService,
  navigationService: NavigationService,
  verificationService: VerificationService,
  alertService: AlertService,
  verificationControl: VerificationControl,
  syncInfrastructure: () => Promise<void>,
  environmentImport?: EnvironmentImportDependencies,
) {
  const app = express();
  const httpServer = createHttpServer(app);

  registerSecurityHeaders(app);

  app.use(express.json({
    limit: "256kb",
    strict: true,
  }));

  app.use("/api", mutationRateLimit);
  app.use("/api/auth/login", loginRateLimit);
  app.use("/api/auth/register", registrationRateLimit);
  app.use("/api/auth/resend-verification", registrationRateLimit);
  app.use("/api/auth/verify-email", verificationRateLimit);

  registerAuthRoutes(app);
  registerNavigationHistoryRoutes(app);

  registerInfrastructureSecurity(app);

  registerSensorDeleteRoutes(
    app,
    nodeService,
    syncInfrastructure,
  );

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
    syncInfrastructure,
  );

  const socket = createSocket(httpServer, store, topology);

  registerNavigationRoutes(
    app,
    navigationService,
    () => socket.sendNavigationConfigUpdated(null),
  );

  if (environmentImport) {
    app.use(
      "/api/admin/environment-imports",
      environmentImport.requireAdmin,
      createEnvironmentImportRouter(environmentImport.prisma),
    );

    console.log("[AMBIENTES] Importação JSON administrativa habilitada.");
  } else {
    console.log(
      "[AMBIENTES] Importação JSON desabilitada: "
      + "dependências administrativas não configuradas.",
    );
  }

  app.get("/api/health", (_request, response) => {
    response.json({
      status: "ok",
      service: "navescence-central",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api", (_request, response) => {
    response.status(404).json({
      error: "ROUTE_NOT_FOUND",
      message: "Endpoint não encontrado.",
    });
  });

  app.use(express.static("public", {
    index: "index.html",
    maxAge: config.nodeEnv === "production" ? "1h" : 0,
    etag: true,
  }));

  function start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const onError = (error: Error) => reject(error);
      httpServer.once("error", onError);

      httpServer.listen(config.web.port, () => {
        httpServer.off("error", onError);

        console.log();
        console.log(`Interface: http://localhost:${config.web.port}`);
        console.log(
          `Autenticação: http://localhost:${config.web.port}/api/auth`,
        );
        console.log(
          `Histórico usuário: http://localhost:${config.web.port}/api/navigation-history/today`,
        );
        console.log(
          `API Navegação: http://localhost:${config.web.port}/api/navigation/config`,
        );
        console.log(
          `Mapa tátil: http://localhost:${config.web.port}/api/navigation/tactile-map`,
        );
        console.log(
          `Health: http://localhost:${config.web.port}/api/health`,
        );

        if (environmentImport) {
          console.log(
            `Importação JSON: http://localhost:${config.web.port}/api/admin/environment-imports`,
          );
        }

        console.log("Segurança HTTP: ATIVA");
        console.log("Rotas administrativas: ADMIN");

        resolve();
      });
    });
  }

  async function stop(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      httpServer.close(error => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  return {
    start,
    stop,
    sendDashboard: socket.sendDashboard,
    sendNavigationConfigUpdated: socket.sendNavigationConfigUpdated,
  };
}
