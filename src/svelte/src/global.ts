import type { AuthInterface } from '../../includes/auth-manager'
import type { ModpackManager } from '../../includes/modpack-manager'
import type { SettingsInterface } from '../../includes/settings-manager'

import { writable } from 'svelte/store';

function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function createGlobal() {
	const { subscribe, set, update } = writable({
        theme: 'light',
        modpack: 'fabrica',
        authInterface: undefined as AuthInterface,
        modpackManager: undefined as ModpackManager,
        settingsManager: undefined as SettingsInterface,
    });

    let obj = {
        subscribe,
        set,
        update,
        capitalizeFirstLetter,
        app: {
            version: 'undetected',
            os: undefined as any,
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