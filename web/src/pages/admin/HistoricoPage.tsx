
import {
  Activity, CalendarClock, Clock3, Cpu, Eye, Play,
  RadioTower, RefreshCw, WifiOff, X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { LoadingState } from "../../components/ui/LoadingState";
import { useSensors } from "../../hooks/useSensors";
import {
  getVerificationHistory,
  getVerificationHistoryItem,
  runVerification,
} from "../../services/historyService";
import type { VerificationHistory } from "../../types/history";

import "./HistoricoPage.css";

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("pt-BR");
}

function formatDuration(value: number | null | undefined) {
  if (value == null) return "—";
  return `${(value / 1000).toFixed(1).replace(".", ",")} s`;
}

function formatNumber(value: number | null | undefined, suffix = "") {
  return value == null ? "—" : `${value}${suffix}`;
}

function translateMode(mode: string) {
  switch (mode) {
    case "AUTOMATIC": return "Automática";
    case "MANUAL": return "Manual";
    default: return mode;
  }
}

function translateResult(result: string) {
  switch (result) {
    case "FINISHED": return "Finalizada";
    case "OFFLINE": return "Offline";
    case "TIMEOUT": return "Tempo esgotado";
    case "ERROR": return "Erro";
    default: return result;
  }
}

function resultClass(result: string) {
  switch (result) {
    case "FINISHED": return "success";
    case "OFFLINE": return "neutral";
    case "TIMEOUT": return "warning";
    case "ERROR": return "danger";
    default: return "neutral";
  }
}

interface DetailItemProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  wide?: boolean;
}

function DetailItem({ label, value, icon, wide = false }: DetailItemProps) {
  return (
    <div className={`verification-detail-item${wide ? " wide" : ""}`}>
      <div className="verification-detail-label">
        {icon}
        <span>{label}</span>
      </div>
      <strong className="verification-detail-value">{value}</strong>
    </div>
  );
}

export function HistoricoPage() {
  const [items, setItems] = useState<VerificationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [target, setTarget] = useState("ALL");
  const [running, setRunning] = useState(false);

  const [selectedVerification, setSelectedVerification] =
    useState<VerificationHistory | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const { sensors } = useSensors(false);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      setItems(await getVerificationHistory());
    } catch {
      setError("Não foi possível carregar o histórico.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function abrirModalVerificacao() {
    setTarget("ALL");
    setError(null);
    setSuccess(null);
    setVerificationModalOpen(true);
  }

  function fecharModalVerificacao() {
    if (running) return;
    setVerificationModalOpen(false);
  }

  async function iniciarVerificacao() {
    setRunning(true);
    setError(null);
    setSuccess(null);

    try {
      await runVerification(target);
      setVerificationModalOpen(false);

      setSuccess(
        target === "ALL"
          ? "Verificação de todos os sensores concluída."
          : `Verificação do ${target} concluída.`,
      );

      await load(false);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Não foi possível executar a verificação.",
      );
    } finally {
      setRunning(false);
    }
  }

  async function abrirDetalhes(id: number) {
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setSelectedVerification(null);

    try {
      const verification = await getVerificationHistoryItem(id);
      setSelectedVerification(verification);
    } catch (exception) {
      setDetailError(
        exception instanceof Error
          ? exception.message
          : "Não foi possível carregar os detalhes da verificação.",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  function fecharDetalhes() {
    if (detailLoading) return;
    setDetailModalOpen(false);
    setSelectedVerification(null);
    setDetailError(null);
  }

  if (loading) {
    return <LoadingState message="Carregando verificações..." />;
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <span className="eyebrow">Infraestrutura</span>
          <h1>Histórico de verificações</h1>
          <p>Execuções realizadas pelos sensores da infraestrutura.</p>
        </div>

        <div className="page-actions">
          <button
            type="button"
            className="button secondary compact"
            onClick={() => void load(false)}
          >
            <RefreshCw size={17} />
            Atualizar
          </button>

          <button
            type="button"
            className="button primary compact"
            onClick={abrirModalVerificacao}
          >
            <Play size={17} />
            Nova verificação
          </button>
        </div>
      </section>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      <section className="panel">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Sensor</th>
                <th>Modo</th>
                <th>Resultado</th>
                <th>Duração</th>
                <th>Leituras</th>
                <th>Detalhes</th>
              </tr>
            </thead>

            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>{formatDate(item.startedAt)}</td>
                  <td><strong>{item.nodeCode}</strong></td>
                  <td>{translateMode(item.mode)}</td>
                  <td>
                    <span className={`verification-status ${resultClass(item.result)}`}>
                      {translateResult(item.result)}
                    </span>
                  </td>
                  <td>{formatDuration(item.durationMs)}</td>
                  <td>{item.readings?.length ?? 0}</td>
                  <td>
                    <button
                      type="button"
                      className="row-action"
                      onClick={() => void abrirDetalhes(item.id)}
                    >
                      <Eye size={15} />
                      Ver detalhes
                    </button>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{ textAlign: "center", padding: "35px" }}
                  >
                    Nenhuma verificação registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {verificationModalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              fecharModalVerificacao();
            }
          }}
        >
          <div className="modal">
            <div className="modal-header">
              <div>
                <span className="eyebrow">Infraestrutura</span>
                <h2 style={{ marginTop: 5 }}>Nova verificação</h2>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={fecharModalVerificacao}
                disabled={running}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <p className="verification-intro">
              Escolha se deseja verificar toda a infraestrutura
              ou apenas um sensor específico.
            </p>

            <div className="field">
              <label htmlFor="verification-target">Sensor</label>
              <select
                id="verification-target"
                value={target}
                onChange={event => setTarget(event.target.value)}
                disabled={running}
              >
                <option value="ALL">Todos os sensores</option>

                {sensors.map(sensor => (
                  <option key={sensor.id} value={sensor.code}>
                    {sensor.code}
                    {sensor.name ? ` — ${sensor.name}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="verification-modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={fecharModalVerificacao}
                disabled={running}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="button primary"
                onClick={() => void iniciarVerificacao()}
                disabled={running}
              >
                {running ? (
                  <>
                    <RefreshCw size={17} />
                    Executando...
                  </>
                ) : (
                  <>
                    <Play size={17} />
                    Iniciar verificação
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailModalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              fecharDetalhes();
            }
          }}
        >
          <div className="modal verification-detail-modal">
            <div className="modal-header">
              <div>
                <span className="eyebrow">Diagnóstico</span>
                <h2 style={{ marginTop: 5 }}>Detalhes da verificação</h2>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={fecharDetalhes}
                disabled={detailLoading}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {detailLoading && (
              <LoadingState message="Carregando detalhes..." />
            )}

            {detailError && (
              <div className="alert error">{detailError}</div>
            )}

            {selectedVerification && (
              <>
                <section className="verification-summary">
                  <div className="verification-summary-header">
                    <div className="verification-sensor-title">
                      <div className="verification-sensor-icon">
                        <RadioTower size={22} />
                      </div>

                      <div>
                        <span className="verification-overline">
                          SENSOR ANALISADO
                        </span>
                        <h3>{selectedVerification.nodeCode}</h3>
                        <p>{selectedVerification.node?.name ?? "Sem nome cadastrado"}</p>
                      </div>
                    </div>

                    <span
                      className={`verification-status ${resultClass(selectedVerification.result)}`}
                    >
                      {selectedVerification.result === "OFFLINE" && (
                        <WifiOff size={14} />
                      )}
                      {translateResult(selectedVerification.result)}
                    </span>
                  </div>

                  <div className="verification-detail-grid">
                    <DetailItem
                      label="Modo de verificação"
                      value={translateMode(selectedVerification.mode)}
                      icon={<Activity size={15} />}
                    />

                    <DetailItem
                      label="Duração"
                      value={formatDuration(selectedVerification.durationMs)}
                      icon={<Clock3 size={15} />}
                    />

                    <DetailItem
                      label="Início"
                      value={formatDate(selectedVerification.startedAt)}
                      icon={<CalendarClock size={15} />}
                    />

                    <DetailItem
                      label="Finalização"
                      value={formatDate(selectedVerification.finishedAt)}
                      icon={<CalendarClock size={15} />}
                    />

                    <DetailItem
                      label="Endereço MAC"
                      value={selectedVerification.node?.mac ?? "—"}
                      icon={<Cpu size={15} />}
                      wide
                    />
                  </div>
                </section>

                <section className="verification-readings">
                  <div className="verification-section-heading">
                    <div>
                      <span className="panel-eyebrow">LEITURAS BLE</span>
                      <h3>Vizinhos detectados</h3>
                    </div>
                    <span className="verification-readings-count">
                      {selectedVerification.readings?.length ?? 0} registros
                    </span>
                  </div>

                  {(selectedVerification.readings ?? []).length === 0 ? (
                    <div className="empty-simple">
                      Nenhum vizinho foi detectado nesta verificação.
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Vizinho</th>
                            <th>MAC</th>
                            <th>Leituras</th>
                            <th>Válidas</th>
                            <th>Descartadas</th>
                            <th>RSSI médio</th>
                            <th>M15</th>
                            <th>Mín.</th>
                            <th>Máx.</th>
                          </tr>
                        </thead>

                        <tbody>
                          {selectedVerification.readings?.map((reading, index) => (
                            <tr key={reading.id ?? `${reading.mac}-${index}`}>
                              <td>
                                <strong>
                                  {reading.neighborCode ?? "Não identificado"}
                                </strong>
                              </td>
                              <td>{reading.mac ?? "—"}</td>
                              <td>{formatNumber(reading.readings)}</td>
                              <td>{formatNumber(reading.validReadings)}</td>
                              <td>{formatNumber(reading.discardedReadings)}</td>
                              <td>{formatNumber(reading.averageRssi, " dBm")}</td>
                              <td>
                                <strong>{formatNumber(reading.m15, " dBm")}</strong>
                              </td>
                              <td>{formatNumber(reading.minRssi, " dBm")}</td>
                              <td>{formatNumber(reading.maxRssi, " dBm")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <div className="verification-modal-actions">
                  <button
                    type="button"
                    className="button secondary"
                    onClick={fecharDetalhes}
                  >
                    Fechar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
