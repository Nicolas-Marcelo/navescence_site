import {
  Building2,
  LogOut,
  UserRound,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import {
  useEnvironment,
  type EnvironmentSelection,
} from "../../context/EnvironmentContext";

export function Topbar() {
  const {
    user,
    logout,
  } = useAuth();

  const {
    environments,
    selectedEnvironmentId,
    setSelectedEnvironmentId,
  } = useEnvironment();

  const navigate =
    useNavigate();

  function sair() {
    logout();

    navigate(
      "/login",
      { replace: true },
    );
  }

  function alterarAmbiente(
    value: string,
  ) {
    const selection: EnvironmentSelection =
      value === "ALL"
        ? "ALL"
        : Number(value);

    setSelectedEnvironmentId(
      selection,
    );
  }

  const inicial =
    user?.name
      ?.trim()
      .charAt(0)
      .toUpperCase() ??
    "U";

  return (
    <header className="admin-topbar">
      <div className="topbar-context">
        <span className="topbar-context-label">
          PAINEL ADMINISTRATIVO
        </span>

        <strong>
          Monitoramento da infraestrutura
        </strong>
      </div>

      <div className="topbar-actions">
        <div className="environment-selector">
          <Building2
            size={17}
            aria-hidden="true"
          />

          <select
            aria-label="Ambiente selecionado"
            value={
              selectedEnvironmentId
            }
            onChange={event =>
              alterarAmbiente(
                event.target.value,
              )
            }
          >
            <option value="ALL">
              Todos os ambientes
            </option>

            {environments.map(
              environment => (
                <option
                  key={
                    environment.id
                  }
                  value={
                    environment.id
                  }
                >
                  {environment.name}
                  {environment.floor
                    ? ` · ${environment.floor}`
                    : ""}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="topbar-user">
          <div className="topbar-avatar">
            {inicial}
          </div>

          <div className="topbar-user-copy">
            <strong>
              {user?.name}
            </strong>

            <span>
              {user?.role === "ADMIN"
                ? "Administrador"
                : "Usuário"}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="topbar-icon-button"
          onClick={() =>
            navigate("/conta")
          }
          title="Minha conta"
          aria-label="Minha conta"
        >
          <UserRound size={19} />
        </button>

        <button
          type="button"
          className="topbar-icon-button danger"
          onClick={sair}
          title="Sair"
          aria-label="Sair"
        >
          <LogOut size={19} />
        </button>
      </div>
    </header>
  );
}