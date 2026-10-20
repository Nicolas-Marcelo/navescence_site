import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getTopology,
} from "../services/topologyService";

import type {
  TopologyEdge,
} from "../types/topology";

export function useTopology() {
  const [edges, setEdges] =
    useState<TopologyEdge[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const reload =
    useCallback(async () => {
      try {
        setError(null);

        setEdges(
          await getTopology(),
        );
      } catch {
        setError(
          "Não foi possível carregar a topologia.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    edges,
    loading,
    error,
    reload,
  };
}