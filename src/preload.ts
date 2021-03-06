import { BrowserWindow, ipcRenderer, IpcRendererEvent, remote, Shell, shell } from "electron";
import path from 'path'
import logger from 'electron-log';
const log = logger.create('renderer');
log.transports.console.format = '{h}:{i}:{s} > {text}';
log.transports.file.format = '{h}:{i}:{s} > {text}';
import fs from 'fs-extra';
import os from 'os'

import fetch from "node-fetch";

//@ts-expect-error
window.fetch = fetch;

//  Allow importing in renderers
//# DO NOT IMPORT ANYTHING THERE, ONLY TYPES
window.exports = exports;

// Includes

let modpackManager = remote.getGlobal('modpackManager');

import { SettingsInterface } from './includes/settings-manager';
let settingsInterface = new SettingsInterface(remote, ipcRenderer);

import { AuthInterface } from './includes/auth-manager';
let authInterface = new AuthInterface(remote, ipcRenderer);

import { AutoUpdaterInterface } from './includes/auto-updater';
let autoUpdater = new AutoUpdaterInterface(remote, ipcRenderer);


//. ------------------
//#region Libs

//@ts-expect-error
window.modpackManager = modpackManager;

//@ts-expect-error
window.settingsInterface = settingsInterface;

//@ts-expect-error
window.authInterface = authInterface;

//@ts-expect-error
window.autoUpdater = autoUpdater;

//#endregion
//. ------------------
//#region Apis

//@ts-expect-error
window.browserWindow = {
    exit: () => {remote.getCurrentWindow().close()},
    minimize: () => {remote.getCurrentWindow().minimize()},
    maximize: () => {remote.getCurrentWindow().maximize()},
    show: () => {remote.getCurrentWindow().show()},
    //@ts-expect-error
    reload: () => {window.modpackManager.downloader.cancel(); remote.getCurrentWindow().reload()},
    isDevToolsOpened: () => {return remote.getCurrentWindow().webContents.isDevToolsOpened()}
}

//@ts-expect-error
window.ipcRenderer = {
    send: ipcRenderer.send,
    sendSync: ipcRenderer.sendSync,
    on: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => {ipcRenderer.on(channel, listener)},
    once: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => {ipcRenderer.once(channel, listener)},
    removeAllListeners: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => {ipcRenderer.removeAllListeners(channel)},
}

//@ts-expect-error
window.shell = {
    showItemInFolder: async (path: string) => {
        console.log('showing file: =', path);
        await shell.showItemInFolder(path);
    },
    openPath: async (path: string) => {
        console.log('opening file: =', path);
        await shell.openPath(path);
    },
    openExternal: async (url: string) => {
        console.log('opening url: =', url);
        await shell.openExternal(url);
    }
}

//@ts-expect-error
window.path = {
    ...path    
}

//@ts-expect-error
window.dialog = {
    showOpenDialog: async (options: any) => {
        return await remote.dialog.showOpenDialog(options);
    }
}

//#endregion
//. ------------------
//#region  //. Console warning --------------------------------------------

//@ts-expect-error
if (window.browserWindow.isDevToolsOpened()) {
    let header_color = `#705CF2`; 
    let p_color = `#6754E2`;
    console.info("%c??????????????-????!", `color:${header_color}; font-size: 48px; padding: 8px 0; font-weight:bold`);
    console.info("%c??????, ?????? ???????????????? ???????????????? ?????? ???????? ????????, ?? ???????????????????????? 420/69 ?????????? ???????? ????????????????.", "color:#ffffff; font-size: 14px; padding: 8px 0");
    console.info("%c???????? ???????????????? ???????? ??????-????????????, ???????????? ???????? ???????????? ???????????????? ???????????? ?? ???????????? ????????????????.", `color:${p_color}; font-size: 16px; padding: 8px 0; font-weight:bold`);
}

ipcRenderer.on('devtools-opened', (_) => {
    let header_color = `#705CF2`; 
    let p_color = `#6754E2`;
    console.info("%c??????????????-????!", `color:${header_color}; font-size: 48px; padding: 8px 0; font-weight:bold`);
    console.info("%c??????, ?????? ???????????????? ???????????????? ?????? ???????? ????????, ?? ???????????????????????? 420/69 ?????????? ???????? ????????????????.", "color:#ffffff; font-size: 14px; padding: 8px 0");
    console.info("%c???????? ???????????????? ???????? ??????-????????????, ???????????? ???????? ???????????? ???????????????? ???????????? ?? ???????????? ????????????????.", `color:${p_color}; font-size: 16px; padding: 8px 0; font-weight:bold`);
});

//#endregion
//. ------------------
//#region App frame (close, minimize, reload buttons), Theme and other onload stuff

let id = -1;

ipcRenderer.send('get-window');
ipcRenderer.on('window-id', (_, arg) => {
    id = arg - 1; // Get window id and store it
})

// window.onunload = () => {
//     ipcRenderer.send('win-hide');
// }

//@ts-expect-error
window.onbeforeload = () => {
    console.log('preloading... <<<');

    // settingsInterface.theme = settingsInterface.settings.appearance.default_dark_theme ? ':dark:' : '';
    settingsInterface.theme = settingsInterface.settings.appearance.theme;
    settingsInterface.bg = settingsInterface.settings.appearance.bg;
    settingsInterface.filter_opacity = settingsInterface.settings.appearance.filter_opacity;
    settingsInterface.blur_amount = settingsInterface.settings.appearance.blur_amount;

    console.log('preload done <<<');
}

//@ts-expect-error
window.max_setable_ram = Math.ceil(os.totalmem() / 1024 / 1024 / 1024);
//@ts-expect-error
window.min_setable_ram = 4;
//@ts-expect-error
window.os = os;

window.onload = async () => {
    // settingsManager.theme = settingsManager.settings.appearance.theme;
    // settingsManager.bg = settingsManager.settings.appearance.bg;
    console.log('loading... <<<');

    if (settingsInterface.settings.dev_mode) document.body.classList.add('dev');
    let vid = (document.getElementById('bg-video') as HTMLVideoElement);
    vid.volume = settingsInterface.settings.appearance.bg_volume / 100;
    vid.muted = false;
    vid.oncanplay = async () => {
        vid.style.transition = '';
        vid.classList.add('loaded');
    }
    
    document.getElementById('app-exit')?.addEventListener('click', () => {
        console.log('exiting');
        settingsInterface.saveSync();
        //@ts-expect-error
        window.modpackManager.downloader.cancel();

        //@ts-expect-error
        window.browserWindow.exit();
    });

    document.getElementById('app-minimize')?.addEventListener('click', () => {
        //@ts-expect-error
        window.browserWindow.minimize();
    });

    document.getElementById('app-reload')?.addEventListener('click', async () => {
        if (document.getElementById('app-reload') && document.getElementById('app-reload')?.classList.contains('locked')) {
            return;
        }

        settingsInterface.saveSync();
        console.log('reloading');
        
        //@ts-expect-error
        window.modpackManager.updateModpacksInfo();
        //@ts-expect-error
        window.settingsInterface.updateThemesList()
        
        //@ts-expect-error
        window.browserWindow.reload();
    });

    //@ts-expect-error
    window.canreload = true;

    window.addEventListener('beforeunload', (ev) => {
        console.log('unloading... <<<');

        console.log('byee~~ sussy baka~ :)');
    });

    console.log('load done <<<');
}

window.console.log = log.info;

//@ts-expect-error
window.version = remote.app.getVersion();

//@ts-expect-error
window.CapitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// let i = 10000000000;
// while (i > 0) {i--};

//#endregion
//. ------------------