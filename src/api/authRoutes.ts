import type {
  Express,
  Request,
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
  resendVerification,
  verifyEmail,
} from "../auth/authService.js";

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
    case "INVALID_TOKEN":
    case "TOKEN_ALREADY_USED":
    case "TOKEN_EXPIRED":
      return 400;

    case "INVALID_CREDENTIALS":
      return 401;

    case "EMAIL_NOT_VERIFIED":
    case "USER_BLOCKED":
    case "USER_NOT_ACTIVE":
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

async function verifyHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const token =
      req.method === "GET"
        ? req.query.token
        : req.body?.token;

    if (
      typeof token !==
      "string"
    ) {
      res.status(400).json({
        error:
          "INVALID_TOKEN",
      });

      return;
    }

    const user =
      await verifyEmail(
        token,
      );

    res.json({
      message:
        "EMAIL_VERIFIED",
      user,
    });
  } catch (error) {
    handleError(
      res,
      error,
    );
  }
}

export function
registerAuthRoutes(
  app: Express,
): void {
  app.post(
    "/api/auth/register",
    async (req, res) => {
      try {
        const user =
          await register({
            name:
              req.body?.name,
            email:
              req.body?.email,
            password:
              req.body?.password,
          });

        res.status(201).json({
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
    async (req, res) => {
      try {
        const result =
          await login({
            email:
              req.body?.email,
            password:
              req.body?.password,
          });

        res.json(result);
      } catch (error) {
        handleError(
          res,
          error,
        );
      }
    },
  );

  app.post(
    "/api/auth/verify-email",
    verifyHandler,
  );

  app.get(
    "/api/auth/verify-email",
    verifyHandler,
  );

  app.post(
    "/api/auth/resend-verification",
    async (req, res) => {
      try {
        const email =
          req.body?.email;

        if (
          typeof email ===
          "string"
        ) {
          await resendVerification(
            email,
          );
        }

        /*
         * Sempre retornamos a
         * mesma mensagem.
         * Evita enumeração de e-mails.
         */
        res.json({
          message:
            "VERIFICATION_SENT_IF_AVAILABLE",
        });
      } catch (error) {
        console.error(
          "[AUTH] Falha no reenvio:",
          error,
        );

        res.json({
          message:
            "VERIFICATION_SENT_IF_AVAILABLE",
        });
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
          res.status(401).json({
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