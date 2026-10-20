import { z } from "zod";

export const poiSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Informe o código.")
    .max(30, "O código é muito longo.")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Use apenas letras, números, hífen e underline.",
    ),

  name: z
    .string()
    .trim()
    .min(2, "Informe o nome do ponto de interesse.")
    .max(100, "O nome é muito longo."),

  type: z
    .string()
    .min(1, "Selecione o tipo."),

  nodeId: z
    .string()
    .min(1, "Selecione o sensor relacionado."),

  description: z
    .string()
    .trim()
    .max(300, "A descrição deve possuir no máximo 300 caracteres."),

  active: z.boolean(),
});

export type PoiFormData =
  z.infer<typeof poiSchema>;