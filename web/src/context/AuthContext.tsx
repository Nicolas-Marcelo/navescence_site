import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  apiRequest,
  getToken,
  onAuthExpired,
  removeToken,
  saveToken,
} from "../services/api";

import type {
  AuthUser,
  LoginResponse,
  MeResponse,
} from "../types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  authenticated: boolean;

  login: (
    email: string,
    password: string,
  ) => Promise<AuthUser>;

  logout: () => void;

  refreshUser:
    () => Promise<void>;
}

const AuthContext =
  createContext<
    AuthContextValue | null
  >(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [
    user,
    setUser,
  ] =
    useState<
      AuthUser | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const logout =
    useCallback(() => {
      removeToken();
      setUser(null);
    }, []);

  const refreshUser =
    useCallback(
      async () => {
        const token =
          getToken();

        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        try {
          const response =
            await apiRequest<
              MeResponse
            >(
              "/api/auth/me",
              {
                authenticated:
                  true,
              },
            );

          setUser(
            response.user,
          );
        } catch {
          removeToken();
          setUser(null);
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  useEffect(
    () => {
      void refreshUser();
    },
    [
      refreshUser,
    ],
  );

  useEffect(
    () => {
      const unsubscribe =
        onAuthExpired(
          () => {
            setUser(null);

            if (
              window.location
                .pathname !==
              "/login"
            ) {
              window.location
                .assign(
                  "/login",
                );
            }
          },
        );

      return unsubscribe;
    },
    [],
  );

  async function login(
    email: string,
    password: string,
  ): Promise<AuthUser> {
    const response =
      await apiRequest<
        LoginResponse
      >(
        "/api/auth/login",
        {
          method: "POST",

          body:
            JSON.stringify({
              email,
              password,
            }),
        },
      );

    saveToken(
      response.token,
    );

    setUser(
      response.user,
    );

    return response.user;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,

        authenticated:
          Boolean(
            user,
          ),

        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(
      AuthContext,
    );

  if (!context) {
    throw new Error(
      "useAuth deve ser utilizado dentro de AuthProvider.",
    );
  }

  return context;
}