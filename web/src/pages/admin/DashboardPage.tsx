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

function traduzirDiagnostico(
  diagnostic:
    string | undefined,
) {
  switch (
    diagnostic
  ) {
    case "OK":
      return "Funcionamento normal";

    case "VIZINHO_NAO_DETECTADO":
      return "Vizinho não detectado";

    case "NO_INDISPONIVEL":
      return "Sensor indisponível";

    case "VERIFICANDO":
      return "Verificando";

    case undefined:
    case "":
      return "Sem diagnóstico";

    default:
      return diagnostic.replaceAll(
        "_",
        " ",
      );
  }
}

export function DashboardPage() {
  const {
    sensors,
    dashboard,
    loading,
    error,
    reload,
  } =
    useSensors(true);

  const {
    alerts,
    reload:
      reloadAlerts,
  } =
    useAlerts();

  const {
    selectedEnvironmentId,
    selectedEnvironment,
  } =
    useEnvironment();

  const visibleSensors =
    useMemo(
      () => {
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
      },
      [
        sensors,
        selectedEnvironmentId,
      ],
    );

  const codes =
    useMemo(
      () =>
        new Set(
          visibleSensors.map(
            sensor =>
              sensor.code,
          ),
        ),
      [
        visibleSensors,
      ],
    );

  const visibleAlerts =
    useMemo(
      () => {
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
      },
      [
        alerts,
        codes,
        selectedEnvironmentId,
      ],
    );

  if (
    loading
  ) {
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
              ? selectedEnvironment
                  .name
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
            <RefreshCw
              size={17}
            />

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
          value={
            online
          }
          description="Disponíveis"
          variant="success"
          icon={
            <Wifi
              size={20}
            />
          }
        />

        <StatCard
          label="Offline"
          value={
            offline
          }
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

        <div
          style={{
            width: "100%",
          }}
        >
          {runtimeNodes.length ===
          0 ? (
            <div
              className="empty-simple"
            >
              Nenhum sensor cadastrado.
            </div>
          ) : (
            runtimeNodes.map(
              ({
                sensor,
                runtime,
              }) => (
                <article
                  key={
                    sensor.id
                  }
                  style={{
                    minHeight:
                      "78px",

                    display:
                      "grid",

                    gridTemplateColumns:
                      "42px minmax(220px, 1fr) 170px minmax(220px, 0.9fr)",

                    alignItems:
                      "center",

                    columnGap:
                      "22px",

                    padding:
                      "13px 16px",

                    borderTop:
                      "1px solid var(--border)",
                  }}
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

                  <div
                    style={{
                      minWidth:
                        0,

                      display:
                        "flex",

                      flexDirection:
                        "column",
                    }}
                  >
                    <span
                      style={{
                        marginBottom:
                          "4px",

                        color:
                          "var(--muted)",

                        fontSize:
                          "0.61rem",

                        fontWeight:
                          800,

                        letterSpacing:
                          "0.08em",

                        textTransform:
                          "uppercase",
                      }}
                    >
                      Sensor
                    </span>

                    <strong
                      style={{
                        color:
                          "var(--primary-deep)",

                        fontSize:
                          "0.84rem",
                      }}
                    >
                      {
                        sensor.code
                      }
                    </strong>

                    <span
                      style={{
                        marginTop:
                          "3px",

                        color:
                          "var(--muted)",

                        fontSize:
                          "0.7rem",

                        whiteSpace:
                          "nowrap",

                        overflow:
                          "hidden",

                        textOverflow:
                          "ellipsis",
                      }}
                    >
                      {sensor.name ??
                        "Sensor NAVESCENCE"}
                    </span>
                  </div>

                  <div
                    style={{
                      minWidth:
                        "150px",
                    }}
                  >
                    <span
                      style={{
                        display:
                          "block",

                        marginBottom:
                          "7px",

                        color:
                          "var(--muted)",

                        fontSize:
                          "0.61rem",

                        fontWeight:
                          800,

                        letterSpacing:
                          "0.08em",

                        textTransform:
                          "uppercase",
                      }}
                    >
                      Presença
                    </span>

                    <StatusBadge
                      value={
                        runtime
                          ?.presence
                      }
                    />
                  </div>

                  <div
                    style={{
                      minWidth:
                        0,

                      display:
                        "flex",

                      flexDirection:
                        "column",

                      alignItems:
                        "flex-start",
                    }}
                  >
                    <span
                      style={{
                        marginBottom:
                          "5px",

                        color:
                          "var(--muted)",

                        fontSize:
                          "0.61rem",

                        fontWeight:
                          800,

                        letterSpacing:
                          "0.08em",

                        textTransform:
                          "uppercase",
                      }}
                    >
                      Diagnóstico
                    </span>

                    <strong
                      style={{
                        maxWidth:
                          "100%",

                        color:
                          runtime
                              ?.diagnostic ===
                            "OK"
                            ? "var(--success)"
                            : runtime
                                  ?.presence ===
                                "OFFLINE"
                              ? "var(--danger)"
                              : "var(--text-soft)",

                        fontSize:
                          "0.73rem",

                        lineHeight:
                          1.4,

                        overflowWrap:
                          "anywhere",
                      }}
                    >
                      {traduzirDiagnostico(
                        runtime
                          ?.diagnostic,
                      )}
                    </strong>
                  </div>
                </article>
              ),
            )
          )}
        </div>
      </section>
    </>
  );
}