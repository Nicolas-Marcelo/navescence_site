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
  loginSchema,
  type LoginFormData,
} from "../../schemas/authSchemas";

import {
  ApiError,
} from "../../services/api";

import {
  useAuth,
} from "../../context/AuthContext";

export function LoginPage() {
  const {
    login,
    authenticated,
    user,
  } = useAuth();

  const navigate =
    useNavigate();

  const [
    serverError,
    setServerError,
  ] =
    useState<
      string | null
    >(null);

  const {
    register,
    handleSubmit,

    formState: {
      errors,
      isSubmitting,
    },
  } =
    useForm<
      LoginFormData
    >({
      resolver:
        zodResolver(
          loginSchema,
        ),

      defaultValues: {
        email: "",
        password: "",
      },
    });

  if (
    authenticated &&
    user
  ) {
    return (
      <Navigate
        to={
          user.role ===
          "ADMIN"
            ? "/admin"
            : "/conta"
        }
        replace
      />
    );
  }

  async function onSubmit(
    data:
      LoginFormData,
  ) {
    setServerError(null);

    try {
      const loggedUser =
        await login(
          data.email
            .trim(),

          data.password,
        );

      navigate(
        loggedUser.role ===
          "ADMIN"
          ? "/admin"
          : "/conta",
        {
          replace: true,
        },
      );
    } catch (error) {
      if (
        error instanceof
        ApiError
      ) {
        if (
          error.code ===
          "INVALID_CREDENTIALS"
        ) {
          setServerError(
            "E-mail ou senha incorretos.",
          );

          return;
        }

        if (
          error.code ===
          "USER_BLOCKED"
        ) {
          setServerError(
            "Esta conta está bloqueada.",
          );

          return;
        }

        if (
          error.code ===
          "TOO_MANY_ATTEMPTS"
        ) {
          setServerError(
            "Muitas tentativas de acesso. Aguarde alguns minutos.",
          );

          return;
        }

        if (
          error.code ===
          "NETWORK_ERROR"
        ) {
          setServerError(
            "Não foi possível conectar ao servidor.",
          );

          return;
        }

        setServerError(
          error.message ||
          "Não foi possível realizar o login.",
        );

        return;
      }

      setServerError(
        "Não foi possível realizar o login.",
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

          <span>
            NAVESCENCE
          </span>
        </Link>

        <div className="auth-heading">
          <span className="eyebrow">
            Acesso
          </span>

          <h1>
            Entre na sua conta
          </h1>

          <p>
            Utilize seu e-mail e
            senha para continuar.
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

        <form
          onSubmit={
            handleSubmit(
              onSubmit,
            )
          }
          noValidate
        >
          <div className="field">
            <label
              htmlFor="email"
            >
              E-mail
            </label>

            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={180}
              placeholder="nome@exemplo.com"
              aria-invalid={
                Boolean(
                  errors.email,
                )
              }
              {...register(
                "email",
              )}
            />

            {errors.email && (
              <span className="field-error">
                {
                  errors.email
                    .message
                }
              </span>
            )}
          </div>

          <div className="field">
            <label
              htmlFor="password"
            >
              Senha
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              maxLength={72}
              aria-invalid={
                Boolean(
                  errors.password,
                )
              }
              {...register(
                "password",
              )}
            />

            {errors.password && (
              <span className="field-error">
                {
                  errors.password
                    .message
                }
              </span>
            )}
          </div>

          <button
            className="button primary full"
            type="submit"
            disabled={
              isSubmitting
            }
          >
            {isSubmitting
              ? "Entrando..."
              : "Entrar"}
          </button>
        </form>

        <footer className="auth-footer">
          <span>
            Ainda não possui uma
            conta?
          </span>

          <Link to="/cadastro">
            Criar conta
          </Link>
        </footer>
      </section>
    </main>
  );
}