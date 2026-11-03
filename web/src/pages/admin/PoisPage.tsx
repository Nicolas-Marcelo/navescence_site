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
  apiErrorMessage,
} from "../../services/apiMessages";

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

  const [
    modalOpen,
    setModalOpen,
  ] =
    useState(false);

  const [
    confirmOpen,
    setConfirmOpen,
  ] =
    useState(false);

  const [
    deleteOpen,
    setDeleteOpen,
  ] =
    useState(false);

  const [
    editing,
    setEditing,
  ] =
    useState<
      Poi | null
    >(null);

  const [
    pendingData,
    setPendingData,
  ] =
    useState<
      PoiFormData | null
    >(null);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    deleting,
    setDeleting,
  ] =
    useState(false);

  const [
    serverError,
    setServerError,
  ] =
    useState<
      string | null
    >(null);

  const {
    register,
    handleSubmit,
    reset,

    formState: {
      errors,
    },
  } =
    useForm<
      PoiFormData
    >({
      resolver:
        zodResolver(
          poiSchema,
        ),

      defaultValues: {
        code: "",
        name: "",
        type: "",
        nodeId: "",
        description: "",
        x: "",
        y: "",
        active: true,
      },
    });

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

  function novo() {
    setEditing(null);
    setServerError(null);

    reset({
      code: "",
      name: "",
      type: "",
      nodeId: "",
      description: "",
      x: "",
      y: "",
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
      code:
        poi.code,

      name:
        poi.name,

      type:
        poi.type,

      nodeId:
        String(
          poi.nodeId,
        ),

      description:
        poi.description ??
        "",

      x:
        poi.x !== null
          ? String(
              poi.x,
            )
          : "",

      y:
        poi.y !== null
          ? String(
              poi.y,
            )
          : "",

      active:
        poi.active,
    });

    setModalOpen(true);
  }

  function revisar(
    data:
      PoiFormData,
  ) {
    setPendingData(
      data,
    );

    setModalOpen(false);
    setConfirmOpen(true);
  }

  function sensorName(
    value: string,
  ) {
    const sensor =
      sensors.find(
        item =>
          item.id ===
          Number(value),
      );

    if (!sensor) {
      return "—";
    }

    return `${sensor.code}${
      sensor.name
        ? ` · ${sensor.name}`
        : ""
    }`;
  }

  async function confirmar() {
    if (!pendingData) {
      return;
    }

    setSaving(true);
    setServerError(null);

    const payload:
      PoiPayload = {
      code:
        pendingData
          .code
          .trim()
          .toUpperCase(),

      name:
        pendingData
          .name
          .trim(),

      type:
        pendingData.type,

      nodeId:
        Number(
          pendingData.nodeId,
        ),

      description:
        pendingData
          .description
          .trim() ||
        null,

      x:
        pendingData.x ===
        ""
          ? null
          : Number(
              pendingData.x,
            ),

      y:
        pendingData.y ===
        ""
          ? null
          : Number(
              pendingData.y,
            ),

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
      setPendingData(null);

      await reload();
    } catch (error) {
      setConfirmOpen(false);
      setModalOpen(true);

      setServerError(
        apiErrorMessage(
          error,
          "Não foi possível salvar o ponto de interesse.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  function pedirExclusao() {
    if (!editing) {
      return;
    }

    setServerError(null);
    setDeleteOpen(true);
  }

  async function confirmarExclusao() {
    if (!editing) {
      return;
    }

    setDeleting(true);
    setServerError(null);

    try {
      await deletePoi(
        editing.id,
      );

      setDeleteOpen(false);
      setModalOpen(false);
      setEditing(null);

      await reload();
    } catch (error) {
      setDeleteOpen(false);
      setModalOpen(true);

      setServerError(
        apiErrorMessage(
          error,
          "Não foi possível excluir o ponto de interesse.",
        ),
      );
    } finally {
      setDeleting(false);
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
            Destinos e locais de
            origem posicionados no
            ambiente.
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
        {visiblePois.map(
          poi => (
            <article
              key={poi.id}
              className="simple-row poi-row"
            >
              <div className="simple-row-icon">
                <MapPin
                  size={19}
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
                  Posição
                </span>

                <strong>
                  {poi.x !== null &&
                  poi.y !== null
                    ? `(${poi.x}, ${poi.y})`
                    : "—"}
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
                <Pencil
                  size={16}
                />

                Editar
              </button>
            </article>
          ),
        )}
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
            handleSubmit(
              revisar,
            )
          }
          autoComplete="off"
          noValidate
        >
          <div className="form-grid">
            <div className="field">
              <label>
                Código *
              </label>

              <input
                autoComplete="off"
                spellCheck={false}
                maxLength={40}
                {...register(
                  "code",
                )}
              />

              {errors.code && (
                <span className="field-error">
                  {
                    errors.code
                      .message
                  }
                </span>
              )}
            </div>

            <div className="field">
              <label>
                Nome *
              </label>

              <input
                autoComplete="off"
                spellCheck={false}
                maxLength={120}
                {...register(
                  "name",
                )}
              />

              {errors.name && (
                <span className="field-error">
                  {
                    errors.name
                      .message
                  }
                </span>
              )}
            </div>

            <div className="field">
              <label>
                Tipo *
              </label>

              <select
                {...register(
                  "type",
                )}
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
                  {
                    errors.type
                      .message
                  }
                </span>
              )}
            </div>

            <div className="field">
              <label>
                Sensor de acesso *
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
                rows={3}
                maxLength={255}
                {...register(
                  "description",
                )}
              />

              {errors
                .description && (
                <span className="field-error">
                  {
                    errors
                      .description
                      .message
                  }
                </span>
              )}
            </div>

            <div className="field">
              <label>
                Coordenada X
              </label>

              <input
                type="text"
                autoComplete="off"
                inputMode="decimal"
                spellCheck={false}
                {...register(
                  "x",
                )}
              />

              {errors.x && (
                <span className="field-error">
                  {
                    errors.x
                      .message
                  }
                </span>
              )}
            </div>

            <div className="field">
              <label>
                Coordenada Y
              </label>

              <input
                type="text"
                autoComplete="off"
                inputMode="decimal"
                spellCheck={false}
                {...register(
                  "y",
                )}
              />

              {errors.y && (
                <span className="field-error">
                  {
                    errors.y
                      .message
                  }
                </span>
              )}
            </div>
          </div>

          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                {...register(
                  "active",
                )}
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
                  onClick={
                    pedirExclusao
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
                  setModalOpen(false)
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
        cancelLabel="Voltar e editar"
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
              label="Sensor de acesso"
              value={
                sensorName(
                  pendingData.nodeId,
                )
              }
            />

            <ReviewItem
              label="Posição"
              value={
                pendingData.x !==
                  "" &&
                pendingData.y !==
                  ""
                  ? `(${pendingData.x}, ${pendingData.y})`
                  : "Não informada"
              }
            />
          </div>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={deleteOpen}
        title="Excluir ponto de interesse"
        description="Esta ação não poderá ser desfeita."
        confirmLabel="Excluir ponto"
        cancelLabel="Cancelar"
        loading={deleting}
        destructive
        onCancel={() => {
          setDeleteOpen(false);
          setModalOpen(true);
        }}
        onConfirm={() =>
          void confirmarExclusao()
        }
      >
        {editing && (
          <div className="review-grid">
            <ReviewItem
              label="Ponto"
              value={
                editing.name
              }
            />

            <ReviewItem
              label="Código"
              value={
                editing.code
              }
            />
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}