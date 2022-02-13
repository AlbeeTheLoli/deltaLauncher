<script lang='ts'>
    import DropMenu from './DropMenu.svelte';
    import { global } from '../../src/global'

    let PRESS_COOLDOWN = 200;
    let pressed = false;
    let ISubButtons: {toggle: boolean, checked?: boolean, h1: string, onclick?: (checked?: boolean) => void, p?: string, onchange?: (checked?: boolean) => void}[];

    //@ts-expect-error
    let max_ram = window.max_setable_ram;
    $: mem = $global.settingsManager.settings.modpack_settings.allocated_memory;

    $: status = $global.state;

    let locked = false;
    $: _locked = ((max_ram < 6) || (max_ram - 6) < 0) ? (true) : ((states[btn_state].locked) ? true : locked);
    let paused = false;
    $: btn_state = (status == 'unzipping' || status == 'post-install' || status == 'ensure-env' || status == 'moving-libs') ? 'post-download' : status == 'init-install' ? 'init-download' : status == 'download' ? (paused ? 'paused' : 'downloading') : ($global.modpackManager.modpacks[$global.modpackManager.modpack].installed ? ($global.state == 'launched' ? 'launched' : 'play') : 'download');
    $: states = {
        'play': {
            h1: 'Играть',
            p: 'Автозаход на сервер ' + ($global.settingsManager.settings.auto_go_to_server_thing ? 'включен' : 'выключен'),
            locked: false,
            sub_buttons: [
                {
                    toggle: false,
                    h1: 'Удалить',
                    onclick: async () => {
                        console.log('Deintalling', $global.modpackManager.modpack)
                        await $global.modpackManager.modpackInstaller.uninstallModpack($global.modpackManager.modpack);
                        await $global.modpackManager.updateModpackDirs();
                        $global.modpackManager.modpacks[$global.modpackManager.modpack].installed = false;
                    }
                },
                {
                    checked: $global.settingsManager.settings.auto_go_to_server_thing,
                    toggle: true,
                    h1: 'Автозаход на сервер',
                    onchange: (checked: boolean) => {
                        console.log(checked)
                        $global.settingsManager.settings.auto_go_to_server_thing = checked;
                    }
                },
            ],
            click: async () => {
                let modpack = $global.modpackManager.modpack;

                console.log('checking env...');
                await $global.modpackManager.ensureModpack(modpack);

                if ($global.modpackManager.addons.preferences.optifine) {
                    if ($global.modpackManager.addons.preferences.optifine.enabled) {
                        let optifine_warning = await global.askOverlay.ask('У вас включен Optifine!', {
                            yes: {body: 'Да, запустить со включенным Optifine', type: 'alt'},
                            no: {body: 'Нет, выключить Optifine и запустить', type: 'clr'},
                            cancel: {body: 'Отменить'},
                        }, 'Несмотря на то, что он включел по умолчанию, мы не советуем играть с ним если вы не пользуетесь шейдерами. Он может вызывать редкие сбои и неправильное отображение объектов. Оставить?')

                        switch (optifine_warning) {
                            default:
                                return;

                            case 'yes':
                                $global.modpackManager.addons.preferences['optifine'].enabled = true
                                break;

                            case 'no':
                                $global.modpackManager.addons.preferences['optifine'].enabled = false
                                break;
                        }
                    }
                }

                let res = await $global.modpackManager.processManager.launchModpack(
                    modpack, 
                    6,
                    $global.settingsManager.settings.modpack_settings.allocated_memory,
                    $global.authInterface.logged_user.login,
                    $global.authInterface.logged_user.uuid
                );
                $global.modpackManager.processManager.launched_modpacks = $global.modpackManager.processManager.launched_modpacks;
                $global.modpackManager.modpack = $global.modpackManager.modpack;


                switch (res) {
                    case 'launched':
                        console.log('launched');
                        break;
                }
            }
        },

        'launched': {
            h1: 'Запущена',
            p: 'Сборка уже запущена',
            locked: true,
            sub_buttons: [
            ],
        },

        'init-download': {
            h1: '',
            p: 'Это может занять некоторое время...',
            locked: true,
            sub_buttons: [],
            click: async () => {}
        },

        'download': {
            h1: 'Скачать',
            p: 'Автозаход на сервер ' + ($global.settingsManager.settings.auto_go_to_server_thing ? 'включен' : 'выключен'),
            locked: false,
            sub_buttons: [
                {
                    checked: $global.settingsManager.settings.auto_go_to_server_thing,
                    toggle: true,
                    h1: 'Автозаход на сервер',
                    onchange: (checked: boolean) => {
                        console.log(checked)
                        $global.settingsManager.settings.auto_go_to_server_thing = checked;
                    }
                },
            ],
            click: async () => {
                let l_modpack = $global.modpackManager.modpack; // launching modpack

                console.log('downloading modpack:', l_modpack);
                let installed = await $global.modpackManager.ensureModpack(l_modpack);
                $global.modpackManager.modpacks[l_modpack].installed = installed;
            }
        },

        'post-download': {
            h1: 'Завершение...',
            p: 'Пожалуйста не закрывайте лаунчер...',
            locked: true,
            sub_buttons: [],
            click: async () => {}
        },

        'downloading': {
            h1: 'Пауза',
            p: 'Не закрывайте лаунчер!',
            locked: false,
            sub_buttons: [
                {
                    toggle: false,
                    h1: 'Отменить',
                    onclick: async () => {
                        console.log('cancelling download for:', $global.modpackManager.modpack)
                        await $global.modpackManager.cancelCurrentDownload();
                        await $global.modpackManager.modpackInstaller.uninstallModpack($global.modpackManager.modpack);
                        await $global.modpackManager.updateModpackDirs();
                        paused = false;
                        $global.modpackManager.modpack = $global.modpackManager.modpack;
                        $global.state = 'idle';
                    }
                },
            ],
            click: async () => {
                console.log('pausing download for:', $global.modpackManager.modpack);
                paused = true;
                await $global.modpackManager.downloader.pause();
            }
        },

        'paused': {
            h1: 'Возобновить',
            p: 'Не закрывайте лаунчер!',
            locked: false,
            sub_buttons: [
                {
                    toggle: false,
                    h1: 'Отменить',
                    onclick: async () => {
                        console.log('cancelling download for:', $global.modpackManager.modpack)
                        await $global.modpackManager.cancelCurrentDownload();
                        await $global.modpackManager.modpackInstaller.uninstallModpack($global.modpackManager.modpack);
                        await $global.modpackManager.updateModpackDirs();
                        paused = false;
                        $global.modpackManager.modpack = $global.modpackManager.modpack;
                        $global.state = 'idle';
                    }
                },
            ],
            click: async () => {
                console.log('resuming download for:', $global.modpackManager.modpack);
                paused = false;
                await $global.modpackManager.downloader.resume();
            },
        },
    }

    $global.ipcRenderer.on('modpack-initializing', (event, { modpack_name }) => {
        locked = false;
    });

    $global.ipcRenderer.on('modpack-launching', (event, { modpack_name }) => {
        locked = true;
        $global.modpackManager.modpack = $global.modpackManager.modpack;
        $global.modpackManager.status = $global.modpackManager.status;
        global.overlay.show(`Запуск ${global.capitalizeFirstLetter(modpack_name)}`, 'Пожалуйста, не выключайте лаунчер.', true);
    });

    $global.ipcRenderer.on('modpack-launched', (event, { modpack_name }) => {
        locked = false;
        $global.modpackManager.modpack = $global.modpackManager.modpack;
        $global.modpackManager.status = $global.modpackManager.status;
        global.overlay.hide();
    });

    $global.ipcRenderer.on('modpack-exit', (event, { modpack_name, code, signal }) => {
        $global.modpackManager.processManager.launched_modpacks = $global.modpackManager.processManager.launched_modpacks;
        $global.modpackManager.modpack = $global.modpackManager.modpack;
        $global.modpackManager.status = $global.modpackManager.status;
        console.log(`<${modpack_name}>`, `exit [${code} ${signal}]`)
        locked = false;
    });

    $global.ipcRenderer.on('modpack-error', (event, { modpack_name, code, signal }) => {
        $global.modpackManager.processManager.launched_modpacks = $global.modpackManager.processManager.launched_modpacks;
        $global.modpackManager.modpack = $global.modpackManager.modpack;
        $global.modpackManager.status = $global.modpackManager.status;
        console.log(`<${modpack_name}>`, `error [${code} ${signal}]`)
        locked = false;
    });
</script>

<div class:download={$global.modpackManager.status != 'idle'} class="main-button-wrapper">
    <DropMenu strict bind:locked={_locked} bind:h1={states[btn_state].h1} bind:p={states[btn_state].p} bind:menus={states[btn_state].sub_buttons} onclick={() => {
        if (!_locked) states[btn_state].click();
    }}/>
</div>

<style>
    .main-button-wrapper {
        display: flex;
        height: 100%;

        --dropmenu-main-bg: var(--playmenu-main-bg);
        --dropmenu-main-h1: var(--playmenu-main-h1);
        --dropmenu-main-p: var(--playmenu-main-p);
        --dropmenu-sub-even-bg: var(--playmenu-sub-even-bg);
        --dropmenu-sub-odd-bg: var(--playmenu-sub-odd-bg);
        --dropmenu-sub-h1: var(--playmenu-sub-h1);
        --dropmenu-sub-p: var(--playmenu-sub-p);
        --dropmenu-toggle-bg: var(--playmenu-toggle-bg);
        --dropmenu-toggle-fill: var(--playmenu-toggle-fill);
        
        --dropmenu-main-bg-hover: var(--playmenu-main-bg-hover);
        --dropmenu-main-h1-hover: var(--playmenu-main-h1-hover);
        --dropmenu-main-p-hover: var(--playmenu-main-p-hover);
        --dropmenu-sub-even-bg-hover: var(--playmenu-sub-even-bg-hover);
        --dropmenu-sub-odd-bg-hover: var(--playmenu-sub-odd-bg-hover);
        --dropmenu-sub-h1-hover: var(--playmenu-sub-h1-hover);
        --dropmenu-sub-p-hover: var(--playmenu-sub-p-hover);
        --dropmenu-toggle-bg-hover: var(--playmenu-toggle-bg-hover);
        --dropmenu-toggle-fill-hover: var(--playmenu-toggle-fill-hover);

        --dropmenu-main-h1-fs: 16px;
        --dropmenu-main-p-fs: 13px;
        --dropmenu-sub-h1-fs: 15px;
        --dropmenu-sub-p-fs: 13px;
    }
</style>