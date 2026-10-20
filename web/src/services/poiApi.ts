export type PoiApproachSide =
  | "LEFT"
  | "RIGHT"
  | "FRONT";

export interface PoiNode {
  id: number;
  code: string;
  name?: string | null;
  active?: boolean;
  maintenance?: boolean;
}

export interface PoiApproachPayload {
  fromNodeId: number;
  side: PoiApproachSide;
  distanceMeters: number | null;
  instruction: string | null;
}

export interface PoiApproachResponse {
  id: number;
  poiId: number;
  fromNodeId: number;
  side: PoiApproachSide;
  distanceMeters: number | null;
  instruction: string | null;

  fromNode?: {
    id: number;
    code: string;
    name?: string | null;
  };
}

export interface PoiPayload {
  code: string;
  name: string;
  type: string;
  description: string | null;
  nodeId: number;
  active: boolean;
  approaches: PoiApproachPayload[];
}

export interface PoiResponse {
  id: number;
  code: string;
  name: string;
  type: string;
  description: string | null;
  nodeId: number;
  active: boolean;

  node?: {
    id: number;
    code: string;
    name?: string | null;
  };

  approaches: PoiApproachResponse[];
}

interface ApiErrorBody {
  error?: string;
  message?: string;
}

async function request<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...options,

    headers: {
      "Content-Type":
        "application/json",

      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body =
      (await response
        .json()
        .catch(
          () => null,
        )) as ApiErrorBody | null;

    throw new Error(
      body?.message ??
        body?.error ??
        `Erro HTTP ${response.status}.`,
    );
  }

  if (
    response.status ===
    204
  ) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function listarPois() {
  return request<PoiResponse[]>(
    "/api/pois",
  );
}

export function buscarPoi(
  id: number,
) {
  return request<PoiResponse>(
    `/api/pois/${id}`,
  );
}

export function criarPoi(
  payload: PoiPayload,
) {
  return request<PoiResponse>(
    "/api/pois",
    {
      method: "POST",
      body:
        JSON.stringify(
          payload,
        ),
    },
  );
}

export function atualizarPoi(
  id: number,
  payload: PoiPayload,
) {
  return request<PoiResponse>(
    `/api/pois/${id}`,
    {
      method: "PUT",
      body:
        JSON.stringify(
          payload,
        ),
    },
  );
}

export function removerPoi(
  id: number,
) {
  return request<void>(
    `/api/pois/${id}`,
    {
      method: "DELETE",
    },
  );
}

export function listarSensoresPoi() {
  return request<PoiNode[]>(
    "/api/sensors",
  );
}