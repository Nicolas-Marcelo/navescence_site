
import { useRef, useState } from "react";

interface ImportSummary {
  sensors: number;
  pois: number;
  connections: number;
  tactileNodes: number;
  tactileEdges: number;
}

interface ValidationResult {
  valid: boolean;
  environment?: {
    code: string;
    name: string;
    floor: string;
  };
  summary?: ImportSummary;
  error?: string;
}

const endpoint = "/api/admin/environment-imports";

export default function ImportarAmbiente() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [arquivo, setArquivo] = useState<string>("");
  const [configuracao, setConfiguracao] = useState<unknown>(null);
  const [resultado, setResultado] = useState<ValidationResult | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [importado, setImportado] = useState(false);

  async function enviar(
    url: string,
    dados: unknown,
  ): Promise<Record<string, unknown>> {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `Erro HTTP ${response.status}`);
    }

    return result;
  }

  async function selecionarArquivo(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setResultado(null);
    setMensagem("");
    setImportado(false);
    setConfiguracao(null);
    setArquivo(file.name);

    if (!file.name.toLowerCase().endsWith(".json")) {
      setMensagem("Selecione um arquivo JSON.");
      return;
    }

    if (file.size > 1024 * 1024) {
      setMensagem("O arquivo deve ter no máximo 1 MB.");
      return;
    }

    setCarregando(true);

    try {
      const content = await file.text();
      const data = JSON.parse(content);

      const validation = await enviar(
        `${endpoint}/validate`,
        data,
      ) as unknown as ValidationResult;

      setConfiguracao(data);
      setResultado(validation);
    } catch (error) {
      setMensagem(
        error instanceof Error
          ? error.message
          : "Não foi possível validar o arquivo.",
      );
    } finally {
      setCarregando(false);
    }
  }

  async function importar() {
    if (!configuracao || !resultado?.valid || carregando) return;

    setCarregando(true);
    setMensagem("");

    try {
      const response = await enviar(endpoint, configuracao);

      setImportado(true);
      setMensagem(
        String(response.message ?? "Configuração importada."),
      );
    } catch (error) {
      setMensagem(
        error instanceof Error
          ? error.message
          : "Falha ao importar configuração.",
      );
    } finally {
      setCarregando(false);
    }
  }

  function limpar() {
    setArquivo("");
    setConfiguracao(null);
    setResultado(null);
    setMensagem("");
    setImportado(false);

    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section style={{
      background: "#fff",
      padding: 24,
      borderRadius: 12,
      border: "1px solid #e2e8f0",
      maxWidth: 580,
    }}>
      <h2 style={{
        marginTop: 0,
        color: "#0c3048",
        fontSize: 22,
      }}>
        Importar ambiente
      </h2>

      <p style={{ color: "#64748b" }}>
        Selecione um arquivo JSON contendo sensores,
        pontos de interesse, conexões e mapa tátil.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        onChange={selecionarArquivo}
        disabled={carregando}
        style={{ marginBottom: 16 }}
      />

      {arquivo && (
        <p style={{ fontSize: 14 }}>
          <strong>Arquivo:</strong> {arquivo}
        </p>
      )}

      {resultado?.valid && resultado.summary && (
        <div style={{
          padding: 16,
          background: "#f1f5f9",
          borderRadius: 8,
          marginBottom: 16,
        }}>
          <h3 style={{ marginTop: 0 }}>
            {resultado.environment?.name}
          </h3>

          <p>
            Código: <strong>{resultado.environment?.code}</strong>
          </p>

          <p>
            Pavimento: {resultado.environment?.floor}
          </p>

          <p>
            Sensores: <strong>{resultado.summary.sensors}</strong>
          </p>

          <p>
            Pontos de interesse: <strong>{resultado.summary.pois}</strong>
          </p>

          <p>
            Conexões principais:{" "}
            <strong>{resultado.summary.connections}</strong>
          </p>

          <p>
            Nós do mapa tátil:{" "}
            <strong>{resultado.summary.tactileNodes}</strong>
          </p>

          <p>
            Conexões táteis:{" "}
            <strong>{resultado.summary.tactileEdges}</strong>
          </p>

          <p style={{
            fontSize: 13,
            color: "#92400e",
            marginBottom: 0,
          }}>
            A importação prepara a configuração em arquivo.
            O cadastro no banco de dados ainda depende
            da integração com os serviços do sistema central.
          </p>
        </div>
      )}

      {mensagem && (
        <p role="status" style={{
          padding: 12,
          borderRadius: 8,
          background: importado ? "#f0fdf4" : "#fef2f2",
          color: importado ? "#166534" : "#991b1b",
        }}>
          {mensagem}
        </p>
      )}

      <div style={{
        display: "flex",
        gap: 12,
        marginTop: 20,
      }}>
        <button
          type="button"
          onClick={limpar}
          disabled={carregando}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            background: "#fff",
            border: "1px solid #cbd5e1",
            cursor: "pointer",
          }}
        >
          Limpar
        </button>

        <button
          type="button"
          onClick={importar}
          disabled={!resultado?.valid || carregando || importado}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            background: "#0c3048",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            opacity: !resultado?.valid || carregando ? 0.6 : 1,
          }}
        >
          {carregando
            ? "Processando..."
            : importado
              ? "Configuração armazenada"
              : "Importar configuração"}
        </button>
      </div>
    </section>
  );
}
