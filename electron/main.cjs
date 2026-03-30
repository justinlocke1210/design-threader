const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const indexPath = path.join(__dirname, "..", "dist", "index.html");
  console.log("Loading file:", indexPath);

  win.loadFile(indexPath);

  win.webContents.openDevTools();

  win.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    console.log("did-fail-load:", { errorCode, errorDescription, validatedURL });
  });

  win.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    console.log("renderer console:", { level, message, line, sourceId });
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
