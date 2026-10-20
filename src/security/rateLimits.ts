import {
  rateLimit,
} from "express-rate-limit";

export const loginRateLimit =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit: 10,

    standardHeaders:
      "draft-8",

    legacyHeaders:
      false,

    message: {
      error:
        "TOO_MANY_ATTEMPTS",

      message:
        "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
    },
  });

export const registrationRateLimit =
  rateLimit({
    windowMs:
      60 * 60 * 1000,

    limit: 10,

    standardHeaders:
      "draft-8",

    legacyHeaders:
      false,

    message: {
      error:
        "TOO_MANY_ATTEMPTS",

      message:
        "Muitas tentativas de cadastro. Tente novamente mais tarde.",
    },
  });

export const verificationRateLimit =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit: 5,

    standardHeaders:
      "draft-8",

    legacyHeaders:
      false,

    message: {
      error:
        "TOO_MANY_ATTEMPTS",

      message:
        "Muitas solicitações de verificação. Aguarde alguns minutos.",
    },
  });

export const mutationRateLimit =
  rateLimit({
    windowMs:
      60 * 1000,

    limit: 60,

    standardHeaders:
      "draft-8",

    legacyHeaders:
      false,

    skip: request =>
      ["GET", "HEAD", "OPTIONS"]
        .includes(
          request.method,
        ),

    message: {
      error:
        "TOO_MANY_REQUESTS",

      message:
        "Muitas alterações foram solicitadas em pouco tempo.",
    },
  });