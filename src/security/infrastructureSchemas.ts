import {
  z,
} from "zod";

const CODE_REGEX =
  /^[A-Za-z0-9_-]+$/;

const MAC_REGEX =
  /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;

const CONTROL_CHARS_REGEX =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

const RESERVED_MACS =
  new Set([
    "00:00:00:00:00:00",
    "FF:FF:FF:FF:FF:FF",
  ]);

function hasNoControlChars(
  value: string,
) {
  return !CONTROL_CHARS_REGEX.test(
    value,
  );
}

const nullableText = (
  max: number,
) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      hasNoControlChars,
      "O texto contém caracteres inválidos.",
    )
    .nullable();

const optionalNullableText = (
  max: number,
) =>
  nullableText(
    max,
  ).optional();

const positiveId =
  z
    .number()
    .int()
    .positive();

const nullableCoordinate =
  z
    .number()
    .finite()
    .min(-10000)
    .max(10000)
    .nullable();

const nullableOrientation =
  z
    .number()
    .finite()
    .min(0)
    .max(359.999)
    .nullable();

const poiApproachSchema =
  z
    .object({
      fromNodeId:
        positiveId,

      side:
        z.enum([
          "LEFT",
          "RIGHT",
          "FRONT",
        ]),

      distanceMeters:
        z
          .number()
          .finite()
          .positive()
          .max(1000)
          .nullable(),

      instruction:
        nullableText(
          500,
        ),
    })
    .strict();

export const sensorCreateSchema =
  z
    .object({
      code:
        z
          .string()
          .trim()
          .min(3)
          .max(30)
          .regex(
            CODE_REGEX,
            "Código inválido.",
          ),

      mac:
        z
          .string()
          .trim()
          .regex(
            MAC_REGEX,
            "MAC inválido.",
          )
          .refine(
            value =>
              !RESERVED_MACS.has(
                value.toUpperCase(),
              ),
            "MAC reservado.",
          )
          .nullable(),

      name:
        nullableText(
          100,
        ),

      environmentId:
        positiveId
          .nullable(),

      location:
        nullableText(
          150,
        ),

      x:
        nullableCoordinate,

      y:
        nullableCoordinate,

      active:
        z.boolean(),

      maintenance:
        z.boolean(),
    })
    .strict();

export const sensorUpdateSchema =
  sensorCreateSchema
    .partial()
    .refine(
      data =>
        Object.keys(
          data,
        ).length > 0,
      {
        message:
          "Nenhum campo foi informado.",
      },
    );

export const sensorStatusSchema =
  z
    .object({
      active:
        z.boolean(),

      maintenance:
        z.boolean(),
    })
    .strict();

export const environmentCreateSchema =
  z
    .object({
      code:
        z
          .string()
          .trim()
          .min(2)
          .max(30)
          .regex(
            CODE_REGEX,
            "Código inválido.",
          ),

      name:
        z
          .string()
          .trim()
          .min(2)
          .max(100),

      type:
        z
          .enum([
            "CORREDOR",
            "SALA",
            "RECEPCAO",
            "BIBLIOTECA",
            "AREA_COMUM",
            "OUTRO",
          ])
          .nullable(),

      floor:
        z
          .string()
          .trim()
          .min(1)
          .max(40),

      description:
        nullableText(
          200,
        ),
    })
    .strict();

export const environmentUpdateSchema =
  environmentCreateSchema
    .partial()
    .refine(
      data =>
        Object.keys(
          data,
        ).length > 0,
      {
        message:
          "Nenhum campo foi informado.",
      },
    );

export const poiCreateSchema =
  z
    .object({
      code:
        z
          .string()
          .trim()
          .min(2)
          .max(40)
          .regex(
            CODE_REGEX,
            "Código inválido.",
          ),

      name:
        z
          .string()
          .trim()
          .min(2)
          .max(120),

      type:
        z.enum([
          "ENTRADA",
          "SERVICO",
          "BANHEIRO",
          "SALA",
          "ACESSIBILIDADE",
          "REFERENCIA",
          "OUTRO",
        ]),

      description:
        nullableText(
          255,
        ),

      nodeId:
        positiveId,

      x:
        nullableCoordinate,

      y:
        nullableCoordinate,

      orientationDegrees:
        nullableOrientation,

      active:
        z.boolean(),

      approaches:
        z
          .array(
            poiApproachSchema,
          )
          .max(20)
          .optional(),
    })
    .strict()
    .refine(
      data =>
        (
          data.x === null &&
          data.y === null
        ) ||
        (
          data.x !== null &&
          data.y !== null
        ),
      {
        message:
          "Informe as coordenadas X e Y juntas.",

        path: [
          "x",
        ],
      },
    );

export const poiUpdateSchema =
  z
    .object({
      code:
        z
          .string()
          .trim()
          .min(2)
          .max(40)
          .regex(
            CODE_REGEX,
            "Código inválido.",
          )
          .optional(),

      name:
        z
          .string()
          .trim()
          .min(2)
          .max(120)
          .optional(),

      type:
        z
          .enum([
            "ENTRADA",
            "SERVICO",
            "BANHEIRO",
            "SALA",
            "ACESSIBILIDADE",
            "REFERENCIA",
            "OUTRO",
          ])
          .optional(),

      description:
        optionalNullableText(
          255,
        ),

      nodeId:
        positiveId
          .optional(),

      x:
        nullableCoordinate
          .optional(),

      y:
        nullableCoordinate
          .optional(),

      orientationDegrees:
        nullableOrientation
          .optional(),

      active:
        z
          .boolean()
          .optional(),

      approaches:
        z
          .array(
            poiApproachSchema,
          )
          .max(20)
          .optional(),
    })
    .strict()
    .refine(
      data =>
        Object.keys(
          data,
        ).length > 0,
      {
        message:
          "Nenhum campo foi informado.",
      },
    );

export const topologyCreateSchema =
  z
    .object({
      nodeA:
        z
          .string()
          .trim()
          .min(3)
          .max(30),

      nodeB:
        z
          .string()
          .trim()
          .min(3)
          .max(30),

      distance:
        z
          .number()
          .finite()
          .positive()
          .max(10000),
    })
    .strict()
    .refine(
      data =>
        data.nodeA !==
        data.nodeB,
      {
        message:
          "Um sensor não pode ser conectado a ele mesmo.",

        path: [
          "nodeB",
        ],
      },
    );

export const verificationRunSchema =
  z
    .object({
      target:
        z
          .string()
          .trim()
          .min(1)
          .max(30),
    })
    .strict();