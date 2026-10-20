import {
  MoveRight,
  Plus,
  Trash2,
} from "lucide-react";

import "./PoiApproachesEditor.css";

export type PoiApproachSide =
  | "LEFT"
  | "RIGHT"
  | "FRONT";

export interface PoiApproachForm {
  fromNodeId:
    number | "";

  side:
    PoiApproachSide;

  distanceMeters:
    number | "";

  instruction:
    string;
}

export interface PoiApproachNode {
  id: number;
  code: string;
  name?: string | null;
}

interface PoiApproachesEditorProps {
  approaches:
    PoiApproachForm[];

  nodes:
    PoiApproachNode[];

  destinationNodeId:
    number | "";

  onChange: (
    approaches:
      PoiApproachForm[],
  ) => void;
}

function criarApproachVazio():
  PoiApproachForm {
  return {
    fromNodeId: "",
    side: "RIGHT",
    distanceMeters: "",
    instruction: "",
  };
}

export default function PoiApproachesEditor({
  approaches,
  nodes,
  destinationNodeId,
  onChange,
}: PoiApproachesEditorProps) {
  function adicionar() {
    onChange([
      ...approaches,
      criarApproachVazio(),
    ]);
  }

  function remover(
    index: number,
  ) {
    onChange(
      approaches.filter(
        (_, i) =>
          i !== index,
      ),
    );
  }

  function atualizar(
    index: number,
    patch:
      Partial<PoiApproachForm>,
  ) {
    onChange(
      approaches.map(
        (
          approach,
          i,
        ) =>
          i === index
            ? {
                ...approach,
                ...patch,
              }
            : approach,
      ),
    );
  }

  const nodesDisponiveis =
    nodes.filter(
      node =>
        node.id !==
        destinationNodeId,
    );

  return (
    <section className="poi-approaches">
      <div className="poi-approaches-header">
        <div>
          <h3>
            Orientações de chegada
          </h3>

          <p>
            Defina como o usuário
            chegará fisicamente ao
            destino após alcançar o
            nó de acesso.
          </p>
        </div>

        <button
          type="button"
          className="poi-secondary-button"
          onClick={
            adicionar
          }
        >
          <Plus size={18} />

          Adicionar orientação
        </button>
      </div>

      {approaches.length ===
      0 ? (
        <div className="poi-approaches-empty">
          <MoveRight
            size={24}
          />

          <div>
            <strong>
              Nenhuma orientação
              cadastrada
            </strong>

            <p>
              Caso nenhuma orientação
              seja cadastrada, o
              aplicativo utilizará a
              mensagem padrão para
              seguir o piso tátil até
              a entrada.
            </p>
          </div>
        </div>
      ) : (
        <div className="poi-approaches-list">
          {approaches.map(
            (
              approach,
              index,
            ) => (
              <div
                key={
                  index
                }
                className="poi-approach-card"
              >
                <div className="poi-approach-card-header">
                  <div>
                    <strong>
                      Orientação{" "}
                      {index + 1}
                    </strong>

                    <span>
                      Configure o sentido
                      de chegada.
                    </span>
                  </div>

                  <button
                    type="button"
                    className="poi-icon-button danger"
                    aria-label="Remover orientação"
                    title="Remover orientação"
                    onClick={() =>
                      remover(
                        index,
                      )
                    }
                  >
                    <Trash2
                      size={18}
                    />
                  </button>
                </div>

                <div className="poi-approach-grid">
                  <label className="poi-field">
                    <span>
                      Chegando do sensor
                    </span>

                    <select
                      value={
                        approach
                          .fromNodeId
                      }
                      onChange={
                        event =>
                          atualizar(
                            index,
                            {
                              fromNodeId:
                                event
                                  .target
                                  .value
                                  ? Number(
                                      event
                                        .target
                                        .value,
                                    )
                                  : "",
                            },
                          )
                      }
                    >
                      <option value="">
                        Selecione
                      </option>

                      {nodesDisponiveis.map(
                        node => (
                          <option
                            key={
                              node.id
                            }
                            value={
                              node.id
                            }
                          >
                            {
                              node.code
                            }

                            {node.name
                              ? ` — ${node.name}`
                              : ""}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label className="poi-field">
                    <span>
                      Destino está
                    </span>

                    <select
                      value={
                        approach.side
                      }
                      onChange={
                        event =>
                          atualizar(
                            index,
                            {
                              side:
                                event
                                  .target
                                  .value as PoiApproachSide,
                            },
                          )
                      }
                    >
                      <option value="RIGHT">
                        À direita
                      </option>

                      <option value="LEFT">
                        À esquerda
                      </option>

                      <option value="FRONT">
                        À frente
                      </option>
                    </select>
                  </label>

                  <label className="poi-field">
                    <span>
                      Distância aproximada
                    </span>

                    <div className="poi-distance-input">
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        placeholder="2"
                        value={
                          approach
                            .distanceMeters
                        }
                        onChange={
                          event =>
                            atualizar(
                              index,
                              {
                                distanceMeters:
                                  event
                                    .target
                                    .value ===
                                  ""
                                    ? ""
                                    : Number(
                                        event
                                          .target
                                          .value,
                                      ),
                              },
                            )
                        }
                      />

                      <span>
                        metros
                      </span>
                    </div>
                  </label>
                </div>

                <label className="poi-field">
                  <span>
                    Instrução complementar
                  </span>

                  <textarea
                    rows={3}
                    maxLength={
                      500
                    }
                    placeholder="Ex.: Siga o piso tátil até a porta da Sala Maker."
                    value={
                      approach
                        .instruction
                    }
                    onChange={
                      event =>
                        atualizar(
                          index,
                          {
                            instruction:
                              event
                                .target
                                .value,
                          },
                        )
                    }
                  />

                  <small>
                    {
                      approach
                        .instruction
                        .length
                    }
                    /500
                  </small>
                </label>
              </div>
            ),
          )}
        </div>
      )}
    </section>
  );
}