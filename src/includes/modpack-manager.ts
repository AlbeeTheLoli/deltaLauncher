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
enum GRAPHICS_LEVELS {
    LOW, // new directory: -> _MIN
    MINOR, // ->  _LOW 
    DEFAULT, // -> _DEFAULT
    HIGH, // -> _HIGH
    ULTRA // _ULTRA
}

import { MODPACK_INFO, ADDONS_INFO, IAddonInfo } from './modpack.info';

export class ModpackManager {
    private __fs: undefined | typeof fs = undefined;
    private _graphics_level = GRAPHICS_LEVELS.DEFAULT;
    private _root = '';
    private _modpacks: any;
    private _libs: any;
    private _resources: any;
    private _settingsStorage: SettingsStorage;
    private log_location = log.transports.file.getFile().path.split('\\main.log')[0];

    private _selected_modpack = Object.keys(MODPACK_INFO)[0];

    public sha = '';
    public set modpack(to: any) {
        this._selected_modpack = to;
        this._settingsStorage.settings.on_modpack = to;
    }

    public get modpack() {
        return this._selected_modpack;
    }

    public downloader: Downloader;

    public constructor(remote: typeof rmt, root: string, settingsStorage: SettingsStorage) {
        log.info('init');

        this._settingsStorage = settingsStorage;
        this._root = root;
        this.ensureRoot();

        this.updateLibsDirs();
        this.updateModpackDirs();
        this.updateResourcesDirs();
        this.ensureAddonsDir();

        this.downloader = new Downloader();

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

            this._modpacks[mdpck].installed = this.modpackInstalledSync(mdpck);
        }

        this.ensureModpackDirs();
    }

    public updateLibsDirs(): void {
        this._libs = {
            path: path.normalize(path.join(this._settingsStorage.settings.modpacks.libs.path.replace(/%ROOT%/g, this._root))),
            '1.12': {
                link: '',
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

    public get addons(): {
        path: string,
        preferences: { [key: string]: { enabled: boolean } },
        mods: typeof ADDONS_INFO.mods,
        dependencies: typeof ADDONS_INFO.mods,

    } {
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

    public modpackInstalledSync(modpack: string): boolean {
        let pth = this.ensureModpackDirSync(modpack);
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

    public libsIntalledSync(version: string, modpack?: string): boolean {
        let pth = this._libs[version].path;
        if (fs.pathExistsSync(pth))
            if (modpack) {
                let modpack_pth = this._modpacks[modpack].path;
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

    public libsIntalled(version: string, modpack?: string): Promise<boolean> {
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

    public async ensureLibsDir(libs_version?: string): Promise<string> {
        if (libs_version) {
            let pth = this.libs[libs_version].path;
            await fs.ensureDir(pth)
            return pth;
        } else {
            let pth = this.libs.path;
            await fs.ensureDir(pth)
            return pth;
        }
    }

    public async ensureAddonsDir() {
        let pth = path.normalize(this.addons.path);
        await fs.ensureDir(pth)
        return pth;
    }

    public async ensureModpackDirs(): Promise<void> {
        for (const modpack_key in this.modpacks) {
            const modpack = this.modpacks[modpack_key];
            await fs.ensureDir(path.normalize(modpack.path))
        }
    }

    public async isFirstLaunch(modpack: string): Promise<boolean> {
        return await fs.pathExists((await this.ensureModpackDir(modpack)) + '\\.mixin.out');
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

    public async getLatestLinkToLibs(): Promise<string> {
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

    public async clearLibsDir(version?: string): Promise<void> {
        let pth = '';
        if (version) {
            console.log(version);
            pth = this.libs[version].path;
        } else {
            pth = this.libs.path;
        }

        if (await fs.pathExists(pth))
            fs.readdir(pth, (err, files) => {
                files.forEach(file => {
                    if (file.toString().split('.').length > 1 && file.toString() != '.mixin.out' && file.toString() != '.git') {
                        if (fs.pathExistsSync(path.join(pth, file))) fs.unlinkSync(path.join(pth, file));
                    }
                    else {
                        if (fs.pathExistsSync(path.join(pth, file))) rimraf.sync(path.join(pth, file));
                    }
                })
            })
    }

    public async clearModpackDir(modpack_name: string): Promise<void> {
        let pth = await this.ensureModpackDir(modpack_name);
        if (await fs.pathExists(pth))
            fs.readdir(pth, (err, files) => {
                log.info(`<${modpack_name}>`, `[ ${ files.join(', ')} ]`)
                files.forEach(file => {
                    try {
                        log.info(`<${modpack_name}>`, `removing ${file}...`)
                        if (fs.pathExistsSync(path.join(pth, file))) fs.unlinkSync(path.join(pth, file));
                    } catch (err) {
                        log.info(`<${modpack_name}>`, `${file} is a dir...`)
                        if (fs.pathExistsSync(path.join(pth, file))) rimraf.sync(path.join(pth, file));
                    }
                })
            })
    }

    public async ensureModpackLibs(modpack: string): Promise<boolean> {
        let version = this.modpacks[modpack].libs_version;
        if (!(await this.libsIntalled(version))) {
            console.log('downloading libs:', version);
            await this.downloadLibs(modpack);

            return false; // Libs were downloaded
        }

        return true; // Libs are present
    }

    public async ensureAddon(addon_name: string): Promise<boolean> {
        log.info(`checking <${addon_name}>....`);
        let addon = this.addons.mods[addon_name] || this.addons.dependencies[addon_name];
        let dir = await this.ensureAddonsDir();
        let pth = path.join(dir, addon.filename);

        if (ADDONS_INFO.dependencies[addon_name] || this.addons.preferences[addon_name].enabled) {
            if (await fs.pathExists(pth)) {
                log.info(`<${addon_name}> exists. no need to download`);
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

                BrowserWindow.getAllWindows()[0]?.webContents.send('download-started', addon_name);
                let downloaded_path = await this.downloader.download(dir, addon.link, addon.filename, 2, (progress) => {
                    if (this.downloader.paused) return false;
                    log.info(progress.percent.toPrecision(2), progress.status);
                    BrowserWindow.getAllWindows()[0]?.webContents.send('download-progress', progress);
                })

                if (downloaded_path == '') {
                    log.info(`[MODPACK] <${addon_name}> download cancelled`);
                    BrowserWindow.getAllWindows()[0]?.webContents.send('download-cancelled');
                    return false;
                }

                BrowserWindow.getAllWindows()[0]?.webContents.send('moving-libs-finished', addon_name);

                return true;
            }
        }

        return true;
    }

    public async ensureAddons(modpack: string): Promise<boolean> {
        let addons = this.addons;
        for (const addon_name in addons.preferences) {
            if (addons.preferences[addon_name]) {
                const el = addons.mods[addon_name] || addons.dependencies[addon_name];
                if (addons.preferences[addon_name].enabled) {
                    await this.ensureAddon(addon_name);

                    let dir = await this.ensureModpackDir(modpack);
                    let src = path.join(await this.ensureAddonsDir(), el.filename);
                    let dest = path.join(dir, 'mods', el.filename);
                    log.info(`<${addon_name}> is enabled. adding:`, src, '->', dest);
                    if (!(await fs.pathExists(dest))) {
                        if (await fs.pathExists('')) await fs.copyFile(src, dest);
                    }
                    for (const dependency of el.dependencies) {
                        log.info('<'+addon_name+'>', 'adding dependency: ', dependency);
                        let dependency_src = path.join(await this.ensureAddonsDir(), addons.dependencies[dependency].filename);
                        let dependency_dest = path.join(dir, 'mods', addons.dependencies[dependency].filename);
                        if (!(await fs.pathExists(dependency_dest))) await fs.copyFile(dependency_src, dependency_dest);
                    }
                } else {
                    let dir = await this.ensureModpackDir(modpack);
                    let dest = path.join(dir, 'mods', el.filename);
                    log.info(`<${addon_name}> is disabled. removing:`, dest);
                    if (await fs.pathExists(dest)) {
                        await fs.unlink(dest);
                    }
                    for (const dependency of el.dependencies) {
                        log.info('<'+addon_name+'>', 'removing dependency: ', dependency);
                        let dependency_pth = path.join(dir, 'mods', addons.dependencies[dependency].filename);
                        if (await fs.pathExists(dependency_pth)) await fs.unlink(dependency_pth);
                    }
                }
            }
        }


        return true; // Libs are present
    }


    public async ensureModpackEnvironment(modpack: string): Promise<boolean> {
        let dir = await this.ensureModpackDir(modpack);
        let libs_exist = await this.ensureModpackLibs(modpack);
        let add_ons_present = this.modpacks[modpack].installed && await this.ensureAddons(modpack);

        BrowserWindow.getAllWindows()[0]?.webContents.send('moving-libs-finished');

        return libs_exist && add_ons_present; // Everything is fine
    }

    //! BETA-TESTING ONLY.
    //! BETA-TESTING ONLY.

    public async downloadSHA(folder: string, repos: string, sha: string, owner='Ektadelta'): Promise<string> {
        await fs.ensureDirSync(folder);
        let _downloaded_path = '';

        if (await fs.pathExists(path.join(folder, `${sha}.zip`))) {
            log.info('[SHA] Are you sure in what are you doing?');
        } else {
            BrowserWindow.getAllWindows()[0]?.webContents.send('download-started', sha);
            let link = `https://github.com/${owner}/${repos}/archive/${sha}.zip`;
            _downloaded_path = await this.downloader.download(
                folder,
                link,
                `modpack.zip`,
                1,
                (progress: any) => {
                    if (this.downloader.paused) return;
                    log.info(progress.percent.toPrecision(2), progress.status);
                    BrowserWindow.getAllWindows()[0]?.webContents.send('download-progress', progress);
                }
            )
            if (_downloaded_path == '') {
                log.info('[SHA] download cancelled.');
                return '';
            }
        }

        BrowserWindow.getAllWindows()[0]?.webContents.send('download-finished');
        return _downloaded_path;
    }

    //! BETA-TESTING ONLY.
    //! BETA-TESTING ONLY.

    public async downloadLibs(modpack_name: string, force_download = false): Promise<boolean> {
        let version = this.modpacks[modpack_name].libs_version;
        let folder = await this.ensureLibsDir(version);
        await this.clearLibsDir(version);
        if (await fs.pathExists(path.join(folder, 'libs.zip')) && !force_download) {
            log.info('[MODPACK] <libs> looks like archive is already downloaded... skipping download.');
        } else {
            BrowserWindow.getAllWindows()[0]?.webContents.send('download-started', 'libs');
            this._libs[version].link = await this.getLatestLinkToLibs();
            let downloaded_path = await this.downloader.download(
                folder,
                this.libs[version].link,
                'libs.zip',
                this._settingsStorage.settings.download_threads,
                (progress: any) => {
                    if (this.downloader.paused) return false;
                    log.info(progress.percent.toPrecision(2), progress.status);
                    BrowserWindow.getAllWindows()[0]?.webContents.send('download-progress', progress);
                }
            )
            if (downloaded_path == '') {
                log.info('[MODPACK] <libs> download cancelled');
                return false;
            }
        }

        BrowserWindow.getAllWindows()[0]?.webContents.send('download-finished');
        await this.processLibs(folder, modpack_name);
        return true;
    }

    public async processLibs(folder: string, modpack_name: string): Promise<boolean> {
        log.info('[MODPACK] <libs> unzipping...');
        try {
            await extract(path.join(folder, 'libs.zip'), { dir: folder })
            BrowserWindow.getAllWindows()[0]?.webContents.send('unzipping-finished');
            log.info('[MODPACK] <libs> success');

            if (await fs.pathExists(path.join(folder, 'libs.zip'))) await fs.unlink(path.join(folder, 'libs.zip'))
            BrowserWindow.getAllWindows()[0]?.webContents.send('libs-downloaded');
            return true;
        } catch (err) {
            log.error('[MODPACK] <libs> Error occured while unpacking libraries...');
            return false;
        }
    }

    // await this.downloadSHA(folder, `${capitalizeFirstLetter(modpack_name)}`, this.sha);

    public async downloadModpack(modpack_name: string, force_download = false): Promise<boolean> {
        if (this.modpacks[modpack_name].installed) return true;

        let folder = await this.ensureModpackDir(modpack_name);
        await this.clearModpackDir(modpack_name);
        if (await fs.pathExists(path.join(folder, 'modpack.zip')) && !force_download) {
            log.info(`[MODPACK] <${modpack_name}> looks like archive is already downloaded... skipping download.`);
            return true;
        } else {
            this._modpacks[modpack_name].link = await this.getLatestLinkToModpack(modpack_name);
            BrowserWindow.getAllWindows()[0]?.webContents.send('download-started', modpack_name);
            let downloaded_path = await this.downloader.download(
                folder,
                this.modpacks[modpack_name].link,
                'modpack.zip',
                this._settingsStorage.settings.download_threads,
                (progress: any) => {
                    if (this.downloader.paused) return false;
                    log.info(progress.percent.toPrecision(2), progress.status);
                    BrowserWindow.getAllWindows()[0]?.webContents.send('download-progress', progress);
                }
            )

            if (downloaded_path == '') {
                log.info(`[MODPACK] <${modpack_name}> download cancelled`);
                BrowserWindow.getAllWindows()[0]?.webContents.send('download-cancelled');
                return false;
            }
        }

        return true;
    }

    public async installModpack(modpack_name: string, force_download = false): Promise<boolean> {
        if (this.modpacks[modpack_name].installed) return true;
        this.ensureModpackEnvironment(modpack_name);

        let folder = await this.ensureModpackDir(modpack_name);
        await this.clearModpackDir(modpack_name);
        if (await fs.pathExists(path.join(folder, 'modpack.zip')) && !force_download) {
            log.info(`[MODPACK] <${modpack_name}> looks like archive is already downloaded... skipping download.`);
        } else {
            if (this.sha) {
                await this.downloadSHA(folder, `${capitalizeFirstLetter(modpack_name)}`, this.sha);
            } else {
                await this.downloadModpack(modpack_name);
            }
        }

        if (this.sha) {
            BrowserWindow.getAllWindows()[0]?.webContents.send('download-finished', modpack_name);
            await this.unzipModpack(folder, modpack_name);

            if (await fs.pathExists(path.join(folder, `${capitalizeFirstLetter(modpack_name)}-${this.sha}`))) {
                let src = path.join(folder, `${capitalizeFirstLetter(modpack_name)}-${this.sha}`);
                let dest = folder;
                await copyWithProgress(src, dest, (progress: any) => {
                    log.info(progress);
                    BrowserWindow.getAllWindows()[0]?.webContents.send('moving-libs-progress', {
                        percent: progress.progress * 100
                    });
                }, 250);
            } else {
                let download_contents = await fs.readdir(folder);
                log.info(download_contents);
                if (await fs.pathExists(path.join(download_contents[0], 'mods'))) {
                    log.info('found mods folder in downloaded files... probably already a modpack so won\' copy')
                } else {
                    let src = path.join(folder, `${capitalizeFirstLetter(modpack_name)}-${this.sha}`);
                    let dest = folder;
                    await copyWithProgress(src, dest, (progress: any) => {
                        log.info(progress);
                        BrowserWindow.getAllWindows()[0]?.webContents.send('moving-libs-progress', {
                            percent: progress.progress * 100
                        });
                    }, 250);
                }
            }

            BrowserWindow.getAllWindows()[0]?.webContents.send('unzipping-finished');
        } else {
            BrowserWindow.getAllWindows()[0]?.webContents.send('download-finished', modpack_name);
            await this.unzipModpack(folder, modpack_name); 
            BrowserWindow.getAllWindows()[0]?.webContents.send('unzipping-finished');
        }
        // BrowserWindow.getAllWindows()[0]?.webContents.send('moving-libs-start');
        // await this.moveLibs(modpack_name);
        this.modpacks[modpack_name].installed = true;
        BrowserWindow.getAllWindows()[0]?.webContents.send('modpack-downloaded', modpack_name);

        return true;
    }

    public async clearModpackArchive(modpack_name: string): Promise<boolean> {
        let fldr = path.join(await this.ensureModpackDir(modpack_name), 'modpack.zip');
        if (await fs.pathExists(fldr)) fs.access(fldr, fs.constants.W_OK, async (err) => {
            if (err) {
                log.error(err);
                return false;
            }

            await fs.unlink(fldr);
            return true;
        })
        return false;
    }

    public unzipModpack(folder: string, modpack_name: string): Promise<boolean> {
        log.info(`[MODPACK] <${modpack_name}> unzipping...`);
        return new Promise(async (resolve, reject) => {
            try {
                let fldr = path.join(folder, 'modpack.zip');
                await extract(fldr, { dir: folder });
                let interval = setInterval(async () => {
                    try {
                        await this.clearModpackArchive(modpack_name);
                        clearInterval(interval);
                        resolve(true);
                    } catch (err) { }
                }, 1000)
            } catch (err) {
                log.error('Error occured while unpacking modpack...');
                reject(err);
            }
        })
    }

    public async moveLibs(modpack_name: string): Promise<boolean> {
        try {
            let libs_version = this.modpacks[modpack_name].libs_version;
            let modpack_path = this.modpacks[modpack_name].path;
            log.info(`[MODPACK] <${modpack_name}> moving libs...`);

            log.info('[MODPACK] Moving: libraries...');
            if (!(await fs.pathExists(modpack_path + '\\libraries'))) {
                await fs.ensureDir(modpack_path + '\\libraries');
                await copyWithProgress(path.join(this.libs[libs_version].path, 'libraries'), path.join(modpack_path, 'libraries'),
                    (progress: any) => {
                        BrowserWindow.getAllWindows()[0]?.webContents.send('moving-libs-progress', {
                            percent: progress.progress * 30
                        });
                    },
                    250,
                );
            }
            BrowserWindow.getAllWindows()[0]?.webContents.send('moving-libs-progress', {
                percent: 30
            });

            log.info('[MODPACK] Moving: assets...');
            if (!(await fs.pathExists(modpack_path + '\\assets'))) {
                await fs.ensureDir(modpack_path + '\\assets');
                await copyWithProgress(path.join(this.libs[libs_version].path, 'assets'), path.join(modpack_path, 'assets'),
                    (progress: any) => {
                        BrowserWindow.getAllWindows()[0]?.webContents.send('moving-libs-progress', {
                            percent: 30 + (progress.progress * 35)
                        });
                    },
                    250,
                );
            }

            BrowserWindow.getAllWindows()[0]?.webContents.send('moving-libs-progress', {
                percent: 65
            });

            log.info('[MODPACK] Moving: versions...');
            if (!(await fs.pathExists(modpack_path + '\\versions'))) {
                await fs.ensureDir(modpack_path + '\\versions');
                await copyWithProgress(path.join(this.libs[libs_version].path, 'versions'), path.join(modpack_path, 'versions'),
                    (progress: any) => {
                        BrowserWindow.getAllWindows()[0]?.webContents.send('moving-libs-progress', {
                            percent: 65 + (progress.progress * 35)
                        });
                    },
                    250,
                );
            }

            BrowserWindow.getAllWindows()[0]?.webContents.send('moving-libs-progress', {
                percent: 100
            });
            BrowserWindow.getAllWindows()[0]?.webContents.send('moving-libs-finished', modpack_name);
            return true;
        } catch (err) {
            console.error(err)
            return false;
        }
    }

    public async getLibsPathsFromJson(): Promise<string[]> {
        let pth = await this.ensureLibsDir('1.12');
        let json = JSON.parse(fs.readFileSync(path.join(pth, 'versions', 'Forge-1.12.2', 'Forge-1.12.2.json')).toString())
        let paths: string[] = [];
        for (const lib_obj of json.libraries) {
            if (lib_obj.classifies != undefined) {
                let platform = os.platform();
                let _pth = '';

                if (platform == 'win32' && lib_obj.classifies['windows']) _pth = path.join(pth, 'libraries', lib_obj.classifies['windows'].path);
                if (platform == 'darwin' && lib_obj.classifies['osx']) _pth = path.join(pth, 'libraries', lib_obj.classifies['osx'].path);
                if (platform == 'linux' && lib_obj.classifies['linux']) _pth = path.join(pth, 'libraries', lib_obj.classifies['linux'].path);

                if (await fs.pathExists(_pth)) paths.push(_pth)
            }

            if (lib_obj.artifact != undefined) {
                let _pth = path.join(pth, 'libraries', lib_obj.artifact.path);
                if (await fs.pathExists(_pth)) paths.push(_pth)
            }
        }

        return paths;
    }

    os_version = os.release().split(".")[0];
    launched_modpacks: {
        [key: string]: { process: ChildProcess },
    } = {};
    public async launchModpack(modpack_name: string, min_ram: number, max_ram: number, username: string, uuid: string): Promise<string> {
        return new Promise(async (_resolve, reject) => {
            if (Object.keys(this.launched_modpacks).includes(modpack_name) && this.launched_modpacks[modpack_name] != undefined) {
                reject('already launched');
                return;
            }

            log.info(`[MODPACK] <${modpack_name}> launching...`);

            BrowserWindow.getAllWindows()[0]?.webContents.send('modpack-initializing', { modpack_name });

            let game_dir = await this.ensureModpackDir(modpack_name);
            let libs_dir = await this.ensureLibsDir('1.12');

            BrowserWindow.getAllWindows()[0]?.webContents.send('modpack-launching', { modpack_name });

            let libs_paths = await (await this.findAllFiles(libs_dir, '.jar')).join(';');

            console.log("LAUNCHING CODE:")

            let java_path = await this.get_latest_java_version_path(modpack_name);

            let base_command = `-Dos.name="Windows 10" -Dos.version="10.0" -Djava.library.path="${libs_dir}\\versions\\1.12.2-forge-14.23.5.2855\\natives" -cp "${libs_paths}" -Xmn${min_ram * 1024}M -Xmx${max_ram * 1024}M -XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M -Dfml.ignoreInvalidMinecraftCertificates=true -Dfml.ignorePatchDiscrepancies=true -Djava.net.preferIPv4Stack=true -Dminecraft.applet.TargetDirectory="${game_dir}" net.minecraft.launchwrapper.Launch --username ${username} --version 1.12.2-forge-14.23.5.2855 --gameDir "${game_dir}" --assetsDir "${libs_dir}\\assets" --assetIndex 1.12 --uuid ${uuid} --accessToken null --userType mojang --tweakClass net.minecraftforge.fml.common.launcher.FMLTweaker --versionType Forge --width 925 --height 530`
            base_command = this.integrate_java_parameters(base_command);
            let cd_path = game_dir;
            let final_command = `${game_dir[0]}:&&cd "${cd_path}"&&"${java_path}" ${base_command}`;

            log.info(`[MODPACK] <${modpack_name}> final command: ${final_command}`);
            
            let process = spawn(final_command, [], { windowsHide: true, shell: true })

            let window_opened = false;
            process.on('exit', (code, signal) => {
                log.info(`[MODPACK] <${modpack_name}> exit`, code, signal);
                delete this.launched_modpacks[modpack_name]
                BrowserWindow.getAllWindows()[0]?.webContents.send('modpack-exit', { modpack_name, code, signal });
                _resolve('exited');
                return;
            })

            process.on('error', error => {
                log.error(`[MODPACK] <${modpack_name}> error`, error);
                delete this.launched_modpacks[modpack_name]
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
                }
            }
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
                let files = fs.readdirSync(`${pth}`)
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