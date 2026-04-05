const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopAPI", {
  getVersion: () => ipcRenderer.invoke("app:getVersion"),
  selectDesignFiles: (designId) => ipcRenderer.invoke("design-files:select", designId),
  openDesignFile: (filePath) => ipcRenderer.invoke("design-files:open", filePath),
  removeDesignFileReference: (designId, fileId) => ipcRenderer.invoke("design-files:remove-reference", designId, fileId),
  listDesignFileReferences: (designId) => ipcRenderer.invoke("design-files:list", designId)
});
