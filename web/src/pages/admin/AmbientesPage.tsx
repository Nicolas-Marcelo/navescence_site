import {
  Building2,
  Pencil,
  Plus,
} from "lucide-react";

import {
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
  useEnvironment,
} from "../../context/EnvironmentContext";

import {
  environmentSchema,
  type EnvironmentFormData,
} from "../../schemas/environmentSchemas";

import {
  createEnvironment,
  deleteEnvironment,
  updateEnvironment,
} from "../../services/environmentService";

import type {
  Environment,
  EnvironmentPayload,
} from "../../types/environment";

export function AmbientesPage() {
  const {
    environments,
    loading,
    reloadEnvironments,
  } = useEnvironment();

  const [modalOpen, setModalOpen] =
    useState(false);

  const [confirmOpen, setConfirmOpen] =
    useState(false);

  const [editing, setEditing] =
    useState<Environment | null>(
      null,
    );

  const [pendingData, setPendingData] =
    useState<EnvironmentFormData | null>(
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
  } = useForm<EnvironmentFormData>({
    resolver:
      zodResolver(environmentSchema),

    defaultValues: {
      code: "",
      name: "",
      type: "",
      floor: "Térreo",
      description: "",
    },
  });

  function novo() {
    setEditing(null);
    setServerError(null);

    reset({
      code: "",
      name: "",
      type: "",
      floor: "Térreo",
      description: "",
    });

    setModalOpen(true);
  }

  function editar(
    environment: Environment,
  ) {
    setEditing(environment);
    setServerError(null);

    reset({
      code: environment.code,
      name: environment.name,
      type:
        environment.type ?? "",
      floor:
        environment.floor ??
        "Térreo",
      description:
        environment.description ??
        "",
    });

    setModalOpen(true);
  }

  function revisar(
    data: EnvironmentFormData,
  ) {
    setPendingData(data);
    setModalOpen(false);
    setConfirmOpen(true);
  }

  async function confirmar() {
    if (!pendingData) return;

    setSaving(true);

    const payload: EnvironmentPayload = {
      code:
        pendingData.code.trim(),
      name:
        pendingData.name.trim(),
      type:
        pendingData.type ||
        null,
      floor:
        pendingData.floor.trim(),
      description:
        pendingData.description.trim() ||
        null,
    };

    try {
      if (editing) {
        await updateEnvironment(
          editing.id,
          payload,
        );
      } else {
        await createEnvironment(
          payload,
        );
      }

      setConfirmOpen(false);
      setPendingData(null);

      await reloadEnvironments();
    } catch (error) {
      console.error(error);

      setConfirmOpen(false);
      setModalOpen(true);

      setServerError(
        "Não foi possível salvar o ambiente.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function excluir() {
    if (!editing) return;

    const confirmed =
      window.confirm(
        `Excluir o ambiente "${editing.name}"?`,
      );

    if (!confirmed) return;

    try {
      await deleteEnvironment(
        editing.id,
      );

      setModalOpen(false);

      await reloadEnvironments();
    } catch {
      setServerError(
        "Não foi possível excluir o ambiente. Verifique se existem sensores vinculados.",
      );
    }
  }

  if (loading) {
    return (
      <LoadingState message="Carregando ambientes..." />
    );
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            Estrutura física
          </span>

          <h1>Ambientes</h1>

          <p>
            Espaços atendidos pela
            infraestrutura NAVESCENCE.
          </p>
        </div>

        <button
          type="button"
          className="button primary"
          onClick={novo}
        >
          <Plus size={17} />
          Novo ambiente
        </button>
      </section>

      <section className="simple-list">
        {environments.map(
          environment => (
            <article
              key={environment.id}
              className="simple-row"
            >
              <div className="simple-row-icon">
                <Building2
                  size={19}
                />
              </div>

              <div className="simple-row-main">
                <strong>
                  {environment.name}
                </strong>

                <span>
                  {environment.code}
                </span>
              </div>

              <div className="simple-row-meta">
                <span>
                  Pavimento
                </span>

                <strong>
                  {environment.floor ??
                    "—"}
                </strong>
              </div>

              <div className="simple-row-meta">
                <span>
                  Sensores
                </span>

                <strong>
                  {environment._count
                    ?.nodes ?? 0}
                </strong>
              </div>

              <button
                type="button"
                className="row-action"
                onClick={() =>
                  editar(environment)
                }
              >
                <Pencil size={16} />
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
            : "Novo ambiente"
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
                placeholder="IADB_TERREO"
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
                placeholder="IADB - Térreo"
                {...register("name")}
              />

              {errors.name && (
                <span className="field-error">
                  {errors.name.message}
                </span>
              )}
            </div>

            <div className="field">
              <label>Tipo</label>

              <select
                {...register("type")}
              >
                <option value="">
                  Não definido
                </option>

                <option value="CORREDOR">
                  Corredor
                </option>

                <option value="SALA">
                  Sala
                </option>

                <option value="RECEPCAO">
                  Recepção
                </option>

                <option value="BIBLIOTECA">
                  Biblioteca
                </option>

                <option value="AREA_COMUM">
                  Área comum
                </option>

                <option value="OUTRO">
                  Outro
                </option>
              </select>
            </div>

            <div className="field">
              <label>
                Pavimento *
              </label>

              <input
                placeholder="Térreo"
                {...register("floor")}
              />

              {errors.floor && (
                <span className="field-error">
                  {errors.floor.message}
                </span>
              )}
            </div>

            <div className="field field-full">
              <label>
                Descrição
              </label>

              <textarea
                rows={4}
                placeholder="Descrição resumida do ambiente."
                {...register(
                  "description",
                )}
              />

              {errors.description && (
                <span className="field-error">
                  {
                    errors.description
                      .message
                  }
                </span>
              )}
            </div>
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
            : "Confirmar novo ambiente"
        }
        description="Confira os dados que serão gravados."
        loading={saving}
        confirmLabel={
          editing
            ? "Confirmar alteração"
            : "Criar ambiente"
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
                pendingData.type ||
                "Não definido"
              }
            />

            <ReviewItem
              label="Pavimento"
              value={
                pendingData.floor
              }
            />

            <ReviewItem
              label="Descrição"
              value={
                pendingData.description ||
                "Sem descrição"
              }
            />
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}