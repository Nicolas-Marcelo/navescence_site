import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import {
  AuthProvider,
} from "./context/AuthContext";

import {
  ProtectedRoute,
} from "./components/ProtectedRoute";

import {
  AppLayout,
} from "./components/layout/AppLayout";

import {
  HomePage,
} from "./pages/HomePage";

import {
  LoginPage,
} from "./pages/auth/LoginPage";

import {
  CadastroPage,
} from "./pages/auth/CadastroPage";

import {
  VerificarEmailPage,
} from "./pages/auth/VerificarEmailPage";

import {
  ContaPage,
} from "./pages/user/ContaPage";

import {
  HistoricoUsuarioPage,
} from "./pages/user/HistoricoUsuarioPage";

import {
  DashboardPage,
} from "./pages/admin/DashboardPage";

import {
  SensoresPage,
} from "./pages/admin/SensoresPage";

import {
  SensorDetalhePage,
} from "./pages/admin/SensorDetalhePage";

import {
  AlertasPage,
} from "./pages/admin/AlertasPage";

import {
  AmbientesPage,
} from "./pages/admin/AmbientesPage";

import {
  PoisPage,
} from "./pages/admin/PoisPage";

import {
  TopologiaPage,
} from "./pages/admin/TopologiaPage";

import {
  UsuariosPage,
} from "./pages/admin/UsuariosPage";

import {
  HistoricoPage,
} from "./pages/admin/HistoricoPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <HomePage />
            }
          />

          <Route
            path="/login"
            element={
              <LoginPage />
            }
          />

          <Route
            path="/cadastro"
            element={
              <CadastroPage />
            }
          />

          <Route
            path="/verificar-email"
            element={
              <VerificarEmailPage />
            }
          />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/admin"
              element={
                <DashboardPage />
              }
            />

            <Route
              path="/admin/sensores"
              element={
                <SensoresPage />
              }
            />

            <Route
              path="/admin/sensores/:code"
              element={
                <SensorDetalhePage />
              }
            />

            <Route
              path="/admin/alertas"
              element={
                <AlertasPage />
              }
            />

            <Route
              path="/admin/ambientes"
              element={
                <AmbientesPage />
              }
            />

            <Route
              path="/admin/pois"
              element={
                <PoisPage />
              }
            />

            <Route
              path="/admin/topologia"
              element={
                <TopologiaPage />
              }
            />

            <Route
              path="/admin/usuarios"
              element={
                <UsuariosPage />
              }
            />

            <Route
              path="/admin/historico"
              element={
                <HistoricoPage />
              }
            />

            <Route
              path="/admin/navegacoes"
              element={
                <HistoricoUsuarioPage />
              }
            />

            <Route
              path="/conta"
              element={
                <ContaPage />
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}