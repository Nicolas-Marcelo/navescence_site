import type {
  Application,
} from "express";

import cors from "cors";

import {
  config,
} from "../config/env.js";

export function registerCors(
  app: Application,
) {
  app.use(
    cors({
      origin: (
        origin,
        callback,
      ) => {
        /*
         * Requisições sem Origin:
         * - Flutter
         * - curl
         * - Postman
         * - comunicação servidor-servidor
         */
        if (!origin) {
          callback(
            null,
            true,
          );

          return;
        }

        if (
          config.web
            .allowedOrigins
            .includes(
              origin,
            )
        ) {
          callback(
            null,
            true,
          );

          return;
        }

        callback(
          new Error(
            "CORS_ORIGIN_DENIED",
          ),
        );
      },

      methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
      ],

      allowedHeaders: [
        "Content-Type",
        "Authorization",
      ],

      exposedHeaders: [
        "RateLimit",
        "RateLimit-Policy",
      ],

      credentials: false,

      maxAge: 600,
    }),
  );
}