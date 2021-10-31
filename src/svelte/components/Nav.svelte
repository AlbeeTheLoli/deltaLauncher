<script lang='ts'>
    export let userData: {
        login: string,
    };
</script>

<header>
    <div id="header-nav" class="nav noselect">
        <div class="nav-element active">Главная</div>
        <div class="nav-element">Настройки</div>
        <div class="nav-element">Аккаунт</div>
    </div>
    <div class="flex-filler drag"></div>
    <div class="profile">
        <div class="profile-info">
            <h1 id="profile-login-el">{userData.login}</h1>
            <p id="change-account" class="noselect">Сменить аккаунт</p>
        </div>
        <div class="bg">
            <div style="opacity: .80;" class="color"></div>
            <div class="img">
                <img id="profile-picture-img" src="" alt="">
            </div>
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
        width: 128px;
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
        position: relative;
        height: 100%;
        width: var(--sidebar-width);
    }

    .profile > .bg {
        z-index: 0;
    }

    .profile > .bg > .color {
        background-color: var(--header-profile-bg);
    }
    
    .profile > .profile-info {
        color: var(--header-profile-text);
        z-index: 10;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        padding: 0 32px;
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