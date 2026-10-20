import {
  MapPin,
  Pencil,
  Plus,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  useForm,
} from "react-hook-form";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import {
  ConfirmDialog,
  ReviewItem,
} from "../../components/ui/ConfirmDialog";

import {
  LoadingState,
} from "../../components/ui/LoadingState";

import {
  Modal,
} from "../../components/ui/Modal";

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
  poiSchema,
  type PoiFormData,
} from "../../schemas/poiSchemas";

import {
  createPoi,
  deletePoi,
  updatePoi,
} from "../../services/poiService";

import type {
  Poi,
  PoiPayload,
} from "../../types/poi";

export function PoisPage() {
  const {
    pois,
    loading,
    error,
    reload,
  } = usePois();

  const {
    sensors,
  } = useSensors();

  const {
    selectedEnvironmentId,
  } = useEnvironment();

  const [modalOpen, setModalOpen] =
    useState(false);

  const [confirmOpen, setConfirmOpen] =
    useState(false);

  const [editing, setEditing] =
    useState<Poi | null>(null);

  const [pendingData, setPendingData] =
    useState<PoiFormData | null>(
      null,
    );

  const [saving, setSaving] =
    useState(false);

  const [serverError, setServerError] =
    useState<string | null>(
      null,
    );

  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
    },
  } = useForm<PoiFormData>({
    resolver:
      zodResolver(poiSchema),

    defaultValues: {
      code: "",
      name: "",
      type: "",
      nodeId: "",
      description: "",
      active: true,
    },
  });

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

  const visiblePois =
    useMemo(() => {
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
    }, [
      pois,
      selectedEnvironmentId,
    ]);

  function novo() {
    setEditing(null);
    setServerError(null);

    reset({
      code: "",
      name: "",
      type: "",
      nodeId: "",
      description: "",
      active: true,
    });

    setModalOpen(true);
  }

  function editar(
    poi: Poi,
  ) {
    setEditing(poi);
    setServerError(null);

    reset({
      code: poi.code,
      name: poi.name,
      type: poi.type,
      nodeId: String(
        poi.nodeId,
      ),
      description:
        poi.description ?? "",
      active: poi.active,
    });

    setModalOpen(true);
  }

  function revisar(
    data: PoiFormData,
  ) {
    setPendingData(data);
    setModalOpen(false);
    setConfirmOpen(true);
  }

  function sensorName(
    value: string,
  ) {
    const sensor =
      sensors.find(
        item =>
          item.id === Number(value),
      );

    if (!sensor) return "—";

    return `${sensor.code}${
      sensor.name
        ? ` · ${sensor.name}`
        : ""
    }`;
  }

  async function confirmar() {
    if (!pendingData) return;

    setSaving(true);

    const payload: PoiPayload = {
      code:
        pendingData.code.trim(),
      name:
        pendingData.name.trim(),
      type:
        pendingData.type,
      nodeId:
        Number(
          pendingData.nodeId,
        ),
      description:
        pendingData.description.trim() ||
        null,
      active:
        pendingData.active,
    };

    try {
      if (editing) {
        await updatePoi(
          editing.id,
          payload,
        );
      } else {
        await createPoi(
          payload,
        );
      }

      setConfirmOpen(false);

      await reload();
    } catch (error) {
      console.error(error);

      setConfirmOpen(false);
      setModalOpen(true);

      setServerError(
        "Não foi possível salvar o ponto de interesse.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function excluir() {
    if (!editing) return;

    if (
      !window.confirm(
        `Excluir "${editing.name}"?`,
      )
    ) {
      return;
    }

    try {
      await deletePoi(
        editing.id,
      );

      setModalOpen(false);

      await reload();
    } catch {
      setServerError(
        "Não foi possível excluir o ponto de interesse.",
      );
    }
  }

  if (loading) {
    return (
      <LoadingState message="Carregando pontos de interesse..." />
    );
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            Navegação
          </span>

          <h1>
            Pontos de interesse
          </h1>

          <p>
            Destinos disponíveis para
            navegação no ambiente.
          </p>
        </div>

        <button
          type="button"
          className="button primary"
          onClick={novo}
        >
          <Plus size={17} />
          Novo ponto
        </button>
      </section>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      <section className="simple-list">
        {visiblePois.map(poi => (
          <article
            key={poi.id}
            className="simple-row"
          >
            <div className="simple-row-icon">
              <MapPin size={19} />
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
                Sensor
              </span>

              <strong>
                {poi.node?.code ??
                  "—"}
              </strong>
            </div>

            <StatusBadge
              value={
                poi.active
                  ? "ACTIVE"
                  : "INACTIVE"
              }
            />

            <button
              type="button"
              className="row-action"
              onClick={() =>
                editar(poi)
              }
            >
              <Pencil size={16} />
              Editar
            </button>
          </article>
        ))}
      </section>

      <Modal
        open={modalOpen}
        title={
          editing
            ? `Editar ${editing.name}`
            : "Novo ponto de interesse"
        }
        onClose={() =>
          setModalOpen(false)
        }
      >
        {serverError && (
          <div className="alert error">
            {serverError}
          </div>
        )}

        <form
          onSubmit={
            handleSubmit(revisar)
          }
          noValidate
        >
          <div className="form-grid">
            <div className="field">
              <label>
                Código *
              </label>

              <input
                placeholder="POI_RECEPCAO"
                {...register("code")}
              />

              {errors.code && (
                <span className="field-error">
                  {errors.code.message}
                </span>
              )}
            </div>

            <div className="field">
              <label>
                Nome *
              </label>

              <input
                placeholder="Recepção"
                {...register("name")}
              />

              {errors.name && (
                <span className="field-error">
                  {errors.name.message}
                </span>
              )}
            </div>

            <div className="field">
              <label>
                Tipo *
              </label>

              <select
                {...register("type")}
              >
                <option value="">
                  Selecione
                </option>

                <option value="ENTRADA">
                  Entrada
                </option>

                <option value="SERVICO">
                  Serviço
                </option>

                <option value="BANHEIRO">
                  Banheiro
                </option>

                <option value="SALA">
                  Sala
                </option>

                <option value="ACESSIBILIDADE">
                  Acessibilidade
                </option>

                <option value="REFERENCIA">
                  Referência
                </option>

                <option value="OUTRO">
                  Outro
                </option>
              </select>

              {errors.type && (
                <span className="field-error">
                  {errors.type.message}
                </span>
              )}
            </div>

            <div className="field">
              <label>
                Sensor relacionado *
              </label>

              <select
                {...register(
                  "nodeId",
                )}
              >
                <option value="">
                  Selecione
                </option>

                {visibleSensors.map(
                  sensor => (
                    <option
                      key={sensor.id}
                      value={sensor.id}
                    >
                      {sensor.code}
                      {sensor.name
                        ? ` · ${sensor.name}`
                        : ""}
                    </option>
                  ),
                )}
              </select>

              {errors.nodeId && (
                <span className="field-error">
                  {
                    errors.nodeId
                      .message
                  }
                </span>
              )}
            </div>

            <div className="field field-full">
              <label>
                Descrição
              </label>

              <textarea
                rows={4}
                {...register(
                  "description",
                )}
              />
            </div>
          </div>

          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                {...register("active")}
              />

              Ponto disponível para
              navegação
            </label>
          </div>

          <footer className="form-actions split">
            <div>
              {editing && (
                <button
                  type="button"
                  className="button danger-button"
                  onClick={() =>
                    void excluir()
                  }
                >
                  Excluir
                </button>
              )}
            </div>

            <div>
              <button
                type="button"
                className="button secondary"
                onClick={() =>
                  setModalOpen(
                    false,
                  )
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="button primary"
              >
                Revisar
              </button>
            </div>
          </footer>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title={
          editing
            ? "Confirmar alteração"
            : "Confirmar novo ponto"
        }
        description="Confira as informações antes de continuar."
        loading={saving}
        confirmLabel={
          editing
            ? "Confirmar alteração"
            : "Criar ponto"
        }
        onCancel={() => {
          setConfirmOpen(false);
          setModalOpen(true);
        }}
        onConfirm={() =>
          void confirmar()
        }
      >
        {pendingData && (
          <div className="review-grid">
            <ReviewItem
              label="Código"
              value={
                pendingData.code
              }
            />

            <ReviewItem
              label="Nome"
              value={
                pendingData.name
              }
            />

            <ReviewItem
              label="Tipo"
              value={
                pendingData.type
              }
            />

            <ReviewItem
              label="Sensor"
              value={sensorName(
                pendingData.nodeId,
              )}
            />

            <ReviewItem
              label="Descrição"
              value={
                pendingData.description ||
                "Sem descrição"
              }
            />

            <ReviewItem
              label="Disponível"
              value={
                pendingData.active
                  ? "Sim"
                  : "Não"
              }
            />
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}