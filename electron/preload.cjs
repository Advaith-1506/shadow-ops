const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('museumBreakDesktop', {
  platform: process.platform,
});

