export interface IModpackInfo {
    libs_version: string,
    link: string,
    ip: string,
}

export interface IAddonInfo {
    default_enabled: boolean,
    filename: string,
    link: string,
    dependencies: string[],
    incompatable_modpacks: string[],
}

export const MODPACK_INFO: {[key: string]: IModpackInfo} = {
    // 'magicae': {
    //     link: '',
    //     libs_version: '1.12',
    //     ip: '',
    // },
    // 'fabrica': {
    //     link: '',
    //     libs_version: '1.12',
    //     ip: '',
    // },
    'statera': {
        link: '',
        libs_version: '1.12',
        ip: '',
    },
    'insula': {
        link: '',
        libs_version: '1.12',
        ip: '',
    },
}

export const ADDONS_INFO: { mods: { [key: string]: IAddonInfo }, dependencies: { [key: string]: IAddonInfo } } = {
    mods: {
        'DynamicSurroundings': {
            default_enabled: false,
            filename: 'DynamicSurroundings-1.12.2-3.6.2.1.jar',
            link: 'https://github.com/Ektadelta/Addition/raw/main/mods/DynamicSurroundings-1.12.2-3.6.2.1.jar',
            dependencies: [ 'OreLib' ],
            incompatable_modpacks: [ 'statera' ],
        },
        'MoBends': {
            default_enabled: false,
            filename: 'MoBends_1.12.2-1.0.0-beta-20.06.20.jar',
            link: 'https://github.com/Ektadelta/Addition/raw/main/mods/MoBends_1.12.2-1.0.0-beta-20.06.20.jar',
            dependencies: [ 'mclib' ],
            incompatable_modpacks: [ ],
        },
        'Aperture': {
            default_enabled: false,
            filename: 'aperture-1.5-1.12.2.jar',
            link: 'https://github.com/Ektadelta/Addition/raw/main/mods/aperture-1.5-1.12.2.jar',
            dependencies: [],
            incompatable_modpacks: [ ],
        },
    },
    dependencies: {
        'OreLib': {
            default_enabled: false,
            filename: 'OreLib-1.12.2-3.6.0.1.jar',
            link: 'https://github.com/Ektadelta/Addition/raw/main/mods/OreLib-1.12.2-3.6.0.1.jar',
            dependencies: [ ],
            incompatable_modpacks: [ ],
        },
        'mclib': {
            default_enabled: false,
            filename: 'mclib-2.1.2-1.12.2.jar',
            link: 'https://github.com/Ektadelta/Addition/raw/main/mods/mclib-2.1.2-1.12.2.jar',
            dependencies: [ ],
            incompatable_modpacks: [ ],
        },
    }
}