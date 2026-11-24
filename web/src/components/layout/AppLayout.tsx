
import { Outlet, useLocation } from "react-router-dom";

import {
  EnvironmentProvider,
} from "../../context/EnvironmentContext";

import {
  EnvironmentDataProvider,
  useEnvironmentData,
} from "../../context/EnvironmentDataContext";

import { LoadingState } from "../ui/LoadingState";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

function AdminContent() {
  const location = useLocation();
  const environmentData = useEnvironmentData();

  const isEnvironmentPage = [
    "/admin/sensores",
    "/admin/pois",
    "/admin/topologia",
  ].includes(location.pathname);

  return (
    <div className="admin-shell">
      <Sidebar />

      <div className="admin-main">
        <Topbar />

        <main className="admin-content">
          {isEnvironmentPage && environmentData.loading ? (
            <LoadingState message="Carregando ambiente..." />
          ) : isEnvironmentPage && environmentData.error ? (
            <div className="alert error" role="alert">
              {environmentData.error}

              <button
                type="button"
                className="button secondary"
                style={{ marginLeft: 12 }}
                onClick={environmentData.reload}
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}

export function AppLayout() {
  return (
    <EnvironmentProvider>
      <EnvironmentDataProvider>
        <AdminContent />
      </EnvironmentDataProvider>
    </EnvironmentProvider>
  );
}
