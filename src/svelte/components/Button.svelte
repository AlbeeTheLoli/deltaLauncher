<script lang='ts'>
    export let type: string = undefined;
    export let el: HTMLDivElement = undefined;

    export let selected = false;
    export let locked = false;
    export let small = false;

    export let onclick = (el?: HTMLDivElement) => {};
</script>

<div bind:this={el} class="button" class:clr={type == 'clr'} class:alt={type == 'alt'} class:selected class:locked class:small on:click={(e) => {
        e.preventDefault();
        !locked && onclick && onclick(el)
    }}>
    <slot />
</div>

<style>
    .button {
        min-width: 164px;
        padding: 0 32px;
        height: 38px;
        display: grid;
        place-items: center;
        user-select: none;

        cursor: pointer;
        background: rgba(var(--text-primary-rgb), 0);
        border: rgba(var(--text-primary-rgb), .16) 2px solid;
        font-size: 14px;
        font-weight: 600;

        transition: background .16s cubic-bezier(0.165, 0.84, 0.44, 1),
                    opacity .16s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .button.selected {
        opacity: .64;
    }

    .button.locked {
        opacity: .32;
        cursor: not-allowed;
    }

    .button.small {
        font-size: 13px;
        padding: 0 16px;
        max-width: fit-content;
        min-width: fit-content;
    }

    .button:hover {
        background: rgba(var(--text-primary-rgb), .08);
        border: rgba(var(--text-primary-rgb), .24) 2px solid;
    }

    .button.clr {
        border: rgba(var(--clr-primary-rgb), .16) 2px solid;
    }

    .button.clr:hover {
        background: rgba(var(--clr-primary-rgb), 1);
        border: rgba(var(--clr-primary-rgb), .24) 2px solid;
    }

    .button.alt {
        border: rgba(var(--alt-primary-rgb), .16) 2px solid;
    }

    .button.alt:hover {
        background: rgba(var(--alt-primary-rgb), 1);
        border: rgba(var(--alt-primary-rgb), .24) 2px solid;
    }
</style>