import { app, BrowserWindow, session } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Get Content Security Policy string
function getContentSecurityPolicy(): string {
  // Development CSP: allows unsafe-eval for Vite HMR
  const devCSP = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' http://localhost:*",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: http://localhost:*",
    "font-src 'self' data:",
    "connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:*",
  ].join('; ');

  // Production CSP: strict, no unsafe-eval
  const prodCSP = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
  ].join('; ');

  return isDev ? devCSP : prodCSP;
}

// Set Content Security Policy via webRequest (for all resources including initial document)
function setContentSecurityPolicyViaWebRequest() {
  const csp = getContentSecurityPolicy();

  const handler = (details: any, callback: any) => {
    // Only modify headers for main frame and subresources, not devtools
    if (details.resourceType === 'mainFrame' || details.resourceType === 'subresource') {
      const responseHeaders = {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      };
      
      callback({
        responseHeaders,
      });
    } else {
      callback({ responseHeaders: details.responseHeaders });
    }
  };
  
  // Use filter to catch all HTTP/HTTPS requests
  const filter = {
    urls: ['http://*/*', 'https://*/*'],
  };
  
  session.defaultSession.webRequest.onHeadersReceived(filter, handler);
}


let mainWindow: BrowserWindow | null = null;

function createWindow() {
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

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    const filePath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(filePath);
  }

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    // Dereference the window object
    mainWindow = null;  
  });
}

// Set CSP handler as early as possible - before app.whenReady()
// This ensures CSP is set before any windows are created
if (app.isReady()) {
  setContentSecurityPolicyViaWebRequest();
} else {
  app.once('ready', () => {
    setContentSecurityPolicyViaWebRequest();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

