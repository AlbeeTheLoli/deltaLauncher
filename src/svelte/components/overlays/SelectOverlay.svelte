<script lang="ts">
    import { onMount } from "svelte";
    import { global } from "../../src/global";

    let el;

    export let visible = false;
    export let h1 = '';
    export let p = '';

    export function show(title?: string, _p?: string, _loading=false) {
        if (title) h1 = title;
        if (_p) p = _p;
        visible = true;
    }

    export function hide() {
        visible = false;
    }

    let _options: {[key: string]: string} = {};
    let answer: (options, i) => void;
    function select(title: string, options: {[key: string]: string}, p?: string): Promise<string> | void {
        return new Promise((resolve, reject) => {
            show(title, p);
            _options = options;

            answer = (__options, __i) => {
                console.log('selected', Object.keys(__options)[__i]);
                answer = undefined;
                hide();
                resolve(Object.keys(__options)[__i]);
            }

            if (el) el.onclick = () => {
                hide();
                reject('focus lost');
            };
        })
    }

    function action(node, [options, i]) {
        node.onclick = () => answer(options, i);
    }

    onMount(() => {
        global.selectOverlay.select = select;
    })
</script>

<div bind:this={el} class="overlay-thing" class:open={visible} class:reduced-motion={$global.settingsManager ? $global.settingsManager.settings.appearance.reduced_motion : false}>
    <div class="overlay-container">
        <h1>{h1}</h1>
        <p>{p}</p>
        <div class="list">
            {#each Object.values(_options) as option, i}
                <div class="el" use:action={[_options, i]}>{option}</div>
            {/each}
        </div>
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
        color: rgba(var(--text-primary-rgb), .48);
        font-weight: 600;
        font-size: 16px;
        display: flex;
        margin-bottom: 16px;
    }

    .overlay-container .list {
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .overlay-container .list .el {
        position: relative;
        cursor: pointer;
        color: rgba(var(--text-primary-rgb), .48);
        font-weight: 600;
        font-size: 16px;
        display: flex;
        margin-bottom: 12px;

        transition: color .32s cubic-bezier(0.23, 1, 0.320, 1);
    }

    .overlay-container .list .el:hover {
        color: rgba(var(--text-primary-rgb), 1);
    }

    .overlay-thing.open {
        opacity: 1 !important;
        pointer-events: all !important;
    }

    .overlay-thing.open .overlay-container {
        left: 0;
    }
</style>