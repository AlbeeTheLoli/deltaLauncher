<script lang='ts'>
    import type { user } from '../../../includes/auth-manager'
    import { global } from '../../src/global';

    export let userData: user;

    export let section_names: string[];
    export let section: number;

    async function change_user() {
        let users = {};
        for (const k in $global.authInterface.users) {
            const ussr = $global.authInterface.users[k];
            users = {
                ...users,
                [ussr.id]: ussr.login, 
            }
        }

        users = {
            ...users,
            '-1': 'Выйти',
        }

        let selected = await global.selectOverlay.select('Выберите аккаунт:', users);
        if (selected == $global.authInterface.logged_user.id) return;
        if (selected != '-1') {
            $global.authInterface.switchUser(selected);
        } else {
            $global.authInterface.logout();
        }
    }
</script>

<header class:reduced-motion={$global.settingsManager.settings.appearance.reduced_motion}>
    <div id="header-nav" class="nav noselect">
        {#each section_names as _, i}
            <div class="nav-element" class:active={section == i} on:click={() => section = i}>{section_names[i]}</div>
        {/each}
    </div>
    <div class="flex-filler drag" style="display: flex; align-items: center; padding-left: 16px">
        {#if $global.settingsManager.settings.dev_mode}
            <p>App state: {$global.state}</p>
        {/if}
    </div>
    <div class="profile">
        <div class="profile-picture">
            <img id="profile-picture-img" class="no-drag" src="D:/Pictures/Anime/Helltaker/0f0f99c00bdc40b5cc21f621bd4d8ac5.jpg" alt="">
        </div>
        <div class="profile-info">
            <h1 id="profile-login-el">{userData.login}</h1>
            <p id="change-account" class="noselect no-drag" on:click={change_user}>Сменить аккаунт</p>
        </div>
    </div>
</header>

<style>
    header {
        z-index: 0;
        width: 100vw;
        height: var(--header-height);
        display: flex;
        justify-content: space-between;

        background-color: var(--header-bg);
    }

    header > .nav {
        color: var(--header-nav-text);
        font-size: 14px;
        font-weight: 600;
        display: flex;
        height: 100%;
    }

    header >.nav > .nav-element {
        background: var(--header-nav-bg);
        cursor: pointer;
        padding: 0 32px;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;

        transition: all .16s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .nav-element.active {
        color: var(--header-nav-text-active);
        background: var(--header-nav-bg-active);
    }

    header >.nav > .nav-element:not(.active):hover {
        color: var(--header-nav-text-hover);
    }

    header >.nav > .nav-element:hover {
        background: var(--header-nav-bg-hover);
    }


    header > .profile {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        position: relative;
        height: 100%;
        width: var(--sidebar-width);
    }

    .profile > .profile-picture {
        width: 42px;
        height: 42px;
        border-radius: 100%;
        overflow: hidden;
        margin-right: 32px;
    }

    .profile > .profile-picture > img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .profile > .profile-info {
        color: var(--header-profile-text);
        z-index: 10;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        padding-right: 32px;
    }

    .profile-info > h1 {
        font-size: 14px;
        font-weight: 700;
    }

    .profile-info > p {
        cursor: pointer;
        font-size: 14px;
        font-weight: 700;
        opacity: .48;

        transition: opacity .16s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .profile p:hover {
        opacity: 1;
    }
</style>