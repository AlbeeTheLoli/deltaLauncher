<script lang="ts">
    export let title: string = 'Без названия';

    let closed = false;
</script>

<div class="settings" class:closed={closed}>
    <div class="header noselect" on:click={() => {closed = !closed}}>
        <div class="button-down">
            <svg xmlns="http://www.w3.org/2000/svg" width="10.854" height="6.426" viewBox="0 0 10.854 6.426">
                <path id="Path_440" data-name="Path 440" d="M0,0,4.012,4.012,8.025,0" transform="translate(1.414 1.414)" fill="none" stroke="rgb(var(--_clr))" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
            </svg>
        </div>
        <h1>{title}</h1>
    </div>

    <div class="content">
        {#if !closed}
            <slot />
        {/if}
    </div>
</div>

<style>
    .settings {
        width: 100%;
        display: flex;
        flex-direction: column;
        margin-bottom: 48px;
        transition: margin-bottom .16s cubic-bezier(0.165, 0.84, 0.44, 1);

        color: var(--main-text);
    }

    .settings.closed {
        margin-bottom: 0;
    }

    .header {
        margin: 16px 0;
        padding: 8px 32px;
        padding-left: 20px;
        cursor: pointer;
        width: 100%;
        display: flex;
        align-items: center;
        margin-bottom: 24px;

        --_clr: var(--main-text-rgb);
        color: rgb(var(--_clr));
        border-left: 4px solid rgba(var(--_clr), 0);

        transition: all .16s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .closed .header {
        margin-bottom: 0;
    }

    .header:hover {
        --_clr: var(--clr-primary-rgb);
        border-left: 4px solid rgba(var(--_clr), 1);
    }

    .header .button-down {
        width: 24px;
        height: 24px;
    }

    .header .button-down > svg {
        transform: rotate(0);
        transition: transform .16s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .closed .button-down > svg {
        transform: rotate(-90deg);
    }

    .header h1 {
        font-size: 24px;
    }

    .content {
        padding: 0 32px;
        width: 100%;
        /* height: 100%; */
        flex: 1;
        display: grid;
        grid-column-gap: 8px;
        grid-row-gap: 8px;
        margin-left: 24px;

        grid-template-columns: repeat(auto-fill, 480px);
        grid-auto-flow: row;
    }

    .closed .content {
        max-height: 0;
    }
</style>