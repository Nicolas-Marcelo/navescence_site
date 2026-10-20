import type {
  TopologyEdge,
} from "../../types/topology";

interface EdgeCardProps {
  edge: TopologyEdge;
}

export function EdgeCard({
  edge,
}: EdgeCardProps) {
  return (
    <article className="edge-card">
      <strong>
        {edge.nodeA?.code ??
          edge.nodeAId}
      </strong>

      <span>→</span>

      <strong>
        {edge.nodeB?.code ??
          edge.nodeBId}
      </strong>

      <small>
        {edge.distance != null
          ? `${edge.distance} m`
          : "Distância não informada"}
      </small>
    </article>
  );
}