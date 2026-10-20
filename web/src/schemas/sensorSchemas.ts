import { z } from "zod";

const optionalNumber = z
  .string()
  .trim()
  .refine(
    value =>
      value === "" ||
      Number.isFinite(Number(value)),
    "Informe um número válido.",
  );

export const sensorSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Informe o código do sensor.")
    .max(30, "O código é muito longo.")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Use apenas letras, números, hífen e underline.",
    ),

  name: z
    .string()
    .trim()
    .max(100, "O nome é muito longo."),

  mac: z
    .string()
    .trim()
    .refine(
      value =>
        value === "" ||
        /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(value),
      "Informe um MAC no formato AA:BB:CC:DD:EE:FF.",
    ),

  environmentId: z.string(),

  location: z
    .string()
    .trim()
    .max(150, "A localização é muito longa."),

  x: optionalNumber,
  y: optionalNumber,

  active: z.boolean(),
  maintenance: z.boolean(),
});

export type SensorFormData =
  z.infer<typeof sensorSchema>;