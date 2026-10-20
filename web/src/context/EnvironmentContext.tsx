import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getEnvironments } from "../services/environmentService";

import type { Environment } from "../types/environment";

export type EnvironmentSelection = "ALL" | number;

interface EnvironmentContextValue {
  environments: Environment[];
  selectedEnvironmentId: EnvironmentSelection;
  selectedEnvironment: Environment | null;
  loading: boolean;
  setSelectedEnvironmentId: (value: EnvironmentSelection) => void;
  reloadEnvironments: () => Promise<void>;
}

const EnvironmentContext =
  createContext<EnvironmentContextValue | null>(null);

interface EnvironmentProviderProps {
  children: ReactNode;
}

export function EnvironmentProvider({
  children,
}: EnvironmentProviderProps) {
  const [environments, setEnvironments] =
    useState<Environment[]>([]);

  const [selectedEnvironmentId, setSelectedEnvironmentId] =
    useState<EnvironmentSelection>("ALL");

  const [loading, setLoading] =
    useState(true);

  async function reloadEnvironments() {
    try {
      const data = await getEnvironments();
      setEnvironments(data);

      if (
        selectedEnvironmentId !== "ALL" &&
        !data.some(item => item.id === selectedEnvironmentId)
      ) {
        setSelectedEnvironmentId("ALL");
      }
    } catch (error) {
      console.error(
        "[AMBIENTES] Não foi possível carregar os ambientes:",
        error,
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reloadEnvironments();
  }, []);

  const selectedEnvironment = useMemo(() => {
    if (selectedEnvironmentId === "ALL") return null;

    return (
      environments.find(
        environment => environment.id === selectedEnvironmentId,
      ) ?? null
    );
  }, [environments, selectedEnvironmentId]);

  return (
    <EnvironmentContext.Provider
      value={{
        environments,
        selectedEnvironmentId,
        selectedEnvironment,
        loading,
        setSelectedEnvironmentId,
        reloadEnvironments,
      }}
    >
      {children}
    </EnvironmentContext.Provider>
  );
}

export function useEnvironment() {
  const context = useContext(EnvironmentContext);

  if (!context) {
    throw new Error(
      "useEnvironment deve ser utilizado dentro de EnvironmentProvider.",
    );
  }

  return context;
}