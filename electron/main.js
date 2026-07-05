const { app, BrowserWindow, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

let serverProcess;
let mainWindow;

const PORT = 3000;
const isDev = process.env.NODE_ENV === 'development';

// 启动后端服务器
function startServer() {
  return new Promise((resolve, reject) => {
    serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
      cwd: path.join(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, PORT: String(PORT) },
    });

    serverProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      console.log('[Server]', msg);
      if (msg.includes('已启动')) resolve();
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('[Server]', data.toString());
    });

    serverProcess.on('error', reject);

    // 超时兜底
    setTimeout(() => resolve(), 5000);
  });
}

// 等待服务器就绪
function waitForServer() {
  return new Promise((resolve) => {
    const check = () => {
      http.get(`http://localhost:${PORT}/api/health`, (res) => {
        if (res.statusCode === 200) resolve();
        else setTimeout(check, 500);
      }).on('error', () => setTimeout(check, 500));
    };
    check();
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: '股票研究看板',
    icon: path.join(__dirname, '..', 'client', 'public', 'favicon.svg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    // 隐藏默认菜单栏
    autoHideMenuBar: true,
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  // 在外部浏览器打开链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    console.log('🚀 启动股票研究看板桌面应用...');

    // 启动服务器
    console.log('📡 启动后端服务...');
    await startServer();
    await waitForServer();
    console.log('✅ 后端服务就绪');

    // 创建窗口
    await createWindow();
    console.log('✅ 窗口已打开');
  } catch (err) {
    console.error('启动失败:', err);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
