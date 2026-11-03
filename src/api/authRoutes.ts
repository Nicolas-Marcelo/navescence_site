import type {
  Express,
  Response,
} from "express";

import {
  type AuthenticatedRequest,
  requireAuth,
} from "../auth/authMiddleware.js";

import {
  getCurrentUser,
  login,
  register,
} from "../auth/authService.js";

import {
  loginSchema,
  registerSchema,
} from "../auth/authSchemas.js";

import {
  validateBody,
} from "../security/validationMiddleware.js";

function errorCode(
  error: unknown,
): string {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return "INTERNAL_ERROR";
}

function errorStatus(
  code: string,
): number {
  switch (code) {
    case "INVALID_NAME":
    case "INVALID_EMAIL":
    case "WEAK_PASSWORD":
      return 400;

    case "INVALID_CREDENTIALS":
      return 401;

    case "USER_BLOCKED":
      return 403;

    case "EMAIL_IN_USE":
      return 409;

    case "USER_NOT_FOUND":
      return 404;

    default:
      return 500;
  }
}

function handleError(
  res: Response,
  error: unknown,
): void {
  const code =
    errorCode(error);

  console.error(
    "[AUTH] Erro:",
    error,
  );

  res
    .status(
      errorStatus(code),
    )
    .json({
      error: code,
    });
}

export function
registerAuthRoutes(
  app: Express,
): void {
  app.post(
    "/api/auth/register",

    validateBody(
      registerSchema,
    ),

    async (req, res) => {
      try {
        const user =
          await register(
            req.body,
          );

        res
          .status(201)
          .json({
            message:
              "USER_CREATED",

            user,
          });
      } catch (error) {
        handleError(
          res,
          error,
        );
      }
    },
  );

  app.post(
    "/api/auth/login",

    validateBody(
      loginSchema,
    ),

    async (req, res) => {
      try {
        const result =
          await login(
            req.body,
          );

        res.json(
          result,
        );
      } catch (error) {
        handleError(
          res,
          error,
        );
      }
    },
  );

  app.get(
    "/api/auth/me",
    requireAuth,

    async (
      req:
        AuthenticatedRequest,
      res,
    ) => {
      try {
        const userId =
          req.auth?.userId;

        if (!userId) {
          res
            .status(401)
            .json({
              error:
                "UNAUTHORIZED",
            });

          return;
        }

        const user =
          await getCurrentUser(
            userId,
          );

        res.json({
          user,
        });
      } catch (error) {
        handleError(
          res,
          error,
        );
      }
    },
  );
}