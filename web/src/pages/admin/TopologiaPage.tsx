import {
  MapPin,
  Route,
  Trash2,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  ConfirmDialog,
  ReviewItem,
} from "../../components/ui/ConfirmDialog";

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
  usePois,
} from "../../hooks/usePois";

import {
  useSensors,
} from "../../hooks/useSensors";

import {
  useTopology,
} from "../../hooks/useTopology";

import {
  apiErrorMessage,
} from "../../services/apiMessages";

import {
  deleteTopologyEdge,
} from "../../services/topologyService";

import type {
  TopologyEdge,
} from "../../types/topology";

const WIDTH = 900;
const HEIGHT = 420;
const PADDING = 45;

const MAP_MARGIN = 2;
const WALL_MAX_Y = 7;

export function TopologiaPage() {
  const {
    sensors,
    dashboard,
    loading: sensorsLoading,
  } = useSensors();

  const {
    pois,
    loading: poisLoading,
  } = usePois();

  const {
    edges,
    loading: topologyLoading,
    error,
    reload,
  } = useTopology();

  const {
    selectedEnvironmentId,
  } = useEnvironment();

  const [
    deletingEdge,
    setDeletingEdge,
  ] =
    useState<
      TopologyEdge | null
    >(null);

  const [
    deleting,
    setDeleting,
  ] =
    useState(false);

  const [
    deleteError,
    setDeleteError,
  ] =
    useState<
      string | null
    >(null);

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

  const allowedIds =
    useMemo(
      () =>
        new Set(
          visibleSensors.map(
            sensor =>
              sensor.id,
          ),
        ),
      [
        visibleSensors,
      ],
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
      [
        edges,
        allowedIds,
      ],
    );

  const visiblePois =
    useMemo(
      () => {
        if (
          selectedEnvironmentId ===
          "ALL"
        ) {
          return pois;
        }

        return pois.filter(
          poi =>
            poi.node
              ?.environmentId ===
            selectedEnvironmentId,
        );
      },
      [
        pois,
        selectedEnvironmentId,
      ],
    );

  const spatialSensors =
    useMemo(
      () =>
        visibleSensors.filter(
          sensor =>
            sensor.x !== null &&
            sensor.y !== null,
        ),
      [
        visibleSensors,
      ],
    );

  const spatialPois =
    useMemo(
      () =>
        visiblePois.filter(
          poi =>
            poi.x !== null &&
            poi.y !== null,
        ),
      [
        visiblePois,
      ],
    );

  const bounds =
    useMemo(
      () => {
        const points = [
          ...spatialSensors.map(
            sensor => ({
              x:
                sensor.x as number,

              y:
                sensor.y as number,
            }),
          ),

          ...spatialPois.map(
            poi => ({
              x:
                poi.x as number,

              y:
                poi.y as number,
            }),
          ),
        ];

        if (
          points.length ===
          0
        ) {
          return null;
        }

        const xs =
          points.map(
            point =>
              point.x,
          );

        const ys =
          points.map(
            point =>
              point.y,
          );

        const minimumX =
          Math.min(
            ...xs,
          );

        const maximumX =
          Math.max(
            ...xs,
          );

        const minimumY =
          Math.min(
            ...ys,
          );

        const maximumY =
          Math.max(
            ...ys,
            WALL_MAX_Y,
          );

        let minX =
          Math.floor(
            minimumX -
            MAP_MARGIN,
          );

        let maxX =
          Math.ceil(
            maximumX +
            MAP_MARGIN,
          );

        let minY =
          Math.floor(
            minimumY -
            MAP_MARGIN,
          );

        let maxY =
          Math.ceil(
            maximumY +
            MAP_MARGIN,
          );

        if (
          minX === maxX
        ) {
          minX -=
            MAP_MARGIN;

          maxX +=
            MAP_MARGIN;
        }

        if (
          minY === maxY
        ) {
          minY -=
            MAP_MARGIN;

          maxY +=
            MAP_MARGIN;
        }

        return {
          minX,
          maxX,
          minY,
          maxY,
        };
      },
      [
        spatialSensors,
        spatialPois,
      ],
    );

  function point(
    x: number,
    y: number,
  ) {
    if (!bounds) {
      return {
        x: 0,
        y: 0,
      };
    }

    const availableWidth =
      WIDTH -
      PADDING * 2;

    const availableHeight =
      HEIGHT -
      PADDING * 2;

    return {
      x:
        PADDING +
        (
          (
            x -
            bounds.minX
          ) /
          (
            bounds.maxX -
            bounds.minX
          )
        ) *
          availableWidth,

      y:
        HEIGHT -
        PADDING -
        (
          (
            y -
            bounds.minY
          ) /
          (
            bounds.maxY -
            bounds.minY
          )
        ) *
          availableHeight,
    };
  }

  function createTicks(
    min: number,
    max: number,
  ) {
    const span =
      max - min;

    const step =
      span <= 20
        ? 1
        : Math.ceil(
            span / 20,
          );

    const ticks:
      number[] = [];

    const start =
      Math.ceil(
        min / step,
      ) * step;

    for (
      let value =
        start;
      value <= max;
      value += step
    ) {
      ticks.push(
        value,
      );
    }

    return ticks;
  }

  const xTicks =
    useMemo(
      () =>
        bounds
          ? createTicks(
              bounds.minX,
              bounds.maxX,
            )
          : [],
      [
        bounds,
      ],
    );

  const yTicks =
    useMemo(
      () =>
        bounds
          ? createTicks(
              bounds.minY,
              bounds.maxY,
            )
          : [],
      [
        bounds,
      ],
    );

  const dividerWorldX =
    useMemo(
      () => {
        if (
          spatialSensors.length <
          2
        ) {
          return null;
        }

        const uniqueXs = [
          ...new Set(
            spatialSensors.map(
              sensor =>
                sensor.x as number,
            ),
          ),
        ].sort(
          (
            a,
            b,
          ) =>
            a - b,
        );

        if (
          uniqueXs.length <
          2
        ) {
          return null;
        }

        let largestGap =
          0;

        let dividerX:
          number | null =
          null;

        for (
          let index = 0;
          index <
          uniqueXs.length -
            1;
          index++
        ) {
          const current =
            uniqueXs[
              index
            ];

          const next =
            uniqueXs[
              index + 1
            ];

          if (
            current ===
              undefined ||
            next ===
              undefined
          ) {
            continue;
          }

          const gap =
            next -
            current;

          if (
            gap >
            largestGap
          ) {
            largestGap =
              gap;

            dividerX =
              current +
              gap / 2;
          }
        }

        return dividerX;
      },
      [
        spatialSensors,
      ],
    );

  const dividerBlocks =
    useMemo(
      () => {
        if (
          dividerWorldX ===
            null ||
          !bounds
        ) {
          return [];
        }

        const startY =
          bounds.minY;

        const endY =
          Math.min(
            WALL_MAX_Y,
            bounds.maxY,
          );

        if (
          endY <= startY
        ) {
          return [];
        }

        const blockWorldHeight =
          0.35;

        const gapWorld =
          0.12;

        const blocks: {
          x: number;
          y: number;
          width: number;
          height: number;
        }[] = [];

        let currentY =
          startY;

        while (
          currentY <
          endY
        ) {
          const blockTop =
            Math.min(
              currentY +
                blockWorldHeight,
              endY,
            );

          const p1 =
            point(
              dividerWorldX,
              currentY,
            );

          const p2 =
            point(
              dividerWorldX,
              blockTop,
            );

          blocks.push({
            x:
              p1.x - 5,

            y:
              Math.min(
                p1.y,
                p2.y,
              ),

            width:
              10,

            height:
              Math.max(
                Math.abs(
                  p1.y -
                  p2.y,
                ),
                4,
              ),
          });

          currentY +=
            blockWorldHeight +
            gapWorld;
        }

        return blocks;
      },
      [
        dividerWorldX,
        bounds,
      ],
    );

  async function confirmarExclusao() {
    if (!deletingEdge) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      await deleteTopologyEdge(
        deletingEdge.id,
      );

      setDeletingEdge(null);

      await reload();
    } catch (error) {
      setDeleteError(
        apiErrorMessage(
          error,
          "Não foi possível excluir a conexão.",
        ),
      );
    } finally {
      setDeleting(false);
    }
  }

  if (
    sensorsLoading ||
    topologyLoading ||
    poisLoading
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
            Estrutura espacial
          </span>

          <h1>
            Topologia
          </h1>

          <p>
            Sensores, conexões e
            pontos de interesse
            posicionados no ambiente.
          </p>
        </div>
      </section>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      {deleteError && (
        <div className="alert error">
          {deleteError}
        </div>
      )}

      <section className="topology-summary">
        <div>
          <strong>
            {
              visibleSensors.length
            }
          </strong>

          <span>
            Sensores
          </span>
        </div>

        <div>
          <strong>
            {
              visibleEdges.length
            }
          </strong>

          <span>
            Conexões
          </span>
        </div>

        <div>
          <strong>
            {
              visiblePois.length
            }
          </strong>

          <span>
            POIs
          </span>
        </div>
      </section>

      <section className="panel">
        <header className="panel-header">
          <div>
            <span className="panel-eyebrow">
              MAPA
            </span>

            <h2>
              Representação espacial
            </h2>

            <p className="muted">
              Passe o mouse sobre um
              sensor ou ponto de
              interesse para visualizar
              suas informações.
            </p>
          </div>
        </header>

        {!bounds ? (
          <div className="alert">
            Cadastre coordenadas nos
            sensores e POIs para
            visualizar o mapa.
          </div>
        ) : (
          <div className="topology-map-wrapper">
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="topology-map"
              role="img"
              aria-label="Mapa espacial da topologia NAVESCENCE"
            >
              <rect
                x="0"
                y="0"
                width={WIDTH}
                height={HEIGHT}
                fill="#ffffff"
              />

              {xTicks.map(
                value => {
                  const p =
                    point(
                      value,
                      0,
                    );

                  return (
                    <line
                      key={
                        `grid-x-${value}`
                      }
                      x1={p.x}
                      y1={PADDING}
                      x2={p.x}
                      y2={
                        HEIGHT -
                        PADDING
                      }
                      stroke="#e3e8eb"
                      strokeWidth="1"
                    />
                  );
                },
              )}

              {yTicks.map(
                value => {
                  const p =
                    point(
                      0,
                      value,
                    );

                  return (
                    <line
                      key={
                        `grid-y-${value}`
                      }
                      x1={PADDING}
                      y1={p.y}
                      x2={
                        WIDTH -
                        PADDING
                      }
                      y2={p.y}
                      stroke="#e3e8eb"
                      strokeWidth="1"
                    />
                  );
                },
              )}

              {visibleEdges.map(
                edge => {
                  const a =
                    edge.nodeA;

                  const b =
                    edge.nodeB;

                  if (
                    !a ||
                    !b ||
                    a.x === null ||
                    a.y === null ||
                    b.x === null ||
                    b.y === null
                  ) {
                    return null;
                  }

                  const pa =
                    point(
                      a.x,
                      a.y,
                    );

                  const pb =
                    point(
                      b.x,
                      b.y,
                    );

                  return (
                    <line
                      key={edge.id}
                      x1={pa.x}
                      y1={pa.y}
                      x2={pb.x}
                      y2={pb.y}
                      stroke="#b9c2c7"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  );
                },
              )}

              {dividerBlocks.map(
                (
                  block,
                  index,
                ) => (
                  <rect
                    key={
                      `divider-${index}`
                    }
                    x={block.x}
                    y={block.y}
                    width={
                      block.width
                    }
                    height={
                      block.height
                    }
                    rx="2"
                    fill="#89949a"
                    opacity="0.75"
                  />
                ),
              )}

              {spatialSensors.map(
                sensor => {
                  const p =
                    point(
                      sensor.x as number,
                      sensor.y as number,
                    );

                  const runtime =
                    dashboard.nodes[
                      sensor.code
                    ];

                  return (
                    <g
                      key={
                        `sensor-${sensor.id}`
                      }
                      style={{
                        cursor:
                          "help",
                      }}
                    >
                      <title>
                        {`${sensor.code}
${sensor.name ?? "Sensor NAVESCENCE"}
Coordenadas: (${sensor.x}, ${sensor.y})
Ambiente: ${sensor.environment?.name ?? "Não definido"}
Presença: ${runtime?.presence ?? "Desconhecido"}`}
                      </title>

                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="12"
                        fill="#1d2c35"
                      />

                      <text
                        x={p.x}
                        y={
                          p.y -
                          20
                        }
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="700"
                        fill="#102631"
                        pointerEvents="none"
                      >
                        {
                          sensor.code
                        }
                      </text>
                    </g>
                  );
                },
              )}

              {spatialPois.map(
                poi => {
                  const p =
                    point(
                      poi.x as number,
                      poi.y as number,
                    );

                  return (
                    <g
                      key={
                        `poi-${poi.id}`
                      }
                      style={{
                        cursor:
                          "help",
                      }}
                    >
                      <title>
                        {`${poi.name}
Código: ${poi.code}
Tipo: ${poi.type}
Coordenadas: (${poi.x}, ${poi.y})
Sensor de acesso: ${poi.node?.code ?? "Não definido"}`}
                      </title>

                      <rect
                        x={
                          p.x -
                          10
                        }
                        y={
                          p.y -
                          10
                        }
                        width="20"
                        height="20"
                        rx="4"
                        fill="#ffffff"
                        stroke="#1d2c35"
                        strokeWidth="3"
                      />
                    </g>
                  );
                },
              )}
            </svg>
          </div>
        )}

        <p className="muted">
          ● = sensor · □ = ponto
          de interesse
        </p>
      </section>

      <section className="panel">
        <header className="panel-header">
          <div>
            <span className="panel-eyebrow">
              PONTOS DE INTERESSE
            </span>

            <h2>
              POIs do ambiente
            </h2>
          </div>
        </header>

        <div className="simple-list embedded">
          {visiblePois.map(
            poi => (
              <article
                key={poi.id}
                className="simple-row topology-poi-row"
              >
                <div className="simple-row-icon">
                  <MapPin
                    size={18}
                  />
                </div>

                <div className="simple-row-main">
                  <strong>
                    {poi.name}
                  </strong>

                  <span>
                    {poi.code}
                  </span>
                </div>

                <div className="simple-row-meta">
                  <span>
                    Sensor de acesso
                  </span>

                  <strong>
                    {
                      poi.node
                        ?.code ??
                      "—"
                    }
                  </strong>
                </div>

                <div className="simple-row-meta">
                  <span>
                    Coordenadas
                  </span>

                  <strong>
                    {poi.x !== null &&
                    poi.y !== null
                      ? `(${poi.x}, ${poi.y})`
                      : "Não definidas"}
                  </strong>
                </div>
              </article>
            ),
          )}
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

                <div className="topology-node-info">
                  <strong>
                    {
                      sensor.code
                    }
                  </strong>

                  <span>
                    {
                      sensor.name ??
                      "Sensor NAVESCENCE"
                    }
                  </span>
                </div>

                <div className="topology-node-status">
                  <StatusBadge
                    value={
                      dashboard.nodes[
                        sensor.code
                      ]
                        ?.presence ??
                      "UNKNOWN"
                    }
                  />
                </div>
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

        <div className="simple-list embedded">
          {visibleEdges.map(
            edge => (
              <article
                key={edge.id}
                className="edge-simple-row"
              >
                <strong>
                  {
                    edge.nodeA
                      ?.code ??
                    edge.nodeAId
                  }
                </strong>

                <span className="edge-line">
                  ─────────
                </span>

                <strong>
                  {
                    edge.nodeB
                      ?.code ??
                    edge.nodeBId
                  }
                </strong>

                <small>
                  {edge.distance !==
                  null
                    ? `${edge.distance} m`
                    : "Distância não informada"}
                </small>

                <button
                  type="button"
                  className="row-action danger-button"
                  onClick={() => {
                    setDeleteError(
                      null,
                    );

                    setDeletingEdge(
                      edge,
                    );
                  }}
                >
                  <Trash2
                    size={16}
                  />

                  Excluir
                </button>
              </article>
            ),
          )}
        </div>
      </section>

      <ConfirmDialog
        open={
          Boolean(
            deletingEdge,
          )
        }
        title="Excluir conexão"
        description="A conexão será removida do grafo utilizado para calcular as rotas."
        confirmLabel="Excluir conexão"
        cancelLabel="Cancelar"
        loading={deleting}
        destructive
        onCancel={() =>
          setDeletingEdge(
            null,
          )
        }
        onConfirm={() =>
          void confirmarExclusao()
        }
      >
        {deletingEdge && (
          <div className="review-grid">
            <ReviewItem
              label="Origem"
              value={
                deletingEdge
                  .nodeA
                  ?.code ??
                deletingEdge
                  .nodeAId
              }
            />

            <ReviewItem
              label="Destino"
              value={
                deletingEdge
                  .nodeB
                  ?.code ??
                deletingEdge
                  .nodeBId
              }
            />

            <ReviewItem
              label="Distância"
              value={
                deletingEdge
                  .distance !==
                null
                  ? `${deletingEdge.distance} m`
                  : "Não informada"
              }
            />
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}