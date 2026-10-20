import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { getPois } from "../services/poiService";

import type { Poi } from "../types/poi";

export function usePois() {
  const [pois, setPois] =
    useState<Poi[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const reload =
    useCallback(async () => {
      try {
        setError(null);

        setPois(
          await getPois(),
        );
      } catch {
        setError(
          "Não foi possível carregar os pontos de interesse.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    pois,
    loading,
    error,
    reload,
  };
}