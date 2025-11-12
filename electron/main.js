// Example electron main process snippet: integrate window state (requires npm install electron-store)
// Merge into your existing main.js where BrowserWindow is created.

const { app, BrowserWindow, ipcMain } = require('electron');
const Store = require('electron-store');
const store = new Store();
let mainWindow;

function createWindow() {
  const saved = store.get('windowState') || {};
  const width = saved.width || 1280;
  const height = saved.height || 800;
  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: /* path to your preload that exposes ipcRenderer or electronStore */,
      contextIsolation: true,
    },
  });

  if (saved.x != null && saved.y != null) {
    try { mainWindow.setBounds({ x: saved.x, y: saved.y, width, height }); } catch(e){}
  }
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  mainWindow.on('close', () => {
    store.set('windowState', mainWindow.getBounds());
  });

  // Handle mini-window request from renderer
  ipcMain.on('jugitube-toggle-mini', () => {
    // implement mini always-on-top window or toggle PiP-like behavior
    // TODO: create/destroy small BrowserWindow with alwaysOnTop: true
  });
}

app.whenReady().then(createWindow);