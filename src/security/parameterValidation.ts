import type {
  NextFunction,
  Request,
  Response,
} from "express";

export function
validatePositiveIdParam(
  request: Request,
  response: Response,
  next: NextFunction,
  value: string,
) {
  if (
    !/^\d+$/.test(
      value,
    )
  ) {
    return response
      .status(400)
      .json({
        error:
          "INVALID_ID",

        message:
          "O identificador deve ser um número inteiro positivo.",
      });
  }

  const id =
    Number(
      value,
    );

  if (
    !Number.isSafeInteger(
      id,
    ) ||
    id <= 0
  ) {
    return response
      .status(400)
      .json({
        error:
          "INVALID_ID",

        message:
          "O identificador informado é inválido.",
      });
  }

  next();
}