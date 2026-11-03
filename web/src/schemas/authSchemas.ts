import { z } from "zod";

const nameRegex =
  /^[\p{L}\p{M}]+(?:[ '\-][\p{L}\p{M}]+)*$/u;

function passwordBytes(
  value: string,
) {
  return new TextEncoder()
    .encode(value)
    .length;
}

function validEmailDomain(
  email: string,
) {
  const at =
    email.lastIndexOf("@");

  if (at <= 0) return false;

  const local =
    email.slice(0, at);

  const domain =
    email.slice(at + 1);

  if (
    local.length > 64 ||
    domain.length > 253 ||
    local.includes("..") ||
    domain.includes("..")
  ) {
    return false;
  }

  const labels =
    domain.split(".");

  if (labels.length < 2) {
    return false;
  }

  return labels.every(label =>
    /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/
      .test(label),
  );
}

export const loginSchema =
  z.object({
    email: z
      .string()
      .trim()
      .min(
        1,
        "Informe seu e-mail.",
      )
      .max(
        180,
        "E-mail inválido.",
      )
      .email(
        "Informe um endereço de e-mail válido.",
      ),

    password: z
      .string()
      .min(
        1,
        "Informe sua senha.",
      )
      .max(
        72,
        "Senha inválida.",
      ),
  });

export const cadastroSchema =
  z
    .object({
      name: z
        .string()
        .trim()
        .min(
          2,
          "O nome deve possuir pelo menos 2 caracteres.",
        )
        .max(
          120,
          "O nome deve possuir no máximo 120 caracteres.",
        )
        .regex(
          nameRegex,
          "Informe um nome válido.",
        )
        .refine(
          value =>
            (
              value.match(
                /\p{L}/gu,
              ) ?? []
            ).length >= 2,
          "Informe um nome válido.",
        ),

      email: z
        .string()
        .trim()
        .toLowerCase()
        .min(
          1,
          "Informe seu e-mail.",
        )
        .max(
          180,
          "O e-mail informado é muito longo.",
        )
        .email(
          "Informe um endereço de e-mail válido.",
        )
        .refine(
          validEmailDomain,
          "Informe um domínio de e-mail válido.",
        ),

      password: z
        .string()
        .min(
          8,
          "A senha deve possuir no mínimo 8 caracteres.",
        )
        .max(
          72,
          "A senha deve possuir no máximo 72 caracteres.",
        )
        .regex(
          /[a-z]/,
          "Inclua pelo menos uma letra minúscula.",
        )
        .regex(
          /[A-Z]/,
          "Inclua pelo menos uma letra maiúscula.",
        )
        .regex(
          /\d/,
          "Inclua pelo menos um número.",
        )
        .refine(
          value =>
            passwordBytes(
              value,
            ) <= 72,
          "A senha é muito longa.",
        ),

      confirmPassword:
        z.string(),
    })
    .strict()
    .refine(
      data =>
        data.password ===
        data.confirmPassword,
      {
        message:
          "As senhas não coincidem.",

        path: [
          "confirmPassword",
        ],
      },
    );

export type LoginFormData =
  z.infer<
    typeof loginSchema
  >;

export type CadastroFormData =
  z.infer<
    typeof cadastroSchema
  >;