import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  ApiError,
  apiRequest,
} from "../../services/api";

type VerificationState =
  | "loading"
  | "success"
  | "error";

export function VerificarEmailPage() {
  const [params] =
    useSearchParams();

  const [state, setState] =
    useState<VerificationState>(
      "loading",
    );

  const [message, setMessage] =
    useState(
      "Aguarde enquanto validamos sua conta.",
    );

  useEffect(() => {
    const token =
      params.get("token");

    if (!token) {
      setState("error");

      setMessage(
        "O token de verificação não foi informado.",
      );

      return;
    }

    async function verificar() {
      try {
        await apiRequest(
          `/api/auth/verify-email?token=${encodeURIComponent(
            token!,
          )}`,
        );

        setState("success");

        setMessage(
          "Sua conta está ativa e já pode ser utilizada.",
        );
      } catch (error) {
        setState("error");

        if (
          error instanceof ApiError &&
          error.code ===
            "TOKEN_EXPIRED"
        ) {
          setMessage(
            "O link de verificação expirou.",
          );

          return;
        }

        if (
          error instanceof ApiError &&
          error.code ===
            "TOKEN_ALREADY_USED"
        ) {
          setMessage(
            "Este link já foi utilizado.",
          );

          return;
        }

        setMessage(
          "O link de verificação é inválido ou não está mais disponível.",
        );
      }
    }

    void verificar();
  }, [params]);

  return (
    <main className="page-center">
      <section className="auth-card center">
        <div
          className="brand-logo large"
          aria-hidden="true"
        >
          N
        </div>

        <span className="eyebrow">
          Verificação
        </span>

        {state === "loading" && (
          <>
            <div
              className="spinner"
              aria-hidden="true"
            />

            <h1>
              Confirmando seu e-mail
            </h1>
          </>
        )}

        {state === "success" && (
          <>
            <div className="status-icon success">
              ✓
            </div>

            <h1>E-mail confirmado</h1>
          </>
        )}

        {state === "error" && (
          <>
            <div className="status-icon error">
              !
            </div>

            <h1>
              Não foi possível confirmar
            </h1>
          </>
        )}

        <p>{message}</p>

        {state !== "loading" && (
          <Link
            className="button primary"
            to="/login"
          >
            Ir para o login
          </Link>
        )}
      </section>
    </main>
  );
}