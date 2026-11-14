import os from "node:os";
import { createRoomServer } from "./roomServer.js";
const serverIp =
  Object.values(os.networkInterfaces())
    .flat()
    .find((n) => n?.family === "IPv4" && !n.internal)?.address || "127.0.0.1";
const port = Number(process.env.PORT || 8787);
const server = createRoomServer({ port, serverIp });
server.wss.on("listening", () =>
  console.log(`Shadow Ops LAN server: ws://${serverIp}:${port}`),
);
server.wss.on("error", (e) => {
  console.error(e.message);
  process.exitCode = 1;
});
