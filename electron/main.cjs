const { app, BrowserWindow } = require("electron");
const path = require("path");
const { pathToFileURL } = require("node:url");
const os = require("node:os");
const isDev = !app.isPackaged;
let lanServer = null;
async function startLanServer() {
  try {
    const { createRoomServer } = await import(
      pathToFileURL(path.join(__dirname, "../server/roomServer.js")).href
    );
    const serverIp =
      Object.values(os.networkInterfaces())
        .flat()
        .find((n) => n?.family === "IPv4" && !n.internal)?.address ||
      "127.0.0.1";
    lanServer = createRoomServer({
      port: Number(process.env.PORT || 8787),
      serverIp,
    });
    lanServer.wss.on("error", (err) =>
      console.warn("LAN server unavailable:", err.message),
    );
  } catch (err) {
    console.warn("LAN server unavailable:", err.message);
  }
}

function createMainWindow() {
  const win = new BrowserWindow({
    title: "Shadow Ops",
    width: 1400,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    autoHideMenuBar: true,
    backgroundColor: "#0b1220",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev) {
    win.loadURL("http://127.0.0.1:5173");
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(async () => {
  await startLanServer();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  try {
    lanServer?.close();
  } catch {}
  lanServer = null;
});
