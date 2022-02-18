<script lang='ts'>
    import { global } from "../../src/global";
    import Button from "../Button.svelte";

    export let show_user_themes: boolean;
</script>

<div class="theme-select">
    <h2>Стандартные темы:</h2>
    <div class="themes">
        <div class="theme">
            <div class="left">
                <h1>Светлая</h1>
                <p>По умолчанию</p>
            </div>
            <div class="right">
                <h1>Albee</h1>
                <p>v1.0</p>
            </div>
            <div class="btn">
                <Button onclick={() => {
                    $global.settingsManager.theme = '';
                }} small>Выбрать</Button>
            </div>
        </div>
        <div class="theme">
            <div class="left">
                <h1>Тёмная</h1>
                <p>Тёмная версия стандартной</p>
            </div>
            <div class="right">
                <h1>Albee</h1>
                <p>v1.0</p>
            </div>
            <div class="btn">
                <Button onclick={() => {
                    $global.settingsManager.theme = ':dark:';
                }} small>Выбрать</Button>
            </div>
        </div>
    </div>

    <div class="gap"></div>

    <h2>Пользовательские темы:</h2>
    <div class="themes">
        {#if show_user_themes && Object.keys($global.settingsManager.themes).filter(el => el != ':dark:').length > 0}
            {#each Object.keys($global.settingsManager.themes).filter(el => el != ':dark:') as theme}
                <div class="theme">
                    <div class="left">
                        <h1>{$global.settingsManager.themes[theme].name}</h1>
                        <p>{$global.settingsManager.themes[theme].description}</p>
                    </div>
                    <div class="right">
                        <h1>{$global.settingsManager.themes[theme].author}</h1>
                        <p>v{$global.settingsManager.themes[theme].version}</p>
                    </div>
                    <div class="btn">
                        <Button onclick={() => {
                            $global.settingsManager.theme = theme;
                        }} small>Выбрать</Button>
                    </div>
                </div>
            {/each}
        {:else}
            <p>У вас не установленно никаких тем ¯\_(ツ)_/¯</p>
            <p>Список доступных тем можно найти <span class="link" on:click={() => {
                global.shell.openExternal(`https://github.com/AlbeeTheLoli/deltaLauncherOld/tree/main/themes`);
            }}>тут</span></p>
        {/if}
    </div>
    <div class="gap"></div>
</div>

<style>
    .gap {
        height: 24px;
    }

    h2 {
        font-size: 15px;
        font-weight: 700;
        margin-bottom: 12px;
    }

    .themes > p {
        color: rgba(var(--text-primary-rgb), .48);
        font-size: 14px;
        font-weight: 600;
        opacity: 1;
    }
    
    .link {
        cursor: pointer;
        font-weight: 700;
        color: var(--clr-primary);

        transition: color .16s cubic-bezier(0.455, 0.03, 0.515, 0.955);
    }

    .link:hover {
        color: var(--alt-primary);
    }

    .themes > .theme {
        width: calc(100% + 56px);
        margin-left: -28px;
        padding-left: 26px;
        padding-right: 26px;
        border-left: rgba(var(--text-primary-rgb), 0) 2px solid;
        border-right: rgba(var(--text-primary-rgb), 0) 2px solid;
        height: 48px;
        display: flex;
        justify-content: space-between;
        padding-bottom: 16px;
        padding-top: 16px;
    }

    .themes > .theme:hover {
        border-left: var(--text-primary) 2px solid;
        border-right: var(--text-primary) 2px solid;
    }


    .themes > .theme > .left {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .themes > .theme > .left h1 {
        font-size: 14px;
        font-weight: 700;
    }

    .themes > .theme > .left p {
        font-size: 13px;
        font-weight: 700;
        opacity: .32;
    }

    .themes > .theme > .right {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-end;
        margin-right: 0;
        right: 0;
        opacity: 1;

        transition: all .16s cubic-bezier(0.455, 0.03, 0.515, 0.955);
    }

    .themes > .theme:hover > .right {
        right: -88px;
        opacity: 0;
    }


    .themes > .theme > .right h1 {
        font-size: 14px;
        font-weight: 700;
    }

    .themes > .theme > .right p {
        font-size: 12px;
        font-weight: 700;
        opacity: .32;
    }

    .themes > .theme > .btn {
        position: relative;
        opacity: 0;
        margin-right: -96px;
        right: 88px;
        width: 96px;
        height: 100%;
        display: flex;
        align-items: center;

        transition: all .16s cubic-bezier(0.455, 0.03, 0.515, 0.955);
    }

    .themes > .theme:hover > .btn {
        opacity: 1;
        margin-right: 0;
        right: 0;
    }
</style>