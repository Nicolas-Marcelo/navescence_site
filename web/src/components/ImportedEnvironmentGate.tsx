
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertCircle, RadioTower, MapPin, Route, RefreshCw } from "lucide-react";

import { useEnvironment } from "../context/EnvironmentContext";
import { apiRequest } from "../services/api";

type ViewType = "sensors" | "pois" | "topology";

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

interface ImportedConnection {
  from: string;
  to: string;
  distance: number;
}

interface ImportedPoi {
  code: string;
  name: string;
  nodeId: string;
  x: number;
  y: number;
  edgeStartNodeId?: string;
  edgeEndNodeId?: string;
  edgePosition?: number;
}

interface TactileNode {
  id: string;
  kind: string;
  x: number;
  y: number;
  label?: string;
}

interface TactileEdge {
  from: string;
  to: string;
  distance: number;
}

interface ImportedConfiguration {
  sensors: ImportedSensor[];
  connections: ImportedConnection[];
  pois: ImportedPoi[];
  tactileMap: {
    version: number;
    nodes: TactileNode[];
    edges: TactileEdge[];
  };
}

interface ImportedEnvironmentResponse {
  imported: boolean;
  environmentId: number;
  code: string;
  name: string;
  floor?: string;
  configuration?: ImportedConfiguration;
  physicalSensors?: PhysicalSensor[];
}

interface ImportedEnvironmentGateProps {
  view: ViewType;
  children: ReactNode;
}

export default function ImportedEnvironmentGate({
  view,
  children,
}: ImportedEnvironmentGateProps) {
  const { selectedEnvironmentId } = useEnvironment();

  const [result, setResult] =
    useState<ImportedEnvironmentResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (selectedEnvironmentId === "ALL") {
      setResult(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const data = await apiRequest<ImportedEnvironmentResponse>(
          `/api/admin/environment-imports/by-id/${selectedEnvironmentId}`,
          { authenticated: true },
        );

        if (!cancelled) setResult(data);
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível carregar o ambiente.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [selectedEnvironmentId, revision]);

  if (selectedEnvironmentId === "ALL") return <>{children}</>;

  if (loading || (result === null && !error)) {
    return (
      <section className="simple-list" style={{ padding: 24 }}>
        Carregando configuração do ambiente...
      </section>
    );
  }

  if (error) {
    return (
      <section className="simple-list" style={{ padding: 24 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: "#991b1b",
        }}>
          <AlertCircle size={19} />
          <strong>{error}</strong>
        </div>

        <button
          className="button secondary"
          type="button"
          onClick={() => setRevision(value => value + 1)}
          style={{ marginTop: 16 }}
        >
          <RefreshCw size={16} />
          Tentar novamente
        </button>
      </section>
    );
  }

  if (!result?.imported) return <>{children}</>;

  if (!result.configuration) {
    return (
      <div className="alert error">
        A configuração importada não está disponível.
      </div>
    );
  }

  return (
    <ImportedEnvironmentContent
      view={view}
      data={result}
      configuration={result.configuration}
    />
  );
}

function ImportedEnvironmentContent({
  view,
  data,
  configuration,
}: {
  view: ViewType;
  data: ImportedEnvironmentResponse;
  configuration: ImportedConfiguration;
}) {
  const sensors = data.physicalSensors ?? [];
  const pois = configuration.pois;
  const connections = configuration.connections;

  const titles: Record<ViewType, string> = {
    sensors: "Sensores",
    pois: "Pontos de interesse",
    topology: "Topologia",
  };

  const descriptions: Record<ViewType, string> = {
    sensors: "Dispositivos físicos utilizados neste ambiente.",
    pois: "Destinos e pontos de origem da configuração importada.",
    topology: "Distribuição espacial dos sensores e pontos de interesse.",
  };

  return (
    <>
      <section className="page-heading">
        <div>
          <span className="eyebrow">Configuração importada</span>
          <h1>{titles[view]}</h1>
          <p>{descriptions[view]}</p>
        </div>
      </section>

      <div style={{
        padding: 14,
        border: "1px solid #dbeafe",
        background: "#eff6ff",
        borderRadius: 10,
        marginBottom: 22,
        color: "#1e40af",
      }}>
        <strong>{data.name}</strong>
        <span style={{ marginLeft: 8, fontSize: 13 }}>
          {data.code}
        </span>

        <div style={{ fontSize: 13, marginTop: 5 }}>
          Visualização da configuração JSON. As alterações nos dispositivos
          físicos e nos cadastros tradicionais estão desabilitadas nesta tela.
        </div>
      </div>

      {view === "sensors" && (
        <>
          <Summary
            items={[
              { label: "Sensores configurados", value: sensors.length },
              {
                label: "Dispositivos cadastrados",
                value: sensors.filter(sensor => sensor.registered).length,
              },
              {
                label: "Disponíveis",
                value: sensors.filter(sensor =>
                  sensor.registered && sensor.active && !sensor.maintenance
                ).length,
              },
            ]}
          />

          <section className="simple-list">
            {sensors.map(sensor => {
              const status = !sensor.registered
                ? "Não cadastrado"
                : sensor.maintenance
                  ? "Em manutenção"
                  : sensor.active
                    ? "Habilitado"
                    : "Desabilitado";

              return (
                <article className="simple-row" key={sensor.nodeId}>
                  <div className="simple-row-icon">
                    <RadioTower size={19} />
                  </div>

                  <div className="simple-row-main">
                    <strong>{sensor.nodeId}</strong>
                    <span>{sensor.name}</span>
                  </div>

                  <div className="simple-row-meta">
                    <span>Coordenadas</span>
                    <strong>({sensor.x}, {sensor.y})</strong>
                  </div>

                  <div className="simple-row-meta">
                    <span>MAC</span>
                    <strong>{sensor.mac ?? "—"}</strong>
                  </div>

                  <div className="simple-row-meta">
                    <span>Cadastro</span>
                    <strong>{status}</strong>
                  </div>
                </article>
              );
            })}
          </section>

          <p style={{ fontSize: 12, color: "#64748b", marginTop: 14 }}>
            Habilitado não significa necessariamente conectado neste momento.
            As coordenadas exibidas são específicas do ambiente selecionado.
          </p>
        </>
      )}

      {view === "pois" && (
        <>
          <Summary
            items={[
              { label: "Pontos de interesse", value: pois.length },
              {
                label: "Com acesso em trecho",
                value: pois.filter(poi =>
                  Boolean(poi.edgeStartNodeId && poi.edgeEndNodeId)
                ).length,
              },
            ]}
          />

          <section className="simple-list">
            {pois.map(poi => (
              <article className="simple-row" key={poi.code}>
                <div className="simple-row-icon">
                  <MapPin size={19} />
                </div>

                <div className="simple-row-main">
                  <strong>{poi.name}</strong>
                  <span>{poi.code}</span>
                </div>

                <div className="simple-row-meta">
                  <span>Sensor de referência</span>
                  <strong>{poi.nodeId}</strong>
                </div>

                <div className="simple-row-meta">
                  <span>Coordenadas</span>
                  <strong>({poi.x}, {poi.y})</strong>
                </div>

                <div className="simple-row-meta">
                  <span>Trecho</span>
                  <strong>
                    {poi.edgeStartNodeId && poi.edgeEndNodeId
                      ? `${poi.edgeStartNodeId} → ${poi.edgeEndNodeId}`
                      : "Acesso pelo sensor"}
                  </strong>
                </div>
              </article>
            ))}
          </section>
        </>
      )}

      {view === "topology" && (
        <>
          <Summary
            items={[
              { label: "Sensores", value: sensors.length },
              { label: "Conexões principais", value: connections.length },
              { label: "Pontos de interesse", value: pois.length },
              {
                label: "Nós do mapa tátil",
                value: configuration.tactileMap.nodes.length,
              },
            ]}
          />

          <div style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 20,
            marginBottom: 22,
          }}>
            <h3 style={{
              margin: "0 0 18px",
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}>
              <Route size={19} />
              Mapa do ambiente
            </h3>

            <EnvironmentMap
              sensors={sensors}
              pois={pois}
              connections={connections}
            />

            <div style={{
              display: "flex",
              gap: 20,
              flexWrap: "wrap",
              fontSize: 13,
              color: "#64748b",
              marginTop: 14,
            }}>
              <span>● Sensor ESP32</span>
              <span>◆ Ponto de interesse</span>
              <span>— Conexão principal</span>
            </div>
          </div>

          <h3>Conexões cadastradas</h3>

          <section className="simple-list">
            {connections.map(edge => (
              <article
                className="simple-row"
                key={`${edge.from}-${edge.to}`}
              >
                <div className="simple-row-icon">
                  <Route size={19} />
                </div>

                <div className="simple-row-main">
                  <strong>{edge.from} → {edge.to}</strong>
                  <span>Conexão bidirecional</span>
                </div>

                <div className="simple-row-meta">
                  <span>Distância</span>
                  <strong>{edge.distance} m</strong>
                </div>
              </article>
            ))}
          </section>
        </>
      )}
    </>
  );
}

function Summary({
  items,
}: {
  items: Array<{ label: string; value: number }>;
}) {
  return (
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: 22,
    }}>
      {items.map(item => (
        <div
          key={item.label}
          style={{
            flex: "1 1 150px",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: 16,
          }}
        >
          <strong style={{ fontSize: 24 }}>
            {item.value}
          </strong>
          <div style={{
            color: "#64748b",
            fontSize: 13,
            marginTop: 4,
          }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function EnvironmentMap({
  sensors,
  pois,
  connections,
}: {
  sensors: PhysicalSensor[];
  pois: ImportedPoi[];
  connections: ImportedConnection[];
}) {
  const positions = useMemo(() => {
    const all = [
      ...sensors.map(item => ({ x: item.x, y: item.y })),
      ...pois.map(item => ({ x: item.x, y: item.y })),
    ];

    if (!all.length) return null;

    const xs = all.map(point => point.x);
    const ys = all.map(point => point.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const width = Math.max(maxX - minX, 1);
    const height = Math.max(maxY - minY, 1);

    const scale = Math.min(600 / width, 350 / height);

    return {
      place: (x: number, y: number) => ({
        x: 80 + (x - minX) * scale,
        y: 65 + (maxY - y) * scale,
      }),
      viewWidth: Math.max(760, width * scale + 160),
      viewHeight: Math.max(480, height * scale + 130),
    };
  }, [sensors, pois]);

  if (!positions) {
    return <p>Sem coordenadas cadastradas.</p>;
  }

  const sensorById = new Map(
    sensors.map(sensor => [sensor.nodeId, sensor]),
  );

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg
        role="img"
        aria-label="Mapa de sensores, conexões e pontos de interesse"
        viewBox={`0 0 ${positions.viewWidth} ${positions.viewHeight}`}
        style={{ display: "block", width: "100%", minWidth: 520 }}
      >
        {connections.map(edge => {
          const from = sensorById.get(edge.from);
          const to = sensorById.get(edge.to);

          if (!from || !to) return null;

          const a = positions.place(from.x, from.y);
          const b = positions.place(to.x, to.y);

          return (
            <line
              key={`${edge.from}-${edge.to}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#94a3b8"
              strokeWidth={5}
              strokeLinecap="round"
            />
          );
        })}

        {pois.map(poi => {
          const p = positions.place(poi.x, poi.y);
          const reference = sensorById.get(poi.nodeId);

          return (
            <g key={poi.code}>
              {reference && (
                <line
                  x1={positions.place(reference.x, reference.y).x}
                  y1={positions.place(reference.x, reference.y).y}
                  x2={p.x}
                  y2={p.y}
                  stroke="#cbd5e1"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                />
              )}
              <rect
                x={p.x - 6}
                y={p.y - 6}
                width={12}
                height={12}
                rx={2}
                transform={`rotate(45 ${p.x} ${p.y})`}
                fill="#16a34a"
              />
              <text
                x={p.x}
                y={p.y - 16}
                textAnchor="middle"
                fontSize={12}
                fill="#334155"
                fontWeight={500}
              >
                {poi.name}
              </text>
            </g>
          );
        })}

        {sensors.map(sensor => {
          const p = positions.place(sensor.x, sensor.y);

          return (
            <g key={sensor.nodeId}>
              <circle
                cx={p.x}
                cy={p.y}
                r={10}
                fill="#0a35cc"
                stroke="#fff"
                strokeWidth={3}
              />

              <text
                x={p.x}
                y={p.y + 28}
                textAnchor="middle"
                fill="#0a35cc"
                fontSize={13}
                fontWeight={700}
              >
                {sensor.nodeId}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
