import { app, BrowserWindow, Menu, ipcMain, globalShortcut, nativeImage } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { registerAPIHandlers } from './api-handler.js'
import { registerMangaHandlers } from './manga-handler.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = !app.isPackaged

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
    show: false,
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
  if (!isDev) {
    // Prevent DevTools from opening via keyboard shortcuts
    win.webContents.on('before-input-event', (event, input) => {
      // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (
        input.key === 'F12' ||
        (input.control && input.shift && ['I', 'i', 'J', 'j', 'C', 'c'].includes(input.key))
      ) {
        event.preventDefault()
      }
    })

    // Block right-click context menu
    win.webContents.on('context-menu', (event) => {
      event.preventDefault()
    })

    // If DevTools somehow opens, close it immediately
    win.webContents.on('devtools-opened', () => {
      win.webContents.closeDevTools()
    })
  }

  //open devtools if in development mode
  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' })
  }


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
    win.show()
  })

  return win
}

app.whenReady().then(() => {
  // Register all API handlers (these run in main process, hidden from renderer)
  registerAPIHandlers(ipcMain)
  registerMangaHandlers(ipcMain)

  const mainWindow = createWindow()

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

app.on('window-all-closed', () => {
  // Unregister shortcuts
  globalShortcut.unregisterAll()
  
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
