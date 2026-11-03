import type {
  Application,
  NextFunction,
  Request,
  Response,
} from "express";

interface HttpError
  extends Error {
  status?: number;
  statusCode?: number;
  type?: string;
}

export function registerApiErrorHandler(
  app: Application,
) {
  app.use(
    (
      error: HttpError,
      request: Request,
      response: Response,
      _next: NextFunction,
    ) => {
      console.error(
        "[API ERROR]",
        {
          method:
            request.method,

          path:
            request.path,

          message:
            error.message,

          stack:
            error.stack,
        },
      );

      if (
        error.type ===
          "entity.parse.failed" ||
        (
          error instanceof
            SyntaxError &&
          request.headers[
            "content-type"
          ]?.includes(
            "application/json",
          )
        )
      ) {
        response
          .status(400)
          .json({
            error:
              "INVALID_JSON",

            message:
              "O corpo JSON da requisição é inválido.",
          });

        return;
      }

      if (
        error.type ===
          "entity.too.large" ||
        error.status === 413 ||
        error.statusCode ===
          413
      ) {
        response
          .status(413)
          .json({
            error:
              "PAYLOAD_TOO_LARGE",

            message:
              "O conteúdo enviado excede o tamanho permitido.",
          });

        return;
      }

      if (
        error.message ===
        "CORS_ORIGIN_DENIED"
      ) {
        response
          .status(403)
          .json({
            error:
              "ORIGIN_NOT_ALLOWED",

            message:
              "Origem não autorizada.",
          });

        return;
      }

      response
        .status(500)
        .json({
          error:
            "INTERNAL_ERROR",

          message:
            "Ocorreu um erro interno no servidor.",
        });
    },
  );
}