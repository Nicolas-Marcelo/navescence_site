const TOKEN_KEY = "navescence_auth_token";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(
    message: string,
    status: number,
    code?: string,
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

interface ApiRequestOptions extends RequestInit {
  authenticated?: boolean;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const token = getToken();

  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.authenticated && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const contentType =
    response.headers.get("content-type") ?? "";

  let data: unknown = null;

  if (contentType.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    const object =
      data &&
      typeof data === "object"
        ? (data as Record<string, unknown>)
        : null;

    const code =
      typeof object?.error === "string"
        ? object.error
        : undefined;

    const message =
      typeof object?.message === "string"
        ? object.message
        : code ?? `Erro HTTP ${response.status}`;

    throw new ApiError(
      message,
      response.status,
      code,
    );
  }

  return data as T;
}