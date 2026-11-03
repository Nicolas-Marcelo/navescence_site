import type {
  ReactNode,
} from "react";

import {
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({
  children,
}: AdminRouteProps) {
  const {
    authenticated,
    loading,
    user,
  } = useAuth();

  const location =
    useLocation();

  if (loading) {
    return (
      <main className="page-center">
        <div className="loading-card">
          <div
            className="spinner"
            aria-hidden="true"
          />

          <p>
            Carregando NAVESCENCE...
          </p>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    );
  }

  if (
    user?.role !==
    "ADMIN"
  ) {
    return (
      <Navigate
        to="/conta"
        replace
      />
    );
  }

  return children;
}