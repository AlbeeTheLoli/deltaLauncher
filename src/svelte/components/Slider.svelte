<script lang='ts'>
    import { onMount } from "svelte";

    export let id: string;
    export let min: number = 0;
    export let max: number = 100;
    export let step: number = .001;
    export let value_step: number = 2;
    export let unit: string = '';
    export let step_values: string[] = [];
    export let free: boolean = false;

    export let value = min;
    export let onchange: Function = () => {};

    let el: HTMLDivElement;
    let pointer_el: HTMLDivElement;
    let max_val = max;
    let min_val = min;

    let focused = false;

    onMount(() => {
        if (pointer_el) pointer_el.style.left = `${((value - min) / (max - min)) * (el.clientWidth - 2)}px`;
    })
</script>

<div class="slider">
    <input bind:value={value} min="{min}" max="{max}" step="{step > 0 ? step : .001}" type="range" name="{id}-input" id="{id}-input" on:input={() => {
        if (pointer_el) pointer_el.style.left = `${((value - min) / (max - min)) * (el.clientWidth - 2)}px`;
        onchange(value);
    }}>
    <div bind:this={el} class="stops">
        {#if free}
            <div class="stop only-value">
                <div class="value">
                    {min}{unit}
                </div>
                <div></div>
            </div>
            <div bind:this={pointer_el} class="stop pointer" style="position: absolute;">
                <div></div>
                <div class="value">
                    {value}{unit}
                </div>
            </div>
            <div class="stop only-value">
                <div class="value">
                    {max}{unit}
                </div>
                <div></div>
            </div>
        {:else}
            {#each Array(Math.floor((max - min) / step) + 1) as _, i}
                {#if step_values.length == 0}
                    {#if (i) % value_step == 0}
                        <div class="stop" class:active={Math.floor((value - min) / step) == i}>
                            <div class="line"></div>
                            <div class="value">
                                {i * step + min}{unit}
                            </div>
                        </div>
                    {:else}
                        <div class="stop empty" class:active={Math.floor((value - min) / step) == i}>
                            <div class="line"></div>
                        </div>
                    {/if}
                {:else}
                    {#if (i) % value_step == 0 && step_values[i / value_step] != ''}
                        <div class="stop" class:active={Math.floor((value - min) / step) == i}>
                            <div class="line"></div>
                            <div class="value">
                                {step_values[i / value_step]}{unit}
                            </div>
                        </div>
                    {:else}
                        <div class="stop empty" class:active={Math.floor((value - min) / step) == i}>
                            <div class="line"></div>
                        </div>
                    {/if}
                {/if}
            {/each}
        {/if}
    </div>
</div>

<style>
    .slider {
        position: relative;
        /* border: var(--text) 2px dashed; */
        width: 100%;
        height: 40px;
        margin-bottom: 16px;
        display: flex;
        justify-content: center;
    }

    .slider > input {
        -webkit-appearance: none;  /* Override default CSS styles */
        appearance: none;

        position: absolute;
        width: 100%;
        height: 100%;
        background: none;
    }

    .slider > input::-webkit-slider-runnable-track {
        width: 100%;
        height: 3px;
        cursor: pointer;
        background: var(--slider-track);
        border-radius: 5px;
    }

    .slider > input::-webkit-slider-thumb {
        -webkit-appearance: none; /* Override default look */
        appearance: none;
        width: 11px; 
        height: 11px; 
        margin-top: -4px;
        background: var(--slider-thumb);
        border-radius: 100%;
        cursor: pointer; 

        transition: background .32s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .slider > input::-webkit-slider-thumb:hover {
        background: var(--slider-thumb-hover);
    }

    .slider > .stops {
        z-index: -1;
        position: absolute;
        top: 4px;
        width: calc(100% - 8px);
        height: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .slider > .stops > .stop {
        height: 100%;
        width: 2px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-direction: column;
    }

    .slider > .stops > .stop > .line {
        height: 9px;
        width: 2px;
        border-radius: 2px;
        background: var(--slider-ticks);
        
        transition: height .32s cubic-bezier(0.165, 0.84, 0.44, 1),
                    background .32s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .slider > .stops > .stop.empty > .line {
        margin-top: 4px;
        height: 4px;
        background: var(--slider-ticks-empty) !important;
    }

    .slider > .stops > .stop.active > .line {
        height: 6px;
        width: 2px;
        background: var(--slider-ticks-active) !important;
    }

    .slider > .stops > .stop.empty.active > .line {
        margin-top: 4px;
        height: 2px;
        width: 2px;
        background: var(--slider-ticks-active) !important;
    }

    .slider > .stops > .stop > .value {
        font-size: 10px;
        font-weight: 700;
        position: relative;

        color: var(--slider-ticks) !important;

        transition: opacity .32s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .slider > .stops > .stop.active > .value {
        color: var(--slider-ticks-active) !important;
    }

    .slider > .stops > .stop:first-child {
        align-items: flex-start;
    }

    .slider > .stops > .stop:first-child > .value {
        width: 0;
        text-align: start;
        display: flex;
        justify-content: flex-start;
        left: -4px;
    }

    .slider > .stops > .stop:last-child {
        align-items: flex-end;
    }

    .slider > .stops > .stop:last-child > .value {
        width: 0;
        text-align: end;
        display: flex;
        justify-content: flex-end;
        left: 4px;
    }

    .slider > .stops > .stop.only-value > .value {
        top: -6px;
    }

    .slider > .stops > .stop.pointer > .value {
        top: -8px;
        opacity: 0;

        transition: top .16s cubic-bezier(0.165, 0.84, 0.44, 1),
                    opacity .16s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .slider:hover > .stops > .stop.pointer > .value {
        top: -2px;
        opacity: 1;
    }
</style>