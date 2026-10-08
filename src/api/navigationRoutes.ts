import type { Application } from "express";

import type { NavigationService } from "../services/navigationService.js";

export function registerNavigationRoutes(
  app: Application,
  navigationService: NavigationService
) {
  app.get("/api/navigation/config", async (request, response) => {
    try {
      let environmentId: number | undefined;

      if (request.query.environmentId !== undefined) {
        environmentId = Number(request.query.environmentId);

        if (!Number.isInteger(environmentId) || environmentId <= 0) {
          return response.status(400).json({
            error: "environmentId inválido."
          });
        }
      }

      const config = await navigationService.getConfig(environmentId);

      response.json(config);
    } catch (error) {
      console.error(
        "Erro ao carregar configuração de navegação:",
        error
      );

      const message = error instanceof Error
        ? error.message
        : "Não foi possível carregar a configuração de navegação.";

      response.status(500).json({
        error: message
      });
    }
  });
}