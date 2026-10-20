import {
  Link,
  Navigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

export function HomePage() {
  const {
    authenticated,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <main className="page-center">
        <div
          className="spinner"
          aria-label="Carregando"
        />
      </main>
    );
  }

  if (authenticated) {
    return (
      <Navigate
        to="/conta"
        replace
      />
    );
  }

  return (
    <main className="page-center">
      <section className="hero">
        <div
          className="brand-logo large"
          aria-hidden="true"
        >
          N
        </div>

        <span className="eyebrow">
          Navegação assistiva indoor
        </span>

        <h1>NAVESCENCE</h1>

        <p className="hero-description">
          Sistema de apoio à navegação em
          ambientes internos, desenvolvido
          para ampliar a autonomia de pessoas
          com deficiência visual.
        </p>

        <div className="hero-actions">
          <Link
            className="button primary"
            to="/login"
          >
            Entrar
          </Link>

          <Link
            className="button secondary"
            to="/cadastro"
          >
            Criar conta
          </Link>
        </div>
      </section>
    </main>
  );
}