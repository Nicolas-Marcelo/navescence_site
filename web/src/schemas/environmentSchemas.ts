import {
  z,
} from "zod";

const ENVIRONMENT_TYPES =
  [
    "CORREDOR",
    "SALA",
    "RECEPCAO",
    "BIBLIOTECA",
    "AREA_COMUM",
    "OUTRO",
  ] as const;

export const environmentSchema =
  z
    .object({
      code:
        z
          .string()
          .trim()
          .min(
            2,
            "Informe o código do ambiente.",
          )
          .max(
            30,
            "O código deve possuir no máximo 30 caracteres.",
          )
          .regex(
            /^[A-Za-z0-9_-]+$/,
            "Use apenas letras, números, hífen e underline.",
          ),

      name:
        z
          .string()
          .trim()
          .min(
            2,
            "Informe o nome do ambiente.",
          )
          .max(
            100,
            "O nome deve possuir no máximo 100 caracteres.",
          ),

      type:
        z
          .string()
          .refine(
            value =>
              value === "" ||
              ENVIRONMENT_TYPES.includes(
                value as
                  typeof ENVIRONMENT_TYPES[number],
              ),
            "Selecione um tipo de ambiente válido.",
          ),

      floor:
        z
          .string()
          .trim()
          .min(
            1,
            "Informe o pavimento.",
          )
          .max(
            40,
            "O pavimento deve possuir no máximo 40 caracteres.",
          ),

      description:
        z
          .string()
          .trim()
          .max(
            200,
            "A descrição deve possuir no máximo 200 caracteres.",
          ),
    })
    .strict();

export type EnvironmentFormData =
  z.infer<
    typeof environmentSchema
  >;