import type {
  Application,
} from "express";

import type {
  NodeService,
} from "../services/nodeService.js";

export function registerSensorDeleteRoutes(
  app: Application,
  nodeService: NodeService,
  syncInfrastructure:
    () => Promise<void>,
) {
  app.delete(
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

        if (
          !Number.isInteger(
            id,
          ) ||
          id <= 0
        ) {
          return response
            .status(400)
            .json({
              error:
                "INVALID_ID",

              message:
                "O identificador do sensor é inválido.",
            });
        }

        const removed =
          await nodeService.remove(
            id,
          );

        if (!removed) {
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

        return response
          .status(204)
          .send();
      } catch (error) {
        if (
          error instanceof
            Error &&
          error.message ===
            "SENSOR_HAS_POIS"
        ) {
          return response
            .status(409)
            .json({
              error:
                "SENSOR_HAS_POIS",

              message:
                "Este sensor possui pontos de interesse vinculados. Remova ou altere esses pontos antes de excluir o sensor.",
            });
        }

        if (
          error instanceof
            Error &&
          error.message ===
            "SENSOR_HAS_POI_APPROACHES"
        ) {
          return response
            .status(409)
            .json({
              error:
                "SENSOR_HAS_POI_APPROACHES",

              message:
                "Este sensor está sendo utilizado em orientações de aproximação de pontos de interesse.",
            });
        }

        console.error(
          "Erro ao excluir sensor:",
          error,
        );

        return response
          .status(500)
          .json({
            error:
              "SENSOR_DELETE_FAILED",

            message:
              "Não foi possível excluir o sensor.",
          });
      }
    },
  );
}