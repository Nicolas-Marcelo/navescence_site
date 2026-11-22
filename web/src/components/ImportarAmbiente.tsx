
import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { FileJson, Upload, X } from "lucide-react";

import { apiRequest } from "../services/api";

interface EnvironmentSummary {
  code: string;
  name: string;
  floor: string;
}

interface ImportSummary {
  sensors: number;
  pois: number;
  connections: number;
  tactileNodes: number;
  tactileEdges: number;
}

interface ValidationResponse {
  valid: boolean;
  environment: EnvironmentSummary;
  summary: ImportSummary;
  error?: string;
}

interface ImportResponse {
  success: boolean;
  status: string;
  message: string;
  environment: {
    id: number;
    code: string;
    name: string;
  };
}

interface ImportarAmbienteProps {
  onImported?: () => void | Promise<void>;
}

const endpoint = "/api/admin/environment-imports";
const maxFileSize = 200 * 1024;

export default function ImportarAmbiente({
  onImported,
}: ImportarAmbienteProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [configuration, setConfiguration] = useState<unknown>(null);
  const [validation, setValidation] = useState<ValidationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  function reset() {
    setFileName("");
    setConfiguration(null);
    setValidation(null);
    setMessage("");
    setSuccess(false);

    if (inputRef.current) inputRef.current.value = "";
  }

  function close() {
    if (loading) return;

    reset();
    setOpen(false);
  }

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setConfiguration(null);
    setValidation(null);
    setMessage("");
    setSuccess(false);

    if (!file.name.toLowerCase().endsWith(".json")) {
      setMessage("Selecione um arquivo com extensão .json.");
      return;
    }

    if (file.size > maxFileSize) {
      setMessage("O arquivo deve ter no máximo 200 KB.");
      return;
    }

    setLoading(true);

    try {
      const content = await file.text();
      const data: unknown = JSON.parse(content);

      const result = await apiRequest<ValidationResponse>(
        `${endpoint}/validate`,
        {
          method: "POST",
          authenticated: true,
          body: JSON.stringify(data),
        },
      );

      if (!result.valid || !result.summary) {
        throw new Error(
          result.error ?? "Não foi possível validar o ambiente.",
        );
      }

      setConfiguration(data);
      setValidation(result);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível validar o JSON.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function importEnvironment() {
    if (!validation?.valid || !configuration || loading || success) return;

    setLoading(true);
    setMessage("");

    try {
      const result = await apiRequest<ImportResponse>(
        endpoint,
        {
          method: "POST",
          authenticated: true,
          body: JSON.stringify(configuration),
        },
      );

      if (!result.success) {
        throw new Error("O servidor não confirmou a importação.");
      }

      setSuccess(true);

      setMessage(
        "Configuração importada com sucesso! "
        + "O ambiente foi salvo no banco de dados. "
        + "A ativação para navegação será realizada separadamente.",
      );

      if (onImported) {
        try {
          await onImported();
        } catch (error) {
          console.error(
            "[AMBIENTES] Falha ao atualizar a lista:",
            error,
          );
        }
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível importar o ambiente.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="button secondary"
        onClick={() => setOpen(true)}
      >
        <Upload size={17} />
        Importar JSON
      </button>

      {open && (
        <div
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
            zIndex: 1000,
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-environment-title"
            style={{
              width: "100%",
              maxWidth: 480,
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 20px 55px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}>
              <h2
                id="import-environment-title"
                style={{
                  margin: 0,
                  color: "#103c56",
                  fontSize: 20,
                }}
              >
                Importar ambiente
              </h2>

              <button
                type="button"
                onClick={close}
                disabled={loading}
                aria-label="Fechar"
                className="button secondary"
                style={{ padding: "6px 10px" }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{
              color: "#64748b",
              fontSize: 14,
              marginBottom: 16,
            }}>
              Selecione um arquivo JSON contendo sensores,
              pontos de interesse, conexões e mapa tátil.
            </p>

            <input
              ref={inputRef}
              type="file"
              accept=".json,application/json"
              onChange={selectFile}
              disabled={loading || success}
              style={{ width: "100%", marginBottom: 12 }}
            />

            {fileName && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                marginBottom: 16,
                color: "#475569",
              }}>
                <FileJson size={17} />
                <span>{fileName}</span>
              </div>
            )}

            {validation?.valid && validation.summary && (
              <div style={{
                background: "#f1f5f9",
                borderRadius: 10,
                padding: 16,
                marginBottom: 16,
              }}>
                <h3 style={{
                  color: "#103c56",
                  margin: "0 0 6px",
                }}>
                  {validation.environment.name}
                </h3>

                <p style={{
                  color: "#64748b",
                  fontSize: 13,
                  marginBottom: 16,
                }}>
                  {validation.environment.code}
                  {" · "}
                  {validation.environment.floor}
                </p>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                  fontSize: 14,
                }}>
                  <div>
                    <strong>{validation.summary.sensors}</strong>
                    <div>Sensores</div>
                  </div>

                  <div>
                    <strong>{validation.summary.pois}</strong>
                    <div>Pontos de interesse</div>
                  </div>

                  <div>
                    <strong>{validation.summary.connections}</strong>
                    <div>Conexões principais</div>
                  </div>

                  <div>
                    <strong>{validation.summary.tactileNodes}</strong>
                    <div>Nós do mapa tátil</div>
                  </div>

                  <div>
                    <strong>{validation.summary.tactileEdges}</strong>
                    <div>Conexões táteis</div>
                  </div>
                </div>
              </div>
            )}

            {message && (
              <div
                role="status"
                style={{
                  padding: 12,
                  marginBottom: 16,
                  borderRadius: 8,
                  fontSize: 13,
                  color: success ? "#166534" : "#991b1b",
                  background: success ? "#f0fdf4" : "#fef2f2",
                }}
              >
                {message}
              </div>
            )}

            <p style={{
              color: "#64748b",
              fontSize: 12,
              marginBottom: 18,
            }}>
              A importação armazena a configuração no ambiente.
              Não altera automaticamente os sensores físicos
              nem o mapa de navegação ativo.
            </p>

            <div style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              flexWrap: "wrap",
            }}>
              <button
                type="button"
                className="button secondary"
                onClick={close}
                disabled={loading}
              >
                {success ? "Fechar" : "Cancelar"}
              </button>

              <button
                type="button"
                className="button primary"
                onClick={() => void importEnvironment()}
                disabled={!validation?.valid || loading || success}
              >
                {loading
                  ? "Processando..."
                  : success
                    ? "Importado"
                    : "Confirmar importação"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
