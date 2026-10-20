import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

export function ContaPage() {
  const {
    user,
    logout,
  } = useAuth();

  const navigate =
    useNavigate();

  if (!user) return null;

  function sair() {
    logout();

    navigate(
      "/login",
      {
        replace: true,
      },
    );
  }

  const inicial =
    user.name
      .trim()
      .charAt(0)
      .toUpperCase();

  return (
    <>
      <header className="topbar">
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

        <nav className="topnav">
          <button
            className="text-button"
            type="button"
            onClick={sair}
          >
            Sair
          </button>
        </nav>
      </header>

      <main className="dashboard">
        <span className="eyebrow">
          Usuário
        </span>

        <h1>Minha conta</h1>

        <p className="muted">
          Dados vinculados ao seu acesso
          ao NAVESCENCE.
        </p>

        <section className="profile-card">
          <div className="profile-header">
            <div className="avatar">
              {inicial}
            </div>

            <div>
              <h2>{user.name}</h2>
              <p>{user.email}</p>
            </div>
          </div>

          <dl className="profile-data">
            <div>
              <dt>Nome</dt>
              <dd>{user.name}</dd>
            </div>

            <div>
              <dt>E-mail</dt>
              <dd>{user.email}</dd>
            </div>

            <div>
              <dt>Situação</dt>
              <dd>
                {user.status === "ACTIVE"
                  ? "Conta ativa"
                  : user.status}
              </dd>
            </div>

            <div>
              <dt>Tipo de usuário</dt>
              <dd>
                {user.role === "ADMIN"
                  ? "Administrador"
                  : "Usuário"}
              </dd>
            </div>
          </dl>
        </section>
      </main>
    </>
  );
}