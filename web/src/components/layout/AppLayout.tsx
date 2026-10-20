import { Outlet } from "react-router-dom";

import {
  EnvironmentProvider,
} from "../../context/EnvironmentContext";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppLayout() {
  return (
    <EnvironmentProvider>
      <div className="admin-shell">
        <Sidebar />

        <div className="admin-main">
          <Topbar />

          <main className="admin-content">
            <Outlet />
          </main>
        </div>
      </div>
    </EnvironmentProvider>
  );
}