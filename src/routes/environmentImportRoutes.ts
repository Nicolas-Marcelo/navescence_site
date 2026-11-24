
import { Router } from "express";
import { Prisma } from "../generated/prisma/client.js";
import type { PrismaClient } from "../generated/prisma/client.js";
import { validateEnvironmentImport } from "../services/environmentImportService.js";

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
        error: error instanceof Error ? error.message : "Configuração inválida.",
      });
    }
  });

  router.post("/", async (req, res) => {
    let data: ReturnType<typeof validateEnvironmentImport>;

    try {
      data = validateEnvironmentImport(req.body);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Configuração inválida.",
      });
      return;
    }

    try {
      const environment = data.environment;

      const existing = await prisma.environment.findUnique({
        where: { code: environment.code },
        select: { id: true, navigationConfig: true },
      });

      if (existing?.navigationConfig != null) {
        res.status(409).json({
          error: "Este ambiente já possui uma configuração. A importação foi cancelada para evitar sobrescrita.",
        });
        return;
      }

      const payload = JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue;

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
      console.error("[AMBIENTES] Erro ao importar:", error);

      res.status(500).json({
        error: "ENVIRONMENT_IMPORT_FAILED",
        message: "Não foi possível salvar a configuração.",
      });
    }
  });

  router.get("/by-id/:id", async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "ID do ambiente inválido." });
      return;
    }

    try {
      const environment = await prisma.environment.findUnique({
        where: { id },
        select: {
          id: true,
          code: true,
          name: true,
          floor: true,
          updatedAt: true,
          navigationConfig: true,
        },
      });

      if (!environment) {
        res.status(404).json({ error: "Ambiente não encontrado." });
        return;
      }

      if (environment.navigationConfig === null) {
        res.json({
          imported: false,
          environmentId: environment.id,
          code: environment.code,
          name: environment.name,
          updatedAt: environment.updatedAt.toISOString(),
        });
        return;
      }

      const configuration = validateEnvironmentImport(
        environment.navigationConfig,
      );

      const physicalNodes = await prisma.node.findMany({
        where: {
          code: {
            in: configuration.sensors.map(sensor => sensor.nodeId),
          },
        },
        select: {
          id: true,
          code: true,
          mac: true,
          name: true,
          active: true,
          maintenance: true,
        },
      });

      const physicalByCode = new Map(
        physicalNodes.map(node => [node.code, node]),
      );

      res.json({
        imported: true,
        environmentId: environment.id,
        code: environment.code,
        name: environment.name,
        floor: environment.floor,
        updatedAt: environment.updatedAt.toISOString(),
        configuration,
        physicalSensors: configuration.sensors.map(sensor => {
          const physical = physicalByCode.get(sensor.nodeId);

          return {
            ...sensor,
            physicalId: physical?.id ?? null,
            mac: physical?.mac ?? null,
            name: physical?.name ?? sensor.nodeId,
            registered: Boolean(physical),
            active: physical?.active ?? false,
            maintenance: physical?.maintenance ?? false,
          };
        }),
      });
    } catch (error) {
      console.error("[AMBIENTES] Falha ao consultar configuração:", error);

      res.status(500).json({
        error: "ENVIRONMENT_CONFIG_READ_FAILED",
        message: "Não foi possível carregar a configuração.",
      });
    }
  });

  router.put("/by-id/:id/config", async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "ID do ambiente inválido." });
      return;
    }

    const expectedUpdatedAt = req.body?.expectedUpdatedAt;

    if (typeof expectedUpdatedAt !== "string" ||
      !Number.isFinite(Date.parse(expectedUpdatedAt))) {
      res.status(400).json({
        error: "Versão da configuração não informada ou inválida.",
      });
      return;
    }

    let configuration: ReturnType<typeof validateEnvironmentImport>;

    try {
      configuration = validateEnvironmentImport(req.body?.configuration);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Configuração inválida.",
      });
      return;
    }

    try {
      const current = await prisma.environment.findUnique({
        where: { id },
        select: {
          id: true,
          code: true,
          updatedAt: true,
          navigationConfig: true,
        },
      });

      if (!current) {
        res.status(404).json({ error: "Ambiente não encontrado." });
        return;
      }

      if (current.navigationConfig === null) {
        res.status(409).json({
          error: "Este ambiente não possui configuração importada.",
        });
        return;
      }

      if (configuration.environment.code !== current.code) {
        res.status(400).json({
          error: "Não é permitido alterar o código do ambiente por esta rota.",
        });
        return;
      }

      const sensorCodes = configuration.sensors.map(sensor => sensor.nodeId);

      const physicalSensors = await prisma.node.findMany({
        where: { code: { in: sensorCodes } },
        select: { code: true },
      });

      const registered = new Set(
        physicalSensors.map(sensor => sensor.code),
      );

      const unknownSensors = sensorCodes.filter(code => !registered.has(code));

      if (unknownSensors.length > 0) {
        res.status(400).json({
          error: `Sensores físicos não cadastrados: ${unknownSensors.join(", ")}`,
        });
        return;
      }

      const payload = JSON.parse(
        JSON.stringify(configuration),
      ) as Prisma.InputJsonValue;

      const updated = await prisma.environment.updateMany({
        where: {
          id,
          updatedAt: new Date(expectedUpdatedAt),
        },
        data: {
          navigationConfig: payload,
        },
      });

      if (updated.count !== 1) {
        res.status(409).json({
          error: "A configuração foi alterada em outra sessão. Atualize a página.",
        });
        return;
      }

      const saved = await prisma.environment.findUniqueOrThrow({
        where: { id },
        select: {
          id: true,
          code: true,
          updatedAt: true,
          navigationConfig: true,
        },
      });

      res.json({
        success: true,
        environmentId: saved.id,
        code: saved.code,
        updatedAt: saved.updatedAt.toISOString(),
        configuration: saved.navigationConfig,
      });
    } catch (error) {
      console.error("[AMBIENTES] Erro ao atualizar configuração:", error);

      res.status(500).json({
        error: "ENVIRONMENT_UPDATE_FAILED",
        message: "Não foi possível atualizar a configuração.",
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
          updatedAt: true,
          navigationConfig: true,
        },
      });

      if (!environment) {
        res.status(404).json({ error: "Ambiente não encontrado." });
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
        updatedAt: environment.updatedAt.toISOString(),
        configuration: environment.navigationConfig,
      });
    } catch (error) {
      console.error("[AMBIENTES] Erro ao consultar ambiente:", error);

      res.status(500).json({
        error: "ENVIRONMENT_CONFIG_READ_FAILED",
        message: "Não foi possível carregar a configuração.",
      });
    }
  });

  return router;
}
