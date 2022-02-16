<script lang="ts">
    import { global } from "../../src/global";
</script>

<div id="overlay-thing" class:open={$global.modpackManager.processManager.launching} class="overlay-thing" class:reduced-motion={$global.settingsManager ? $global.settingsManager.settings.appearance.reduced_motion : false}>
    <div class="overlay-container">
        <h1>Запуск {global.capitalizeFirstLetter($global.modpackManager.modpack)}</h1>
        <div class="stages">
            <p class:active={$global.modpackManager.processManager.launching_stage == 'init'}>Подготовка к запуску</p>
            <p class:active={$global.modpackManager.processManager.launching_stage == 'lib-gathering'}>Сбор библиотек</p>
            <p class:active={$global.modpackManager.processManager.launching_stage == 'spawning'}>Запуск игры</p>
        </div>
    </div>
    <div class="overlay-loading">
        <svg id="loading-logo" xmlns="http://www.w3.org/2000/svg" style="width: 128px;" width="277.951" height="277.94" viewBox="0 0 277.951 277.94">
            <defs>
                <style>
                    @keyframes loadingfade {
                        0% {
                            opacity: 1;
                        }
        
                        50% {
                            opacity: 0;
                        }
        
                        100% {
                            opacity: 1;
                        }
                    }
                </style>
            </defs>
            <path id="loadingpart3" data-name="loadingpart3" style="animation: loadingfade 2s .66s infinite" fill="var(--text-primary)" d="M0,277.94H0l28.849-50L216,177.82l61.932,25.645Z"/>
            <path id="loadingpart2" data-name="loadingpart2" style="animation: loadingfade 2s .33s infinite" fill="var(--text-primary)" d="M220.261,203.473h0L158.33,177.82,102.78,81.6,102.77.017,220.26,203.47Z" transform="translate(57.69)"/>
            <path id="loadingpart1" data-name="loadingpart1" style="animation: loadingfade 2s 0s infinite" fill="var(--text-primary)" d="M160.46,0V81.6l-47.03,81.47L57.69,178.01Z"/>
        </svg>
    </div>
</div>

<style>
    .overlay-thing {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(var(--bg-secondary-alt-rgb), .8);
        backdrop-filter: blur(128px);
        z-index: 10;
        opacity: 0;
        display: flex;
        align-items: center;
        padding-left: 64px;
        padding-right: 256px;
        justify-content: space-between;
        pointer-events: none;

        transition: all .64s cubic-bezier(0.23, 1, 0.320, 1);
    }

    .overlay-container {
        position: relative;
        left: -128px;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        flex-direction: column;
        margin-bottom: 16px;

        transition: all .64s cubic-bezier(0.23, 1, 0.320, 1);
    }

    .overlay-loading {
        position: relative;
        opacity: 0;
        left: 128px;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        flex-direction: column;

        transition: all .64s cubic-bezier(0.23, 1, 0.320, 1);
    }

    .overlay-container h1 {
        color: rgba(var(--text-primary-rgb), 1);
        font-weight: bold;
        font-size: 32px;
        display: flex;
        margin-bottom: 12px;
    }

    .overlay-container p {
        color: rgba(var(--text-primary-rgb), 1);
        font-weight: 600;
        opacity: .16;
        font-size: 14px;
        display: flex;
        margin: 2px 0;
    }

    .overlay-container p.active {
        margin: 4px 0 !important;
        opacity: 1;
        font-size: 16px;
    }

    .overlay-thing.open {
        opacity: 1 !important;
        pointer-events: all !important;
    }

    .overlay-thing.open .overlay-container {
        left: 0;
    }

    .overlay-thing.open > * {
        -webkit-user-drag: drag;
    }

    .overlay-thing.open .overlay-loading {
        -webkit-user-drag: drag;
        opacity: 1;
        left: 0;
    }
</style>