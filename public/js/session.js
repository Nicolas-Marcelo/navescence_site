const TOKEN_KEY =
  "navescence_auth_token";

export function obterToken() {
  return localStorage.getItem(
    TOKEN_KEY
  );
}

export function salvarToken(
  token
) {
  localStorage.setItem(
    TOKEN_KEY,
    token
  );
}

export function encerrarSessao() {
  localStorage.removeItem(
    TOKEN_KEY
  );
}

export function possuiSessao() {
  const token =
    obterToken();

  return Boolean(
    token &&
    token.trim()
  );
}

export function exigirSessao() {
  if (possuiSessao()) {
    return;
  }

  window.location.replace(
    "/login.html"
  );
}

export async function apiRequest(
  path,
  options = {}
) {
  const token =
    obterToken();

  const headers = {
    ...(options.body
      ? {
          "Content-Type":
            "application/json"
        }
      : {}),

    ...(options.headers ?? {}),

    ...(token
      ? {
          Authorization:
            `Bearer ${token}`
        }
      : {})
  };

  const response =
    await fetch(
      path,
      {
        ...options,
        headers
      }
    );

  let data = null;

  const contentType =
    response.headers.get(
      "content-type"
    );

  if (
    contentType?.includes(
      "application/json"
    )
  ) {
    data =
      await response.json();
  }

  if (
    response.status === 401
  ) {
    encerrarSessao();

    if (
      window.location.pathname !==
      "/login.html"
    ) {
      window.location.replace(
        "/login.html"
      );
    }

    throw new Error(
      "UNAUTHORIZED"
    );
  }

  if (!response.ok) {
    const error =
      new Error(
        data?.error ??
        "REQUEST_ERROR"
      );

    error.status =
      response.status;

    error.code =
      data?.error;

    throw error;
  }

  return data;
}

export async function carregarUsuario() {
  const data =
    await apiRequest(
      "/api/auth/me"
    );

  return data.user;
}