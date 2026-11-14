const { contextBridge } = require("electron");
const desktop = { platform: process.platform };
contextBridge.exposeInMainWorld("shadowOpsDesktop", desktop);
// Preserve the inherited bridge name for compatibility with existing bundles.
contextBridge.exposeInMainWorld("museumBreakDesktop", desktop);
