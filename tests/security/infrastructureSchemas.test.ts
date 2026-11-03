import {
  describe,
  expect,
  it,
} from "vitest";

import {
  environmentCreateSchema,
  poiCreateSchema,
  sensorCreateSchema,
  topologyCreateSchema,
} from "../../src/security/infrastructureSchemas.js";

describe(
  "Validação de sensores",
  () => {
    const validSensor = {
      code:
        "NAV_S01",

      mac:
        "68:09:47:9E:DC:16",

      name:
        "Sensor 01",

      environmentId:
        1,

      location:
        "Corredor",

      x:
        10,

      y:
        20,

      active:
        true,

      maintenance:
        false,
    };

    it(
      "aceita sensor válido",
      () => {
        const result =
          sensorCreateSchema
            .safeParse(
              validSensor,
            );

        expect(
          result.success,
        ).toBe(true);
      },
    );

    it(
      "rejeita campos extras",
      () => {
        const result =
          sensorCreateSchema
            .safeParse({
              ...validSensor,

              role:
                "ADMIN",
            });

        expect(
          result.success,
        ).toBe(false);
      },
    );

    it(
      "rejeita MAC inválido",
      () => {
        const result =
          sensorCreateSchema
            .safeParse({
              ...validSensor,

              mac:
                "banana",
            });

        expect(
          result.success,
        ).toBe(false);
      },
    );

    it(
      "rejeita MAC reservado",
      () => {
        const result =
          sensorCreateSchema
            .safeParse({
              ...validSensor,

              mac:
                "00:00:00:00:00:00",
            });

        expect(
          result.success,
        ).toBe(false);
      },
    );

    it(
      "rejeita coordenada absurda",
      () => {
        const result =
          sensorCreateSchema
            .safeParse({
              ...validSensor,

              x:
                999999999,
            });

        expect(
          result.success,
        ).toBe(false);
      },
    );
  },
);

describe(
  "Validação de ambientes",
  () => {
    it(
      "rejeita tipo desconhecido",
      () => {
        const result =
          environmentCreateSchema
            .safeParse({
              code:
                "IADB",

              name:
                "IADB",

              type:
                "BATCAVERNA",

              floor:
                "Térreo",

              description:
                null,
            });

        expect(
          result.success,
        ).toBe(false);
      },
    );
  },
);

describe(
  "Validação de POIs",
  () => {
    it(
      "rejeita sensor com ID zero",
      () => {
        const result =
          poiCreateSchema
            .safeParse({
              code:
                "POI_01",

              name:
                "Recepção",

              type:
                "SERVICO",

              description:
                null,

              nodeId:
                0,

              active:
                true,
            });

        expect(
          result.success,
        ).toBe(false);
      },
    );
  },
);

describe(
  "Validação da topologia",
  () => {
    it(
      "rejeita conexão do sensor com ele mesmo",
      () => {
        const result =
          topologyCreateSchema
            .safeParse({
              nodeA:
                "NAV_S01",

              nodeB:
                "NAV_S01",

              distance:
                5,
            });

        expect(
          result.success,
        ).toBe(false);
      },
    );

    it(
      "rejeita distância negativa",
      () => {
        const result =
          topologyCreateSchema
            .safeParse({
              nodeA:
                "NAV_S01",

              nodeB:
                "NAV_S02",

              distance:
                -5,
            });

        expect(
          result.success,
        ).toBe(false);
      },
    );
  },
);