import express from "express";

import request from "supertest";

import jwt from "jsonwebtoken";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  config,
} from "../../src/config/env.js";

import {
  requireAdmin,
  requireAuth,
} from "../../src/auth/authMiddleware.js";

function createToken(
  role:
    "USER" |
    "ADMIN",
) {
  return jwt.sign(
    {
      role,
    },
    config.auth.jwtSecret,
    {
      subject:
        "1",

      expiresIn:
        "1h",
    },
  );
}

function createApp() {
  const app =
    express();

  app.get(
    "/private",
    requireAuth,
    (_req, res) => {
      res.json({
        ok: true,
      });
    },
  );

  app.get(
    "/admin",
    requireAdmin,
    (_req, res) => {
      res.json({
        ok: true,
      });
    },
  );

  return app;
}

describe(
  "Autenticação",
  () => {
    it(
      "bloqueia rota privada sem token",
      async () => {
        const response =
          await request(
            createApp(),
          )
            .get(
              "/private",
            );

        expect(
          response.status,
        ).toBe(401);
      },
    );

    it(
      "aceita usuário autenticado",
      async () => {
        const token =
          createToken(
            "USER",
          );

        const response =
          await request(
            createApp(),
          )
            .get(
              "/private",
            )
            .set(
              "Authorization",
              `Bearer ${token}`,
            );

        expect(
          response.status,
        ).toBe(200);
      },
    );

    it(
      "bloqueia USER em rota ADMIN",
      async () => {
        const token =
          createToken(
            "USER",
          );

        const response =
          await request(
            createApp(),
          )
            .get(
              "/admin",
            )
            .set(
              "Authorization",
              `Bearer ${token}`,
            );

        expect(
          response.status,
        ).toBe(403);

        expect(
          response.body.error,
        ).toBe(
          "FORBIDDEN",
        );
      },
    );

    it(
      "permite ADMIN",
      async () => {
        const token =
          createToken(
            "ADMIN",
          );

        const response =
          await request(
            createApp(),
          )
            .get(
              "/admin",
            )
            .set(
              "Authorization",
              `Bearer ${token}`,
            );

        expect(
          response.status,
        ).toBe(200);
      },
    );

    it(
      "rejeita token adulterado",
      async () => {
        const response =
          await request(
            createApp(),
          )
            .get(
              "/private",
            )
            .set(
              "Authorization",
              "Bearer token-falso",
            );

        expect(
          response.status,
        ).toBe(401);

        expect(
          response.body.error,
        ).toBe(
          "INVALID_TOKEN",
        );
      },
    );

    it(
      "rejeita token expirado",
      async () => {
        const token =
          jwt.sign(
            {
              role:
                "USER",
            },
            config.auth
              .jwtSecret,
            {
              subject:
                "1",

              expiresIn:
                -1,
            },
          );

        const response =
          await request(
            createApp(),
          )
            .get(
              "/private",
            )
            .set(
              "Authorization",
              `Bearer ${token}`,
            );

        expect(
          response.status,
        ).toBe(401);
      },
    );
  },
);