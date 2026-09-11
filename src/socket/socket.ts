import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";

import type { NodeStore } from "../states/nodeStore.js";
import type { TopologyStore } from "../states/topologyStore.js";
import { getDashboard } from "../services/dashboard.js";

export function createSocket(httpServer: HttpServer, store: NodeStore, topology: TopologyStore) {
  const io = new SocketIOServer(httpServer);

  io.on("connection", socket => {
    console.log(`[WEB] Interface conectada: ${socket.id}`);
    socket.emit("dashboard:update", getDashboard(store, topology));

    socket.on("disconnect", () => {
      console.log(`[WEB] Interface desconectada: ${socket.id}`);
    });
  });

  function sendDashboard() {
    io.emit("dashboard:update", getDashboard(store, topology));
  }

  return { sendDashboard };
}