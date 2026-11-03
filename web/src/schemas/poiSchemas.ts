import {
  z,
} from "zod";

function optionalCoordinate(
  label: string,
) {
  return z
    .string()
    .trim()
    .refine(
      value => {
        if (value === "") {
          return true;
        }

        const number =
          Number(value);

        return (
          Number.isFinite(
            number,
          ) &&
          number >= -10000 &&
          number <= 10000
        );
      },
      `${label} inválida.`,
    );
}

export const poiSchema =
  z
    .object({
      code:
        z
          .string()
          .trim()
          .min(
            2,
            "Informe o código.",
          )
          .max(
            40,
            "O código deve possuir no máximo 40 caracteres.",
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
            "Informe o nome do ponto de interesse.",
          )
          .max(
            120,
            "O nome deve possuir no máximo 120 caracteres.",
          ),

      type:
        z
          .string()
          .min(
            1,
            "Selecione o tipo.",
          ),

      nodeId:
        z
          .string()
          .min(
            1,
            "Selecione o sensor de acesso.",
          ),

      description:
        z
          .string()
          .trim()
          .max(
            255,
            "A descrição deve possuir no máximo 255 caracteres.",
          ),

      x:
        optionalCoordinate(
          "Coordenada X",
        ),

      y:
        optionalCoordinate(
          "Coordenada Y",
        ),

      active:
        z.boolean(),
    })
    .strict()
    .superRefine(
      (
        data,
        context,
      ) => {
        if (
          (
            data.x === "" &&
            data.y !== ""
          ) ||
          (
            data.x !== "" &&
            data.y === ""
          )
        ) {
          context.addIssue({
            code: "custom",

            path: [
              "x",
            ],

            message:
              "Informe as coordenadas X e Y juntas.",
          });

          context.addIssue({
            code: "custom",

            path: [
              "y",
            ],

            message:
              "Informe as coordenadas X e Y juntas.",
          });
        }
      },
    );

export type PoiFormData =
  z.infer<
    typeof poiSchema
  >;