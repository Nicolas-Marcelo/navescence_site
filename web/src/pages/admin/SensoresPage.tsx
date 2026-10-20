import {
  Pencil,
  Plus,
  RadioTower,
  RefreshCw,
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
  useSensors,
} from "../../hooks/useSensors";

import {
  sensorSchema,
  type SensorFormData,
} from "../../schemas/sensorSchemas";

import {
  createSensor,
  updateSensor,
} from "../../services/sensorService";

import type {
  Sensor,
  SensorPayload,
} from "../../types/sensor";

export function SensoresPage() {
  const {
    sensors,
    dashboard,
    loading,
    error,
    reload,
  } = useSensors(true);

  const {
    environments,
    selectedEnvironmentId,
  } = useEnvironment();

  const [search, setSearch] =
    useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [confirmOpen, setConfirmOpen] =
    useState(false);

  const [editingSensor, setEditingSensor] =
    useState<Sensor | null>(null);

  const [pendingData, setPendingData] =
    useState<SensorFormData | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [serverError, setServerError] =
    useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
    },
  } = useForm<SensorFormData>({
    resolver:
      zodResolver(sensorSchema),

    defaultValues: {
      code: "",
      name: "",
      mac: "",
      environmentId: "",
      location: "",
      x: "",
      y: "",
      active: true,
      maintenance: false,
    },
  });

  const filtered =
    useMemo(() => {
      let result =
        [...sensors];

      if (
        selectedEnvironmentId !==
        "ALL"
      ) {
        result =
          result.filter(
            sensor =>
              sensor.environmentId ===
              selectedEnvironmentId,
          );
      }

      const query =
        search
          .trim()
          .toLowerCase();

      if (query) {
        result =
          result.filter(
            sensor => {
              const value = `
                ${sensor.code}
                ${sensor.name ?? ""}
                ${sensor.mac ?? ""}
                ${sensor.location ?? ""}
                ${sensor.environment?.name ?? ""}
              `.toLowerCase();

              return value.includes(
                query,
              );
            },
          );
      }

      return result.sort(
        (a, b) =>
          a.code.localeCompare(
            b.code,
            undefined,
            { numeric: true },
          ),
      );
    }, [
      sensors,
      search,
      selectedEnvironmentId,
    ]);

  function novoSensor() {
    setEditingSensor(null);
    setServerError(null);

    reset({
      code: "",
      name: "",
      mac: "",
      environmentId:
        selectedEnvironmentId ===
        "ALL"
          ? ""
          : String(
              selectedEnvironmentId,
            ),
      location: "",
      x: "",
      y: "",
      active: true,
      maintenance: false,
    });

    setModalOpen(true);
  }

  function editarSensor(
    sensor: Sensor,
  ) {
    setEditingSensor(sensor);
    setServerError(null);

    reset({
      code: sensor.code,
      name: sensor.name ?? "",
      mac: sensor.mac ?? "",
      environmentId:
        sensor.environmentId != null
          ? String(
              sensor.environmentId,
            )
          : "",
      location:
        sensor.location ?? "",
      x:
        sensor.x != null
          ? String(sensor.x)
          : "",
      y:
        sensor.y != null
          ? String(sensor.y)
          : "",
      active: sensor.active,
      maintenance:
        sensor.maintenance,
    });

    setModalOpen(true);
  }

  function revisar(
    data: SensorFormData,
  ) {
    setPendingData(data);
    setModalOpen(false);
    setConfirmOpen(true);
  }

  function voltarEdicao() {
    setConfirmOpen(false);
    setModalOpen(true);
  }

  function environmentName(
    value: string,
  ) {
    if (!value) return "Nenhum";

    return (
      environments.find(
        item =>
          item.id === Number(value),
      )?.name ?? "Desconhecido"
    );
  }

  async function confirmar() {
    if (!pendingData) return;

    setSaving(true);
    setServerError(null);

    const payload: SensorPayload = {
      code:
        pendingData.code.trim(),
      name:
        pendingData.name.trim() ||
        null,
      mac:
        pendingData.mac.trim() ||
        null,
      environmentId:
        pendingData.environmentId
          ? Number(
              pendingData.environmentId,
            )
          : null,
      location:
        pendingData.location.trim() ||
        null,
      x:
        pendingData.x === ""
          ? null
          : Number(
              pendingData.x,
            ),
      y:
        pendingData.y === ""
          ? null
          : Number(
              pendingData.y,
            ),
      active:
        pendingData.active,
      maintenance:
        pendingData.maintenance,
    };

    try {
      if (editingSensor) {
        await updateSensor(
          editingSensor.id,
          payload,
        );
      } else {
        await createSensor(
          payload,
        );
      }

      setConfirmOpen(false);
      setPendingData(null);

      await reload();
    } catch (error) {
      console.error(error);

      setConfirmOpen(false);
      setModalOpen(true);

      setServerError(
        "Não foi possível salvar o sensor. Verifique os dados e tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <LoadingState message="Carregando sensores..." />
    );
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            Infraestrutura
          </span>

          <h1>Sensores</h1>

          <p>
            Nós responsáveis pela
            infraestrutura de localização.
          </p>
        </div>

        <div className="page-actions">
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

          <button
            type="button"
            className="button primary"
            onClick={novoSensor}
          >
            <Plus size={17} />
            Novo sensor
          </button>
        </div>
      </section>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      <section className="simple-toolbar">
        <input
          type="search"
          placeholder="Buscar sensor..."
          value={search}
          onChange={event =>
            setSearch(
              event.target.value,
            )
          }
        />

        <span>
          {filtered.length}{" "}
          {filtered.length === 1
            ? "sensor"
            : "sensores"}
        </span>
      </section>

      <section className="simple-list">
        {filtered.map(sensor => {
          const runtime =
            dashboard.nodes[
              sensor.code
            ];

          return (
            <article
              key={sensor.id}
              className="simple-row"
            >
              <div className="simple-row-icon">
                <RadioTower
                  size={19}
                />
              </div>

              <div className="simple-row-main">
                <strong>
                  {sensor.code}
                </strong>

                <span>
                  {sensor.name ??
                    "Sensor NAVESCENCE"}
                </span>
              </div>

              <div className="simple-row-meta">
                <span>
                  Ambiente
                </span>

                <strong>
                  {sensor.environment
                    ?.name ?? "—"}
                </strong>
              </div>

              <StatusBadge
                value={
                  runtime?.presence ??
                  "UNKNOWN"
                }
              />

              <button
                type="button"
                className="row-action"
                onClick={() =>
                  editarSensor(sensor)
                }
              >
                <Pencil size={16} />
                Editar
              </button>
            </article>
          );
        })}
      </section>

      <Modal
        open={modalOpen}
        title={
          editingSensor
            ? `Editar ${editingSensor.code}`
            : "Novo sensor"
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
              <label htmlFor="sensor-code">
                Código *
              </label>

              <input
                id="sensor-code"
                placeholder="NAV_S06"
                {...register("code")}
              />

              {errors.code && (
                <span className="field-error">
                  {errors.code.message}
                </span>
              )}
            </div>

            <div className="field">
              <label htmlFor="sensor-name">
                Nome
              </label>

              <input
                id="sensor-name"
                placeholder="Corredor principal"
                {...register("name")}
              />

              {errors.name && (
                <span className="field-error">
                  {errors.name.message}
                </span>
              )}
            </div>

            <div className="field field-full">
              <label htmlFor="sensor-mac">
                MAC
              </label>

              <input
                id="sensor-mac"
                placeholder="AA:BB:CC:DD:EE:FF"
                {...register("mac")}
              />

              {errors.mac && (
                <span className="field-error">
                  {errors.mac.message}
                </span>
              )}
            </div>

            <div className="field field-full">
              <label htmlFor="sensor-environment">
                Ambiente
              </label>

              <select
                id="sensor-environment"
                {...register(
                  "environmentId",
                )}
              >
                <option value="">
                  Nenhum ambiente
                </option>

                {environments.map(
                  environment => (
                    <option
                      key={
                        environment.id
                      }
                      value={
                        environment.id
                      }
                    >
                      {
                        environment.name
                      }
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="field field-full">
              <label htmlFor="sensor-location">
                Localização
              </label>

              <input
                id="sensor-location"
                placeholder="Próximo à entrada principal"
                {...register(
                  "location",
                )}
              />
            </div>

            <div className="field">
              <label htmlFor="sensor-x">
                Posição X
              </label>

              <input
                id="sensor-x"
                inputMode="decimal"
                {...register("x")}
              />

              {errors.x && (
                <span className="field-error">
                  {errors.x.message}
                </span>
              )}
            </div>

            <div className="field">
              <label htmlFor="sensor-y">
                Posição Y
              </label>

              <input
                id="sensor-y"
                inputMode="decimal"
                {...register("y")}
              />

              {errors.y && (
                <span className="field-error">
                  {errors.y.message}
                </span>
              )}
            </div>
          </div>

          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                {...register("active")}
              />

              Sensor habilitado
            </label>

            <label>
              <input
                type="checkbox"
                {...register(
                  "maintenance",
                )}
              />

              Em manutenção
            </label>
          </div>

          <footer className="form-actions">
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
              Revisar cadastro
            </button>
          </footer>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title={
          editingSensor
            ? "Confirmar alteração"
            : "Confirmar novo sensor"
        }
        description="Confira as informações antes de gravar no sistema."
        confirmLabel={
          editingSensor
            ? "Confirmar alteração"
            : "Criar sensor"
        }
        loading={saving}
        onCancel={voltarEdicao}
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
                pendingData.name ||
                "Sem nome"
              }
            />

            <ReviewItem
              label="MAC"
              value={
                pendingData.mac ||
                "Não informado"
              }
            />

            <ReviewItem
              label="Ambiente"
              value={environmentName(
                pendingData.environmentId,
              )}
            />

            <ReviewItem
              label="Localização"
              value={
                pendingData.location ||
                "Não informada"
              }
            />

            <ReviewItem
              label="Posição"
              value={
                pendingData.x ||
                pendingData.y
                  ? `X: ${pendingData.x || "—"} / Y: ${pendingData.y || "—"}`
                  : "Não informada"
              }
            />

            <ReviewItem
              label="Estado"
              value={
                pendingData.active
                  ? "Habilitado"
                  : "Desabilitado"
              }
            />

            <ReviewItem
              label="Manutenção"
              value={
                pendingData.maintenance
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