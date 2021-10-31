import electron, { app, BrowserWindow, ipcMain, remote } from "electron";
import path from 'path';
import logger from 'electron-log'
import * as fs from 'fs-extra';
import fetch from 'node-fetch'

const log = logger.create('main');
log.variables.label = 'main';
log.transports.console.format = '{h}:{i}:{s} > [{label}] {text}';
log.transports.file.format = '{h}:{i}:{s} > [{label}] {text}';

let mainWindow: BrowserWindow;

if (require("electron-squirrel-startup")) {
    app.quit();
}

async function main() {
    mainWindow = await openStartWindow();
};

app.on("ready", main);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        main();
    }
});

function openStartWindow(): Promise<BrowserWindow> {
    return new Promise((resolve, _) => {
        let win = new BrowserWindow({
            width: 1610,
            height: 900,
            minWidth: 1000,
            minHeight: 724,
            frame: false,
            thickFrame: true,
            icon: 'res/favicon.png',
            webPreferences: {
                nodeIntegration: false,
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: false,
                enableRemoteModule: true,
            },
            show: false,
        })
    
        win.loadFile('./src/start/index.html');
        win.on('ready-to-show', async () => {
            win.show();
            resolve(win);
        });
    
        win.webContents.on("devtools-opened", (err: string) => {
            win.webContents.send("devtools-opened");
            log.info("console opened");
        });
    })
}

function createMainWindow() {
    return new Promise((resolve, _) => {
        let win = new BrowserWindow({
            width: 1610,
            height: 900,
            minWidth: 1000,
            minHeight: 724,
            frame: false,
            thickFrame: true,
            icon: 'res/favicon.png',
            webPreferences: {
                nodeIntegration: false,
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: false,
                enableRemoteModule: true,
            },
            show: false,
        })
    
        win.loadFile('./src/svelte/index.html');
        win.on('ready-to-show', async () => {
            win.show();
            resolve(win);
            win.webContents.openDevTools();
        });
    
        win.webContents.on("devtools-opened", (err: string) => {
            win.webContents.send("devtools-opened");
            log.info("console opened");
        });
    })
}



// Settings
import { SettingsStorage } from './includes/settings-manager';
declare let settingsStorage: SettingsStorage;
Object.defineProperty(global, 'settingsStorage', {
    value: new SettingsStorage(remote, getRoot())
})

if (settingsStorage.settings.version == '') {
    settingsStorage.first_launch = true;
} else if (settingsStorage.settings.version != app.getVersion()) {
    settingsStorage.after_update = true;
}

// Auth

import { AuthStorage } from './includes/auth-manager'
Object.defineProperty(global, 'authStorage', {
    value: new AuthStorage(ipcMain, fetch, settingsStorage)
})

// ModpackManager
import { ModpackManager } from './includes/modpack-manager';
Object.defineProperty(global, 'modpackManager', {
    value: new ModpackManager(remote, getRoot(), settingsStorage)
})

// AutoUpdater
import { AutoUpdater } from './includes/auto-updater';
declare let autoUpdater: AutoUpdater;
Object.defineProperty(global, 'autoUpdater', {
    value: new AutoUpdater(ipcMain, getRoot(), settingsStorage)
})



function getRoot() {
    let root_dir = 'D:\\Games\\Delta\\launcher';
    fs.ensureDirSync(root_dir);
    return root_dir;
}

ipcMain.on('get-root', (event) => {
    event.returnValue = getRoot();
});

ipcMain.on('open-main-window', async (event) => {
    mainWindow = (await createMainWindow()) as BrowserWindow;
    event.reply('main-window-opened', event.sender.id)
})

ipcMain.on('open-start-window', async (event) => {
    openStartWindow();
    BrowserWindow.getAllWindows()[1].destroy();
})

ipcMain.on('get-window', (event) => {    
    event.reply('window-id', event.sender.id)
})

