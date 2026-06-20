const { app, BrowserWindow, protocol, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';
const isPackaged = app.isPackaged;

let mainWindow = null;

const DEV_SERVER_URL = 'http://localhost:5173';

function resolveDistPath(...paths) {
  if (isPackaged) {
    return path.join(process.resourcesPath, 'app', 'dist', ...paths);
  }
  return path.join(__dirname, '..', 'dist', ...paths);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 720,
    title: '追更控制台 - 资深读者的网文管理工具',
    show: false,
    backgroundColor: '#f0f2f5',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: isDev,
      webSecurity: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    loadDevServer();
  } else {
    loadProduction();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    console.error(`[Electron] 页面加载失败: ${errorCode} - ${errorDescription}`);
    if (!isDev) {
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          loadProduction();
        }
      }, 500);
    }
  });
}

function loadDevServer() {
  const tryLoad = (attempts = 0) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.loadURL(DEV_SERVER_URL).catch(() => {
      if (attempts < 20) {
        setTimeout(() => tryLoad(attempts + 1), 500);
      } else {
        mainWindow.loadFile(path.join(__dirname, 'loading-error.html'));
      }
    });
  };
  tryLoad();
}

function loadProduction() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const indexPath = resolveDistPath('index.html');
  if (fs.existsSync(indexPath)) {
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error('[Electron] 加载打包文件失败:', err);
    });
  } else {
    console.error(`[Electron] 文件不存在: ${indexPath}`);
  }
}

function registerProtocols() {
  protocol.registerFileProtocol('app', (request, callback) => {
    const url = request.url.replace('app://', '');
    const filePath = resolveDistPath(url);
    callback({ path: filePath });
  });
}

app.whenReady().then(() => {
  registerProtocols();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  mainWindow = null;
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  mainWindow = null;
});

app.on('will-quit', (e) => {
  try {
    mainWindow = null;
  } catch (err) {
    console.error('[Electron] 清理时出错:', err);
  }
});

process.on('uncaughtException', (error) => {
  console.error('[Electron] 未捕获异常:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Electron] 未处理的 Promise 拒绝:', reason);
});

process.on('SIGINT', () => {
  app.quit();
});

process.on('SIGTERM', () => {
  app.quit();
});
