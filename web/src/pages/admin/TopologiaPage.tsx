import {
  Route,
} from "lucide-react";

import {
  useMemo,
} from "react";

import {
  LoadingState,
} from "../../components/ui/LoadingState";

import {
  StatusBadge,
} from "../../components/ui/StatusBadge";

import {
  useEnvironment,
} from "../../context/EnvironmentContext";

import {
  useSensors,
} from "../../hooks/useSensors";

import {
  useTopology,
} from "../../hooks/useTopology";

export function TopologiaPage() {
  const {
    sensors,
    dashboard,
    loading:
      sensorsLoading,
  } = useSensors();

  const {
    edges,
    loading:
      topologyLoading,
    error,
  } = useTopology();

  const {
    selectedEnvironmentId,
  } = useEnvironment();

  const visibleSensors =
    useMemo(() => {
      if (
        selectedEnvironmentId ===
        "ALL"
      ) {
        return sensors;
      }

      return sensors.filter(
        sensor =>
          sensor.environmentId ===
          selectedEnvironmentId,
      );
    }, [
      sensors,
      selectedEnvironmentId,
    ]);

  const allowedIds =
    useMemo(
      () =>
        new Set(
          visibleSensors.map(
            sensor =>
              sensor.id,
          ),
        ),
      [visibleSensors],
    );

  const visibleEdges =
    useMemo(
      () =>
        edges.filter(
          edge =>
            allowedIds.has(
              edge.nodeAId,
            ) &&
            allowedIds.has(
              edge.nodeBId,
            ),
        ),
      [edges, allowedIds],
    );

  if (
    sensorsLoading ||
    topologyLoading
  ) {
    return (
      <LoadingState message="Carregando topologia..." />
    );
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            Estrutura de grafos
          </span>

          <h1>Topologia</h1>

          <p>
            Relação entre os sensores
            utilizada no cálculo das rotas.
          </p>
        </div>
      </section>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      <section className="topology-summary">
        <div>
          <strong>
            {visibleSensors.length}
          </strong>

          <span>Nós</span>
        </div>

        <div>
          <strong>
            {visibleEdges.length}
          </strong>

          <span>Conexões</span>
        </div>
      </section>

      <section className="panel">
        <header className="panel-header">
          <div>
            <span className="panel-eyebrow">
              NÓS
            </span>

            <h2>
              Sensores do ambiente
            </h2>
          </div>
        </header>

        <div className="topology-node-grid">
          {visibleSensors.map(
            sensor => (
              <article
                key={sensor.id}
                className="topology-simple-node"
              >
                <div className="simple-row-icon">
                  <Route
                    size={18}
                  />
                </div>

                <div>
                  <strong>
                    {sensor.code}
                  </strong>

                  <span>
                    {sensor.name ??
                      "Sensor NAVESCENCE"}
                  </span>
                </div>

                <StatusBadge
                  value={
                    dashboard.nodes[
                      sensor.code
                    ]?.presence
                  }
                />
              </article>
            ),
          )}
        </div>
      </section>

      <section className="panel">
        <header className="panel-header">
          <div>
            <span className="panel-eyebrow">
              CONEXÕES
            </span>

            <h2>
              Ligações do grafo
            </h2>
          </div>
        </header>

        <div className="simple-list">
          {visibleEdges.map(
            edge => (
              <article
                key={edge.id}
                className="edge-simple-row"
              >
                <strong>
                  {edge.nodeA
                    ?.code ??
                    edge.nodeAId}
                </strong>

                <span className="edge-line">
                  ─────────
                </span>

                <strong>
                  {edge.nodeB
                    ?.code ??
                    edge.nodeBId}
                </strong>

                <small>
                  {edge.distance !=
                  null
                    ? `${edge.distance} m`
                    : "Distância não informada"}
                </small>
              </article>
            ),
          )}
        </div>
      </section>
    </>
  );
}