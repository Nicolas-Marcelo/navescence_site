import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getAlerts,
} from "../services/alertService";

import type {
  SystemAlert,
} from "../types/alert";

export function useAlerts() {
  const [alerts, setAlerts] =
    useState<SystemAlert[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const reload =
    useCallback(async () => {
      try {
        setError(null);

        setAlerts(
          await getAlerts(),
        );
      } catch {
        setError(
          "Não foi possível carregar os alertas.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    alerts,
    loading,
    error,
    reload,
  };
}