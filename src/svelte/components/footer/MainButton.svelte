<script lang='ts'>
    import DropMenu from './DropMenu.svelte';
    export let downloading: boolean;

    let PRESS_COOLDOWN = 200;
    let pressed = false;
    let sub_buttons: {toggle: boolean, checked?: boolean, h1: string, onclick?: (checked?: boolean) => void, p?: string, onchange?: (checked?: boolean) => void}[] = [
        {
            toggle: false,
            h1: 'Удалить',
            onclick: async () => {
                console.log('йоу')
            }
        },
        {
            checked: false,
            toggle: true,
            h1: 'Автозаход на сервер',
            onchange: (checked: boolean) => {
                console.log(checked)
            }
        },
    ]

    let selected_modpack = 'magicae';

    let h1 = 'Играть';
    let p = 'Автозаход на сервер выключен';

    let locked = false;
    let state = 'play';
</script>

<div class:download={downloading} class="main-button-wrapper">
    <DropMenu strict bind:locked={locked} bind:h1={h1} bind:p={p} bind:menus={sub_buttons} onclick={() => {
        console.log('main button AAAA')
    }}/>
</div>

<style>
    .main-button-wrapper {
        display: flex;
        height: 100%;

        --dropmenu-main-bg: var(--clr-primary);
        --dropmenu-main-h1: var(--bg-primary);
        --dropmenu-main-p: var(--bg-secondary);
        --dropmenu-sub-even-bg: var(--clr-primary);
        --dropmenu-sub-odd-bg: var(--clr-secondary);
        --dropmenu-sub-h1: var(--bg-primary);
        --dropmenu-sub-p: var(--bg-secondary);
        --dropmenu-toggle-bg: var(--dropmenu-main-bg);
        --dropmenu-toggle-fill: var(--dropmenu-main-h1);

        --dropmenu-main-bg-hover: var(--clr-tertiary);
        --dropmenu-main-h1-hover: var(--bg-primary);
        --dropmenu-main-p-hover: var(--bg-secondary);
        --dropmenu-sub-even-bg-hover: var(--clr-tertiary);
        --dropmenu-sub-odd-bg-hover: var(--clr-tertiary);
        --dropmenu-sub-h1-hover: var(--bg-primary);
        --dropmenu-sub-p-hover: var(--bg-secondary);
        --dropmenu-toggle-bg-hover: var(--dropmenu-main-bg-hover);
        --dropmenu-toggle-fill-hover: var(--dropmenu-main-h1-hover);

        --dropmenu-main-h1-fs: 16px;
        --dropmenu-main-p-fs: 13px;
        --dropmenu-sub-h1-fs: 15px;
        --dropmenu-sub-p-fs: 13px;
    }
</style>