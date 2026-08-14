const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('twitchClipper', {
  version: '1.0.0'
});
