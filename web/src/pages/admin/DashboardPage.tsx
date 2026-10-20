import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  RadioTower,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";

import {
  useMemo,
} from "react";

import {
  StatCard,
} from "../../components/ui/StatCard";

import {
  StatusBadge,
} from "../../components/ui/StatusBadge";

import {
  LoadingState,
} from "../../components/ui/LoadingState";

import {
  useEnvironment,
} from "../../context/EnvironmentContext";

import {
  useAlerts,
} from "../../hooks/useAlerts";

import {
  useSensors,
} from "../../hooks/useSensors";

export function DashboardPage() {
  const {
    sensors,
    dashboard,
    loading,
    error,
    reload,
  } = useSensors(true);

  const {
    alerts,
    reload: reloadAlerts,
  } = useAlerts();

  const {
    selectedEnvironmentId,
    selectedEnvironment,
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

  const codes =
    useMemo(
      () =>
        new Set(
          visibleSensors.map(
            sensor =>
              sensor.code,
          ),
        ),
      [visibleSensors],
    );

  const visibleAlerts =
    useMemo(() => {
      if (
        selectedEnvironmentId ===
        "ALL"
      ) {
        return alerts;
      }

      return alerts.filter(
        alert =>
          alert.nodeCode &&
          codes.has(
            alert.nodeCode,
          ),
      );
    }, [
      alerts,
      codes,
      selectedEnvironmentId,
    ]);

  if (loading) {
    return (
      <LoadingState message="Carregando infraestrutura..." />
    );
  }

  const runtimeNodes =
    visibleSensors.map(
      sensor => ({
        sensor,
        runtime:
          dashboard.nodes[
            sensor.code
          ],
      }),
    );

  const online =
    runtimeNodes.filter(
      item =>
        item.runtime
          ?.presence ===
        "ONLINE",
    ).length;

  const offline =
    runtimeNodes.filter(
      item =>
        item.runtime
          ?.presence ===
        "OFFLINE",
    ).length;

  const activeAlerts =
    visibleAlerts.filter(
      alert =>
        alert.status ===
        "ACTIVE",
    );

  const infrastructureOk =
    offline === 0 &&
    activeAlerts.length === 0;

  async function atualizar() {
    await Promise.all([
      reload(),
      reloadAlerts(),
    ]);
  }

  return (
    <>
      <section className="dashboard-hero">
        <div>
          <div className="dashboard-kicker">
            <RadioTower
              size={16}
            />

            INFRAESTRUTURA NAVESCENCE
          </div>

          <h1>
            {selectedEnvironment
              ? selectedEnvironment.name
              : "Visão geral do sistema"}
          </h1>

          <p>
            {selectedEnvironment
              ? `Monitoramento da infraestrutura vinculada a ${selectedEnvironment.name}.`
              : "Acompanhe o estado geral da infraestrutura de navegação indoor."}
          </p>
        </div>

        <div className="dashboard-hero-actions">
          <div
            className={`health-pill ${
              infrastructureOk
                ? "healthy"
                : "attention"
            }`}
          >
            {infrastructureOk ? (
              <CheckCircle2
                size={17}
              />
            ) : (
              <AlertTriangle
                size={17}
              />
            )}

            {infrastructureOk
              ? "Operação normal"
              : "Requer atenção"}
          </div>

          <button
            type="button"
            className="button secondary compact"
            onClick={() =>
              void atualizar()
            }
          >
            <RefreshCw size={17} />
            Atualizar
          </button>
        </div>
      </section>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      <section className="stats-grid">
        <StatCard
          label="Sensores"
          value={
            visibleSensors.length
          }
          description="Cadastrados"
          icon={
            <Activity
              size={20}
            />
          }
        />

        <StatCard
          label="Online"
          value={online}
          description="Disponíveis"
          variant="success"
          icon={
            <Wifi size={20} />
          }
        />

        <StatCard
          label="Offline"
          value={offline}
          description="Indisponíveis"
          variant={
            offline
              ? "danger"
              : "default"
          }
          icon={
            <WifiOff
              size={20}
            />
          }
        />

        <StatCard
          label="Alertas"
          value={
            activeAlerts.length
          }
          description="Em aberto"
          variant={
            activeAlerts.length
              ? "warning"
              : "default"
          }
          icon={
            <AlertTriangle
              size={20}
            />
          }
        />
      </section>

      <section className="panel dashboard-main-panel">
        <header className="panel-header">
          <div>
            <span className="panel-eyebrow">
              SENSORES
            </span>

            <h2>
              Estado da infraestrutura
            </h2>
          </div>

          <div className="panel-counter">
            {online}/
            {visibleSensors.length} online
          </div>
        </header>

        <div className="simple-list embedded">
          {runtimeNodes.map(
            ({
              sensor,
              runtime,
            }) => (
              <article
                key={sensor.id}
                className="simple-row"
              >
                <div
                  className={`simple-row-icon ${
                    runtime?.presence ===
                    "OFFLINE"
                      ? "danger"
                      : ""
                  }`}
                >
                  <RadioTower
                    size={18}
                  />
                </div>

                <div className="simple-row-main">
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
                    runtime?.presence
                  }
                />

                <div className="simple-row-meta">
                  <span>
                    Diagnóstico
                  </span>

                  <strong>
                    {runtime
                      ?.diagnostic ??
                      "—"}
                  </strong>
                </div>
              </article>
            ),
          )}
        </div>
      </section>
    </>
  );
}