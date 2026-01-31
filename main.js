const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const { workerData } = require('worker_threads');

let win;
let tray = null;

function createWindow() {
    win = new BrowserWindow({
        width: 450,
        height: 700,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    win.loadURL('http://localhost:3000');

    win.setAlwaysOnTop(true, 'screen-saver');
}

app.whenReady().then(() => {
    createWindow();

    const { nativeImage } = require('electron');
    const iconPath = path.join(__dirname, 'public', 'favicon.ico');
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon);


    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show Zenith', click: () => win.show() },
        { label: 'Quit', click: () => app.quit() }
    ]);

    tray.setToolTip('Zenith Focus Timer');
    tray.setContextMenu(contextMenu);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('minimize-me', () => {
    if (win) win.minimize();
});

ipcMain.on('close-me', () => {
        app.quit();
});
