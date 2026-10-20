import {
  useState,
} from "react";

import {
  Link,
  Navigate,
  useLocation,
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
  apiRequest,
} from "../../services/api";

import { useAuth } from "../../context/AuthContext";

export function LoginPage() {
  const {
    login,
    authenticated,
  } = useAuth();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [serverError, setServerError] =
    useState<string | null>(null);

  const [showResend, setShowResend] =
    useState(false);

  const [resendMessage, setResendMessage] =
    useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<LoginFormData>({
    resolver:
      zodResolver(loginSchema),

    defaultValues: {
      email: "",
      password: "",
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
    data: LoginFormData,
  ) {
    setServerError(null);
    setShowResend(false);
    setResendMessage(null);

    try {
      await login(
        data.email.trim(),
        data.password,
      );

      const state =
        location.state as
          | { from?: string }
          | null;

      navigate(
        state?.from ?? "/conta",
        {
          replace: true,
        },
      );
    } catch (error) {
      if (error instanceof ApiError) {
        if (
          error.code ===
          "EMAIL_NOT_VERIFIED"
        ) {
          setServerError(
            "Confirme seu e-mail antes de entrar.",
          );

          setShowResend(true);
          return;
        }

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
      }

      setServerError(
        "Não foi possível realizar o login.",
      );
    }
  }

  async function reenviarVerificacao() {
    const email =
      getValues("email").trim();

    if (!email) {
      setResendMessage(
        "Informe seu e-mail primeiro.",
      );

      return;
    }

    try {
      await apiRequest(
        "/api/auth/resend-verification",
        {
          method: "POST",

          body: JSON.stringify({
            email,
          }),
        },
      );

      setResendMessage(
        "Se o e-mail estiver cadastrado, uma nova verificação foi gerada.",
      );
    } catch {
      setResendMessage(
        "Não foi possível solicitar uma nova verificação.",
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
            Acesso
          </span>

          <h1>Entre na sua conta</h1>

          <p>
            Utilize seu e-mail e senha
            para continuar.
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
            handleSubmit(onSubmit)
          }
          noValidate
        >
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
              autoComplete="current-password"
              aria-invalid={
                Boolean(errors.password)
              }
              {...register("password")}
            />

            {errors.password && (
              <span className="field-error">
                {errors.password.message}
              </span>
            )}
          </div>

          <button
            className="button primary full"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Entrando..."
              : "Entrar"}
          </button>
        </form>

        {showResend && (
          <div className="resend-box">
            <button
              className="text-button"
              type="button"
              onClick={
                reenviarVerificacao
              }
            >
              Reenviar e-mail de verificação
            </button>

            {resendMessage && (
              <p>{resendMessage}</p>
            )}
          </div>
        )}

        <footer className="auth-footer">
          <span>
            Ainda não possui uma conta?
          </span>

          <Link to="/cadastro">
            Criar conta
          </Link>
        </footer>
      </section>
    </main>
  );
}