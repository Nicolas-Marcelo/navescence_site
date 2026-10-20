import {
  Navigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

export function HomePage() {
  const {
    authenticated,
    loading,
    user,
  } = useAuth();

  if (loading) {
    return (
      <main className="page-center">
        <div className="content-state">
          <div
            className="spinner"
            aria-hidden="true"
          />

          <span>
            Carregando NAVESCENCE...
          </span>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (user?.role === "ADMIN") {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  return (
    <Navigate
      to="/conta"
      replace
    />
  );
}