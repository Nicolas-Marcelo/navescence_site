import type {
  Server as HttpServer,
} from "node:http";

import {
  Server as SocketIOServer,
} from "socket.io";

import type {
  NodeStore,
} from "../states/nodeStore.js";

import type {
  TopologyStore,
} from "../states/topologyStore.js";

import {
  getDashboard,
} from "../services/dashboard.js";

export interface NavigationConfigUpdate {
  environmentId:
    number | null;

  updatedAt:
    string;
}

export function createSocket(
  httpServer:
    HttpServer,

  store:
    NodeStore,

  topology:
    TopologyStore,
) {
  const io =
    new SocketIOServer(
      httpServer,
    );

  io.on(
    "connection",
    socket => {
      socket.emit(
        "dashboard:update",

        getDashboard(
          store,
          topology,
        ),
      );
    },
  );

  function sendDashboard() {
    io.emit(
      "dashboard:update",

      getDashboard(
        store,
        topology,
      ),
    );
  }

  function sendNavigationConfigUpdated(
    environmentId:
      number | null =
      null,
  ) {
    const update:
      NavigationConfigUpdate = {
      environmentId,

      updatedAt:
        new Date()
          .toISOString(),
    };

    io.emit(
      "navigation_config_updated",
      update,
    );
  }

  return {
    sendDashboard,
    sendNavigationConfigUpdated,
  };
}