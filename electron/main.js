const { app, BrowserWindow, dialog, session, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

let mainWindow;
let server;

function getDataDir() {
  return path.join(app.getPath('userData'), 'data');
}

function getResourceBin(name) {
  const packaged = path.join(process.resourcesPath, 'bin', name);
  const development = path.join(__dirname, '..', 'resources', 'bin', name);

  if (app.isPackaged) return packaged;
  if (fs.existsSync(development)) return development;

  // Durante o desenvolvimento, permite usar executáveis instalados no PATH.
  return name;
}

function startServer() {
  return new Promise((resolve, reject) => {
    process.env.APP_DATA_DIR = getDataDir();
    process.env.YTDLP_PATH = getResourceBin(process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
    process.env.FFMPEG_PATH = getResourceBin(process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
    process.env.PORT = '0';

    fs.mkdirSync(getDataDir(), { recursive: true });
    require(path.join(__dirname, '..', 'src', 'server.js'));
    server = global.__TWITCH_CLIPPER_SERVER__;

    const timer = setInterval(() => {
      if (server && server.address()) {
        clearInterval(timer);
        resolve(server.address().port);
      }
    }, 25);
    setTimeout(() => {
      clearInterval(timer);
      if (!server) reject(new Error('Não foi possível iniciar o servidor local.'));
    }, 5000);
  });
}

async function createWindow() {
  const port = await startServer();

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 850,
    minWidth: 900,
    minHeight: 700,
    backgroundColor: '#0e0e10',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}`);

  session.defaultSession.on('will-download', (_event, item) => {
    const suggested = item.getFilename() || 'clip.mp4';
    const target = dialog.showSaveDialogSync(mainWindow, {
      title: 'Salvar clip',
      defaultPath: path.join(app.getPath('videos'), 'Twitch Clipper', suggested),
      filters: [{ name: 'Vídeo MP4', extensions: ['mp4'] }]
    });
    if (!target) {
      item.cancel();
      return;
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    item.setSavePath(target);
  });
}

app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event, url) => {
    if (!url.startsWith('http://127.0.0.1:')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
});

app.whenReady().then(() => createWindow().catch(err => {
  dialog.showErrorBox('Twitch Clipper', err.stack || err.message);
  app.quit();
}));

app.on('window-all-closed', () => {
  if (server) server.close();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (server) server.close();
});
