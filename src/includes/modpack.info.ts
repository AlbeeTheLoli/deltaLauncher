export interface IModpackInfo {
    libs_version: string,
    link: string,
    ip: string,
    min_ram: number,
    recommended_ram: number,
}

export interface IAddonInfo {
    display_name: string,
    default_enabled: boolean,
    filename: string,
    link: string,
    dependencies: string[],
    incompatable_modpacks: string[],
}

export const MODPACK_INFO: {[key: string]: IModpackInfo} = {
    'magicae': {
        link: '',
        libs_version: '1.12',
        ip: '',

        min_ram: 6,
        recommended_ram: 10,
    },
    'fabrica': {
        link: '',
        libs_version: '1.12',
        ip: '',

        min_ram: 6,
        recommended_ram: 10,
    },
    'statera': {
        link: '',
        libs_version: '1.12',
        ip: '',

        min_ram: 6,
        recommended_ram: 10,
    },
    'insula': {
        link: '',
        libs_version: '1.12',
        ip: '',

        min_ram: 6,
        recommended_ram: 10,
    },
}

export const ADDONS_INFO: { mods: { [key: string]: IAddonInfo }, dependencies: { [key: string]: IAddonInfo } } = {
    mods: {
        'dynamicSurroundings': {
            display_name: 'Dynamic Surroundings',
            default_enabled: false,
            filename: 'DynamicSurroundings-1.12.2-3.6.2.1.jar',
            link: 'https://github.com/Ektadelta/Addition/raw/main/mods/DynamicSurroundings-1.12.2-3.6.2.1.jar',
            dependencies: [ 'oreLib' ],
            incompatable_modpacks: [ ],
        },
        'moBends': {
            display_name: 'Mo\' Bends',
            default_enabled: false,
            filename: 'MoBends_1.12.2-1.0.0-beta-20.06.20.jar',
            link: 'https://github.com/Ektadelta/Addition/raw/main/mods/MoBends_1.12.2-1.0.0-beta-20.06.20.jar',
            dependencies: [ 'mcLib' ],
            incompatable_modpacks: [ ],
        },
        'aperture': {
            display_name: 'Aperture',
            default_enabled: false,
            filename: 'aperture-1.5-1.12.2.jar',
            link: 'https://github.com/Ektadelta/Addition/raw/main/mods/aperture-1.5-1.12.2.jar',
            dependencies: [],
            incompatable_modpacks: [ ],
        },
        'optifine': {
            display_name: 'Optifine',
            default_enabled: true,
            filename: 'preview_OptiFine_1.12.2_HD_U_G6_pre1.jar',
            link: 'https://github.com/Ektadelta/Addition/raw/main/mods/preview_OptiFine_1.12.2_HD_U_G6_pre1.jar',
            dependencies: [],
            incompatable_modpacks: [ ],
        },
        'jei': {
            display_name: 'JEI',
            default_enabled: true,
            filename: 'jei_1.12.2-4.16.1.302.jar',
            link: 'https://github.com/Ektadelta/Addition/raw/main/mods/jei/jei_1.12.2-4.16.1.302.jar',
            dependencies: [ 'jeiThaumic', 'jeiBees', 'jeiIntegration', 'jeiHarvestcraft', 'jeiVillagers', 'jeiTinker', 'jeiResources' ],
            incompatable_modpacks: [ ],
        },
    },
    dependencies: {
        'oreLib': {
            display_name: 'OreLib',
            default_enabled: false,
            filename: 'OreLib-1.12.2-3.6.0.1.jar',
            link: 'https://github.com/Ektadelta/Addition/raw/main/mods/OreLib-1.12.2-3.6.0.1.jar',
            dependencies: [ ],
            incompatable_modpacks: [ ],
        },
        'mcLib': {
            display_name: 'Mclib',
            default_enabled: false,
            filename: 'mclib-2.1.2-1.12.2.jar',
            link: 'https://github.com/Ektadelta/Addition/raw/main/mods/mclib-2.1.2-1.12.2.jar',
            dependencies: [ ],
            incompatable_modpacks: [ ],
        },
        'jeiThaumic': {
            display_name: 'ThaumicJEI',
            default_enabled: false,
            filename: 'ThaumicJEI-1.12.2-1.6.0-27.jar',
            link: 'https://github.com/Ektadelta/Addition/raw/main/mods/jei/ThaumicJEI-1.12.2-1.6.0-27.jar',
            dependencies: [ ],
            incompatable_modpacks: [ ],
        },
        'jeiBees': {
            display_name: 'Jeibees',
            default_enabled: false,
            filename: 'jeibees-0.9.0.5-mc1.12.2.jar',
            link: 'https://github.com/Ektadelta/Addition/raw/main/mods/jei/jeibees-0.9.0.5-mc1.12.2.jar',
            dependencies: [ ],
            incompatable_modpacks: [ ],
        },
        'jeiIntegration': {
            display_name: 'JeiIntegration',
            default_enabled: false,
            filename: 'jeiintegration_1.12.2-1.6.0.jar',
            link: 'https://github.com/Ektadelta/Addition/raw/main/mods/jei/jeiintegration_1.12.2-1.6.0.jar',
            dependencies: [ ],
            incompatable_modpacks: [ ],
        },
        'jeiVillagers': {
            display_name: 'JeiVillagers',
            default_enabled: false,
            filename: 'jeivillagers-1.12-1.0.2.jar',
            link: 'https://github.com/Ektadelta/Addition/raw/main/mods/jei/jeivillagers-1.12-1.0.2.jar',
            dependencies: [ ],
            incompatable_modpacks: [ ],
        },
        'jeiHarvestcraft': {
            display_name: 'JustEnoughHarvestcraft',
            default_enabled: false,
            filename: 'just-enough-harvestcraft-1.12.2-1.7.2.jar',
            link: 'https://github.com/Ektadelta/Addition/raw/main/mods/jei/just-enough-harvestcraft-1.12.2-1.7.2.jar',
            dependencies: [ ],
            incompatable_modpacks: [ ],
        },
        'jeiTinker': {
            display_name: 'tinkersjei',
            default_enabled: false,
            filename: 'tinkersjei-1.2.jar',
            link: 'https://github.com/Ektadelta/Addition/raw/main/mods/jei/tinkersjei-1.2.jar',
            dependencies: [ ],
            incompatable_modpacks: [ ],
        },
        'jeiResources': {
            display_name: 'JustEnoughResources',
            default_enabled: false,
            filename: 'JustEnoughResources-1.12.2-0.9.2.60.jar',
            link: 'https://github.com/Ektadelta/Addition/raw/main/mods/jei/JustEnoughResources-1.12.2-0.9.2.60.jar',
            dependencies: [ ],
            incompatable_modpacks: [ ],
        },
    }
}