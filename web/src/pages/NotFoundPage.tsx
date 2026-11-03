import {
  Home,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

export function NotFoundPage() {
  const {
    authenticated,
    user,
  } = useAuth();

  let destination = "/";

  if (authenticated) {
    destination =
      user?.role === "ADMIN"
        ? "/admin"
        : "/conta";
  }

  return (
    <main className="page-center">
      <section className="auth-card center">
        <span className="eyebrow">
          Erro 404
        </span>

        <h1>
          Página não encontrada
        </h1>

        <p className="muted">
          O endereço informado não
          existe ou não está disponível.
        </p>

        <div
          style={{
            marginTop: "24px",
          }}
        >
          <Link
            to={destination}
            className="button primary"
          >
            <Home size={17} />

            Voltar
          </Link>
        </div>
      </section>
    </main>
  );
}