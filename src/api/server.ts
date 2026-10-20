import express from "express";

import {
  createServer as createHttpServer,
} from "node:http";

import { config } from "../config/env.js";

import type {
  NodeStore,
} from "../states/nodeStore.js";

import type {
  TopologyStore,
} from "../states/topologyStore.js";

import type {
  AlertService,
} from "../services/alertService.js";

import type {
  EnvironmentService,
} from "../services/environmentService.js";

import type {
  NavigationService,
} from "../services/navigationService.js";

import type {
  NodeService,
} from "../services/nodeService.js";

import type {
  PoiService,
} from "../services/poiService.js";

import type {
  TopologyService,
} from "../services/topologyService.js";

import type {
  VerificationService,
} from "../services/verificationService.js";

import {
  createSocket,
} from "../socket/socket.js";

import {
  registerSecurityHeaders,
} from "../security/securityHeaders.js";

import {
  loginRateLimit,
  mutationRateLimit,
  registrationRateLimit,
  verificationRateLimit,
} from "../security/rateLimits.js";

import {
  registerInfrastructureSecurity,
} from "../security/infrastructureSecurity.js";

import {
  registerAuthRoutes,
} from "./authRoutes.js";

import {
  registerNavigationHistoryRoutes,
} from "./navigationHistoryRoutes.js";

import {
  registerNavigationRoutes,
} from "./navigationRoutes.js";

import {
  registerRoutes,
  type VerificationControl,
} from "./routes.js";

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
  verificationControl:
    VerificationControl,
  syncInfrastructure:
    () => Promise<void>,
) {
  const app =
    express();

  const httpServer =
    createHttpServer(app);

  /*
   * Headers HTTP de segurança.
   *
   * Inclui Helmet e CSP.
   */
  registerSecurityHeaders(app);

  /*
   * Limita o tamanho do JSON recebido.
   *
   * Evita que a API aceite corpos
   * desnecessariamente grandes.
   */
  app.use(
    express.json({
      limit: "256kb",
      strict: true,
    }),
  );

  /*
   * Limite geral para operações
   * que modificam dados.
   *
   * GET, HEAD e OPTIONS são ignorados.
   */
  app.use(
    "/api",
    mutationRateLimit,
  );

  /*
   * Limites específicos das
   * operações de autenticação.
   */
  app.use(
    "/api/auth/login",
    loginRateLimit,
  );

  app.use(
    "/api/auth/register",
    registrationRateLimit,
  );

  app.use(
    "/api/auth/resend-verification",
    verificationRateLimit,
  );

  app.use(
    "/api/auth/verify-email",
    verificationRateLimit,
  );

  /*
   * API de autenticação.
   *
   * Cadastro e login permanecem
   * públicos, mas protegidos por
   * rate limiting.
   */
  registerAuthRoutes(app);

  /*
   * Histórico pessoal do usuário.
   *
   * As próprias rotas utilizam
   * requireAuth.
   */
  registerNavigationHistoryRoutes(
    app,
  );

  /*
   * Proteção da infraestrutura.
   *
   * IMPORTANTE:
   * precisa vir ANTES de
   * registerRoutes().
   *
   * Aqui são aplicados:
   * - JWT obrigatório;
   * - role ADMIN;
   * - validação Zod;
   * - rejeição de campos extras.
   */
  registerInfrastructureSecurity(
    app,
  );

  /*
   * Administração e infraestrutura.
   */
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

  /*
   * Configuração consumida pelo
   * aplicativo Flutter.
   *
   * Não entra na proteção administrativa,
   * pois o aplicativo precisa acessar
   * /api/navigation/config.
   */
  registerNavigationRoutes(
    app,
    navigationService,
  );

  /*
   * Endpoint de diagnóstico.
   */
  app.get(
    "/api/health",
    (_req, res) => {
      res.json({
        status: "ok",
        service:
          "navescence-central",
        timestamp:
          new Date()
            .toISOString(),
      });
    },
  );

  /*
   * Resposta padrão para qualquer
   * endpoint inexistente da API.
   *
   * Deve permanecer antes do
   * express.static().
   */
  app.use(
    "/api",
    (_req, res) => {
      res
        .status(404)
        .json({
          error:
            "ROUTE_NOT_FOUND",

          message:
            "Endpoint não encontrado.",
        });
    },
  );

  /*
   * Site estático legado.
   *
   * Mantido por enquanto enquanto
   * concluímos a migração para React.
   */
  app.use(
    express.static(
      "public",
      {
        index: "index.html",

        maxAge:
          config.nodeEnv ===
          "production"
            ? "1h"
            : 0,

        etag: true,
      },
    ),
  );

  /*
   * Socket.IO.
   */
  const socket =
    createSocket(
      httpServer,
      store,
      topology,
    );

  function start():
    Promise<void> {
    return new Promise(
      (
        resolve,
        reject,
      ) => {
        const onError =
          (error: Error) => {
            reject(error);
          };

        httpServer.once(
          "error",
          onError,
        );

        httpServer.listen(
          config.web.port,
          () => {
            httpServer.off(
              "error",
              onError,
            );

            console.log();

            console.log(
              `Interface: ` +
              `http://localhost:${config.web.port}`,
            );

            console.log(
              `Autenticação: ` +
              `http://localhost:${config.web.port}/api/auth`,
            );

            console.log(
              `Histórico usuário: ` +
              `http://localhost:${config.web.port}/api/navigation-history/today`,
            );

            console.log(
              `API Navegação: ` +
              `http://localhost:${config.web.port}/api/navigation/config`,
            );

            console.log(
              `Health: ` +
              `http://localhost:${config.web.port}/api/health`,
            );

            console.log(
              "Segurança HTTP: ATIVA",
            );

            console.log(
              "Rotas administrativas: ADMIN",
            );

            resolve();
          },
        );
      },
    );
  }

  async function stop():
    Promise<void> {
    await new Promise<void>(
      (
        resolve,
        reject,
      ) => {
        httpServer.close(
          error => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          },
        );
      },
    );
  }

  return {
    start,
    stop,

    sendDashboard:
      socket.sendDashboard,

    sendNavigationConfigUpdated:
      socket
        .sendNavigationConfigUpdated,
  };
}