
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getDashboard,
  getSensors,
} from "../services/sensorService";

import { useEnvironmentData } from "../context/EnvironmentDataContext";

import type {
  DashboardData,
  Sensor,
} from "../types/sensor";

export function useSensors(autoRefresh = false) {
  const environmentData = useEnvironmentData();

  const [physicalSensors, setPhysicalSensors] = useState<Sensor[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData>({
    nodes: {},
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);

      const [sensorData, dashboardData] = await Promise.all([
        getSensors(),
        getDashboard(),
      ]);

      setPhysicalSensors(sensorData);
      setDashboard(dashboardData);
    } catch {
      setError("Não foi possível carregar os sensores.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();

    if (!autoRefresh) return;

    const timer = window.setInterval(
      () => void reload(),
      5000,
    );

    return () => window.clearInterval(timer);
  }, [autoRefresh, reload]);

  const sensors = environmentData.imported
    ? environmentData.sensors
    : physicalSensors;

  return {
    sensors,
    dashboard,
    loading: loading || environmentData.loading,
    error: environmentData.error ?? error,
    reload,
  };
}
