import {
  Link,
  useParams,
} from "react-router-dom";

import {
  LoadingState,
} from "../../components/ui/LoadingState";

import {
  SensorMetrics,
} from "../../components/sensors/SensorMetrics";

import {
  StatusBadge,
} from "../../components/ui/StatusBadge";

import {
  useSensors,
} from "../../hooks/useSensors";

export function SensorDetalhePage() {
  const { code } =
    useParams();

  const {
    sensors,
    dashboard,
    loading,
  } = useSensors(true);

  if (loading) {
    return (
      <LoadingState />
    );
  }

  const sensor =
    sensors.find(
      item =>
        item.code === code,
    );

  if (!sensor) {
    return (
      <section className="panel">
        Sensor não encontrado.
      </section>
    );
  }

  const runtime =
    dashboard.nodes[
      sensor.code
    ];

  return (
    <>
      <Link
        to="/admin/sensores"
        className="back-link"
      >
        ← Sensores
      </Link>

      <section className="page-heading">
        <div>
          <span className="eyebrow">
            Sensor
          </span>

          <h1>
            {sensor.code}
          </h1>

          <p>
            {sensor.name ??
              "Sensor NAVESCENCE"}
          </p>
        </div>

        <StatusBadge
          value={
            runtime?.presence
          }
        />
      </section>

      <section className="panel">
        <SensorMetrics
          data={runtime}
        />
      </section>
    </>
  );
}