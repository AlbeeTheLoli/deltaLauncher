<script lang="ts">
    import { fly } from "svelte/transition";
    import { global } from '../../src/global';

    export let bordered = true;
    export let title: string = '';
    export const delay: number = 0;
    export let tip: {
        h1?: string,
        p?: string,
    } = undefined;
</script>

<div class="setting" class:bordered in:fly={{y: -10, duration: 100}} out:fly={{y: -10, duration: 100}}>
    <h1>{title}</h1>
    
    <div class="content">
        <slot />
    </div>

    {#if tip}
        <div class="tip">
            {#if tip.h1} <h1>{tip.h1}</h1> {/if}
            {#if tip.p} <p>{tip.p}</p> {/if}
        </div> 
    {/if}
</div>

<style>
    .setting {
        padding: 20px 28px;
    }

    .setting.bordered {
        border: rgba(var(--main-text-rgb), .02) 2px solid;
        background: rgba(var(--main-text-rgb), .02);
    }

    .setting.bordered:hover {
        border: rgba(var(--main-text-rgb), .08) 2px solid;
        background: rgba(var(--main-text-rgb), .04);
    }

    .setting > h1 {
        font-size: 18px;
        margin-bottom: 24px;
    }

    .tip {
        max-width: var(--width);
        width: 100%;
        display: flex;
        flex-direction: column;
        font-size: 12px;
        font-weight: 600;
    }

    .tip > h1 {
        max-width: var(--width);
        width: 100%;
        font-size: 12px;
        font-weight: 600;
        opacity: .64;
        margin-bottom: 4px;
    }

    .tip > p {
        max-width: var(--width);
        width: 100%;
        font-size: 12px;
        font-weight: 600;
        opacity: .32;
    }
</style>
