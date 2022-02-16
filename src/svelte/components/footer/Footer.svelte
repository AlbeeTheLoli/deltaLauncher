<script lang="ts">
    import { global } from '../../src/global';
    import Loading from '../Loading.svelte';
    import DropMenu from './DropMenu.svelte';
    import MainButton from "./MainButton.svelte";

    function get_server_status(ip: string, port: string) {
        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest();
            request.onreadystatechange = () => {
                if (request.readyState !== 4 || request.status !== 200) return;

                const response = JSON.parse(request.responseText);
                
                console.log(`<${ip}:${port}> status: ${response.online ? "online" : "offline"}`);
                if (response.online) {
                    resolve({...response, status: 'online'});
                } else {
                    reject({status: 'offline'});
                }
            };
            request.open("GET", `https://mcapi.us/server/status?ip=${ip}&port=${port}`);
            request.send();
        })
    }

    $: status = $global.state;
    $: downloading = status != 'idle' && status != 'launched';
    $: downloading_item = $global.modpackManager.downloading_item;
    $: paused = $global.modpackManager.downloader.paused;

    $: launch_time = $global.modpackManager.processManager.launched_modpacks[$global.modpackManager.modpack] ? $global.modpackManager.processManager.launched_modpacks[$global.modpackManager.modpack].launch_time : new Date();
    $: play_time = new Date()

    setInterval(() => {
        if (launch_time) play_time = new Date(Math.abs((new Date()).getTime() - launch_time.getTime()));
        play_time.setHours(play_time.getHours() - 4);
    });

    let soft_downloading = false;
    let install_status = '';

    let servers_menus = [];

    for (const mdpck in $global.modpackManager.modpacks) {
        servers_menus.push({
            id: mdpck,
            h1: global.capitalizeFirstLetter(mdpck),
            p: 'Разработчик',
            toggle: false,
            status: {
                online: false,
                players: -1
            },
            onclick: () => {
                console.log(`selected ${mdpck}!`);

                $global.modpackManager.modpack = mdpck;
            }
        })
    }

    function getServerStatuses() {
        for (const status of servers_menus) {
            status.status = {
                online: false,
                players: 0,
            }
        }
    }

</script>

<footer class:reduced-motion={$global.settingsManager.settings.appearance.reduced_motion} class:download={downloading} class:soft-download={$global.modpackManager.processManager.launched_modpacks[$global.modpackManager.modpack] && $global.modpackManager.processManager.launched_modpacks[$global.modpackManager.modpack]?.process}>
    <DropMenu bind:locked={downloading} h1={global.capitalizeFirstLetter($global.modpackManager.modpack)} p={'Разработчик'} menus={servers_menus.filter((el) => {return el.id != $global.modpackManager.modpack})} />
    <div id="footer-bar" class="footer-bar">
        <div class="progress-bar">
            <div class="progress-bg">
                <div class="top"></div>
                <div class="bottom"></div>
            </div>
            <div class="filler" style="width: {Math.min($global.download_progress.percent, 1) * 100}%;">
                <div class="top"></div>
                <div class="bottom"></div>
            </div>
        </div>
        <div class="info">
            {#if downloading}
                {#if status == 'init-install'}
                    <h1>Подготовка к загрузке{downloading_item != 'libs' ? `: ${global.capitalizeFirstLetter(downloading_item)}` : ' библиотек'} ({($global.download_progress.percent * 100).toFixed(2)}%)<Loading /></h1>
                    <p>Ожидание ответа сервера: [фаза {$global.download_progress.on_thread + 1} из {$global.download_progress.threads}]<Loading /></p>
                {:else if status == 'download'}
                    <h1>Скачивание{downloading_item != 'libs' ? `: ${global.capitalizeFirstLetter(downloading_item)}` : ' библиотек'} ({($global.download_progress.percent * 100).toFixed(2)}%)<Loading /></h1>
                    {#if paused}
                        <p>Пауза</p>
                    {:else if $global.download_progress.speed != undefined}
                        <p>Скорость: {$global.download_progress.speed.toFixed(2)} Мб в секунду</p>
                    {:else}
                        <p>Загрузка<Loading /></p>
                    {/if}
                {:else}
                    <h1>Установка{downloading_item != 'libs' ? `: ${global.capitalizeFirstLetter(downloading_item)}` : ' библиотек'} ({($global.download_progress.percent * 100).toFixed(2)}%)</h1>
                    {#if status == 'unzipping'}
                        <p>Распаковка архива<Loading /> </p>
                    {:else if status == 'moving-libs'}
                        <p>Перенос библиотек: {$global.download_progress.percent}%</p>
                    {/if}
                {/if}
            {:else if $global.modpackManager.processManager.launched_modpacks[$global.modpackManager.modpack] && $global.modpackManager.processManager.launched_modpacks[$global.modpackManager.modpack]?.process}
                <h1>Время в игре: {play_time.toLocaleTimeString('en-UK', {hour:'2-digit', minute:'2-digit', second:'2-digit', hour12: false})}</h1>
                <p>Разработчик</p>
            {:else}
                <h1>Тут что-то будет<Loading /></h1>
                {#if $global.modpackManager.sha}
                    <p>Эксперементальная ветка: {$global.modpackManager.sha}</p>
                {:else}
                    <p>Версия: 0.0.0.0</p>
                {/if}
            {/if}
        </div>
    </div>
    <MainButton />
</footer>

<style>
    footer {
        height: var(--footer-height);
        background: var(--footer-bg);
        color: var(--footer-text);
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-left: 0;

        transition: margin .48s cubic-bezier(0.23, 1, 0.320, 1);
    }

    footer.download {
        margin-left: calc(-1 * var(--sidebar-width));
    }

    .footer-bar {
        --progress-height: 0;
        --progress-top-opacity: 0;

        z-index: 0;
        height: 100%;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
    }

    .footer-bar .info {
        z-index: 1;
        flex: 1;
        padding-left: 32px;
        max-height: calc(100% - 8px);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        position: relative;
        top: 2px;

        font-size: 14px;
        font-weight: 700;

        transition: top .32s cubic-bezier(0.215, 0.610, 0.355, 1);
    }

    .footer-bar .info > h1 {
        font-size: 15px;
        font-weight: 700;
        margin-bottom: 2px;
    }

    .footer-bar .info > p {
        opacity: .32;
        font-size: 14px;
        font-weight: 700;
    }

    .footer-bar .progress-bar {
        z-index: -1;
        position: absolute;
        width: 100%;
        height: 100%;
    }

    .progress-bar .top {
        width: 100%;
        flex: 1;
        opacity: var(--progress-top-opacity);
        transition: opacity .16s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .progress-bar .bottom {
        height: var(--progress-height);
        transition: height .08s cubic-bezier(0.165, 0.84, 0.44, 1);
        width: 100%;
    }

    .progress-bar > * {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .progress-bar .progress-bg .bottom {
        background-color: var(--progress-bar-bg);
    }

    .progress-bar .filler {
        width: 0;
        transition: width 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    @keyframes load-progress {
        0% {
            opacity: .64;
        }

        50% {
            opacity: 1;
        }

        100% {
            opacity: .64;
        }
    }

    .progress-bar .filler .top {
        background: rgba(var(--bg-accent-rgb), .08);
    }

    .progress-bar .filler .bottom {
        background: var(--progress-bar-filler);
        animation: load-progress 2s infinite linear;
    }

    .download .footer-bar {
        --progress-height: 8px !important;
        --progress-top-opacity: 1 !important;
    }

    .download .footer-bar .info {
        top: 0;
    }

    .soft-download .footer-bar {
        --progress-top-opacity: 1 !important;
    }
</style>