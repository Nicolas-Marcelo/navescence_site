
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { getPois } from "../services/poiService";
import { useEnvironmentData } from "../context/EnvironmentDataContext";

import type { Poi } from "../types/poi";

export function usePois() {
  const environmentData = useEnvironmentData();

  const [physicalPois, setPhysicalPois] = useState<Poi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      setPhysicalPois(await getPois());
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

  const pois = environmentData.imported
    ? environmentData.pois
    : physicalPois;

  return {
    pois,
    loading: loading || environmentData.loading,
    error: environmentData.error ?? error,
    reload,
  };
}
