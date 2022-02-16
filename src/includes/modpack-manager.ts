import { remote as rmt, BrowserWindow, app } from 'electron'
import type { SettingsStorage } from '../includes/settings-manager';
import { copyWithProgress } from '../includes/copy-with-progress';
import nodeFetch from 'node-fetch';
import extract from 'extract-zip';
import rimraf from 'rimraf';
import * as fs from 'fs-extra';
import * as path from 'path'
import os from 'os'
import { spawn, ChildProcess } from 'child_process';
import { Downloader } from './downloader';

const mergeFiles = require('merge-files');

import logger from 'electron-log';
const log = logger.create('modpack');
log.variables.label = 'modpack';
log.transports.console.format = '{h}:{i}:{s} > [{label}] {text}';
log.transports.file.format = '{h}:{i}:{s} > [{label}] {text}';

function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Subdirectory for graphics: ./.essentials/_SETTINGS
//! Don't touch .source.json and .versions.json it's for legal purposes
const GRAPHICS_LEVELS = [
    "_LOW", // new directory: -> _MIN
    "_MINOR", // ->  _LOW 
    "_DEFAULT", // -> _DEFAULT
    "_HIGH", // -> _HIGH
    "_ULTRA" // _ULTRA
]

import { MODPACK_INFO, ADDONS_INFO, IAddonInfo } from './modpack.info';
import { extractWithProgress } from './extract-with-progress';

export type TStatus = 'idle' | 'download' | 'launched' | 'init-install' | 'install' | 'post-install' | 'ensure-env' | 'unzipping' | 'moving-libs';

export class ModpackManager {
    public MODPACK_INFO = MODPACK_INFO;
    public ADDONS_INFO = ADDONS_INFO;

    private __fs: undefined | typeof fs = undefined;
    private _graphics_level = GRAPHICS_LEVELS[2]; // моя оценка по программированию (defolt)
    private _root = '';
    public _modpacks: any;
    public _libs: any;
    private _resources: any;
    private _settingsStorage: SettingsStorage;
    private log_location = log.transports.file.getFile().path.split('\\main.log')[0];

    private _selected_modpack;

    public sha = '';
    private _status: TStatus = 'idle';
    public set status(to: TStatus) {
        this._status = to;
        BrowserWindow.getAllWindows()[0].webContents.send('modpack-manager-status-changed', { to: (Object.keys(this.processManager.launched_modpacks).includes(to) ? 'launched' : to) })
    }

    public get status() {
        return this._status;
    }

    public downloading_item = '';

    public set modpack(to: any) {
        this._selected_modpack = to;
        this._settingsStorage.settings.on_modpack = to;
        this.status = this.status;
    }

    public get modpack() {
        return this._selected_modpack;
    }

    public downloader: Downloader;
    public modpackInstaller: ModpackInstaller;
    public processManager: ProcessManager;

    public constructor(remote: typeof rmt, root: string, settingsStorage: SettingsStorage) {
        log.info('init');

        this._settingsStorage = settingsStorage;
        this._selected_modpack = settingsStorage.settings.on_modpack || Object.keys(MODPACK_INFO)[0];
        this._root = root;
        this.ensureRoot();

        this.downloader = new Downloader();
        this.modpackInstaller = new ModpackInstaller(root, this.downloader, this, settingsStorage);
        this.processManager = new ProcessManager(root, this, settingsStorage);

        this.updateLibsDirs();
        this.updateModpackDirs();
        this.updateResourcesDirs();
        this.ensureAddonsDir();

        if (this._settingsStorage.settings.dev_mode) {
            this.__fs = fs;
        }
    }

    public updateModpackDirs(): void {
        this._modpacks = {};

        for (const mdpck in MODPACK_INFO) {
            this._modpacks = {
                ...this._modpacks,
                [mdpck]: {
                    //@ts-expect-error
                    path: path.normalize(path.join(this._settingsStorage.settings.modpacks[mdpck].path.replace(/%ROOT%/g, this._root))),
                    version: 1.0,
                    installed: false,
                    ...MODPACK_INFO[mdpck],
                },
            }

            this._modpacks[mdpck].installed = this.modpackInstaller.modpackInstalledSync(mdpck);
        }

        this.ensureModpackDirectories();
    }

    public updateLibsDirs(): void {
        this._libs = {
            path: path.normalize(path.join(this._settingsStorage.settings.modpacks.libs.path.replace(/%ROOT%/g, this._root))),
            '1.12': {
                path: path.normalize(path.join(this._settingsStorage.settings.modpacks.libs.path.replace(/%ROOT%/g, this._root), '1.12')),
                version: 1.0,
                installed: false,
            },
        }
    }

    public updateResourcesDirs(): void {
        fs.ensureDirSync(path.normalize(path.join(this._root, 'resources')));
        this._resources = {
            path: path.normalize(path.join(this._root, 'resources')),
            skin: {
                path: path.normalize(path.join(this._root, 'resources', 'skin.png')),
            }
        }
    }

    public ensureRoot() {
        fs.ensureDirSync(this._root)
    }

    public get root() {
        fs.ensureDirSync(this._root)
        return this._root;
    }

    public set root(_) { }

    public get addons(): { path: string, preferences: { [key: string]: { enabled: boolean } }, mods: typeof ADDONS_INFO.mods, dependencies: typeof ADDONS_INFO.mods, } {
        return {
            path: this._settingsStorage.settings.modpack_settings.add_ons.path.replace(/%ROOT%/g, this.root),
            preferences: {
                ...this._settingsStorage.settings.modpack_settings.add_ons.all,
            } as { [key: string]: { enabled: boolean } },
            ...ADDONS_INFO,
        }
    }
    public set addons(_: {
        path: string,
        preferences: { [key: string]: { enabled: boolean } },
        mods: typeof ADDONS_INFO.mods,
        dependencies: typeof ADDONS_INFO.mods,

    }) { }

    public get modpacks() { return this._modpacks; } 
    public set modpacks(_: any) { }

    public get libs() { return this._libs; }
    public set libs(_: any) { }

    public ensureModpackDirSync(modpack_key: string): string {
        let pth = path.normalize(this.modpacks[modpack_key].path);
        if (this.sha) pth = path.join(this.root, 'experemental', this.sha);
        fs.ensureDirSync(pth)
        return pth;
    }

    public async ensureModpackDir(modpack_key: string): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                let installed = this.ensureModpackDirSync(modpack_key);
                resolve(installed);
            } catch (err) {
                log.error(err);
                reject(err)
            }
        })
    }

    public async ensureModpackDirectories(): Promise<void> {
        for (const modpack_key in this.modpacks) {
            const modpack = this.modpacks[modpack_key];
            await fs.ensureDir(path.normalize(modpack.path))
        }
    }

    public ensureLibsDirSync(libs_version?: string): string {
        if (libs_version) {
            let pth = this.libs[libs_version].path;
            fs.ensureDirSync(pth)
            return pth;
        } else {
            let pth = this.libs.path;
            fs.ensureDirSync(pth)
            return pth;
        }
    }

    public async ensureLibsDir(libs_version?: string): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                let installed = this.ensureLibsDirSync(libs_version);
                resolve(installed);
            } catch (err) {
                log.error(err);
                reject(err)
            }
        })
    }

    public async ensureAddonsDir() {
        let pth = path.normalize(this.addons.path);
        await fs.ensureDir(pth)
        return pth;
    }

    public async isFirstLaunch(modpack: string): Promise<boolean> {
        return await fs.pathExists(path.join(await this.ensureModpackDir(modpack), '.mixin.out')) == false;
    }

    public async getInfo(item: string, version?: string): Promise<any> {
        await fs.ensureDir(item)
        let pth = '';
        if (item == 'libs' && version) {
            pth = this.libs[version].path;
        } else if (this.modpacks[item]) {
            pth = this.modpacks[this.modpacks[item]].path;
        }

        const res = JSON.parse((await fs.readFile(pth)).toString());
        if (!res.version) res.version = 'v0.0.0.0';
        return res;
    }

    public async setInfo(item: string, to: any, version?: string): Promise<void> {
        await fs.ensureDir(item)
        let pth = '';
        if (item == 'libs' && version) {
            pth = this.libs[version].path;
        } else if (this.modpacks[item]) {
            pth = this.modpacks[this.modpacks[item]].path;
        }

        let res = JSON.parse((await fs.readFile(pth)).toString());
        res = { ...res, ...to }
        fs.writeFile(pth, JSON.stringify(res));
    }

    public async applyControlSettings() {
        for (const modpack_name of Object.keys(this.modpacks)) {
            let modpack_folder = await this.ensureModpackDir(modpack_name);
    
            let options_path = path.join(modpack_folder, 'options.txt');
            let of_options_path = path.join(modpack_folder, 'optionsof.txt');
            if (await fs.pathExists(options_path) == false) { 
                log.info('[SETTINGS] There are no options in ' + modpack_name);
                continue;
            }
            
            if (await fs.pathExists(of_options_path) == false) { 
                log.info('[SETTINGS] There are no optifine options in ' + modpack_name);
                continue;
            }
    
            let options_string = (await fs.readFile(options_path)).toString();
            let new_options_string = options_string;
    
            let controls_object = { ...this._settingsStorage.settings.modpack_settings.controls };
            // Dismount is the same as the crouch
            //@ts-expect-error
            controls_object.dismount = controls_object.crouch;
            //@ts-expect-error
            controls_object.dismount.minecraft_key = 'key_key.dismount';
    
    
            let changed_smth = false;
            for (const key of Object.keys(controls_object))
            {
                //@ts-expect-error
                let minecraft_key = controls_object[key].minecraft_key;
                //@ts-expect-error
                let minecraft_code = controls_object[key].minecraft_code;
                
                let new_control_line = `${minecraft_key}:${minecraft_code}`;
    
                let index_of_key = options_string.indexOf(minecraft_key + ':');
                let start_index_of_val = index_of_key + (minecraft_key + ':').length;
                let val = '';
                for (let i = 0; i < 32; i++)
                {
                    let symbol = options_string.toString().charAt(start_index_of_val + i);
                    if (symbol == '\n' || symbol == ' ') { break; }
                    val += symbol;
                }
    
                let old_control_line = `${minecraft_key}:${val}`;
    
                // Write to optionsof as well cuz this key is fucking special (fuck optifine)
                if (minecraft_key == 'key_of.key.zoom') {
                    let of_options_string = (await fs.readFile(of_options_path)).toString();
                    let of_new_control_line = `key_of.key.zoom:${minecraft_code}`;
    
                    let of_index_of_key = of_options_string.indexOf('key_of.key.zoom:');
                    let of_start_index_of_val = of_index_of_key + ('key_of.key.zoom:').length;
                    let of_val = '';
                    for (let i = 0; i < 4; i++)
                    {
                        let of_symbol = of_options_string.toString().charAt(of_start_index_of_val + i);
                        if (of_symbol == '\n') { break; }
                        of_val += of_symbol;
                    }
    
                    let of_old_control_line = `key_of.key.zoom:${of_val}`;
                    let of_new_options_string = of_options_string.toString().replace(of_old_control_line, of_new_control_line);
    
                    if (old_control_line == new_control_line) {
                        log.info(`[SETTINGS] <optionsof.txt> Unchanged: ${old_control_line}`);
                    } else {
                        log.info(`[SETTINGS] <optionsof.txt> From: ${of_old_control_line}`);
                        log.info(`[SETTINGS] <optionsof.txt> To: ${of_new_control_line}`);
                        await fs.writeFile(of_options_path, of_new_options_string);
                    }
                }
    
                if (old_control_line == new_control_line) {
                    log.info(`[SETTINGS] <options.txt> Unchanged: ${old_control_line}`);
                    continue;
                }
    
                changed_smth = true;
                log.info(`[SETTINGS] <options.txt> From: ${old_control_line}`);
                log.info(`[SETTINGS] <options.txt> To: ${new_control_line}`);
                new_options_string = new_options_string.toString().replace(old_control_line, new_control_line);
            }
            
            if (changed_smth){
                log.info(`[SETTINGS] <options.txt> Updating file`);
                await fs.writeFile(options_path, new_options_string);
            } else {
                log.info(`[SETTINGS] <options.txt> No changes have been made.`);
            }
        }

        return true;
    }

    public async integrateSettings(modpack_name: string): Promise<boolean> {
        let fl = await this.isFirstLaunch(modpack_name); // studio
        if (fl && (await this.modpackInstaller.modpackInstalled(modpack_name))) {
            let preset = GRAPHICS_LEVELS[this._settingsStorage.settings.modpack_settings.optimization_level - 1];
            let modpack_folder = await this.ensureModpackDir(modpack_name)
            let src = path.join(modpack_folder, '.essentials', '_SETTINGS', preset);
            
            log.info(`[MODPACK] <${modpack_name}> integrating settings: [${preset}]. src: [${src}]...`);
            if (await fs.pathExists(src)) {
                let files = await fs.readdir(src);
                await files.forEach(async file => {
                    let file_pth = path.join(src, file);
                    let dist = path.join(modpack_folder, file);
                    log.info(`[MODPACK] <${modpack_name}> copying from: [${file_pth}] to [${dist}]...`);
                    if (await fs.pathExists(file_pth)) {
                        await fs.copyFile(file_pth, dist);
                    }
                })
                return true;
            }

            log.info(`[MODPACK] <${modpack_name}> src not found!`);
        }

        log.info(`[MODPACK] <${modpack_name}> not a first launch. skipping settings intergration...`);
        return false;
    }

    public async ensureModpack(modpack_name: string, force_install=false) {
        let libs_version = this._modpacks[modpack_name].libs_version;
        let libs_installed = await this.modpackInstaller.installLibs(libs_version);
        let modpack_installed = await this.modpackInstaller.installModpack(modpack_name);
        let environment_modpack = await this.ensureModpackEnvironment(modpack_name);

        this.status = 'idle';

        return libs_installed && modpack_installed && environment_modpack;
    }

    public async ensureModpackEnvironment(modpack_name: string, force_install=false) {
        let user_settings_applied = await this.applyControlSettings();
        let settings_applied = await this.integrateSettings(modpack_name);
        let addons_installed = await this.modpackInstaller.ensureAddonsInModpack(modpack_name);

        return addons_installed && settings_applied && user_settings_applied;
    }

    public async cancelCurrentDownload() {
        this.modpackInstaller.cancelled = true;
        this.downloader.cancel();
        this.status = 'idle';
        this.downloading_item = '';
    }
}

class ModpackInstaller {
    private _settingsStorage: SettingsStorage;
    private _downloader: Downloader;
    private _modpackManager: ModpackManager;
    
    public cancelled = false;
    public busy = false;
    public root: string;

    constructor(root: string, downloader: Downloader, modpackManager: ModpackManager, settingsStorage: SettingsStorage) {
        this._settingsStorage = settingsStorage;
        this._downloader = downloader;
        this._modpackManager = modpackManager;
        this.root = root;
    }

    //. >>> ESSENTIALS
    //#region ESSENTIALS ---------------------------------------------------

    public modpackInstalledSync(modpack: string): boolean {
        let pth = this._modpackManager.ensureModpackDirSync(modpack);
        if (fs.pathExistsSync(pth))
            return (fs.pathExistsSync(pth + '\\mods'));
        else return false;
    }

    public modpackInstalled(modpack: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                let installed = this.modpackInstalledSync(modpack)
                resolve(installed);
            } catch (err) {
                log.error(err);
                reject(err)
            }
        })
    }

    public libsIntalledSync(version='1.12', modpack?: string): boolean {
        let pth = this._modpackManager.ensureLibsDirSync(version);
        if (fs.pathExistsSync(pth))
            if (modpack) {
                let modpack_pth = this._modpackManager.ensureModpackDirSync(modpack);
                console.log(modpack_pth + '\\assets');
                return ((fs.readdirSync(pth).length > 0
                    && fs.pathExistsSync(pth + '\\assets')
                    && fs.pathExistsSync(pth + '\\libraries')
                    && fs.pathExistsSync(pth + '\\versions')) && (
                        fs.pathExistsSync(modpack_pth + '\\assets')
                        && fs.pathExistsSync(modpack_pth + '\\libraries')
                        && fs.pathExistsSync(modpack_pth + '\\versions')));
            } else {
                return (fs.readdirSync(pth).length > 0
                    && fs.pathExistsSync(pth + '\\assets')
                    && fs.pathExistsSync(pth + '\\libraries')
                    && fs.pathExistsSync(pth + '\\versions'));
            }
        else return false;
    }

    public libsIntalled(version?: string, modpack?: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                let installed = this.libsIntalledSync(version, modpack);
                resolve(installed);
            } catch (err) {
                log.error(err);
                reject(err)
            }
        })
    }

    //#endregion
    
    //. >>> LIBS
    //#region LIBS ---------------------------------------------------

    public async getLatestLinkToLibs(version?: string): Promise<string> {
        return new Promise((resolve, reject) => {
            nodeFetch(`https://api.github.com/repos/Ektadelta/Encore/tags`, {
                method: 'GET',
            }).then(res => res.json()).then(res => {
                if (res[0].zipball_url) {
                    log.info(res[0].name);
                    resolve(res[0].name);
                }
            }).catch(err => { log.error(err) })
        }).then(res => {
            return `https://github.com/Ektadelta/Encore/releases/download/${res}/Encore-${res}.zip`
        })
    }

    public async downloadLibsArchive(version='1.12', force_download=false): Promise<string> {
        let link = await this.getLatestLinkToLibs(version);
        let folder = await this._modpackManager.ensureLibsDir(version);
        log.info(`[MODPACK] <libs\\${version}> downloading archive...`);

        if (await fs.pathExists(path.join(folder, 'libs.zip')) && !force_download) {
            log.info(`[MODPACK] <libs\\${version}> looks like archive is already downloaded... skipping download.`);
            return path.join(folder, 'libs.zip');
        } else {
            let downloaded_path = await this._downloader.download(
                folder,
                link,
                'libs.zip',
                this._settingsStorage.settings.download_threads,
                (progress: any) => {
                    if (this._downloader.paused) return false;
                    if (progress.status == 'download')
                        this._modpackManager.status = 'download';
                    log.info(progress.percent.toPrecision(2), progress.status);
                    BrowserWindow.getAllWindows()[0]?.webContents.send('modpack-manager-download-progress', progress);
                }
            )

            return downloaded_path;
        }
    }

    public async installLibs(version?: string, force_install=false): Promise<boolean> {
        if (this.busy) return false;
        this.busy = true;
        let folder = await this._modpackManager.ensureLibsDir(version);
        let archive = path.join(folder, 'libs.zip');

        this._modpackManager.status = 'init-install';
        this._modpackManager.downloading_item = 'libs';

        if ((await this.libsIntalled(version)) == false) {
            if ((await fs.pathExists(archive)) == false) {
                archive = await this.downloadLibsArchive(version, force_install);

                if (archive == '') {
                    this.busy = false;
                    return false;
                }
            }
            
            if (this.cancelled) {
                log.info(`[MODPACK] <libs\\${version}> cancelled. skipping instalation...`);
                this._modpackManager.status = 'idle';
                this.cancelled = false;
                this.busy = false;
                return false;
            }

            this._modpackManager.status = 'install';

            log.info(`[MODPACK] <libs\\${version}> unzipping...`);
            try {
                this._modpackManager.status = 'unzipping';

                await extractWithProgress(archive, folder, (progress) => {
                    log.info(`[MODPACK] <libs\\${version}> unzipping: ${progress.percent}`);
                    BrowserWindow.getAllWindows()[0]?.webContents.send('modpack-manager-download-progress', progress);
                }, 250);
                log.info(`[MODPACK] <libs\\${version}> unzipped`);

                this._modpackManager.status = 'post-install';

                if (await fs.pathExists(archive)) await fs.unlink(archive)

                log.info(`[MODPACK] <libs\\${version}> installed`);
                this.busy = false;
                this.cancelled = false;
                return true;
            } catch (err) {
                log.error(`[MODPACK] <libs\\${version}> error occured while unpacking libraries...`);
                this.busy = false;
                this.cancelled = false;
                return false;
            }
        }

        log.info(`[MODPACK] <libs\\${version}> already installed`);
        this.busy = false;
        this.cancelled = false;
        return true;
    }

    public async uninstallLibs(version='1.12') {
        if (this.busy) return false;
        this.busy = true;
        let pth = await this._modpackManager.ensureLibsDir(version);

        if (await fs.pathExists(pth))
            fs.readdir(pth, (err, files) => {
                files.forEach(file => {
                    try {
                        log.info(`<libs\\${version}>`, `removing ${file}...`)
                        if (fs.pathExistsSync(path.join(pth, file))) fs.unlinkSync(path.join(pth, file));
                    } catch (err) {
                        log.info(`<libs\\${version}>`, `${file} is a dir...`)
                        if (fs.pathExistsSync(path.join(pth, file))) rimraf.sync(path.join(pth, file));
                    }
                })
            })
        this.busy = false;
    }

    //#endregion

    //. >>> MODPACKS
    //#region MODPACKS ---------------------------------------------------

    public async getLatestLinkToModpack(modpack_name: string): Promise<string> {
        return new Promise((resolve, reject) => {
            nodeFetch(`https://api.github.com/repos/Ektadelta/${capitalizeFirstLetter(modpack_name)}/tags`, {
                method: 'GET',
            }).then(res => res.json()).then(res => {
                if (res[0].zipball_url) {
                    log.info(res[0].name);
                    resolve(res[0].name);
                }
            }).catch(err => { log.error(err) })
        }).then(res => {
            return `https://github.com/Ektadelta/${capitalizeFirstLetter(modpack_name)}/releases/download/${res}/${capitalizeFirstLetter(modpack_name)}-${res}.zip`
        })
    }

    public async downloadModpackArchive(modpack_name: string, force_download=false) {
        let link = await this.getLatestLinkToModpack(modpack_name);
        let folder = await this._modpackManager.ensureModpackDir(modpack_name);
        log.info(`[MODPACK] <modpack\\${modpack_name}> downloading archive...`);

        if (await fs.pathExists(path.join(folder, 'modpack.zip')) && !force_download) {
            log.info(`[MODPACK] <modpack\\${modpack_name}> looks like archive is already downloaded... skipping download.`);
            return path.join(folder, 'modpack.zip');
        } else {
            let downloaded_path = await this._downloader.download(
                folder,
                link,
                'modpack.zip',
                this._settingsStorage.settings.download_threads,
                (progress: any) => {
                    if (this._downloader.paused) return false;
                    if (this._downloader.downloading && progress.status == 'download')
                        this._modpackManager.status = 'download';
                    log.info(progress.percent.toPrecision(2), progress.status);
                    BrowserWindow.getAllWindows()[0]?.webContents.send('modpack-manager-download-progress', progress);
                }
            )

            return downloaded_path;
        }
    }

    public async installModpack(modpack_name: string, force_install=false) {
        if (this.busy) return false;
        this.busy = true;
        let folder = await this._modpackManager.ensureModpackDir(modpack_name);
        let archive = path.join(folder, 'modpack.zip');

        this._modpackManager.status = 'init-install';
        this._modpackManager.downloading_item = modpack_name;

        if ((await this.modpackInstalled(modpack_name)) == false) {
            if ((await fs.pathExists(archive)) == false) {
                archive = await this.downloadModpackArchive(modpack_name, force_install);

                if (archive == '') {
                    this.busy = false;
                    return false;
                }
            }

            if (this.cancelled) {
                log.info(`[MODPACK] <modpack\\${modpack_name}> cancelled. skipping instalation...`);
                this._modpackManager.status = 'idle';
                this.cancelled = false;
                this.busy = false;
                return false;
            }

            this._modpackManager.status = 'install';

            log.info(`[MODPACK] <modpack\\${modpack_name}> unzipping...`);
            try {
                this._modpackManager.status = 'unzipping';

                await extractWithProgress(archive, folder, (progress) => {
                    log.info(`[MODPACK] <modpack\\${modpack_name}> unzipping: ${progress.percent}`);
                    BrowserWindow.getAllWindows()[0]?.webContents.send('modpack-manager-download-progress', progress);
                }, 250);
                log.info(`[MODPACK] <modpack\\${modpack_name}> unzipped`);

                this._modpackManager.status = 'post-install';

                if (await fs.pathExists(archive)) await fs.unlink(archive)

                log.info(`[MODPACK] <modpack\\${modpack_name}> installed`);
                this._modpackManager.status = 'post-install';
                this.cancelled = false;
                this.busy = false;
                return true;
            } catch (err) {
                log.error(`[MODPACK] <modpack\\${modpack_name}> error occured while unpacking ${modpack_name}...`);
                this._modpackManager.status = 'post-install';
                this.cancelled = false;
                this.busy = false;
                return false;
            }
        }

        log.info(`[MODPACK] <modpack\\${modpack_name}> already installed`);
        this._modpackManager.status = 'post-install';
        this.cancelled = false;
        this.busy = false;
        return true;
    }

    public async uninstallModpack(modpack_name: string) {
        if (this.busy) return false;
        this.busy = true;
        let pth = await this._modpackManager.ensureModpackDir(modpack_name);

        if (await fs.pathExists(pth))
            fs.readdir(pth, (err, files) => {
                files.forEach(file => {
                    try {
                        log.info(`<modpack\\${modpack_name}>`, `removing ${file}...`)
                        if (fs.pathExistsSync(path.join(pth, file))) fs.unlinkSync(path.join(pth, file));
                    } catch (err) {
                        log.info(`<modpack\\${modpack_name}>`, `${file} is a dir...`)
                        if (fs.pathExistsSync(path.join(pth, file))) rimraf.sync(path.join(pth, file));
                    }
                })
            })
        this.busy = false;
    }
    
    //#endregion

    //. >>> ADDONS
    //#region ADDONS ---------------------------------------------------

    public async ensureAddon(addon_name: string): Promise<boolean> {
        log.info(`checking <${addon_name}>....`);
        let addon = this._modpackManager.addons.mods[addon_name] || this._modpackManager.addons.dependencies[addon_name];
        let dir = await this._modpackManager.ensureAddonsDir();
        let pth = path.join(dir, addon.filename);

        this._modpackManager.status = 'init-install';
        this._modpackManager.downloading_item = addon.display_name;

        if (ADDONS_INFO.dependencies[addon_name] || this._modpackManager.addons.preferences[addon_name].enabled) {
            if (await fs.pathExists(pth)) {
                log.info(`<${addon_name}> exists. no need to download`);
                this._modpackManager.status = 'post-install';
                return true;
            } else {
                log.info(`<${addon_name}> doesn't exist. downloading....`);
                log.info(`<${addon_name}> dependencies:`, addon.dependencies);

                if (addon.dependencies.length > 0) {
                    log.info(`<${addon_name}> installing dependencies....`);
                    for (const dependency of addon.dependencies) {
                        await this.ensureAddon(dependency);
                    }
                }

                this._modpackManager.status = 'init-install';
                let downloaded_path = await this._downloader.download(dir, addon.link, addon.filename, 1, (progress) => {
                    if (this._downloader.paused) return false;
                    if (this._downloader.downloading && progress.status == 'download')
                        this._modpackManager.status = 'download';
                    log.info(progress.percent.toPrecision(2), progress.status);
                    BrowserWindow.getAllWindows()[0]?.webContents.send('modpack-manager-download-progress', progress);
                });

                if (downloaded_path == '') {
                    log.info(`[MODPACK] <${addon_name}> download cancelled`);
                    this._modpackManager.status = 'idle';
                    return false;
                }

                this._modpackManager.status = 'post-install';
                return true;
            }
        }

        return true;
    }

    public async ensureAddonsInModpack(modpack: string): Promise<boolean> {
        let addons = this._modpackManager.addons;
        for (const addon_name in addons.preferences) {
            if (addons.preferences[addon_name]) {
                const el = addons.mods[addon_name] || addons.dependencies[addon_name];
                if (addons.preferences[addon_name].enabled) {
                    await this.ensureAddon(addon_name);

                    let dir = await this._modpackManager.ensureModpackDir(modpack);
                    let src = path.join(await this._modpackManager.ensureAddonsDir(), el.filename);
                    let dest = path.join(dir, 'mods', el.filename);
                    log.info(`<addon\\${addon_name}> is enabled. adding:`, src, '->', dest);
                    if ((await fs.pathExists(path.join(dir, 'mods'))) && !(await fs.pathExists(dest))) {
                        await fs.copyFile(src, dest);
                    }
                    for (const dependency of el.dependencies) {
                        log.info(`<addon\\${addon_name}> adding dependency: ${dependency}`);
                        let dependency_src = path.join(await this._modpackManager.ensureAddonsDir(), addons.dependencies[dependency].filename);
                        let dependency_dest = path.join(dir, 'mods', addons.dependencies[dependency].filename);
                        if ((await fs.pathExists(path.join(dir, 'mods'))) && !(await fs.pathExists(dependency_dest))) await fs.copyFile(dependency_src, dependency_dest);
                    }
                } else {
                    let dir = await this._modpackManager.ensureModpackDir(modpack);
                    let dest = path.join(dir, 'mods', el.filename);
                    log.info(`<addon\\${addon_name}> is disabled. removing:`, dest);
                    if (await fs.pathExists(dest)) {
                        await fs.unlink(dest);
                    }
                    for (const dependency of el.dependencies) {
                        log.info(`<addon\\${addon_name}> removing dependency: ${dependency}`);
                        let dependency_pth = path.join(dir, 'mods', addons.dependencies[dependency].filename);
                        if (await fs.pathExists(dependency_pth)) await fs.unlink(dependency_pth);
                    }
                }
            }
        }


        return true; // Libs are present
    }

    //#endregion

}

type TLaunchStages = 'idle' | 'init' | 'lib-gathering' | 'spawning'

class ProcessManager {
    private _settingsStorage: SettingsStorage;
    private _modpackManager: ModpackManager;
    
    public launching = false;
    public launching_stage: TLaunchStages = 'idle';
    public root: string;

    constructor(root: string, modpackManager: ModpackManager, settingsStorage: SettingsStorage) {
        this._settingsStorage = settingsStorage;
        this._modpackManager = modpackManager;
        this.root = root;
    }

    os_version = os.release().split(".")[0];
    launched_modpacks: {
        [key: string]: { process: ChildProcess | undefined, launch_time: Date },
    } = {};
    public async launchModpack(modpack_name: string, min_ram: number, max_ram: number, username: string, uuid: string): Promise<string> {
        return new Promise(async (_resolve, reject) => {
            if (Object.keys(this.launched_modpacks).includes(modpack_name) && this.launched_modpacks[modpack_name] != undefined) {
                reject('already launched');
                return;
            }

            if (this.launching) {
                reject('currently launching');
                return;
            }

            log.info(`[MODPACK] <${modpack_name}> launching...`);
            this.launching = true;
            this.launching_stage = 'init';

            BrowserWindow.getAllWindows()[0]?.webContents.send('modpack-initializing', { modpack_name });

            let game_dir = await this._modpackManager.ensureModpackDir(modpack_name);
            let libs_dir = await this._modpackManager.ensureLibsDir('1.12');

            BrowserWindow.getAllWindows()[0]?.webContents.send('modpack-launching', { modpack_name });

            this.launching_stage = 'lib-gathering';
            let libs_paths = (await this.findAllFiles(libs_dir, '.jar')).join(';');

            console.log("LAUNCHING CODE:")

            let java_path = await this.get_latest_java_version_path(modpack_name);

            let base_command = `-Dos.name="Windows 10" -Dos.version="10.0" -Djava.library.path="${libs_dir}\\versions\\1.12.2-forge-14.23.5.2855\\natives" -cp "${libs_paths}" -Xmn${min_ram * 1024}M -Xmx${max_ram * 1024}M -XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M -Dfml.ignoreInvalidMinecraftCertificates=true -Dfml.ignorePatchDiscrepancies=true -Djava.net.preferIPv4Stack=true -Dminecraft.applet.TargetDirectory="${game_dir}" net.minecraft.launchwrapper.Launch --username ${username} --version 1.12.2-forge-14.23.5.2855 --gameDir "${game_dir}" --assetsDir "${libs_dir}\\assets" --assetIndex 1.12 --uuid ${uuid} --accessToken null --userType mojang --tweakClass net.minecraftforge.fml.common.launcher.FMLTweaker --versionType Forge --width 925 --height 530`
            base_command = this.integrate_java_parameters(base_command);
            let cd_path = game_dir;
            let final_command = `${game_dir[0]}:&&cd "${cd_path}"&&"${java_path}" ${base_command}`;

            log.info(`[MODPACK] <${modpack_name}> final command: ${final_command.replace(uuid, '[redacted by chinese government]')}`);
            
            this.launching_stage = 'spawning';
            let process = spawn(final_command, [], { windowsHide: true, shell: true })

            let window_opened = false;
            process.on('exit', (code, signal) => {
                log.info(`[MODPACK] <${modpack_name}> exit`, code, signal);
                this.launched_modpacks[modpack_name].process = undefined;
                delete this.launched_modpacks[modpack_name]
                this.launching = false;
                this.launched_modpacks = this.launched_modpacks;
                BrowserWindow.getAllWindows()[0]?.webContents.send('modpack-exit', { modpack_name, code, signal });
                _resolve('exited');
                return;
            })

            process.on('error', error => {
                log.error(`[MODPACK] <${modpack_name}> error`, error);
                this.launched_modpacks[modpack_name].process = undefined;
                delete this.launched_modpacks[modpack_name]
                this.launching = false;
                this.launched_modpacks = this.launched_modpacks;
                BrowserWindow.getAllWindows()[0]?.webContents.send('modpack-error', { modpack_name, error });
                _resolve('error');
                return;
            })

            if (this._settingsStorage.settings.modpack_settings.show_console_output)
                process.stdout.on('data', (data) => {
                    BrowserWindow.getAllWindows()[0]?.webContents.send('modpack-data', { modpack_name, data: data.toString() });
                })

            process.stdout.on('data', (data) => {
                if (!window_opened) {
                    if (data.toString().split("Starts to replace vanilla recipe ingredients with ore ingredients.").length > 1) {
                        log.error(`[MODPACK] <${modpack_name}> window opened`);
                        this.launching = false;
                        this.launched_modpacks = this.launched_modpacks;
                        window_opened = true;
                        BrowserWindow.getAllWindows()[0]?.webContents.send('modpack-launched', { modpack_name });
                        _resolve('launched');
                    }
                }
            })

            this.launched_modpacks = {
                ...this.launched_modpacks,
                [modpack_name]: {
                    process: process,
                    launch_time: new Date(),
                }
            }
            this._modpackManager.status = 'idle';
        })
    }

    private __found_paths: string[] = [];
    public findAllFiles(pth: string, looking_for: string): Promise<string[]> {
        this.__found_paths = [];
        return new Promise(async (resolve, reject) => {
            try {
                await this.findAllFiles_rec(pth, looking_for, 64);
                resolve(this.__found_paths);
            } catch (err) {
                reject(err)
            }
        })
    }

    private findAllFiles_rec(pth: string, looking_for: string, steps: number): Promise<void> {
        return new Promise(async (resolve, _) => {
            if (steps <= 0) resolve(undefined);
            let ext = path.extname(pth);
            if (ext == looking_for) {
                this.__found_paths.push(pth);
                resolve(undefined);
            }

            try {
                let files = await fs.readdir(`${pth}`)
                if (files.length < 1) resolve(undefined);
                for (const _pth of files) {
                    await this.findAllFiles_rec(path.join(pth, _pth), looking_for, steps - 1)
                }
            } catch (err) {
                resolve(undefined);
            }

            resolve(undefined);
        })
    }

    private async get_latest_java_version_path(modpack_name: string): Promise<string> {
        let installed_java = await this.get_installed_java_path();
        if (installed_java == "No java found" || this._settingsStorage.settings.modpack_settings.use_builtin_java) {
            if (os.arch() == "x64") {
                const path_to_java = path.join(app.getAppPath().split("app.asar")[0], "\\src\\res\\java\\runtime-windows-x64\\bin\\javaw.exe");
                log.info(`[MODPACK] <${modpack_name}> Using builtin x64-java: ${path_to_java}`);
                return path_to_java;
            } else {
                const path_to_java = path.join(app.getAppPath().split("app.asar")[0], "\\src\\res\\java\\runtime\\bin\\javaw.exe");
                log.info(`[MODPACK] <${modpack_name}> Using builtin x86-java: ${path_to_java}`);
                return path_to_java;
            }
        }

        log.info(`[LAUNCH] Using installed java: ${installed_java}`);
        return installed_java;
    }

    private async get_installed_java_path(): Promise<string> {
        if ((await fs.readdir("C:\\Program Files")).includes("Java")) {
            for (const version of await fs.readdir("C:\\Program Files\\Java")) {
                if (await fs.pathExists(`C:\\Program Files\\Java\\${version}\\bin\\javaw.exe`)) {
                    return `C:\\Program Files\\Java\\${version}\\bin\\javaw.exe`;
                }
            }

            return "No java found";
        } else if ((await fs.readdir("C:\\Program Files (x86)")).includes("Java")) {
            for (const version of await fs.readdir("C:\\Program Files (x86)\\Java")) {
                if (await fs.pathExists(`C:\\Program Files (x86)\\Java\\${version}\\bin\\javaw.exe`)) {
                    return `C:\\Program Files (x86)\\Java\\${version}\\bin\\javaw.exe`;
                }
            }

            return "No java found";
        } else {
            return "No java found";
        }
    }

    private integrate_java_parameters(command: string): string {
        let settings = this._settingsStorage.settings
        let pars = settings.modpack_settings.java_parameters;
        if (pars == '') return command;
        let pars_arr = pars.split(" ");

        for (let parameter of pars_arr) {
            if (parameter.charAt(0) != "-") continue;

            if (parameter.includes("-Xmx")) {
                let par_prototype = `-Xmx${settings.modpack_settings.allocated_memory * 1024}M`;
                command = command.replace(par_prototype, parameter);
                continue;
            } else if (parameter.includes("-Xms")) {
                let par_prototype = `-Xms1000M`;
                command = command.replace(par_prototype, parameter);
                continue;
            } else if (parameter.includes("-username")) {
                continue;
            } else if (parameter.includes("-uuid")) {
                continue;
            } else {
                command += " " + parameter;
            }
        }

        return command;
    }
}