import type {
  NextFunction,
  Request,
  Response,
} from "express";

import jwt from "jsonwebtoken";

import {
  config,
} from "../config/env.js";

export type AuthenticatedRole =
  | "USER"
  | "ADMIN";

interface JwtPayload {
  sub?: string | number;
  role?: string;
}

export interface AuthenticatedRequest
  extends Request {
  auth?: {
    userId: number;
    role: AuthenticatedRole;
  };
}

function getBearerToken(
  request: Request,
): string | null {
  const authorization =
    request.headers.authorization;

  if (!authorization) {
    return null;
  }

  const [
    scheme,
    token,
  ] = authorization.split(" ");

  if (
    scheme !== "Bearer" ||
    !token
  ) {
    return null;
  }

  return token.trim();
}

function parsePayload(
  payload: string | jwt.JwtPayload,
): {
  userId: number;
  role: AuthenticatedRole;
} | null {
  if (
    typeof payload === "string"
  ) {
    return null;
  }

  const subject =
    payload.sub;

  const userId =
    Number(subject);

  if (
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    return null;
  }

  const role =
    payload.role;

  if (
    role !== "USER" &&
    role !== "ADMIN"
  ) {
    return null;
  }

  return {
    userId,
    role,
  };
}

export function requireAuth(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
) {
  const token =
    getBearerToken(request);

  if (!token) {
    return response
      .status(401)
      .json({
        error: "UNAUTHORIZED",
        message:
          "Autenticação necessária.",
      });
  }

  try {
    const payload =
      jwt.verify(
        token,
        config.auth.jwtSecret,
      );

    const auth =
      parsePayload(payload);

    if (!auth) {
      return response
        .status(401)
        .json({
          error:
            "INVALID_TOKEN",
          message:
            "Token de acesso inválido.",
        });
    }

    request.auth = auth;

    next();
  } catch {
    return response
      .status(401)
      .json({
        error:
          "INVALID_TOKEN",
        message:
          "Token de acesso inválido ou expirado.",
      });
  }
}

export function requireAdmin(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
) {
  requireAuth(
    request,
    response,
    () => {
      if (
        request.auth?.role !==
        "ADMIN"
      ) {
        return response
          .status(403)
          .json({
            error: "FORBIDDEN",
            message:
              "Esta operação é restrita a administradores.",
          });
      }

      next();
    },
  );
}