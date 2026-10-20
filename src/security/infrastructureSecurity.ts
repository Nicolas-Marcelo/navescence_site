import type {
  Application,
  NextFunction,
  Request,
  Response,
} from "express";

import {
  requireAdmin,
} from "../auth/authMiddleware.js";

import {
  environmentCreateSchema,
  environmentUpdateSchema,
  poiCreateSchema,
  poiUpdateSchema,
  sensorCreateSchema,
  sensorStatusSchema,
  sensorUpdateSchema,
  topologyCreateSchema,
  verificationRunSchema,
} from "./infrastructureSchemas.js";

import {
  validateBody,
} from "./validationMiddleware.js";

function onlyMethod(
  method: string,
  middleware: (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => unknown,
) {
  return (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    if (
      request.method !== method
    ) {
      return next();
    }

    return middleware(
      request,
      response,
      next,
    );
  };
}

function sensorValidation(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  if (
    request.method === "POST"
  ) {
    return validateBody(
      sensorCreateSchema,
    )(
      request,
      response,
      next,
    );
  }

  if (
    request.method === "PUT"
  ) {
    return validateBody(
      sensorUpdateSchema,
    )(
      request,
      response,
      next,
    );
  }

  if (
    request.method === "PATCH"
  ) {
    return validateBody(
      sensorStatusSchema,
    )(
      request,
      response,
      next,
    );
  }

  next();
}

function environmentValidation(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  if (
    request.method === "POST"
  ) {
    return validateBody(
      environmentCreateSchema,
    )(
      request,
      response,
      next,
    );
  }

  if (
    request.method === "PUT"
  ) {
    return validateBody(
      environmentUpdateSchema,
    )(
      request,
      response,
      next,
    );
  }

  next();
}

function poiValidation(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  if (
    request.method === "POST"
  ) {
    return validateBody(
      poiCreateSchema,
    )(
      request,
      response,
      next,
    );
  }

  if (
    request.method === "PUT"
  ) {
    return validateBody(
      poiUpdateSchema,
    )(
      request,
      response,
      next,
    );
  }

  next();
}

export function registerInfrastructureSecurity(
  app: Application,
) {
  app.use(
    "/api/dashboard",
    requireAdmin,
  );

  app.use(
    "/api/nodes",
    requireAdmin,
  );

  app.use(
    "/api/sensors",
    requireAdmin,
    sensorValidation,
  );

  app.use(
    "/api/environments",
    requireAdmin,
    environmentValidation,
  );

  app.use(
    "/api/pois",
    requireAdmin,
    poiValidation,
  );

  app.use(
    "/api/topology",
    requireAdmin,
    onlyMethod(
      "POST",
      validateBody(
        topologyCreateSchema,
      ),
    ),
  );

  app.use(
    "/api/alerts",
    requireAdmin,
  );

  app.use(
    "/api/verifications",
    requireAdmin,
    (
      request,
      response,
      next,
    ) => {
      if (
        request.method ===
          "POST" &&
        request.path ===
          "/run"
      ) {
        return validateBody(
          verificationRunSchema,
        )(
          request,
          response,
          next,
        );
      }

      next();
    },
  );
}