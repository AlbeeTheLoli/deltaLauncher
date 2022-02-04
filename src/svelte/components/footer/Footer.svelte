<script lang="ts">
    import { global } from '../../src/global';
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

    $: downloading = $global.state == 'download';
    let soft_downloading = false;
    let download_progress = 0;

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

    let h1 = 'Тут что то будет...';
    let p = 'Наверное....';
    let downloading_item = '';

    $global.ipcRenderer.on('download-started', (event, item) => {
        console.log('STARTED');
        last_received_bytes = 0;

        downloading_item = item;
        if (downloading_item == 'libs') {
            h1 = `Подготовка к загрузке библиотек.`;
        } else {
            h1 = `Подготовка к загрузке: ${global.capitalizeFirstLetter(downloading_item)}.`;
        }
        p = `Ожидание ответа сервера...`;
        
        $global.state = 'download';
    })

    let last_received_bytes = 0;
    $global.ipcRenderer.on('download-progress', (event, progress) => {
        console.log('PROGRESS', progress);
        let speed = (progress.received_size - last_received_bytes) / 1024 / 1024;
        last_received_bytes = progress.received_size;
        
        download_progress = progress.percent;

        if (downloading_item == 'libs') {
            h1 = `Скачивание библиотек...`;
        } else {
            h1 = `Скачивание: ${global.capitalizeFirstLetter(downloading_item)}...`;
        }
        p = `Скорость: ${speed.toPrecision(2)} Мб в секунду`;

        $global.state = 'download';
    })

    $global.ipcRenderer.on('download-finished', () => {
        console.log('FINISHED');

        h1 = `Распаковка файлов...`;
        p = 'Это может занять некторое время.';

        $global.state = 'download';
    })

    $global.ipcRenderer.on('download-cancelled', () => {
        console.log('CANCELLED');

        h1 = 'Тут что то будет...';
        p = 'Наверное....';
        
        $global.state = 'idle';
    })

    $global.ipcRenderer.on('modpack-downloaded', () => {
        downloading_item = '';
        console.log('DOWNLOADED');
        
        h1 = 'Завершение...';
        p = 'Это может занять некторое время.';

        $global.state = 'download';
    })

    $global.ipcRenderer.on('moving-libs-start', async (event) => {
        h1 = `Перенос библиотек...`;
        p = 'Это может занять некторое время.';

        $global.state = 'download';
    })

    $global.ipcRenderer.on('moving-libs-progress', async (event, progress) => {
        h1 = `Перенос библиотек: ${(progress.percent).toFixed(1)}%`;
        p = 'Это может занять некторое время.';
        download_progress = progress.percent / 100;

        $global.state = 'download';
    });

    $global.ipcRenderer.on('moving-libs-finished', () => {
        h1 = 'Тут что то будет...';
        p = 'Наверное...';

        $global.state = 'idle';
    });
</script>

<footer class:download={downloading} class:soft-download={soft_downloading} >
    <DropMenu bind:locked={downloading} h1={global.capitalizeFirstLetter($global.modpackManager.modpack)} p={'Разработчик'} menus={servers_menus.filter((el) => {return el.id != $global.modpackManager.modpack})} />
    <div id="footer-bar" class="footer-bar">
        <div class="progress-bar">
            <div class="progress-bg">
                <div class="top"></div>
                <div class="bottom"></div>
            </div>
            <div class="filler" style="width: {download_progress * 100}%;">
                <div class="top"></div>
                <div class="bottom"></div>
            </div>
        </div>
        <div class="info">
            <h1>{h1}</h1>
            <p>{p}</p>
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