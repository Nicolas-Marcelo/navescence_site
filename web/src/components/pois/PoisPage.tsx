import {
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import PoiCard from "./PoiCard";
import PoiForm from "./PoiForm";

import type {
  PoiPayload,
  PoiResponse,
  PoiNode,
} from "../../services/poiApi";

import {
  atualizarPoi,
  criarPoi,
  listarPois,
  listarSensoresPoi,
  removerPoi,
} from "../../services/poiApi";

import "./pois.css";

export default function PoisPage() {
  const [
    pois,
    setPois,
  ] =
    useState<
      PoiResponse[]
    >([]);

  const [
    nodes,
    setNodes,
  ] =
    useState<
      PoiNode[]
    >([]);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    modalOpen,
    setModalOpen,
  ] =
    useState(false);

  const [
    editingPoi,
    setEditingPoi,
  ] =
    useState<
      PoiResponse | null
    >(null);

  async function carregar() {
    setLoading(true);
    setError("");

    try {
      const [
        poisResponse,
        nodesResponse,
      ] =
        await Promise.all([
          listarPois(),
          listarSensoresPoi(),
        ]);

      setPois(
        poisResponse,
      );

      setNodes(
        nodesResponse,
      );
    } catch (
      exception
    ) {
      setError(
        exception instanceof
          Error
          ? exception.message
          : "Não foi possível carregar os destinos.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(
    () => {
      void carregar();
    },
    [],
  );

  const filteredPois =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (!query) {
          return pois;
        }

        return pois.filter(
          poi => {
            const text =
              [
                poi.name,
                poi.code,
                poi.type,
                poi.description ??
                  "",
                poi.node
                  ?.code ??
                  "",
              ]
                .join(
                  " ",
                )
                .toLowerCase();

            return text.includes(
              query,
            );
          },
        );
      },
      [
        pois,
        search,
      ],
    );

  function abrirCadastro() {
    setEditingPoi(
      null,
    );

    setModalOpen(
      true,
    );
  }

  function abrirEdicao(
    poi:
      PoiResponse,
  ) {
    setEditingPoi(
      poi,
    );

    setModalOpen(
      true,
    );
  }

  function fecharModal() {
    setModalOpen(
      false,
    );

    setEditingPoi(
      null,
    );
  }

  async function salvar(
    payload:
      PoiPayload,
  ) {
    if (
      editingPoi
    ) {
      await atualizarPoi(
        editingPoi.id,
        payload,
      );
    } else {
      await criarPoi(
        payload,
      );
    }

    fecharModal();

    await carregar();
  }

  async function excluir(
    poi:
      PoiResponse,
  ) {
    const confirmed =
      window.confirm(
        `Deseja excluir "${poi.name}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await removerPoi(
        poi.id,
      );

      await carregar();
    } catch (
      exception
    ) {
      window.alert(
        exception instanceof
          Error
          ? exception.message
          : "Não foi possível excluir o POI.",
      );
    }
  }

  return (
    <div className="pois-page">
      <div className="pois-page-header">
        <div>
          <h1>
            Pontos de interesse
          </h1>

          <p>
            Cadastre os destinos
            utilizados pelo
            NAVESCENCE e configure
            como o usuário deve
            acessar cada ambiente.
          </p>
        </div>

        <button
          type="button"
          className="poi-button-primary"
          onClick={
            abrirCadastro
          }
        >
          <Plus
            size={18}
          />

          Novo destino
        </button>
      </div>

      <div className="pois-toolbar">
        <div className="pois-search">
          <Search
            size={18}
          />

          <input
            type="text"
            value={
              search
            }
            placeholder="Buscar destino..."
            onChange={
              event =>
                setSearch(
                  event
                    .target
                    .value,
                )
            }
          />
        </div>

        <button
          type="button"
          className="poi-button-secondary"
          onClick={() =>
            void carregar()
          }
        >
          <RefreshCw
            size={17}
          />

          Atualizar
        </button>
      </div>

      {error && (
        <div className="pois-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="pois-loading">
          Carregando destinos...
        </div>
      ) : filteredPois.length ===
        0 ? (
        <div className="pois-empty">
          <MapEmpty />

          <strong>
            Nenhum destino encontrado
          </strong>

          <p>
            Cadastre o primeiro ponto
            de interesse do ambiente.
          </p>
        </div>
      ) : (
        <div className="pois-grid">
          {filteredPois.map(
            poi => (
              <PoiCard
                key={
                  poi.id
                }
                poi={
                  poi
                }
                onEdit={
                  abrirEdicao
                }
                onDelete={
                  excluir
                }
              />
            ),
          )}
        </div>
      )}

      {modalOpen && (
        <div className="poi-modal-overlay">
          <div className="poi-modal">
            <div className="poi-modal-header">
              <div>
                <h2>
                  {editingPoi
                    ? "Editar destino"
                    : "Novo destino"}
                </h2>

                <p>
                  Configure o POI e
                  suas orientações de
                  chegada.
                </p>
              </div>

              <button
                type="button"
                className="poi-modal-close"
                onClick={
                  fecharModal
                }
              >
                <X
                  size={20}
                />
              </button>
            </div>

            <div className="poi-modal-content">
              <PoiForm
                poi={
                  editingPoi
                }
                nodes={
                  nodes
                }
                onSubmit={
                  salvar
                }
                onCancel={
                  fecharModal
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MapEmpty() {
  return (
    <div className="pois-empty-icon">
      <Search
        size={26}
      />
    </div>
  );
}