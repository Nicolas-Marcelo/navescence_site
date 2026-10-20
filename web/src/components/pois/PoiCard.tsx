import {
  Edit3,
  MapPin,
  Navigation,
  Trash2,
} from "lucide-react";

import type {
  PoiResponse,
} from "../../services/poiApi";

interface PoiCardProps {
  poi:
    PoiResponse;

  onEdit: (
    poi:
      PoiResponse,
  ) => void;

  onDelete: (
    poi:
      PoiResponse,
  ) => void;
}

function nomeLado(
  side: string,
) {
  switch (side) {
    case "LEFT":
      return "Esquerda";

    case "RIGHT":
      return "Direita";

    case "FRONT":
      return "À frente";

    default:
      return side;
  }
}

function nomeTipo(
  type: string,
) {
  switch (
    type.toUpperCase()
  ) {
    case "ROOM":
      return "Sala";

    case "ENTRANCE":
      return "Entrada";

    case "BATHROOM":
      return "Banheiro";

    case "SERVICE":
      return "Serviço";

    case "STAIRS":
      return "Escada";

    case "ELEVATOR":
      return "Elevador";

    default:
      return type;
  }
}

export default function PoiCard({
  poi,
  onEdit,
  onDelete,
}: PoiCardProps) {
  return (
    <article className="poi-card">
      <div className="poi-card-header">
        <div className="poi-card-icon">
          <MapPin
            size={20}
          />
        </div>

        <div className="poi-card-title">
          <strong>
            {poi.name}
          </strong>

          <span>
            {poi.code}
          </span>
        </div>

        <span
          className={
            poi.active
              ? "poi-status active"
              : "poi-status inactive"
          }
        >
          {poi.active
            ? "Ativo"
            : "Inativo"}
        </span>
      </div>

      <div className="poi-card-info">
        <div>
          <span>
            Tipo
          </span>

          <strong>
            {nomeTipo(
              poi.type,
            )}
          </strong>
        </div>

        <div>
          <span>
            Nó de acesso
          </span>

          <strong>
            {poi.node?.code ??
              `ID ${poi.nodeId}`}
          </strong>
        </div>
      </div>

      {poi.description && (
        <p className="poi-card-description">
          {poi.description}
        </p>
      )}

      <div className="poi-card-approaches">
        <div className="poi-card-section-title">
          <Navigation
            size={16}
          />

          Orientações de chegada
        </div>

        {(
          poi.approaches ??
          []
        ).length ===
        0 ? (
          <p className="poi-card-empty">
            Nenhuma orientação
            específica cadastrada.
          </p>
        ) : (
          <div className="poi-card-approach-list">
            {poi.approaches.map(
              approach => (
                <div
                  key={
                    approach.id
                  }
                  className="poi-card-approach"
                >
                  <div>
                    <span>
                      Chegando de
                    </span>

                    <strong>
                      {approach
                        .fromNode
                        ?.code ??
                        `Nó ${approach.fromNodeId}`}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Destino
                    </span>

                    <strong>
                      {nomeLado(
                        approach.side,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Distância
                    </span>

                    <strong>
                      {approach
                          .distanceMeters ==
                        null
                        ? "—"
                        : `${approach.distanceMeters} m`}
                    </strong>
                  </div>

                  {approach
                    .instruction && (
                    <p>
                      {
                        approach
                          .instruction
                      }
                    </p>
                  )}
                </div>
              ),
            )}
          </div>
        )}
      </div>

      <div className="poi-card-actions">
        <button
          type="button"
          onClick={() =>
            onEdit(
              poi,
            )
          }
        >
          <Edit3
            size={16}
          />

          Editar
        </button>

        <button
          type="button"
          className="danger"
          onClick={() =>
            onDelete(
              poi,
            )
          }
        >
          <Trash2
            size={16}
          />

          Excluir
        </button>
      </div>
    </article>
  );
}