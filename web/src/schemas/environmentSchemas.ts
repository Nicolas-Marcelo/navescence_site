import { z } from "zod";

export const environmentSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Informe o código do ambiente.")
    .max(30, "O código é muito longo.")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Use apenas letras, números, hífen e underline.",
    ),

  name: z
    .string()
    .trim()
    .min(2, "Informe o nome do ambiente.")
    .max(100, "O nome é muito longo."),

  type: z.string(),

  floor: z
    .string()
    .trim()
    .min(1, "Informe o pavimento.")
    .max(60, "O pavimento é muito longo."),

  description: z
    .string()
    .trim()
    .max(300, "A descrição deve possuir no máximo 300 caracteres."),
});

export type EnvironmentFormData =
  z.infer<typeof environmentSchema>;