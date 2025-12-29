import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// #region agent log
console.log('[DEBUG] App starting', { isDev, NODE_ENV: process.env.NODE_ENV, isPackaged: app.isPackaged, __dirname });
// #endregion

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  // #region agent log
  console.log('[DEBUG] createWindow called', { preloadPath: path.join(__dirname, 'preload.js') });
  // #endregion
  
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#0a0a0a',
    show: false,
  });

  // #region agent log
  console.log('[DEBUG] BrowserWindow created');
  // #endregion

  if (isDev) {
    // #region agent log
    console.log('[DEBUG] Loading dev URL', { url: 'http://localhost:5173' });
    // #endregion
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    const filePath = path.join(__dirname, '../dist/index.html');
    // #region agent log
    console.log('[DEBUG] Loading production file', { filePath });
    // #endregion
    mainWindow.loadFile(filePath);
  }

  mainWindow.once('ready-to-show', () => {
    // #region agent log
    console.log('[DEBUG] ready-to-show fired');
    // #endregion
    if (mainWindow) {
      mainWindow.show();
      // #region agent log
      console.log('[DEBUG] Window shown');
      // #endregion
    }
  });

  mainWindow.on('closed', () => {
    // Dereference the window object
    mainWindow = null;  
  });
}

// #region agent log
console.log('[DEBUG] Waiting for app.whenReady()');
// #endregion

app.whenReady().then(() => {
  // #region agent log
  console.log('[DEBUG] app.whenReady() resolved');
  // #endregion
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // #region agent log
  console.log('[DEBUG] window-all-closed event');
  // #endregion
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

