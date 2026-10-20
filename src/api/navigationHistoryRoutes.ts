import type {
  Express,
  Response
} from "express";

import {
  requireAuth,
  type AuthenticatedRequest
} from "../auth/authMiddleware.js";

import { prisma } from "../database/prisma.js";

function parseHistoryId(
  value: unknown
): number | null {
  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return null;
  }

  const id = Number(value);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return null;
  }

  return id;
}

function handleHistoryError(
  res: Response,
  error: unknown
): void {
  console.error(
    "[HISTÓRICO USUÁRIO] Erro:",
    error
  );

  res.status(500).json({
    error: "INTERNAL_ERROR"
  });
}

export function registerNavigationHistoryRoutes(
  app: Express
): void {
  app.post(
    "/api/navigation-history/start",
    requireAuth,
    async (
      req: AuthenticatedRequest,
      res
    ) => {
      try {
        const userId =
          req.auth?.userId;

        if (!userId) {
          res.status(401).json({
            error: "UNAUTHORIZED"
          });

          return;
        }

        const originNodeCode =
          String(
            req.body?.originNodeCode ?? ""
          ).trim();

        const destinationNodeCode =
          String(
            req.body?.destinationNodeCode ?? ""
          ).trim();

        const destinationName =
          String(
            req.body?.destinationName ?? ""
          ).trim();

        if (
          !originNodeCode ||
          !destinationNodeCode ||
          !destinationName
        ) {
          res.status(400).json({
            error:
              "INVALID_NAVIGATION_DATA"
          });

          return;
        }

        const history =
          await prisma.navigationHistory.create({
            data: {
              userId,
              originNodeCode,
              destinationNodeCode,
              destinationName,

              events: {
                create: {
                  nodeCode:
                    originNodeCode,

                  label:
                    "Origem"
                }
              }
            }
          });

        console.log(
          `[HISTÓRICO USUÁRIO] ` +
          `Navegação ${history.id} iniciada | ` +
          `Usuário ${userId} | ` +
          `${originNodeCode} -> ${destinationNodeCode}`
        );

        res
          .status(201)
          .json(history);
      } catch (error) {
        handleHistoryError(
          res,
          error
        );
      }
    }
  );

  app.post(
    "/api/navigation-history/:id/event",
    requireAuth,
    async (
      req: AuthenticatedRequest,
      res
    ) => {
      try {
        const userId =
          req.auth?.userId;

        if (!userId) {
          res.status(401).json({
            error: "UNAUTHORIZED"
          });

          return;
        }

        const id =
          parseHistoryId(
            req.params.id
          );

        if (id == null) {
          res.status(400).json({
            error:
              "INVALID_HISTORY_ID"
          });

          return;
        }

        const nodeCode =
          String(
            req.body?.nodeCode ?? ""
          ).trim();

        if (!nodeCode) {
          res.status(400).json({
            error:
              "NODE_REQUIRED"
          });

          return;
        }

        const history =
          await prisma.navigationHistory.findFirst({
            where: {
              id,
              userId
            }
          });

        if (!history) {
          res.status(404).json({
            error:
              "HISTORY_NOT_FOUND"
          });

          return;
        }

        if (
          history.status !==
          "ACTIVE"
        ) {
          res.status(409).json({
            error:
              "HISTORY_NOT_ACTIVE"
          });

          return;
        }

        const label =
          req.body?.label == null
            ? null
            : String(
                req.body.label
              ).trim() || null;

        const event =
          await prisma.navigationEvent.create({
            data: {
              navigationHistoryId:
                id,

              nodeCode,

              label
            }
          });

        res
          .status(201)
          .json(event);
      } catch (error) {
        handleHistoryError(
          res,
          error
        );
      }
    }
  );

  app.post(
    "/api/navigation-history/:id/finish",
    requireAuth,
    async (
      req: AuthenticatedRequest,
      res
    ) => {
      try {
        const userId =
          req.auth?.userId;

        if (!userId) {
          res.status(401).json({
            error:
              "UNAUTHORIZED"
          });

          return;
        }

        const id =
          parseHistoryId(
            req.params.id
          );

        if (id == null) {
          res.status(400).json({
            error:
              "INVALID_HISTORY_ID"
          });

          return;
        }

        const history =
          await prisma.navigationHistory.findFirst({
            where: {
              id,
              userId
            }
          });

        if (!history) {
          res.status(404).json({
            error:
              "HISTORY_NOT_FOUND"
          });

          return;
        }

        if (
          history.status ===
          "COMPLETED"
        ) {
          res.json(history);

          return;
        }

        if (
          history.status ===
          "CANCELLED"
        ) {
          res.status(409).json({
            error:
              "HISTORY_ALREADY_CANCELLED"
          });

          return;
        }

        const updated =
          await prisma.navigationHistory.update({
            where: {
              id
            },

            data: {
              status:
                "COMPLETED",

              finishedAt:
                new Date()
            }
          });

        console.log(
          `[HISTÓRICO USUÁRIO] ` +
          `Navegação ${id} concluída | ` +
          `Usuário ${userId}`
        );

        res.json(updated);
      } catch (error) {
        handleHistoryError(
          res,
          error
        );
      }
    }
  );

  app.post(
    "/api/navigation-history/:id/cancel",
    requireAuth,
    async (
      req: AuthenticatedRequest,
      res
    ) => {
      try {
        const userId =
          req.auth?.userId;

        if (!userId) {
          res.status(401).json({
            error:
              "UNAUTHORIZED"
          });

          return;
        }

        const id =
          parseHistoryId(
            req.params.id
          );

        if (id == null) {
          res.status(400).json({
            error:
              "INVALID_HISTORY_ID"
          });

          return;
        }

        const history =
          await prisma.navigationHistory.findFirst({
            where: {
              id,
              userId
            }
          });

        if (!history) {
          res.status(404).json({
            error:
              "HISTORY_NOT_FOUND"
          });

          return;
        }

        if (
          history.status ===
          "CANCELLED"
        ) {
          res.json(history);

          return;
        }

        if (
          history.status ===
          "COMPLETED"
        ) {
          res.status(409).json({
            error:
              "HISTORY_ALREADY_COMPLETED"
          });

          return;
        }

        const updated =
          await prisma.navigationHistory.update({
            where: {
              id
            },

            data: {
              status:
                "CANCELLED",

              finishedAt:
                new Date()
            }
          });

        console.log(
          `[HISTÓRICO USUÁRIO] ` +
          `Navegação ${id} cancelada | ` +
          `Usuário ${userId}`
        );

        res.json(updated);
      } catch (error) {
        handleHistoryError(
          res,
          error
        );
      }
    }
  );

  app.get(
    "/api/navigation-history/today",
    requireAuth,
    async (
      req: AuthenticatedRequest,
      res
    ) => {
      try {
        const userId =
          req.auth?.userId;

        if (!userId) {
          res.status(401).json({
            error:
              "UNAUTHORIZED"
          });

          return;
        }

        const inicio =
          new Date();

        inicio.setHours(
          0,
          0,
          0,
          0
        );

        const fim =
          new Date(inicio);

        fim.setDate(
          fim.getDate() + 1
        );

        const history =
          await prisma.navigationHistory.findMany({
            where: {
              userId,

              startedAt: {
                gte: inicio,
                lt: fim
              }
            },

            include: {
              events: {
                orderBy: {
                  occurredAt:
                    "asc"
                }
              }
            },

            orderBy: {
              startedAt:
                "desc"
            }
          });

        res.json(history);
      } catch (error) {
        handleHistoryError(
          res,
          error
        );
      }
    }
  );
}