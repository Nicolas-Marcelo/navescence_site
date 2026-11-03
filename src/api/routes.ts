import type {
  Application,
} from "express";

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
  getDashboard,
} from "../services/dashboard.js";

import {
  isForeignKeyViolation,
  isUniqueViolation,
} from "../security/prismaErrors.js";

export interface VerificationControl {
  getStatus:
    () => unknown;

  run: (
    target: string,
  ) => Promise<unknown>;
}

export function registerRoutes(
  app: Application,
  store: NodeStore,
  topology: TopologyStore,
  nodeService: NodeService,
  topologyService: TopologyService,
  environmentService: EnvironmentService,
  poiService: PoiService,
  verificationService: VerificationService,
  alertService: AlertService,
  verificationControl: VerificationControl,
  syncInfrastructure:
    () => Promise<void>,
) {
  app.get(
    "/api/nodes",
    (_request, response) => {
      response.json(
        store.getAll(),
      );
    },
  );

  app.get(
    "/api/dashboard",
    (_request, response) => {
      response.json(
        getDashboard(
          store,
          topology,
        ),
      );
    },
  );

  app.get(
    "/api/sensors",
    async (
      _request,
      response,
    ) => {
      try {
        response.json(
          await nodeService.list(),
        );
      } catch (error) {
        console.error(
          "Erro ao listar sensores:",
          error,
        );

        response
          .status(500)
          .json({
            error:
              "SENSOR_LIST_FAILED",

            message:
              "Não foi possível listar os sensores.",
          });
      }
    },
  );

  app.get(
    "/api/sensors/:id",
    async (
      request,
      response,
    ) => {
      try {
        const id =
          Number(
            request.params.id,
          );

        const node =
          await nodeService.get(
            id,
          );

        if (!node) {
          return response
            .status(404)
            .json({
              error:
                "SENSOR_NOT_FOUND",

              message:
                "Sensor não encontrado.",
            });
        }

        response.json(
          node,
        );
      } catch (error) {
        console.error(
          "Erro ao buscar sensor:",
          error,
        );

        response
          .status(500)
          .json({
            error:
              "SENSOR_READ_FAILED",

            message:
              "Não foi possível buscar o sensor.",
          });
      }
    },
  );

  app.post(
    "/api/sensors",
    async (
      request,
      response,
    ) => {
      try {
        const node =
          await nodeService.create(
            request.body,
          );

        await syncInfrastructure();

        response
          .status(201)
          .json(
            node,
          );
      } catch (error) {
        if (
          isUniqueViolation(
            error,
          )
        ) {
          return response
            .status(409)
            .json({
              error:
                "SENSOR_CODE_OR_MAC_IN_USE",

              message:
                "Já existe um sensor com este código ou MAC.",
            });
        }

        console.error(
          "Erro ao cadastrar sensor:",
          error,
        );

        response
          .status(400)
          .json({
            error:
              "SENSOR_CREATE_FAILED",

            message:
              "Não foi possível cadastrar o sensor.",
          });
      }
    },
  );

  app.put(
    "/api/sensors/:id",
    async (
      request,
      response,
    ) => {
      try {
        const id =
          Number(
            request.params.id,
          );

        const node =
          await nodeService.update(
            id,
            request.body,
          );

        if (!node) {
          return response
            .status(404)
            .json({
              error:
                "SENSOR_NOT_FOUND",

              message:
                "Sensor não encontrado.",
            });
        }

        await syncInfrastructure();

        response.json(
          node,
        );
      } catch (error) {
        if (
          isUniqueViolation(
            error,
          )
        ) {
          return response
            .status(409)
            .json({
              error:
                "SENSOR_CODE_OR_MAC_IN_USE",

              message:
                "Já existe um sensor com este código ou MAC.",
            });
        }

        console.error(
          "Erro ao atualizar sensor:",
          error,
        );

        response
          .status(400)
          .json({
            error:
              "SENSOR_UPDATE_FAILED",

            message:
              "Não foi possível atualizar o sensor.",
          });
      }
    },
  );

  app.patch(
    "/api/sensors/:id/status",
    async (
      request,
      response,
    ) => {
      try {
        const id =
          Number(
            request.params.id,
          );

        const node =
          await nodeService.setStatus(
            id,
            request.body.active,
            request.body.maintenance,
          );

        if (!node) {
          return response
            .status(404)
            .json({
              error:
                "SENSOR_NOT_FOUND",

              message:
                "Sensor não encontrado.",
            });
        }

        await syncInfrastructure();

        response.json(
          node,
        );
      } catch (error) {
        console.error(
          "Erro ao alterar sensor:",
          error,
        );

        response
          .status(400)
          .json({
            error:
              "SENSOR_STATUS_FAILED",

            message:
              "Não foi possível alterar o estado do sensor.",
          });
      }
    },
  );

  app.get(
    "/api/environments",
    async (
      _request,
      response,
    ) => {
      try {
        response.json(
          await environmentService.list(),
        );
      } catch (error) {
        console.error(
          "Erro ao listar ambientes:",
          error,
        );

        response
          .status(500)
          .json({
            error:
              "ENVIRONMENT_LIST_FAILED",

            message:
              "Não foi possível carregar os ambientes.",
          });
      }
    },
  );

  app.get(
    "/api/environments/:id",
    async (
      request,
      response,
    ) => {
      try {
        const id =
          Number(
            request.params.id,
          );

        const environment =
          await environmentService.get(
            id,
          );

        if (!environment) {
          return response
            .status(404)
            .json({
              error:
                "ENVIRONMENT_NOT_FOUND",

              message:
                "Ambiente não encontrado.",
            });
        }

        response.json(
          environment,
        );
      } catch (error) {
        console.error(
          "Erro ao carregar ambiente:",
          error,
        );

        response
          .status(500)
          .json({
            error:
              "ENVIRONMENT_READ_FAILED",

            message:
              "Não foi possível carregar o ambiente.",
          });
      }
    },
  );

  app.post(
    "/api/environments",
    async (
      request,
      response,
    ) => {
      try {
        const environment =
          await environmentService.create(
            request.body,
          );

        response
          .status(201)
          .json(
            environment,
          );
      } catch (error) {
        if (
          isUniqueViolation(
            error,
          )
        ) {
          return response
            .status(409)
            .json({
              error:
                "ENVIRONMENT_CODE_IN_USE",

              message:
                "Já existe um ambiente com este código.",
            });
        }

        console.error(
          "Erro ao cadastrar ambiente:",
          error,
        );

        response
          .status(400)
          .json({
            error:
              "ENVIRONMENT_CREATE_FAILED",

            message:
              "Não foi possível cadastrar o ambiente.",
          });
      }
    },
  );

  app.put(
    "/api/environments/:id",
    async (
      request,
      response,
    ) => {
      try {
        const id =
          Number(
            request.params.id,
          );

        const environment =
          await environmentService.update(
            id,
            request.body,
          );

        if (!environment) {
          return response
            .status(404)
            .json({
              error:
                "ENVIRONMENT_NOT_FOUND",

              message:
                "Ambiente não encontrado.",
            });
        }

        response.json(
          environment,
        );
      } catch (error) {
        if (
          isUniqueViolation(
            error,
          )
        ) {
          return response
            .status(409)
            .json({
              error:
                "ENVIRONMENT_CODE_IN_USE",

              message:
                "Já existe um ambiente com este código.",
            });
        }

        console.error(
          "Erro ao atualizar ambiente:",
          error,
        );

        response
          .status(400)
          .json({
            error:
              "ENVIRONMENT_UPDATE_FAILED",

            message:
              "Não foi possível atualizar o ambiente.",
          });
      }
    },
  );

  app.delete(
    "/api/environments/:id",
    async (
      request,
      response,
    ) => {
      try {
        const id =
          Number(
            request.params.id,
          );

        const environment =
          await environmentService.remove(
            id,
          );

        if (!environment) {
          return response
            .status(404)
            .json({
              error:
                "ENVIRONMENT_NOT_FOUND",

              message:
                "Ambiente não encontrado.",
            });
        }

        response
          .status(204)
          .send();
      } catch (error) {
        if (
          error instanceof
            Error &&
          error.message ===
            "ENVIRONMENT_HAS_SENSORS"
        ) {
          return response
            .status(409)
            .json({
              error:
                "ENVIRONMENT_HAS_SENSORS",

              message:
                "O ambiente possui sensores vinculados e não pode ser excluído.",
            });
        }

        if (
          isForeignKeyViolation(
            error,
          )
        ) {
          return response
            .status(409)
            .json({
              error:
                "ENVIRONMENT_IN_USE",

              message:
                "O ambiente possui vínculos e não pode ser excluído.",
            });
        }

        console.error(
          "Erro ao remover ambiente:",
          error,
        );

        response
          .status(500)
          .json({
            error:
              "ENVIRONMENT_DELETE_FAILED",

            message:
              "Não foi possível remover o ambiente.",
          });
      }
    },
  );

  app.get(
    "/api/pois",
    async (
      _request,
      response,
    ) => {
      try {
        response.json(
          await poiService.list(),
        );
      } catch (error) {
        console.error(
          "Erro ao listar pontos de interesse:",
          error,
        );

        response
          .status(500)
          .json({
            error:
              "POI_LIST_FAILED",

            message:
              "Não foi possível carregar os pontos de interesse.",
          });
      }
    },
  );

  app.get(
    "/api/pois/operational",
    async (
      _request,
      response,
    ) => {
      try {
        response.json(
          await poiService.listOperational(),
        );
      } catch (error) {
        console.error(
          "Erro ao listar POIs operacionais:",
          error,
        );

        response
          .status(500)
          .json({
            error:
              "POI_LIST_FAILED",

            message:
              "Não foi possível carregar os pontos de interesse disponíveis.",
          });
      }
    },
  );

  app.get(
    "/api/pois/:id",
    async (
      request,
      response,
    ) => {
      try {
        const id =
          Number(
            request.params.id,
          );

        const poi =
          await poiService.get(
            id,
          );

        if (!poi) {
          return response
            .status(404)
            .json({
              error:
                "POI_NOT_FOUND",

              message:
                "Ponto de interesse não encontrado.",
            });
        }

        response.json(
          poi,
        );
      } catch (error) {
        console.error(
          "Erro ao carregar POI:",
          error,
        );

        response
          .status(500)
          .json({
            error:
              "POI_READ_FAILED",

            message:
              "Não foi possível carregar o ponto de interesse.",
          });
      }
    },
  );

  app.post(
    "/api/pois",
    async (
      request,
      response,
    ) => {
      try {
        const poi =
          await poiService.create(
            request.body,
          );

        response
          .status(201)
          .json(
            poi,
          );
      } catch (error) {
        if (
          isUniqueViolation(
            error,
          )
        ) {
          return response
            .status(409)
            .json({
              error:
                "POI_CODE_IN_USE",

              message:
                "Já existe um ponto de interesse com este código.",
            });
        }

        console.error(
          "Erro ao cadastrar POI:",
          error,
        );

        response
          .status(400)
          .json({
            error:
              "POI_CREATE_FAILED",

            message:
              error instanceof Error
                ? error.message
                : "Não foi possível cadastrar o ponto de interesse.",
          });
      }
    },
  );

  app.put(
    "/api/pois/:id",
    async (
      request,
      response,
    ) => {
      try {
        const id =
          Number(
            request.params.id,
          );

        const poi =
          await poiService.update(
            id,
            request.body,
          );

        if (!poi) {
          return response
            .status(404)
            .json({
              error:
                "POI_NOT_FOUND",

              message:
                "Ponto de interesse não encontrado.",
            });
        }

        response.json(
          poi,
        );
      } catch (error) {
        if (
          isUniqueViolation(
            error,
          )
        ) {
          return response
            .status(409)
            .json({
              error:
                "POI_CODE_IN_USE",

              message:
                "Já existe um ponto de interesse com este código.",
            });
        }

        console.error(
          "Erro ao atualizar POI:",
          error,
        );

        response
          .status(400)
          .json({
            error:
              "POI_UPDATE_FAILED",

            message:
              error instanceof Error
                ? error.message
                : "Não foi possível atualizar o ponto de interesse.",
          });
      }
    },
  );

  app.delete(
    "/api/pois/:id",
    async (
      request,
      response,
    ) => {
      try {
        const id =
          Number(
            request.params.id,
          );

        const poi =
          await poiService.remove(
            id,
          );

        if (!poi) {
          return response
            .status(404)
            .json({
              error:
                "POI_NOT_FOUND",

              message:
                "Ponto de interesse não encontrado.",
            });
        }

        response
          .status(204)
          .send();
      } catch (error) {
        console.error(
          "Erro ao remover POI:",
          error,
        );

        response
          .status(500)
          .json({
            error:
              "POI_DELETE_FAILED",

            message:
              "Não foi possível remover o ponto de interesse.",
          });
      }
    },
  );

  app.get(
    "/api/topology",
    async (
      _request,
      response,
    ) => {
      try {
        response.json(
          await topologyService.list(),
        );
      } catch (error) {
        console.error(
          "Erro ao listar topologia:",
          error,
        );

        response
          .status(500)
          .json({
            error:
              "TOPOLOGY_LIST_FAILED",

            message:
              "Não foi possível carregar a topologia.",
          });
      }
    },
  );

  app.post(
    "/api/topology",
    async (
      request,
      response,
    ) => {
      try {
        const edge =
          await topologyService.create(
            request.body,
          );

        await syncInfrastructure();

        response
          .status(201)
          .json(
            edge,
          );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Não foi possível criar a conexão.";

        if (
          message ===
          "Essa conexão já está cadastrada."
        ) {
          return response
            .status(409)
            .json({
              error:
                "EDGE_ALREADY_EXISTS",

              message,
            });
        }

        response
          .status(400)
          .json({
            error:
              "EDGE_CREATE_FAILED",

            message,
          });
      }
    },
  );

  app.delete(
    "/api/topology/:id",
    async (
      request,
      response,
    ) => {
      try {
        const id =
          Number(
            request.params.id,
          );

        const edge =
          await topologyService.remove(
            id,
          );

        if (!edge) {
          return response
            .status(404)
            .json({
              error:
                "EDGE_NOT_FOUND",

              message:
                "Conexão não encontrada.",
            });
        }

        await syncInfrastructure();

        response
          .status(204)
          .send();
      } catch (error) {
        console.error(
          "Erro ao remover conexão:",
          error,
        );

        response
          .status(500)
          .json({
            error:
              "EDGE_DELETE_FAILED",

            message:
              "Não foi possível remover a conexão.",
          });
      }
    },
  );

  app.get(
    "/api/verifications/status",
    (
      _request,
      response,
    ) => {
      response.json(
        verificationControl
          .getStatus(),
      );
    },
  );

  app.post(
    "/api/verifications/run",
    async (
      request,
      response,
    ) => {
      try {
        const target =
          typeof request.body
            .target ===
          "string"
            ? request.body
                .target
            : "ALL";

        response.json(
          await verificationControl.run(
            target,
          ),
        );
      } catch (error) {
        const code =
          (
            error as {
              code?: string;
            }
          ).code;

        const message =
          error instanceof Error
            ? error.message
            : "Não foi possível iniciar a verificação.";

        if (
          code ===
          "BUSY"
        ) {
          return response
            .status(409)
            .json({
              error:
                "VERIFICATION_BUSY",

              message,
            });
        }

        if (
          code ===
          "NOT_FOUND"
        ) {
          return response
            .status(404)
            .json({
              error:
                "VERIFICATION_NODE_NOT_FOUND",

              message,
            });
        }

        response
          .status(400)
          .json({
            error:
              "VERIFICATION_FAILED",

            message,
          });
      }
    },
  );

  app.get(
    "/api/verifications/history",
    async (
      request,
      response,
    ) => {
      try {
        const requestedLimit =
          Number(
            request.query
              .limit ??
            50,
          );

        const limit =
          Number.isInteger(
            requestedLimit,
          )
            ? Math.min(
                Math.max(
                  requestedLimit,
                  1,
                ),
                200,
              )
            : 50;

        response.json(
          await verificationService
            .listRecent(
              limit,
            ),
        );
      } catch (error) {
        console.error(
          "Erro ao carregar histórico:",
          error,
        );

        response
          .status(500)
          .json({
            error:
              "VERIFICATION_HISTORY_FAILED",

            message:
              "Não foi possível carregar o histórico de verificações.",
          });
      }
    },
  );

  app.get(
    "/api/verifications/history/:id",
    async (
      request,
      response,
    ) => {
      try {
        const id =
          Number(
            request.params.id,
          );

        const verification =
          await verificationService.get(
            id,
          );

        if (!verification) {
          return response
            .status(404)
            .json({
              error:
                "VERIFICATION_NOT_FOUND",

              message:
                "Verificação não encontrada.",
            });
        }

        response.json(
          verification,
        );
      } catch (error) {
        console.error(
          "Erro ao carregar verificação:",
          error,
        );

        response
          .status(500)
          .json({
            error:
              "VERIFICATION_READ_FAILED",

            message:
              "Não foi possível carregar a verificação.",
          });
      }
    },
  );

  app.get(
    "/api/alerts",
    async (
      request,
      response,
    ) => {
      try {
        const status =
          typeof request.query
            .status ===
          "string"
            ? request.query
                .status
                .toUpperCase()
            : undefined;

        const type =
          typeof request.query
            .type ===
          "string"
            ? request.query
                .type
                .toUpperCase()
            : undefined;

        const nodeCode =
          typeof request.query
            .node ===
          "string"
            ? request.query
                .node
                .toUpperCase()
            : undefined;

        const requestedLimit =
          Number(
            request.query
              .limit ??
            200,
          );

        const limit =
          Number.isInteger(
            requestedLimit,
          )
            ? Math.min(
                Math.max(
                  requestedLimit,
                  1,
                ),
                500,
              )
            : 200;

        response.json(
          await alertService.list({
            status,
            type,
            nodeCode,
            limit,
          }),
        );
      } catch (error) {
        console.error(
          "Erro ao carregar alertas:",
          error,
        );

        response
          .status(500)
          .json({
            error:
              "ALERT_LIST_FAILED",

            message:
              "Não foi possível carregar os alertas.",
          });
      }
    },
  );

  app.get(
    "/api/alerts/:id",
    async (
      request,
      response,
    ) => {
      try {
        const id =
          Number(
            request.params.id,
          );

        const alert =
          await alertService.get(
            id,
          );

        if (!alert) {
          return response
            .status(404)
            .json({
              error:
                "ALERT_NOT_FOUND",

              message:
                "Alerta não encontrado.",
            });
        }

        response.json(
          alert,
        );
      } catch (error) {
        console.error(
          "Erro ao carregar alerta:",
          error,
        );

        response
          .status(500)
          .json({
            error:
              "ALERT_READ_FAILED",

            message:
              "Não foi possível carregar o alerta.",
          });
      }
    },
  );
}