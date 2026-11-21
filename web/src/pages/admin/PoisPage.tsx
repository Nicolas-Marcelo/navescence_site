
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ConfirmDialog, ReviewItem } from "../../components/ui/ConfirmDialog";
import { LoadingState } from "../../components/ui/LoadingState";
import { Modal } from "../../components/ui/Modal";
import { StatusBadge } from "../../components/ui/StatusBadge";

import { useEnvironment } from "../../context/EnvironmentContext";
import { usePois } from "../../hooks/usePois";
import { useSensors } from "../../hooks/useSensors";

import { poiSchema, type PoiFormData } from "../../schemas/poiSchemas";
import { ApiError } from "../../services/api";
import { apiErrorMessage } from "../../services/apiMessages";
import { createPoi, deletePoi, updatePoi } from "../../services/poiService";

import type { Poi, PoiPayload } from "../../types/poi";

import "./PoisPage.css";

const camposPoi = [
  "code", "name", "type", "nodeId",
  "description", "x", "y", "active",
] as const;

type CampoPoi = typeof camposPoi[number];

function campoValido(value: string): value is CampoPoi {
  return camposPoi.some(campo => campo === value);
}

function mensagemCampo(field: string, message: string) {
  const mensagens: Record<string, string> = {
    code: "Código",
    name: "Nome",
    type: "Tipo",
    nodeId: "Sensor de acesso",
    description: "Descrição",
    x: "Coordenada X",
    y: "Coordenada Y",
    active: "Disponibilidade",
    orientationDegrees: "Orientação",
  };

  const nome = mensagens[field] ?? field;
  const texto = message.trim();

  if (texto.includes("expected number, received undefined")) {
    return `${nome}: campo numérico obrigatório não enviado.`;
  }

  if (texto.includes("expected number, received")) {
    return `${nome}: informe um número válido.`;
  }

  if (texto.includes("expected string, received")) {
    return `${nome}: informe um texto válido.`;
  }

  return `${nome}: ${texto}`;
}

export function PoisPage() {
  const { pois, loading, error, reload } = usePois();
  const { sensors } = useSensors();
  const { selectedEnvironmentId } = useEnvironment();

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [editing, setEditing] = useState<Poi | null>(null);
  const [pendingData, setPendingData] = useState<PoiFormData | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<PoiFormData>({
    resolver: zodResolver(poiSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
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

  const visibleSensors = useMemo(() => {
    if (selectedEnvironmentId === "ALL") return sensors;

    return sensors.filter(
      sensor => sensor.environmentId === selectedEnvironmentId,
    );
  }, [sensors, selectedEnvironmentId]);

  const visiblePois = useMemo(() => {
    if (selectedEnvironmentId === "ALL") return pois;

    return pois.filter(
      poi => poi.node?.environmentId === selectedEnvironmentId,
    );
  }, [pois, selectedEnvironmentId]);

  function novo() {
    setEditing(null);
    setPendingData(null);
    setServerError(null);
    clearErrors();

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

  function editar(poi: Poi) {
    setEditing(poi);
    setPendingData(null);
    setServerError(null);
    clearErrors();

    reset({
      code: poi.code,
      name: poi.name,
      type: poi.type,
      nodeId: String(poi.nodeId),
      description: poi.description ?? "",
      x: poi.x !== null ? String(poi.x) : "",
      y: poi.y !== null ? String(poi.y) : "",
      active: poi.active,
    });

    setModalOpen(true);
  }

  function revisar(data: PoiFormData) {
    setServerError(null);
    clearErrors();

    const codigo = data.code.trim().toUpperCase();

    const duplicado = pois.find(
      poi => poi.code.toUpperCase() === codigo && poi.id !== editing?.id,
    );

    if (duplicado) {
      setError("code", {
        type: "manual",
        message: `O código ${codigo} já pertence ao ponto "${duplicado.name}".`,
      });

      setServerError("Corrija o código do ponto de interesse.");
      return;
    }

    const sensor = sensors.find(item => item.id === Number(data.nodeId));

    if (!sensor) {
      setError("nodeId", {
        type: "manual",
        message: "Selecione um sensor de acesso cadastrado.",
      });

      setServerError("O sensor selecionado não foi encontrado.");
      return;
    }

    if (data.active && (!sensor.active || sensor.maintenance)) {
      setError("nodeId", {
        type: "manual",
        message: "Este sensor está desabilitado ou em manutenção.",
      });

      setServerError(
        "Selecione um sensor habilitado ou desmarque a disponibilidade do ponto.",
      );
      return;
    }

    setPendingData(data);
    setModalOpen(false);
    setConfirmOpen(true);
  }

  function voltarEdicao() {
    setConfirmOpen(false);
    setServerError(null);
    setModalOpen(true);
  }

  function sensorName(value: string) {
    const sensor = sensors.find(item => item.id === Number(value));
    if (!sensor) return "—";

    return `${sensor.code}${sensor.name ? ` · ${sensor.name}` : ""}`;
  }

  function tratarErroApi(error: unknown) {
    if (!(error instanceof ApiError)) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o ponto de interesse.",
      );
      return;
    }

    if (error.code === "POI_CODE_IN_USE") {
      const texto = "Este código já está cadastrado em outro ponto de interesse.";

      setError("code", { type: "server", message: texto });
      setServerError(texto);
      return;
    }

    if (error.code === "VALIDATION_ERROR") {
      const resposta = error.message.trim();
      const separador = resposta.indexOf(":");

      if (separador > 0) {
        const campo = resposta.substring(0, separador).trim();
        const descricao = resposta.substring(separador + 1).trim();
        const mensagem = mensagemCampo(campo, descricao);

        if (campoValido(campo)) {
          setError(campo, {
            type: "server",
            message: mensagem,
          });
        }

        setServerError(mensagem);
        return;
      }

      setServerError(
        resposta || "Verifique os dados informados no formulário.",
      );
      return;
    }

    setServerError(
      apiErrorMessage(error, "Não foi possível salvar o ponto de interesse."),
    );
  }

  async function confirmar() {
    if (!pendingData) return;

    setSaving(true);
    setServerError(null);

    const payload: PoiPayload = {
      code: pendingData.code.trim().toUpperCase(),
      name: pendingData.name.trim(),
      type: pendingData.type,
      nodeId: Number(pendingData.nodeId),
      description: pendingData.description.trim() || null,
      x: pendingData.x === "" ? null : Number(pendingData.x),
      y: pendingData.y === "" ? null : Number(pendingData.y),
      orientationDegrees: editing?.orientationDegrees ?? null,
      active: pendingData.active,
    };

    try {
      if (editing) {
        await updatePoi(editing.id, payload);
      } else {
        await createPoi(payload);
      }

      setConfirmOpen(false);
      setPendingData(null);
      setEditing(null);
      await reload();
    } catch (error) {
      setConfirmOpen(false);
      setModalOpen(true);
      tratarErroApi(error);
    } finally {
      setSaving(false);
    }
  }

  function pedirExclusao() {
    if (!editing) return;

    setServerError(null);
    setDeleteOpen(true);
  }

  async function confirmarExclusao() {
    if (!editing) return;

    setDeleting(true);
    setServerError(null);

    try {
      await deletePoi(editing.id);

      setDeleteOpen(false);
      setModalOpen(false);
      setEditing(null);
      setPendingData(null);

      await reload();
    } catch (error) {
      setDeleteOpen(false);
      setModalOpen(true);

      setServerError(
        apiErrorMessage(error, "Não foi possível excluir o ponto de interesse."),
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <LoadingState message="Carregando pontos de interesse..." />;
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <span className="eyebrow">Navegação</span>
          <h1>Pontos de interesse</h1>
          <p>Destinos e locais de origem posicionados no ambiente.</p>
        </div>

        <button type="button" className="button primary" onClick={novo}>
          <Plus size={17} />
          Novo ponto
        </button>
      </section>

      {error && <div className="alert error">{error}</div>}

      <section className="simple-list">
        {visiblePois.map(poi => (
          <article key={poi.id} className="simple-row poi-row">
            <div className="simple-row-icon">
              <MapPin size={19} />
            </div>

            <div className="simple-row-main">
              <strong>{poi.name}</strong>
              <span>{poi.code}</span>
            </div>

            <div className="simple-row-meta">
              <span>Sensor de acesso</span>
              <strong>{poi.node?.code ?? "—"}</strong>
            </div>

            <div className="simple-row-meta">
              <span>Posição</span>
              <strong>
                {poi.x !== null && poi.y !== null
                  ? `(${poi.x}, ${poi.y})`
                  : "—"}
              </strong>
            </div>

            <StatusBadge value={poi.active ? "ACTIVE" : "INACTIVE"} />

            <button
              type="button"
              className="row-action"
              onClick={() => editar(poi)}
            >
              <Pencil size={16} />
              Editar
            </button>
          </article>
        ))}
      </section>

      <Modal
        open={modalOpen}
        title={editing ? `Editar ${editing.name}` : "Novo ponto de interesse"}
        onClose={() => setModalOpen(false)}
      >
        {serverError && (
          <div className="alert error" role="alert">
            {serverError}
          </div>
        )}

        <form
          className="poi-edit-form"
          onSubmit={handleSubmit(revisar)}
          autoComplete="off"
          noValidate
        >
          <div className="form-grid">
            <div className="field">
              <label htmlFor="poi-code">Código *</label>

              <input
                id="poi-code"
                autoComplete="off"
                spellCheck={false}
                maxLength={40}
                aria-invalid={!!errors.code}
                {...register("code", {
                  onChange: () => setServerError(null),
                })}
              />

              {errors.code && (
                <span className="field-error" role="alert">
                  {errors.code.message}
                </span>
              )}
            </div>

            <div className="field">
              <label htmlFor="poi-name">Nome *</label>

              <input
                id="poi-name"
                autoComplete="off"
                spellCheck={false}
                maxLength={120}
                aria-invalid={!!errors.name}
                {...register("name")}
              />

              {errors.name && (
                <span className="field-error" role="alert">
                  {errors.name.message}
                </span>
              )}
            </div>

            <div className="field">
              <label htmlFor="poi-type">Tipo *</label>

              <select
                id="poi-type"
                aria-invalid={!!errors.type}
                {...register("type")}
              >
                <option value="">Selecione</option>
                <option value="ENTRADA">Entrada</option>
                <option value="SERVICO">Serviço</option>
                <option value="BANHEIRO">Banheiro</option>
                <option value="SALA">Sala</option>
                <option value="ACESSIBILIDADE">Acessibilidade</option>
                <option value="REFERENCIA">Referência</option>
                <option value="OUTRO">Outro</option>
              </select>

              {errors.type && (
                <span className="field-error" role="alert">
                  {errors.type.message}
                </span>
              )}
            </div>

            <div className="field">
              <label htmlFor="poi-node">Sensor de acesso *</label>

              <select
                id="poi-node"
                aria-invalid={!!errors.nodeId}
                {...register("nodeId")}
              >
                <option value="">Selecione</option>

                {visibleSensors.map(sensor => (
                  <option key={sensor.id} value={sensor.id}>
                    {sensor.code}{sensor.name ? ` · ${sensor.name}` : ""}
                  </option>
                ))}
              </select>

              {errors.nodeId && (
                <span className="field-error" role="alert">
                  {errors.nodeId.message}
                </span>
              )}
            </div>

            <div className="field field-full">
              <label htmlFor="poi-description">Descrição</label>

              <textarea
                id="poi-description"
                rows={3}
                maxLength={255}
                aria-invalid={!!errors.description}
                {...register("description")}
              />

              {errors.description && (
                <span className="field-error" role="alert">
                  {errors.description.message}
                </span>
              )}
            </div>

            <div className="field">
              <label htmlFor="poi-x">Coordenada X</label>

              <input
                id="poi-x"
                type="text"
                autoComplete="off"
                inputMode="decimal"
                spellCheck={false}
                placeholder="Ex.: 0"
                aria-invalid={!!errors.x}
                {...register("x")}
              />

              {errors.x && (
                <span className="field-error" role="alert">
                  {errors.x.message}
                </span>
              )}
            </div>

            <div className="field">
              <label htmlFor="poi-y">Coordenada Y</label>

              <input
                id="poi-y"
                type="text"
                autoComplete="off"
                inputMode="decimal"
                spellCheck={false}
                placeholder="Ex.: 8"
                aria-invalid={!!errors.y}
                {...register("y")}
              />

              {errors.y && (
                <span className="field-error" role="alert">
                  {errors.y.message}
                </span>
              )}
            </div>
          </div>

          <div className="poi-availability-group">
            <label className="poi-availability-option">
              <input type="checkbox" {...register("active")} />
              Ponto disponível para navegação
            </label>
          </div>

          <footer className="poi-form-actions">
            <div className="poi-form-actions-left">
              {editing && (
                <button
                  type="button"
                  className="button danger-button"
                  onClick={pedirExclusao}
                >
                  <Trash2 size={15} />
                  Excluir
                </button>
              )}
            </div>

            <div className="poi-form-actions-right">
              <button
                type="button"
                className="button secondary"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </button>

              <button type="submit" className="button primary">
                Revisar
              </button>
            </div>
          </footer>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title={editing ? "Confirmar alteração" : "Confirmar novo ponto"}
        description="Confira as informações antes de continuar."
        loading={saving}
        confirmLabel={editing ? "Confirmar alteração" : "Criar ponto"}
        cancelLabel="Voltar e editar"
        onCancel={voltarEdicao}
        onConfirm={() => void confirmar()}
      >
        {pendingData && (
          <div className="review-grid">
            <ReviewItem label="Código" value={pendingData.code.toUpperCase()} />
            <ReviewItem label="Nome" value={pendingData.name} />
            <ReviewItem label="Sensor de acesso" value={sensorName(pendingData.nodeId)} />
            <ReviewItem
              label="Posição"
              value={pendingData.x !== "" && pendingData.y !== ""
                ? `(${pendingData.x}, ${pendingData.y})`
                : "Não informada"}
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
        onConfirm={() => void confirmarExclusao()}
      >
        {editing && (
          <div className="review-grid">
            <ReviewItem label="Ponto" value={editing.name} />
            <ReviewItem label="Código" value={editing.code} />
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}
