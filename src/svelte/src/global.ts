import type { AuthInterface } from '../../includes/auth-manager'
import type { TStatus, ModpackManager } from '../../includes/modpack-manager'
import type { SettingsInterface } from '../../includes/settings-manager'

import type {IProgress} from '../../includes/downloader';

import { writable } from 'svelte/store';

import type { ipcRenderer } from 'electron';

function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function createGlobal() {
	const { subscribe, set, update } = writable({
        theme: 'light',
        authInterface: undefined as unknown as AuthInterface,
        modpackManager: undefined as unknown as ModpackManager,
        settingsManager: undefined as unknown as SettingsInterface,
        ipcRenderer: {
            send: undefined as unknown as typeof ipcRenderer.send,
            sendSync: undefined as unknown as typeof ipcRenderer.sendSync,
            on: undefined as unknown as typeof ipcRenderer.on,
            once: undefined as unknown as typeof ipcRenderer.once,
            removeAllListeners: undefined as unknown as typeof ipcRenderer.removeAllListeners,
        },
        state: 'idle' as TStatus,
        download_progress: {
            percent: 0,
            total_size: 0,
            received_size: 0,
            status: 'idle',
        } as IProgress & {
            speed: number,
            on_thread: number,
            threads: number,
        },
    });

    let obj = {
        subscribe,
        set,
        update,
        capitalizeFirstLetter,
        LOADING_SPAN: '<span class="loading"><p>.</p><p>.</p><p>.</p></span>',
        shell: {
            showItemInFolder: async (path: string) => {},
            openPath: async (path: string) => {},
            openExternal: async (url: string) => {}
        },
        app: {
            version: 'undetected',
            os: undefined as any,
        },
        dialog: {
            showOpenDialog: async (options: any): Promise<any> => {}
        },
        path: {
            normalize: (p: string): string => {return ''},
            join: (...paths: string[]): string => {return ''},
        },
        overlay: {
            show: (title?: string, p?: string, _loading=false) => {console.warn('overlay not ready')},
            hide: () => {console.warn('overlay not ready')},
        },
        askOverlay: {
            ask: (title: string, options: {[key: string]: {body: string, type?: string}}, p?:string): Promise<string> | void => {console.warn('overlay not ready')},
        },
        selectOverlay: {
            select: (title: string, options: {[key: string]: string}, p?: string): Promise<string> | void => {console.warn('overlay not ready')},
        }
    };

    return obj;
}

export const global = createGlobal();