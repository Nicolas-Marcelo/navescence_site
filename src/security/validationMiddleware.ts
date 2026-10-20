import type {
  NextFunction,
  Request,
  Response,
} from "express";

import type {
  ZodType,
} from "zod";

function firstValidationMessage(
  error: {
    issues: Array<{
      message: string;
      path: PropertyKey[];
    }>;
  },
) {
  const issue =
    error.issues[0];

  if (!issue) {
    return "Dados inválidos.";
  }

  const field =
    issue.path
      .map(String)
      .join(".");

  if (!field) {
    return issue.message;
  }

  return `${field}: ${issue.message}`;
}

export function validateBody(
  schema: ZodType,
) {
  return (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    const result =
      schema.safeParse(
        request.body,
      );

    if (!result.success) {
      return response
        .status(400)
        .json({
          error:
            "VALIDATION_ERROR",

          message:
            firstValidationMessage(
              result.error,
            ),

          fields:
            result.error.issues.map(
              issue => ({
                field:
                  issue.path
                    .map(String)
                    .join("."),

                message:
                  issue.message,
              }),
            ),
        });
    }

    request.body =
      result.data;

    next();
  };
}