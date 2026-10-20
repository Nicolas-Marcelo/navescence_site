import {
  useState,
} from "react";

import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  useForm,
} from "react-hook-form";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import {
  cadastroSchema,
  type CadastroFormData,
} from "../../schemas/authSchemas";

import {
  ApiError,
  apiRequest,
} from "../../services/api";

import type {
  RegisterResponse,
} from "../../types/auth";

import { useAuth } from "../../context/AuthContext";

export function CadastroPage() {
  const {
    authenticated,
  } = useAuth();

  const navigate =
    useNavigate();

  const [serverError, setServerError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<CadastroFormData>({
    resolver:
      zodResolver(cadastroSchema),

    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  if (authenticated) {
    return (
      <Navigate
        to="/conta"
        replace
      />
    );
  }

  async function onSubmit(
    data: CadastroFormData,
  ) {
    setServerError(null);
    setSuccess(false);

    try {
      await apiRequest<RegisterResponse>(
        "/api/auth/register",
        {
          method: "POST",

          body: JSON.stringify({
            name: data.name.trim(),
            email: data.email.trim(),
            password: data.password,
          }),
        },
      );

      setSuccess(true);

      setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 1800);
    } catch (error) {
      if (error instanceof ApiError) {
        if (
          error.code ===
          "EMAIL_IN_USE"
        ) {
          setError(
            "email",
            {
              message:
                "Este e-mail já está cadastrado.",
            },
          );

          return;
        }

        if (
          error.code ===
          "INVALID_NAME"
        ) {
          setError(
            "name",
            {
              message:
                "Informe um nome válido.",
            },
          );

          return;
        }

        if (
          error.code ===
          "INVALID_EMAIL"
        ) {
          setError(
            "email",
            {
              message:
                "Informe um e-mail válido.",
            },
          );

          return;
        }

        if (
          error.code ===
          "WEAK_PASSWORD"
        ) {
          setError(
            "password",
            {
              message:
                "A senha não atende aos requisitos de segurança.",
            },
          );

          return;
        }
      }

      setServerError(
        "Não foi possível realizar o cadastro.",
      );
    }
  }

  return (
    <main className="page-center">
      <section className="auth-card">
        <Link
          className="brand"
          to="/"
        >
          <span
            className="brand-logo"
            aria-hidden="true"
          >
            N
          </span>

          <span>NAVESCENCE</span>
        </Link>

        <div className="auth-heading">
          <span className="eyebrow">
            Cadastro
          </span>

          <h1>Crie sua conta</h1>

          <p>
            Informe seus dados para
            utilizar o NAVESCENCE.
          </p>
        </div>

        {serverError && (
          <div
            className="alert error"
            role="alert"
          >
            {serverError}
          </div>
        )}

        {success && (
          <div
            className="alert success"
            role="status"
          >
            Conta criada. Confirme seu
            e-mail antes de entrar.
          </div>
        )}

        <form
          onSubmit={
            handleSubmit(onSubmit)
          }
          noValidate
        >
          <div className="field">
            <label htmlFor="name">
              Nome
            </label>

            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Seu nome"
              aria-invalid={
                Boolean(errors.name)
              }
              {...register("name")}
            />

            {errors.name && (
              <span className="field-error">
                {errors.name.message}
              </span>
            )}
          </div>

          <div className="field">
            <label htmlFor="email">
              E-mail
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="nome@exemplo.com"
              aria-invalid={
                Boolean(errors.email)
              }
              {...register("email")}
            />

            {errors.email && (
              <span className="field-error">
                {errors.email.message}
              </span>
            )}
          </div>

          <div className="field">
            <label htmlFor="password">
              Senha
            </label>

            <input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={
                Boolean(errors.password)
              }
              {...register("password")}
            />

            <small className="field-help">
              No mínimo 8 caracteres,
              contendo letra maiúscula,
              minúscula e número.
            </small>

            {errors.password && (
              <span className="field-error">
                {errors.password.message}
              </span>
            )}
          </div>

          <div className="field">
            <label htmlFor="confirmPassword">
              Confirmar senha
            </label>

            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={
                Boolean(
                  errors.confirmPassword,
                )
              }
              {...register(
                "confirmPassword",
              )}
            />

            {errors.confirmPassword && (
              <span className="field-error">
                {
                  errors.confirmPassword
                    .message
                }
              </span>
            )}
          </div>

          <button
            className="button primary full"
            type="submit"
            disabled={
              isSubmitting ||
              success
            }
          >
            {isSubmitting
              ? "Criando conta..."
              : "Criar conta"}
          </button>
        </form>

        <footer className="auth-footer">
          <span>
            Já possui uma conta?
          </span>

          <Link to="/login">
            Entrar
          </Link>
        </footer>
      </section>
    </main>
  );
}