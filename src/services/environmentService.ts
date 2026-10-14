import type {
  EnvironmentData,
  EnvironmentRepository
} from "../repositories/environmentRepository.js";

export function createEnvironmentService(
  repository: EnvironmentRepository,
  onNavigationUpdate: () => void = () => {}
) {
  function list() {
    return repository.findAll();
  }

  function get(id: number) {
    return repository.findById(id);
  }

  async function create(
    data: EnvironmentData
  ) {
    const code =
      data.code
        ?.trim()
        .toUpperCase();

    const name =
      data.name?.trim();

    if (!code) {
      throw new Error(
        "O código do ambiente é obrigatório."
      );
    }

    if (!name) {
      throw new Error(
        "O nome do ambiente é obrigatório."
      );
    }

    const environment =
      await repository.create({
        code,
        name,

        type:
          data.type
            ?.trim()
            .toUpperCase() || null,

        floor:
          data.floor?.trim() ||
          "Térreo",

        description:
          data.description
            ?.trim() || null
      });

    onNavigationUpdate();

    return environment;
  }

  async function update(
    id: number,
    data: Partial<EnvironmentData>
  ) {
    const environment =
      await repository.findById(id);

    if (!environment) return null;

    const updated =
      await repository.update(id, {
        code:
          data.code === undefined
            ? undefined
            : data.code
                .trim()
                .toUpperCase(),

        name:
          data.name === undefined
            ? undefined
            : data.name.trim(),

        type:
          data.type === undefined
            ? undefined
            : data.type
                ?.trim()
                .toUpperCase() || null,

        floor:
          data.floor === undefined
            ? undefined
            : data.floor.trim(),

        description:
          data.description === undefined
            ? undefined
            : data.description
                ?.trim() || null
      });

    onNavigationUpdate();

    return updated;
  }

  async function remove(id: number) {
    const environment =
      await repository.findById(id);

    if (!environment) return null;

    await repository.remove(id);

    onNavigationUpdate();

    return environment;
  }

  return {
    list,
    get,
    create,
    update,
    remove
  };
}

export type EnvironmentService =
  ReturnType<
    typeof createEnvironmentService
  >;