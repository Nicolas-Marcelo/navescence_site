import {
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import {
  useMemo,
} from "react";

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

export function AlertasPage() {
  const {
    alerts,
    loading,
    error,
    reload,
  } = useAlerts();

  const {
    sensors,
  } = useSensors();

  const {
    selectedEnvironmentId,
  } = useEnvironment();

  const visibleAlerts =
    useMemo(() => {
      if (
        selectedEnvironmentId ===
        "ALL"
      ) {
        return alerts;
      }

      const allowedCodes =
        new Set(
          sensors
            .filter(
              sensor =>
                sensor.environmentId ===
                selectedEnvironmentId,
            )
            .map(
              sensor =>
                sensor.code,
            ),
        );

      return alerts.filter(
        alert =>
          alert.nodeCode &&
          allowedCodes.has(
            alert.nodeCode,
          ),
      );
    }, [
      alerts,
      sensors,
      selectedEnvironmentId,
    ]);

  if (loading) {
    return (
      <LoadingState message="Carregando alertas..." />
    );
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            Diagnóstico
          </span>

          <h1>Alertas</h1>

          <p>
            Ocorrências relevantes da
            infraestrutura selecionada.
          </p>
        </div>

        <button
          type="button"
          className="button secondary"
          onClick={() =>
            void reload()
          }
        >
          <RefreshCw size={17} />
          Atualizar
        </button>
      </section>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      <section className="simple-list">
        {visibleAlerts.length ===
          0 && (
          <div className="empty-simple">
            Nenhum alerta encontrado.
          </div>
        )}

        {visibleAlerts.map(
          alert => (
            <article
              key={alert.id}
              className="simple-row"
            >
              <div className="simple-row-icon danger">
                <AlertTriangle
                  size={19}
                />
              </div>

              <div className="simple-row-main">
                <strong>
                  {alert.title ??
                    "Alerta"}
                </strong>

                <span>
                  {alert.message ??
                    "Sem descrição"}
                </span>
              </div>

              <div className="simple-row-meta">
                <span>
                  Sensor
                </span>

                <strong>
                  {alert.nodeCode ??
                    "—"}
                </strong>
              </div>

              <StatusBadge
                value={
                  alert.status
                }
              />
            </article>
          ),
        )}
      </section>
    </>
  );
}