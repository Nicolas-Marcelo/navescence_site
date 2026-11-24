
import { useCallback, useEffect, useState } from "react";

import { getTopology } from "../services/topologyService";
import { useEnvironmentData } from "../context/EnvironmentDataContext";

import type { TopologyEdge } from "../types/topology";

export function useTopology() {
  const environmentData = useEnvironmentData();

  const [physicalEdges, setPhysicalEdges] = useState<TopologyEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      setPhysicalEdges(await getTopology());
    } catch {
      setError("Não foi possível carregar a topologia.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const edges = environmentData.imported
    ? environmentData.edges
    : physicalEdges;

  return {
    edges,
    loading: loading || environmentData.loading,
    error: environmentData.error ?? error,
    reload,
  };
}
