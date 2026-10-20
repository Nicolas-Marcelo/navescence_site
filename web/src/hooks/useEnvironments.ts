import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getEnvironments,
} from "../services/environmentService";

import type {
  Environment,
} from "../types/environment";

export function useEnvironments() {
  const [environments, setEnvironments] =
    useState<Environment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const reload =
    useCallback(async () => {
      try {
        setError(null);

        setEnvironments(
          await getEnvironments(),
        );
      } catch {
        setError(
          "Não foi possível carregar os ambientes.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    environments,
    loading,
    error,
    reload,
  };
}