
import { Router } from "express";
import type { PrismaClient, Prisma } from "../generated/prisma/client.js";
import {
  validateEnvironmentImport,
} from "../services/environmentImportService.js";

export function createEnvironmentImportRouter(prisma: PrismaClient) {
  const router = Router();

  router.post("/validate", (req, res) => {
    try {
      const data = validateEnvironmentImport(req.body);

      res.json({
        valid: true,
        environment: data.environment,
        summary: {
          sensors: data.sensors.length,
          pois: data.pois.length,
          connections: data.connections.length,
          tactileNodes: data.tactileMap.nodes.length,
          tactileEdges: data.tactileMap.edges.length,
        },
      });
    } catch (error) {
      res.status(400).json({
        valid: false,
        error: error instanceof Error
          ? error.message
          : "Configuração inválida.",
      });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const data = validateEnvironmentImport(req.body);
      const environment = data.environment;

      const existing = await prisma.environment.findUnique({
        where: { code: environment.code },
        select: { id: true, navigationConfig: true },
      });

      if (existing?.navigationConfig !== null &&
          existing?.navigationConfig !== undefined) {
        res.status(409).json({
          error: "Este ambiente já possui uma configuração. "
            + "A importação foi cancelada para evitar sobrescrita.",
        });
        return;
      }

      const payload = JSON.parse(
        JSON.stringify(data),
      ) as Prisma.InputJsonValue;

      const saved = await prisma.environment.upsert({
        where: { code: environment.code },
        create: {
          code: environment.code,
          name: environment.name,
          type: environment.type ?? null,
          floor: environment.floor,
          description: environment.description ?? null,
          navigationConfig: payload,
        },
        update: {
          navigationConfig: payload,
        },
        select: {
          id: true,
          code: true,
          name: true,
        },
      });

      res.status(201).json({
        success: true,
        status: "STORED",
        message: "Configuração salva no ambiente.",
        environment: saved,
        summary: {
          sensors: data.sensors.length,
          pois: data.pois.length,
          connections: data.connections.length,
        },
      });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error
          ? error.message
          : "Erro ao importar ambiente.",
      });
    }
  });

  router.get("/:code", async (req, res) => {
    const code = req.params.code.toUpperCase();

    try {
      const environment = await prisma.environment.findUnique({
        where: { code },
        select: {
          id: true,
          code: true,
          name: true,
          navigationConfig: true,
        },
      });

      if (!environment) {
        res.status(404).json({
          error: "Ambiente não encontrado.",
        });
        return;
      }

      if (environment.navigationConfig === null) {
        res.status(404).json({
          error: "Ambiente sem configuração importada.",
        });
        return;
      }

      res.json({
        environmentId: environment.id,
        code: environment.code,
        name: environment.name,
        configuration: environment.navigationConfig,
      });
    } catch (error) {
      res.status(500).json({
        error: "Não foi possível carregar a configuração.",
      });
    }
  });

  return router;
}
