
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useEnvironment } from "./EnvironmentContext";
import { apiRequest } from "../services/api";

import {
  setImportedMutationEnvironment,
} from "../services/importedEnvironmentCrud";

import type { Sensor } from "../types/sensor";
import type { Poi } from "../types/poi";
import type { TopologyEdge } from "../types/topology";

interface ImportedSensor {
  nodeId: string;
  x: number;
  y: number;
}

interface PhysicalSensor extends ImportedSensor {
  physicalId: number | null;
  mac: string | null;
  name: string;
  registered: boolean;
  active: boolean;
  maintenance: boolean;
}

interface ImportedPoi {
  code: string;
  name: string;
  nodeId: string;
  x: number;
  y: number;
}

interface ImportedConnection {
  from: string;
  to: string;
  distance: number;
}

interface ImportedResponse {
  imported: boolean;
  environmentId: number;
  code: string;
  name: string;
  floor?: string;
  updatedAt?: string;
  configuration?: {
    sensors: ImportedSensor[];
    pois: ImportedPoi[];
    connections: ImportedConnection[];
  };
  physicalSensors?: PhysicalSensor[];
}

interface EnvironmentDataValue {
  imported: boolean;
  loading: boolean;
  error: string | null;
  sensors: Sensor[];
  pois: Poi[];
  edges: TopologyEdge[];
  reload: () => void;
}

const Context = createContext<EnvironmentDataValue | null>(null);

function normalize(data: ImportedResponse) {
  const configuration = data.configuration!;

  const environment = {
    id: data.environmentId,
    code: data.code,
    name: data.name,
    type: null,
    floor: data.floor ?? "Térreo",
    description: null,
  };

  const sensors: Sensor[] = (data.physicalSensors ?? []).map(
    (sensor, index) => ({
      id: sensor.physicalId ?? -(index + 1),
      code: sensor.nodeId,
      mac: sensor.mac,
      name: sensor.name,
      environmentId: data.environmentId,
      environment,
      location: null,
      x: sensor.x,
      y: sensor.y,
      active: sensor.active,
      maintenance: sensor.maintenance,
    }),
  );

  const sensorByCode = new Map(
    sensors.map(sensor => [sensor.code, sensor]),
  );

  const pois: Poi[] = configuration.pois.map((poi, index) => {
    const node = sensorByCode.get(poi.nodeId);

    return {
      id: -(index + 1),
      code: poi.code,
      name: poi.name,
      type: poi.code === "ENTRADA"
        ? "ENTRADA"
        : poi.code === "BANHEIRO"
          ? "BANHEIRO"
          : "SALA",
      description: null,
      nodeId: node?.id ?? -1,
      node: node ?? null,
      x: poi.x,
      y: poi.y,
      orientationDegrees: null,
      active: true,
    };
  });

  const edges: TopologyEdge[] = configuration.connections.map(
    (edge, index) => {
      const nodeA = sensorByCode.get(edge.from);
      const nodeB = sensorByCode.get(edge.to);

      return {
        id: -(index + 1),
        nodeAId: nodeA?.id ?? -1,
        nodeBId: nodeB?.id ?? -1,
        distance: edge.distance,
        nodeA,
        nodeB,
      };
    },
  );

  return { sensors, pois, edges };
}

export function EnvironmentDataProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { selectedEnvironmentId } = useEnvironment();

  const [data, setData] = useState<ImportedResponse | null>(null);
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  const reload = useCallback(() => {
    setRevision(value => value + 1);
  }, []);

  useEffect(() => {
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<{ environmentId: number }>).detail;

      if (detail?.environmentId === selectedEnvironmentId) {
        reload();
      }
    };

    window.addEventListener(
      "navescence:environment-config-updated",
      listener,
    );

    return () => {
      window.removeEventListener(
        "navescence:environment-config-updated",
        listener,
      );
    };
  }, [reload, selectedEnvironmentId]);

  useEffect(() => {
    setImportedMutationEnvironment(null);

    if (selectedEnvironmentId === "ALL") {
      setData(null);
      setLoadedId(null);
      setError(null);
      setLoading(false);
      return;
    }

    const environmentId = selectedEnvironmentId;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await apiRequest<ImportedResponse>(
          `/api/admin/environment-imports/by-id/${environmentId}`,
          { authenticated: true },
        );

        if (cancelled) return;

        setData(response);
        setLoadedId(environmentId);
        setImportedMutationEnvironment(
          response.imported ? environmentId : null,
        );
      } catch (cause) {
        if (cancelled) return;

        setData(null);
        setLoadedId(null);
        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível carregar o ambiente.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
      setImportedMutationEnvironment(null);
    };
  }, [selectedEnvironmentId, revision]);

  const ready = selectedEnvironmentId === "ALL" ||
    (!loading && loadedId === selectedEnvironmentId);

  const imported = selectedEnvironmentId !== "ALL" &&
    ready && data?.imported === true;

  const normalized = useMemo(() => {
    if (!imported || !data?.configuration) {
      return {
        sensors: [] as Sensor[],
        pois: [] as Poi[],
        edges: [] as TopologyEdge[],
      };
    }

    return normalize(data);
  }, [data, imported]);

  return (
    <Context.Provider
      value={{
        imported,
        loading: selectedEnvironmentId !== "ALL" && !ready,
        error,
        sensors: normalized.sensors,
        pois: normalized.pois,
        edges: normalized.edges,
        reload,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useEnvironmentData() {
  const context = useContext(Context);

  if (!context) {
    throw new Error(
      "useEnvironmentData deve ser usado dentro de EnvironmentDataProvider.",
    );
  }

  return context;
}
