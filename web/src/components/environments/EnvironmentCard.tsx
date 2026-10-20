import type {
  Environment,
} from "../../types/environment";

interface EnvironmentCardProps {
  environment: Environment;
  onEdit: (
    environment: Environment,
  ) => void;
}

export function EnvironmentCard({
  environment,
  onEdit,
}: EnvironmentCardProps) {
  const count =
    environment._count
      ?.nodes ?? 0;

  return (
    <article className="environment-card">
      <header>
        <div className="environment-icon">
          {environment.name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map(word => word[0])
            .join("")
            .toUpperCase()}
        </div>

        <button
          type="button"
          className="text-button"
          onClick={() =>
            onEdit(environment)
          }
        >
          Editar
        </button>
      </header>

      <span className="eyebrow">
        {environment.code}
      </span>

      <h3>
        {environment.name}
      </h3>

      <p>
        {environment.description ??
          "Sem descrição cadastrada."}
      </p>

      <footer>
        {count}{" "}
        {count === 1
          ? "sensor"
          : "sensores"}
      </footer>
    </article>
  );
}