import {
  ApiError,
} from "./api";

const messages:
  Record<
    string,
    string
  > = {
  SENSOR_CODE_IN_USE:
    "Já existe um sensor com este código.",

  SENSOR_MAC_IN_USE:
    "Já existe um sensor com este MAC.",

  SENSOR_CODE_OR_MAC_IN_USE:
    "Já existe um sensor com este código ou MAC.",

  SENSOR_CREATE_FAILED:
    "Não foi possível cadastrar o sensor.",

  SENSOR_UPDATE_FAILED:
    "Não foi possível atualizar o sensor.",

  SENSOR_DELETE_FAILED:
    "Não foi possível excluir o sensor.",

  SENSOR_HAS_POIS:
    "Este sensor possui pontos de interesse vinculados. Altere ou remova esses pontos antes de excluir o sensor.",

  SENSOR_HAS_POI_APPROACHES:
    "Este sensor está sendo utilizado por uma orientação de ponto de interesse.",

  ENVIRONMENT_CODE_IN_USE:
    "Já existe um ambiente com este código.",

  ENVIRONMENT_HAS_SENSORS:
    "Este ambiente possui sensores vinculados e não pode ser excluído.",

  ENVIRONMENT_IN_USE:
    "Este ambiente possui vínculos e não pode ser excluído.",

  ENVIRONMENT_CREATE_FAILED:
    "Não foi possível cadastrar o ambiente.",

  ENVIRONMENT_UPDATE_FAILED:
    "Não foi possível atualizar o ambiente.",

  ENVIRONMENT_DELETE_FAILED:
    "Não foi possível excluir o ambiente.",

  POI_CODE_IN_USE:
    "Já existe um ponto de interesse com este código.",

  POI_CREATE_FAILED:
    "Não foi possível cadastrar o ponto de interesse.",

  POI_UPDATE_FAILED:
    "Não foi possível atualizar o ponto de interesse.",

  POI_DELETE_FAILED:
    "Não foi possível excluir o ponto de interesse.",

  EDGE_ALREADY_EXISTS:
    "Esta conexão já está cadastrada.",

  EDGE_DELETE_FAILED:
    "Não foi possível excluir a conexão.",

  INVALID_ID:
    "O identificador informado é inválido.",

  VALIDATION_ERROR:
    "Alguns dados informados são inválidos.",

  FORBIDDEN:
    "Você não possui permissão para realizar esta operação.",

  UNAUTHORIZED:
    "Sua sessão não é válida.",

  INVALID_TOKEN:
    "Sua sessão expirou ou não é válida.",

  INTERNAL_ERROR:
    "Ocorreu um erro interno no servidor.",

  NETWORK_ERROR:
    "Não foi possível conectar ao servidor.",

  ROUTE_NOT_FOUND:
    "O endereço solicitado não existe.",
};

export function apiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (
    !(
      error instanceof
      ApiError
    )
  ) {
    return fallback;
  }

  if (
    error.code &&
    messages[
      error.code
    ]
  ) {
    return messages[
      error.code
    ];
  }

  return (
    error.message ||
    fallback
  );
}