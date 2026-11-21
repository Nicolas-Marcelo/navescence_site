
import type { Application } from "express";
import { requireAdmin } from "../auth/authMiddleware.js";
import type { NavigationService } from "../services/navigationService.js";
import {
  loadTactileMap,
  saveTactileMap,
} from "../services/tactileMapService.js";

export function registerNavigationRoutes(
  app: Application,
  navigationService: NavigationService,
  onTactileMapChanged: () => void = () => {},
) {
  app.get("/api/navigation/tactile-map", requireAdmin, async (_request, response) => {
    try {
      response.json(await loadTactileMap());
    } catch (error) {
      console.error("Erro ao carregar mapa tátil:", error);
      response.status(500).json({
        error: "TACTILE_MAP_READ_FAILED",
      });
    }
  });

  app.put("/api/navigation/tactile-map", requireAdmin, async (request, response) => {
    try {
      const mapa = await saveTactileMap(request.body);
      onTactileMapChanged();
      response.json(mapa);
    } catch (error) {
      console.error("Erro ao atualizar mapa tátil:", error);
      response.status(400).json({
        error: "TACTILE_MAP_UPDATE_FAILED",
        message: error instanceof Error ? error.message : "Mapa inválido.",
      });
    }
  });

  app.get("/api/navigation/config", async (request, response) => {
    try {
      let environmentId: number | undefined;

      if (request.query.environmentId !== undefined) {
        environmentId = Number(request.query.environmentId);

        if (!Number.isInteger(environmentId) || environmentId <= 0) {
          return response.status(400).json({
            error: "environmentId inválido.",
          });
        }
      }

      const config = await navigationService.getConfig(environmentId);
      response.json(config);
    } catch (error) {
      console.error(
        "Erro ao carregar configuração de navegação:",
        error,
      );

      const message = error instanceof Error
        ? error.message
        : "Não foi possível carregar a configuração de navegação.";

      response.status(500).json({ error: message });
    }
  });
}
