const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

function getDataDir() {
  const dir = path.join(app.getPath("userData"), "data");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getRefsFilePath() {
  return path.join(getDataDir(), "design-file-references.json");
}

function readRefsDb() {
  const file = getRefsFilePath();
  if (!fs.existsSync(file)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}

function writeRefsDb(data) {
  fs.writeFileSync(getRefsFilePath(), JSON.stringify(data, null, 2), "utf8");
}

function listRefsForDesign(designId) {
  const db = readRefsDb();
  return Array.isArray(db[designId]) ? db[designId] : [];
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const indexPath = path.join(__dirname, "..", "dist", "index.html");
  win.loadFile(indexPath);
}

app.whenReady().then(() => {
  ipcMain.handle("design-files:list", async (_, designId) => {
    const refs = listRefsForDesign(designId);

    return refs.filter((item) => {
      try {
        return fs.existsSync(item.file_path);
      } catch {
        return false;
      }
    });
  });

  ipcMain.handle("design-files:select", async (_, designId) => {
    const result = await dialog.showOpenDialog({
      title: "Select design files",
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "Supported Files", extensions: ["png", "jpg", "jpeg", "webp", "gif", "pdf"] }
      ]
    });

    if (result.canceled || !result.filePaths.length) {
      return [];
    }

    const db = readRefsDb();
    const existing = Array.isArray(db[designId]) ? db[designId] : [];

    const newItems = result.filePaths.map((filePath) => {
      const stat = fs.statSync(filePath);
      return {
        id: crypto.randomUUID(),
        design_id: designId,
        file_name: path.basename(filePath),
        file_path: filePath,
        file_url: `file:///${filePath.replace(/\\/g, "/")}`,
        file_size: stat.size,
        created_at: new Date().toISOString()
      };
    });

    db[designId] = [...existing, ...newItems];
    writeRefsDb(db);

    return newItems;
  });

  ipcMain.handle("design-files:remove-reference", async (_, designId, fileId) => {
    const db = readRefsDb();
    const existing = Array.isArray(db[designId]) ? db[designId] : [];
    db[designId] = existing.filter((item) => item.id !== fileId);
    writeRefsDb(db);
    return { ok: true };
  });

  ipcMain.handle("design-files:open", async (_, filePath) => {
    await shell.openPath(filePath);
    return { ok: true };
  });

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
