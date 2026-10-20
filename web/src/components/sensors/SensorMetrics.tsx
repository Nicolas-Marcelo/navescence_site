import type {
  DashboardNode,
} from "../../types/sensor";

interface SensorMetricsProps {
  data?: DashboardNode;
}

export function SensorMetrics({
  data,
}: SensorMetricsProps) {
  const neighbor =
    data?.detectedNeighbors?.[0] ??
    data?.neighbor ??
    null;

  return (
    <div className="metrics-grid">
      <div>
        <span>M15</span>
        <strong>
          {neighbor?.m15 != null
            ? `${neighbor.m15} dBm`
            : "—"}
        </strong>
      </div>

      <div>
        <span>RSSI médio</span>
        <strong>
          {neighbor?.averageRssi != null
            ? `${neighbor.averageRssi} dBm`
            : "—"}
        </strong>
      </div>

      <div>
        <span>Leituras</span>
        <strong>
          {neighbor?.readings ?? 0}
        </strong>
      </div>
    </div>
  );
}