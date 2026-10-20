import {
  useEffect,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import PoiApproachesEditor from "./PoiApproachesEditor";

import type {
  PoiApproachForm,
  PoiApproachNode,
} from "./PoiApproachesEditor";

import type {
  PoiPayload,
  PoiResponse,
} from "../../services/poiApi";

interface PoiFormProps {
  poi?: PoiResponse | null;

  nodes:
    PoiApproachNode[];

  onSubmit: (
    payload:
      PoiPayload,
  ) => Promise<void>;

  onCancel:
    () => void;
}

export default function PoiForm({
  poi,
  nodes,
  onSubmit,
  onCancel,
}: PoiFormProps) {
  const [
    code,
    setCode,
  ] =
    useState("");

  const [
    name,
    setName,
  ] =
    useState("");

  const [
    type,
    setType,
  ] =
    useState("ROOM");

  const [
    description,
    setDescription,
  ] =
    useState("");

  const [
    nodeId,
    setNodeId,
  ] =
    useState<
      number | ""
    >("");

  const [
    active,
    setActive,
  ] =
    useState(true);

  const [
    approaches,
    setApproaches,
  ] =
    useState<
      PoiApproachForm[]
    >([]);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  useEffect(
    () => {
      if (!poi) {
        setCode("");
        setName("");
        setType("ROOM");
        setDescription("");
        setNodeId("");
        setActive(true);
        setApproaches([]);

        return;
      }

      setCode(
        poi.code,
      );

      setName(
        poi.name,
      );

      setType(
        poi.type,
      );

      setDescription(
        poi.description ??
          "",
      );

      setNodeId(
        poi.nodeId,
      );

      setActive(
        poi.active,
      );

      setApproaches(
        (
          poi.approaches ??
          []
        ).map(
          approach => ({
            fromNodeId:
              approach
                .fromNodeId,

            side:
              approach.side,

            distanceMeters:
              approach
                .distanceMeters ??
              "",

            instruction:
              approach
                .instruction ??
              "",
          }),
        ),
      );
    },
    [poi],
  );

  function validar() {
    if (
      !code.trim()
    ) {
      throw new Error(
        "Informe o código do POI.",
      );
    }

    if (
      !name.trim()
    ) {
      throw new Error(
        "Informe o nome do POI.",
      );
    }

    if (
      !type.trim()
    ) {
      throw new Error(
        "Informe o tipo do POI.",
      );
    }

    if (
      nodeId === ""
    ) {
      throw new Error(
        "Selecione o nó de acesso.",
      );
    }

    const usados =
      new Set<number>();

    for (
      const approach
      of approaches
    ) {
      if (
        approach
          .fromNodeId ===
        ""
      ) {
        throw new Error(
          "Selecione o sensor de origem em todas as orientações.",
        );
      }

      if (
        approach
          .fromNodeId ===
        nodeId
      ) {
        throw new Error(
          "O sensor de origem não pode ser o mesmo sensor do destino.",
        );
      }

      if (
        usados.has(
          approach
            .fromNodeId,
        )
      ) {
        throw new Error(
          "Existe mais de uma orientação para o mesmo sensor de origem.",
        );
      }

      if (
        approach
            .distanceMeters !==
          "" &&
        approach
            .distanceMeters <=
          0
      ) {
        throw new Error(
          "A distância deve ser maior que zero.",
        );
      }

      usados.add(
        approach
          .fromNodeId,
      );
    }
  }

  async function handleSubmit(
    event:
      FormEvent,
  ) {
    event.preventDefault();

    setError("");

    try {
      validar();

      setSaving(true);

      const payload:
        PoiPayload = {
        code:
          code
            .trim()
            .toUpperCase(),

        name:
          name.trim(),

        type:
          type
            .trim()
            .toUpperCase(),

        description:
          description
            .trim() ||
          null,

        nodeId:
          Number(
            nodeId,
          ),

        active,

        approaches:
          approaches.map(
            approach => ({
              fromNodeId:
                Number(
                  approach
                    .fromNodeId,
                ),

              side:
                approach.side,

              distanceMeters:
                approach
                    .distanceMeters ===
                  ""
                  ? null
                  : Number(
                      approach
                        .distanceMeters,
                    ),

              instruction:
                approach
                  .instruction
                  .trim() ||
                null,
            }),
          ),
      };

      await onSubmit(
        payload,
      );
    } catch (
      exception
    ) {
      setError(
        exception instanceof
          Error
          ? exception.message
          : "Não foi possível salvar o POI.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="poi-form"
      onSubmit={
        handleSubmit
      }
    >
      <div className="poi-form-grid">
        <label className="poi-field">
          <span>
            Código
          </span>

          <input
            value={
              code
            }
            maxLength={
              40
            }
            placeholder="SALA_MAKER"
            onChange={
              event =>
                setCode(
                  event
                    .target
                    .value,
                )
            }
          />
        </label>

        <label className="poi-field">
          <span>
            Nome
          </span>

          <input
            value={
              name
            }
            maxLength={
              120
            }
            placeholder="Sala Maker"
            onChange={
              event =>
                setName(
                  event
                    .target
                    .value,
                )
            }
          />
        </label>

        <label className="poi-field">
          <span>
            Tipo
          </span>

          <select
            value={
              type
            }
            onChange={
              event =>
                setType(
                  event
                    .target
                    .value,
                )
            }
          >
            <option value="ROOM">
              Sala
            </option>

            <option value="ENTRANCE">
              Entrada
            </option>

            <option value="BATHROOM">
              Banheiro
            </option>

            <option value="SERVICE">
              Serviço
            </option>

            <option value="STAIRS">
              Escada
            </option>

            <option value="ELEVATOR">
              Elevador
            </option>

            <option value="OTHER">
              Outro
            </option>
          </select>
        </label>

        <label className="poi-field">
          <span>
            Nó de acesso
          </span>

          <select
            value={
              nodeId
            }
            onChange={
              event =>
                setNodeId(
                  event
                    .target
                    .value
                    ? Number(
                        event
                          .target
                          .value,
                      )
                    : "",
                )
            }
          >
            <option value="">
              Selecione
            </option>

            {nodes.map(
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
      </div>

      <label className="poi-field">
        <span>
          Descrição
        </span>

        <textarea
          rows={3}
          maxLength={
            255
          }
          value={
            description
          }
          placeholder="Descrição opcional do destino."
          onChange={
            event =>
              setDescription(
                event
                  .target
                  .value,
              )
          }
        />
      </label>

      <label className="poi-checkbox-field">
        <input
          type="checkbox"
          checked={
            active
          }
          onChange={
            event =>
              setActive(
                event
                  .target
                  .checked,
              )
          }
        />

        <div>
          <strong>
            POI ativo
          </strong>

          <span>
            Disponibilizar este destino
            para navegação.
          </span>
        </div>
      </label>

      <div className="poi-form-divider" />

      <PoiApproachesEditor
        approaches={
          approaches
        }
        nodes={
          nodes
        }
        destinationNodeId={
          nodeId
        }
        onChange={
          setApproaches
        }
      />

      {error && (
        <div className="poi-form-error">
          {error}
        </div>
      )}

      <div className="poi-form-actions">
        <button
          type="button"
          className="poi-button-secondary"
          onClick={
            onCancel
          }
          disabled={
            saving
          }
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="poi-button-primary"
          disabled={
            saving
          }
        >
          {saving
            ? "Salvando..."
            : poi
              ? "Salvar alterações"
              : "Cadastrar destino"}
        </button>
      </div>
    </form>
  );
}