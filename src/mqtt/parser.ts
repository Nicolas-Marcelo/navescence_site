import type {
  ScanReading
} from "../models/scan.js";

function toNumber(value: string): number | undefined {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : undefined;
}

export function parseScan(payload: string): ScanReading {
  const reading:
    ScanReading = {};

  let content = payload;

  const advertisingKey = " | advertising=";

  if (payload.includes(advertisingKey)) {
    const [main, ...advertising] =
      payload.split(advertisingKey);

    content =
      main ?? "";

    reading.advertising =
      advertising.join(
        advertisingKey
      );
  }

  const fields =
    content.split(
      " | "
    );

  for (const field of fields) {
    const separator =
      field.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key =
      field
        .slice(
          0,
          separator
        )
        .trim();

    const value =
      field
        .slice(
          separator + 1
        )
        .trim();

    switch (key) {
      case "scanner":
        reading.scanner =
          value;
        break;

      case "nome":
        reading.name =
          value;
        break;

      case "mac":
        reading.mac =
          value;
        break;

      case "leituras":
        reading.readings =
          toNumber(value);
        break;

      case "validas":
        reading.validReadings =
          toNumber(value);
        break;

      case "descartadas":
        reading.discardedReadings =
          toNumber(value);
        break;

      case "rssi_medio":
        reading.averageRssi =
          toNumber(value);
        break;

      case "m15":
        reading.m15 =
          toNumber(value);
        break;

      case "minimo":
        reading.minRssi =
          toNumber(value);
        break;

      case "maximo":
        reading.maxRssi =
          toNumber(value);

        break;

    }
  }

  return reading;
}