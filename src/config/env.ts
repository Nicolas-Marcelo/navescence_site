import "dotenv/config";

function readNumber(
  value: string | undefined,
  fallback: number
): number {

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

export const config = {

  mqtt: {
    host:
      process.env.MQTT_HOST ??
      "127.0.0.1",

    port:
      readNumber(
        process.env.MQTT_PORT,
        1884
      ),

    user:
      process.env.MQTT_USER ??
      "",

    password:
      process.env.MQTT_PASSWORD ??
      ""
  },

  web: {
    port:
      readNumber(
        process.env.WEB_PORT,
        3000
      )
  },

  coordinator: {
    checkTimeout:
      25_000,

    nodeDelay:
      2_000,

    roundDelay:
      60_000
  }
};