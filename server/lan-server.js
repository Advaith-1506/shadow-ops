import { createRoomServer } from "./roomServer.js";
import { getLanAddresses } from "./lanAddresses.js";
const lanAddresses = getLanAddresses();
const serverIp = lanAddresses[0]?.address || "127.0.0.1";
const port = Number(process.env.PORT || 8787);
const server = createRoomServer({ port, serverIp, lanAddresses });
server.wss.on("listening", () => {
  console.log(`Shadow Ops WebSocket: ws://${serverIp}:${port}`);
  for (const n of lanAddresses)
    console.log(`LAN website (${n.name}): http://${n.address}:5173`);
});
server.wss.on("error", (e) => {
  console.error(e.message);
  process.exitCode = 1;
});
