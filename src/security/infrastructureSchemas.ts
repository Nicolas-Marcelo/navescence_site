import {
  z,
} from "zod";

const nullableText = (
  max: number,
) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable();

const optionalNullableText = (
  max: number,
) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional();

const positiveId =
  z
    .number()
    .int()
    .positive();

const nullableCoordinate =
  z
    .number()
    .finite()
    .nullable();

export const sensorCreateSchema =
  z
    .object({
      code: z
        .string()
        .trim()
        .min(3)
        .max(30)
        .regex(
          /^[A-Za-z0-9_-]+$/,
          "Código inválido.",
        ),

      mac: z
        .string()
        .trim()
        .regex(
          /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/,
          "MAC inválido.",
        )
        .nullable(),

      name:
        nullableText(100),

      environmentId:
        positiveId.nullable(),

      location:
        nullableText(150),

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
        Object.keys(data).length >
        0,
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
      code: z
        .string()
        .trim()
        .min(2)
        .max(30)
        .regex(
          /^[A-Za-z0-9_-]+$/,
          "Código inválido.",
        ),

      name: z
        .string()
        .trim()
        .min(2)
        .max(100),

      type: z
        .enum([
          "CORREDOR",
          "SALA",
          "RECEPCAO",
          "BIBLIOTECA",
          "AREA_COMUM",
          "OUTRO",
        ])
        .nullable(),

      floor: z
        .string()
        .trim()
        .min(1)
        .max(60),

      description:
        nullableText(300),
    })
    .strict();

export const environmentUpdateSchema =
  environmentCreateSchema
    .partial()
    .refine(
      data =>
        Object.keys(data).length >
        0,
      {
        message:
          "Nenhum campo foi informado.",
      },
    );

export const poiCreateSchema =
  z
    .object({
      code: z
        .string()
        .trim()
        .min(2)
        .max(30)
        .regex(
          /^[A-Za-z0-9_-]+$/,
          "Código inválido.",
        ),

      name: z
        .string()
        .trim()
        .min(2)
        .max(100),

      type: z.enum([
        "ENTRADA",
        "SERVICO",
        "BANHEIRO",
        "SALA",
        "ACESSIBILIDADE",
        "REFERENCIA",
        "OUTRO",
      ]),

      description:
        nullableText(300),

      nodeId:
        positiveId,

      active:
        z.boolean(),
    })
    .strict();

export const poiUpdateSchema =
  z
    .object({
      code: z
        .string()
        .trim()
        .min(2)
        .max(30)
        .regex(
          /^[A-Za-z0-9_-]+$/,
        )
        .optional(),

      name: z
        .string()
        .trim()
        .min(2)
        .max(100)
        .optional(),

      type: z
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
          300,
        ),

      nodeId:
        positiveId.optional(),

      active:
        z.boolean().optional(),
    })
    .strict()
    .refine(
      data =>
        Object.keys(data).length >
        0,
      {
        message:
          "Nenhum campo foi informado.",
      },
    );

export const topologyCreateSchema =
  z
    .object({
      nodeA: z
        .string()
        .trim()
        .min(3)
        .max(30),

      nodeB: z
        .string()
        .trim()
        .min(3)
        .max(30),

      distance: z
        .number()
        .finite()
        .positive()
        .max(10000)
        .nullable(),
    })
    .strict()
    .refine(
      data =>
        data.nodeA !== data.nodeB,
      {
        message:
          "Um sensor não pode ser conectado a ele mesmo.",
        path: ["nodeB"],
      },
    );

export const verificationRunSchema =
  z
    .object({
      target: z
        .string()
        .trim()
        .min(1)
        .max(30),
    })
    .strict();