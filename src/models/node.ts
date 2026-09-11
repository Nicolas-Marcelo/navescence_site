import type {
  ScanReading
} from "./scan.js";

export enum Presence {

  Online =
    "ONLINE",

  Offline =
    "OFFLINE",

  Unknown =
    "DESCONHECIDO"

}

export enum NodeStatus {

  Unknown =
    "DESCONHECIDO",

  Checking =
    "VERIFICANDO",

  Finished =
    "FINALIZADO",

  Busy =
    "OCUPADO"

}

export enum Diagnostic {

  Unknown =
    "DESCONHECIDO",

  Ok =
    "OK",

  Checking =
    "VERIFICANDO",

  Offline =
    "NO_INDISPONIVEL",

  MissingNeighbor =
    "VIZINHO_NAO_DETECTADO"

}

export interface NodeState {

  presence:
    Presence;

  status:
    NodeStatus;

  scans:
    ScanReading[];

  lastCommunication:
    string | null;

  lastVerification:
    string | null;
}

export function createNodeState():
  NodeState {

  return {

    presence:
      Presence.Unknown,

    status:
      NodeStatus.Unknown,

    scans:
      [],

    lastCommunication:
      null,

    lastVerification:
      null

  };
}