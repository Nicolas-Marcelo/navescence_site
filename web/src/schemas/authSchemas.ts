import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail.")
    .email("Informe um endereço de e-mail válido."),

  password: z
    .string()
    .min(1, "Informe sua senha."),
});

export const cadastroSchema = z
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
        /[A-Za-zÀ-ÿ]/,
        "Informe um nome válido.",
      ),

    email: z
      .string()
      .trim()
      .min(1, "Informe seu e-mail.")
      .email(
        "Informe um endereço de e-mail válido.",
      )
      .max(
        180,
        "O e-mail informado é muito longo.",
      ),

    password: z
      .string()
      .min(
        8,
        "A senha deve possuir no mínimo 8 caracteres.",
      )
      .max(
        100,
        "A senha deve possuir no máximo 100 caracteres.",
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
      ),

    confirmPassword: z.string(),
  })
  .refine(
    data =>
      data.password === data.confirmPassword,
    {
      message: "As senhas não coincidem.",
      path: ["confirmPassword"],
    },
  );

export type LoginFormData =
  z.infer<typeof loginSchema>;

export type CadastroFormData =
  z.infer<typeof cadastroSchema>;