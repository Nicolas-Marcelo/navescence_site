import {
  StatusBadge,
} from "../ui/StatusBadge";

import type {
  DashboardNode,
  Sensor,
} from "../../types/sensor";

interface SensorCardProps {
  sensor: Sensor;
  runtime?: DashboardNode;
}

export function SensorCard({
  sensor,
  runtime,
}: SensorCardProps) {
  return (
    <article className="sensor-card">
      <header>
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
            runtime?.presence ??
            "UNKNOWN"
          }
        />
      </header>

      <dl>
        <div>
          <dt>Ambiente</dt>
          <dd>
            {sensor.environment
              ?.name ?? "—"}
          </dd>
        </div>

        <div>
          <dt>Localização</dt>
          <dd>
            {sensor.location ?? "—"}
          </dd>
        </div>

        <div>
          <dt>Diagnóstico</dt>
          <dd>
            {runtime?.diagnostic ??
              "—"}
          </dd>
        </div>
      </dl>
    </article>
  );
}