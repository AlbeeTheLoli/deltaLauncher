<script lang='ts'>
    export let onclick = () => {};
    export let menus: {toggle: boolean, checked?: boolean, h1: string, onclick?: (checked?: boolean) => void, p?: string, onchange?: (checked?: boolean) => void}[] = []
    export let strict = false;
    export let downloading: boolean = false;

    export let h1 = '';
    export let p = '';

    export let show_sub = false;
    export let locked = false;

    function toggle(el: HTMLDivElement, btn) {
        let checked = el.dataset.state == 'true';
        el.onclick = () => {
            if (checked) {
                el.dataset.state = 'false';
                el.innerText = 'Нет';
            } else {
                el.dataset.state = 'true';
                el.innerText = 'Да';
            }

            checked = !checked;
            if (btn.onchange) btn.onchange(checked)
        }
    }
</script>

<div class:show-sub={show_sub} class:download={downloading} class:locked={locked} class="dropmenu-container" on:mouseleave={() => show_sub = false}>
    {#each menus as btn, i}
        {#if btn.toggle}
            <div style="--order: {i}" class="sub-menu toggle">
                <div class="info" on:click={() => {if (btn.onclick) btn.onclick()}}>
                    <h1>{btn.h1}</h1>
                </div>
                <div data-state={btn.checked.toString()} class="toggle noselect" use:toggle={btn}>
                    {btn.checked ? 'Да' : 'Нет'}
                </div>
            </div>
        {:else}
            <div style="--order: {i}" class="sub-menu">
                <div class="info" on:click={() => {if (btn.onclick) btn.onclick()}}>
                    <h1>{btn.h1}</h1>
                    {#if btn.p} <p>{btn.p}</p> {/if}
                </div>
            </div>
        {/if}
    {/each}
    <div class="main-menu">
        <div on:mouseenter={() => show_sub = !strict} id="main-menu" class="info" on:click={() => onclick()}>
            <h1>{h1}</h1>
            <p>{p}</p>
        </div>
        <div id="open-sub-menu" class:active={show_sub} on:mouseenter={() => show_sub = true} class="open-sub-menu">
            <svg xmlns="http://www.w3.org/2000/svg" width="10.854" height="6.426" viewBox="0 0 10.854 6.426">
                <path id="Path_397" data-name="Path 397" d="M0,0,4.012,4.012,8.025,0" transform="translate(9.44 5.012) rotate(180)" fill="none" stroke="var(--fill)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
            </svg>                      
        </div>
    </div>
</div>

<style>
    .dropmenu-container {
        width: var(--sidebar-width);
        height: 100%;
        position: relative;
        opacity: 1;
    }

    .dropmenu-container.download {
        pointer-events: none;
    }

    .dropmenu-container:not(.locked) {
        transition: all 1s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .dropmenu-container.locked {
        opacity: .8;
        cursor: not-allowed;
    }

    .dropmenu-container.locked * {
        pointer-events: none;
    }

    .main-menu {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: space-between;
        /* background: rgba(var(--main-menu-bg-rgb)); */
        cursor: pointer;
    }

    .main-menu > .info {
        color: var(--dropmenu-main-h1);
        background: var(--dropmenu-main-bg);

        display: flex;
        flex: 1;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        padding: 0 32px;

        transition: background .16s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .dropmenu-container:not(.locked) .main-menu > .info:hover {
        background: var(--dropmenu-main-bg-hover);
        color: var(--dropmenu-main-h1-hover) !important;
    }

    .main-menu > .info > h1 {
        font-size: var(--dropmenu-main-h1-fs);
        font-weight: 700;
        margin-bottom: 2px;
    }

    .main-menu > .info > p {
        font-size: var(--dropmenu-main-p-fs);
        font-weight: 700;
        opacity: .48;
    }

    .open-sub-menu {
        --fill: var(--dropmenu-main-h1);

        width: var(--footer-height);
        background-color: var(--dropmenu-main-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;

        transition: all .16s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .open-sub-menu.active {
        background-color: var(--dropmenu-main-bg-hover);
        --fill: var(--dropmenu-main-h1-hover);
    }

    .sub-menu {
        position: absolute;
        bottom: 16px;
        left: 0;
        width: var(--sidebar-width);
        height: 64px;

        cursor: pointer;
        opacity: 0;

        display: flex;

        transition: bottom .32s cubic-bezier(0.165, 0.84, 0.44, 1),
                    opacity .16s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .sub-menu:nth-child(2n) .info {
        color: var(--dropmenu-sub-h1);
        background: var(--dropmenu-sub-even-bg)
    }

    .sub-menu:nth-child(2n) .info:hover {
        color: var(--dropmenu-sub-h1-hover);
        background: var(--dropmenu-sub-even-bg-hover);
    }

    .sub-menu:nth-child(2n + 1) .info {
        color: var(--dropmenu-sub-h1);
        background: var(--dropmenu-sub-odd-bg);
    }

    .sub-menu:nth-child(2n + 1) .info:hover {
        color: var(--dropmenu-sub-h1-hover);
        background: var(--dropmenu-sub-odd-bg-hover);
    }

    .dropmenu-container.show-sub .sub-menu {
        opacity: 1;
        bottom: calc(var(--order) * 64px + var(--footer-height));
    }

    .sub-menu > .info {
        height: 100%;
        display: flex;
        flex: 1;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        padding: 0 32px;

        transition: background-color .16s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .sub-menu > .info > h1 {
        font-size: var(--dropmenu-sub-h1-fs);
        font-weight: 700;
        margin-bottom: 2px;
    }

    .sub-menu > .info > p {
        font-size: var(--dropmenu-sub-p-fs);
        font-weight: 700;
        opacity: .64;
    }

    .sub-menu .toggle {
        color: var(--dropmenu-toggle-fill);
        width: var(--footer-height);
        background-color: var(--dropmenu-toggle-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;

        font-size: 15px;
        font-weight: 700;

        /* transition: all .16s cubic-bezier(0.165, 0.84, 0.44, 1); */
    }

    .sub-menu .toggle:hover {
        color: var(--dropmenu-toggle-fill-hover);
        background-color: var(--dropmenu-toggle-bg-hover);
    }
</style>