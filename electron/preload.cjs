const { contextBridge, ipcRenderer } = require("electron");
const pkg = require("../package.json");

contextBridge.exposeInMainWorld("desktopAPI", {
  version: pkg.version,
  selectDesignFiles: (designId) => ipcRenderer.invoke("design-files:select", designId),
  openDesignFile: (filePath) => ipcRenderer.invoke("design-files:open", filePath),
  removeDesignFileReference: (designId, fileId) => ipcRenderer.invoke("design-files:remove-reference", designId, fileId),
  listDesignFileReferences: (designId) => ipcRenderer.invoke("design-files:list", designId)
});
