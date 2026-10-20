import "dotenv/config";

function readNumber(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) return fallback;

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function readBoolean(
  value: string | undefined,
  fallback = false,
): boolean {
  if (!value) return fallback;

  return ["true", "1", "yes", "on"]
    .includes(value.toLowerCase());
}

const nodeEnv =
  process.env.NODE_ENV ?? "development";

const jwtSecret =
  process.env.JWT_SECRET?.trim() ||
  "navescence-dev-change-this-secret";

if (
  nodeEnv === "production" &&
  jwtSecret ===
    "navescence-dev-change-this-secret"
) {
  throw new Error(
    "JWT_SECRET deve ser configurado em produção.",
  );
}

export const config = {
  nodeEnv,

  mqtt: {
    host:
      process.env.MQTT_HOST ??
      "127.0.0.1",

    port: readNumber(
      process.env.MQTT_PORT,
      1884,
    ),

    user:
      process.env.MQTT_USER ??
      "",

    password:
      process.env.MQTT_PASSWORD ??
      "",
  },

  web: {
    port: readNumber(
      process.env.PORT,
      3000,
    ),

    publicBaseUrl:
      process.env.PUBLIC_BASE_URL ??
      "http://localhost:3000",
  },

  auth: {
    jwtSecret,

    jwtExpiresIn:
      process.env.JWT_EXPIRES_IN ??
      "30d",

    verificationMinutes:
      readNumber(
        process.env
          .EMAIL_VERIFICATION_MINUTES,
        60,
      ),
  },

  smtp: {
    host:
      process.env.SMTP_HOST ??
      "",

    port: readNumber(
      process.env.SMTP_PORT,
      587,
    ),

    secure: readBoolean(
      process.env.SMTP_SECURE,
      false,
    ),

    user:
      process.env.SMTP_USER ??
      "",

    password:
      process.env.SMTP_PASSWORD ??
      "",

    from:
      process.env.SMTP_FROM ??
      "NAVESCENCE <noreply@navescence.local>",
  },

  coordinator: {
    checkTimeout: 10000,
    nodeDelay: 1000,
    roundDelay: 90000,
  },
};