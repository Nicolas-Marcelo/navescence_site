import type {
  NodeData,
  NodeRepository,
} from "../repositories/nodeRepository.js";

export function createNodeService(
  repository: NodeRepository,
  onNavigationUpdate:
    () => void = () => {},
) {
  function list() {
    return repository.findAll();
  }

  function listOperational() {
    return repository.findOperational();
  }

  function get(
    id: number,
  ) {
    return repository.findById(
      id,
    );
  }

  async function create(
    data: NodeData,
  ) {
    const code =
      data.code
        ?.trim()
        .toUpperCase();

    if (!code) {
      throw new Error(
        "O código do sensor é obrigatório.",
      );
    }

    const node =
      await repository.create({
        ...data,

        code,

        mac:
          data.mac
            ?.trim()
            .toUpperCase() ||
          null,

        name:
          data.name
            ?.trim() ||
          null,

        location:
          data.location
            ?.trim() ||
          null,
      });

    onNavigationUpdate();

    return node;
  }

  async function update(
    id: number,
    data:
      Partial<NodeData>,
  ) {
    const node =
      await repository.findById(
        id,
      );

    if (!node) {
      return null;
    }

    const updated =
      await repository.update(
        id,
        {
          ...data,

          code:
            data.code ===
            undefined
              ? undefined
              : data.code
                  .trim()
                  .toUpperCase(),

          mac:
            data.mac ===
            undefined
              ? undefined
              : data.mac
                  ?.trim()
                  .toUpperCase() ||
                null,

          name:
            data.name ===
            undefined
              ? undefined
              : data.name
                  ?.trim() ||
                null,

          location:
            data.location ===
            undefined
              ? undefined
              : data.location
                  ?.trim() ||
                null,
        },
      );

    onNavigationUpdate();

    return updated;
  }

  async function setStatus(
    id: number,
    active?: boolean,
    maintenance?: boolean,
  ) {
    const node =
      await repository.findById(
        id,
      );

    if (!node) {
      return null;
    }

    const updated =
      await repository.update(
        id,
        {
          active,
          maintenance,
        },
      );

    onNavigationUpdate();

    return updated;
  }

  async function remove(
    id: number,
  ) {
    const node =
      await repository.findById(
        id,
      );

    if (!node) {
      return null;
    }

    if (
      node._count
        .pointsOfInterest >
      0
    ) {
      throw new Error(
        "SENSOR_HAS_POIS",
      );
    }

    if (
      node._count
        .poiApproachesFrom >
      0
    ) {
      throw new Error(
        "SENSOR_HAS_POI_APPROACHES",
      );
    }

    const removed =
      await repository.remove(
        id,
      );

    onNavigationUpdate();

    return removed;
  }

  return {
    list,
    listOperational,
    get,
    create,
    update,
    setStatus,
    remove,
  };
}

export type NodeService =
  ReturnType<
    typeof createNodeService
  >;