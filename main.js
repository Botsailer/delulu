import { app, BrowserWindow, Menu, ipcMain, globalShortcut, nativeImage, Tray } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { registerAPIHandlers } from './api-handler.js'
import { registerMangaHandlers } from './manga-handler.js'
import { registerAnimeHandlers, startStreamProxy } from './anime-handler.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = !app.isPackaged
let tray = null
let isQuitting = false

// Set app name
app.setName('DELULU')

// Disable hardware acceleration to fix lag on Linux and potential crashes
app.disableHardwareAcceleration()

// Handle single instance lock
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, we should focus our window.
    const windows = BrowserWindow.getAllWindows()
    if (windows.length > 0) {
      if (windows[0].isMinimized()) windows[0].restore()
      if (!windows[0].isVisible()) windows[0].show()
      windows[0].focus()
    }
  })
}

// Get icon path - use PNG for all platforms in dev, platform-specific for production
const getIconPath = () => {
  // Always use PNG for Linux, it's the most reliable
  if (process.platform === 'linux') {
    return path.join(__dirname, 'assets', 'icon.png')
  }
  const iconName = process.platform === 'win32' ? 'icon.ico' : 'icon.icns'
  return path.join(__dirname, 'assets', iconName)
}

const createWindow = () => {
  // Hide the menu bar completely
  Menu.setApplicationMenu(null)

  // Create native image for icon (more reliable on Linux)
  const iconPath = getIconPath()
  const appIcon = nativeImage.createFromPath(iconPath)

  const win = new BrowserWindow({
    show: true,
    autoHideMenuBar: true,
    title: 'DELULU',
    icon: appIcon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      // Load preload script to expose safe IPC methods
      preload: path.join(__dirname, 'preload.js'),
      // Disable DevTools in production
      devTools: isDev,
    }
  })

  // ============ SECURITY: Disable DevTools in production ============
  // if (!isDev) {
  //   // Prevent DevTools from opening via keyboard shortcuts
  //   win.webContents.on('before-input-event', (event, input) => {
  //     // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
  //     if (
  //       input.key === 'F12' ||
  //       (input.control && input.shift && ['I', 'i', 'J', 'j', 'C', 'c'].includes(input.key))
  //     ) {
  //       event.preventDefault()
  //     }
  //   })

  //   // Block right-click context menu
  //   win.webContents.on('context-menu', (event) => {
  //     event.preventDefault()
  //   })

  //   // If DevTools somehow opens, close it immediately
  //   win.webContents.on('devtools-opened', () => {
  //     win.webContents.closeDevTools()
  //   })
  // }

  //open devtools if in development mode
  // if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' })
  // }


  // ============ SECURITY: Block external navigation ============
  win.webContents.on('will-navigate', (event, url) => {
    // Only allow navigation within the app
    if (!url.startsWith('http://localhost:5173') && !url.startsWith('file://')) {
      event.preventDefault()
    }
  })

  // Block new windows/popups
  win.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' }
  })

  // Load from Vite dev server in development, built files in production
  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, 'renderer/dist/index.html'))
  }

  win.once('ready-to-show', () => {
    win.maximize()
  })

  // Handle close event to minimize to tray
  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      win.hide()
      return false
    }
  })

  return win
}

app.whenReady().then(() => {
  // Register all API handlers (these run in main process, hidden from renderer)
  registerAPIHandlers(ipcMain)
  registerMangaHandlers(ipcMain)
  registerAnimeHandlers(ipcMain)

  // Start the local stream proxy server for M3U8/segment proxying
  // This allows HLS.js to request from localhost with correct headers injected server-side
  startStreamProxy().then(port => {
    // Store the proxy port globally so renderer can access it
    global.streamProxyPort = port;
  }).catch(() => {});

  const mainWindow = createWindow()

  // Create Tray
  const iconPath = getIconPath()
  const trayIcon = nativeImage.createFromPath(iconPath)
  
  // Resize icon: Windows/Mac prefer 16x16, Linux prefers larger (32x32 or original)
  const resizedIcon = process.platform === 'linux' 
    ? trayIcon.resize({ width: 32, height: 32 }) 
    : trayIcon.resize({ width: 16, height: 16 })

  tray = new Tray(resizedIcon)
  tray.setToolTip('DELULU')

  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Show App', 
      click: () => mainWindow.show() 
    },
    { type: 'separator' },
    {
      label: 'Uninstall',
      click: () => {
        mainWindow.show()
        mainWindow.webContents.send('system:uninstall-request')
      }
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => {
        isQuitting = true
        app.quit()
      } 
    }
  ])

  tray.setContextMenu(contextMenu)

  // Handle uninstall confirmation
  ipcMain.handle('system:confirm-uninstall', async () => {
    isQuitting = true
    
    if (process.platform === 'linux') {
      // On Linux, we can't easily self-uninstall without sudo password.
      // We'll try to open a terminal with the command
      const { exec } = await import('child_process')
      
      // Try to use a terminal emulator to run the command
      // This covers common terminals: gnome-terminal, konsole, xterm, etc.
      const uninstallCmd = `sudo apt remove delulu -y`
      
      // Try to launch a terminal that stays open or runs the command
      // This is a best-effort approach
      const terminals = [
        `gnome-terminal -- bash -c "${uninstallCmd}; read -p 'Press Enter to close'"` ,
        `konsole -e bash -c "${uninstallCmd}; read -p 'Press Enter to close'"`,
        `xterm -e "sudo apt remove delulu -y; read -p 'Press Enter to close'"`
      ]
      
      // Just try to run the first one that works or just quit and let user know
      // Since we can't reliably detect terminal, we'll just quit and show a dialog before quitting?
      // Actually, let's just quit the app so the uninstaller can run if the user runs it manually
      
      // Better approach for Linux: Just quit and maybe open a help page or show a final dialog?
      // But user asked for "uninstall it".
      
      // Let's try to run the command directly if possible, but it will fail without password.
      // So we will use xdg-open to open a terminal? No.
      
      // We will just quit the app, as the uninstaller (if run externally) needs the app closed.
      app.quit()
      
      // In a real scenario, we might spawn a detached process that asks for password via GUI (pkexec)
      // exec(`pkexec apt-get remove delulu -y`)
      exec(`pkexec apt-get remove delulu -y`, () => {})
      
    } else if (process.platform === 'win32') {
      // Windows: Run the uninstaller
      const { spawn } = await import('child_process')
      const uninstallerPath = path.join(path.dirname(app.getPath('exe')), 'Uninstall DELULU.exe')
      spawn(uninstallerPath, { detached: true, stdio: 'ignore' })
      app.quit()
    } else {
      app.quit()
    }
  })

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
    }
  })

  // ============ SECURITY: Block global shortcuts in production ============
  if (!isDev) {
    // Register and block DevTools shortcuts globally
    globalShortcut.register('F12', () => {})
    globalShortcut.register('CommandOrControl+Shift+I', () => {})
    globalShortcut.register('CommandOrControl+Shift+J', () => {})
    globalShortcut.register('CommandOrControl+Shift+C', () => {})
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('before-quit', () => {
  isQuitting = true
})

app.on('window-all-closed', () => {
  // Unregister shortcuts
  globalShortcut.unregisterAll()
  
  if (process.platform !== 'darwin') {
    // Do not quit automatically, let the tray handle it
    // app.quit()
  }
})
