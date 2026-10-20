import {
  CheckCircle2,
  Clock,
  Navigation,
  Route,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  LoadingState,
} from "../../components/ui/LoadingState";

import {
  StatusBadge,
} from "../../components/ui/StatusBadge";

import {
  getTodayNavigationHistory,
} from "../../services/historyService";

import type {
  NavigationHistory,
} from "../../types/history";

export function HistoricoUsuarioPage() {
  const [items, setItems] =
    useState<
      NavigationHistory[]
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
          await getTodayNavigationHistory(),
        );
      } catch {
        setError(
          "Não foi possível carregar as navegações.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) {
    return (
      <LoadingState message="Carregando navegações..." />
    );
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            Mobilidade
          </span>

          <h1>Navegações</h1>

          <p>
            Trajetos registrados para
            o usuário.
          </p>
        </div>
      </section>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <section className="empty-navigation">
          <Navigation
            size={32}
          />

          <strong>
            Nenhuma navegação registrada
          </strong>

          <span>
            Os trajetos realizados
            aparecerão aqui.
          </span>
        </section>
      ) : (
        <section className="navigation-list">
          {items.map(item => (
            <article
              key={item.id}
              className="navigation-history-card"
            >
              <div className="navigation-history-icon">
                {item.status ===
                "COMPLETED" ? (
                  <CheckCircle2
                    size={20}
                  />
                ) : (
                  <Route
                    size={20}
                  />
                )}
              </div>

              <div className="navigation-history-main">
                <div className="navigation-history-title">
                  <div>
                    <strong>
                      {item.destinationName ??
                        item.destinationNodeCode}
                    </strong>

                    <span>
                      {item.originNodeCode}
                      {" → "}
                      {
                        item.destinationNodeCode
                      }
                    </span>
                  </div>

                  <StatusBadge
                    value={
                      item.status
                    }
                  />
                </div>

                <div className="navigation-history-meta">
                  <Clock size={14} />

                  {new Date(
                    item.startedAt,
                  ).toLocaleString(
                    "pt-BR",
                    {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </>
  );
}