import {
  useEffect,
  useState,
} from "react";

import {
  LoadingState,
} from "../../components/ui/LoadingState";

import {
  getVerificationHistory,
} from "../../services/historyService";

import type {
  VerificationHistory,
} from "../../types/history";

export function HistoricoPage() {
  const [items, setItems] =
    useState<
      VerificationHistory[]
    >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    async function load() {
      try {
        setItems(
          await getVerificationHistory(),
        );
      } catch {
        setError(
          "Não foi possível carregar o histórico.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) {
    return (
      <LoadingState message="Carregando verificações..." />
    );
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            Infraestrutura
          </span>

          <h1>
            Histórico de verificações
          </h1>

          <p>
            Execuções realizadas pelos
            sensores da infraestrutura.
          </p>
        </div>
      </section>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

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
              </tr>
            </thead>

            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>
                    {new Date(
                      item.startedAt,
                    ).toLocaleString(
                      "pt-BR",
                    )}
                  </td>

                  <td>
                    <strong>
                      {item.nodeCode}
                    </strong>
                  </td>

                  <td>
                    {item.mode}
                  </td>

                  <td>
                    {item.result}
                  </td>

                  <td>
                    {item.durationMs !=
                    null
                      ? `${(
                          item.durationMs /
                          1000
                        ).toFixed(
                          1,
                        )} s`
                      : "—"}
                  </td>

                  <td>
                    {item.readings
                      ?.length ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}