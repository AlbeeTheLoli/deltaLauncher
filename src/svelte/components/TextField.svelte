<script lang='ts'>
    export let placeholder = '';
    export let value = '';

    export let onclick = (e?: MouseEvent) => {};
    export let onchange = (e?: Event) => {};
    export let oninput = (e?: Event) => {};
</script>

<input 
    type='text'
    {placeholder}
    on:click={(e) => {!!onclick && onclick(e)}}
    on:change={(e) => {!!onchange && onchange(e)}}
    on:input={(e) => {!!oninput && oninput(e)}}
    bind:value={value}
>

<style>
    input {
        background: none;
        border: none;
        width: 100%;

        color: var(--main-text-primary);
        font-size: 14px;
        font-weight: 700;
        border: rgba(var(--main-text-primary-rgb), .16) 2px solid;
        padding: 8px 16px;
        margin-bottom: 16px;
    }

    input::placeholder {
        color: var(--main-text);
        font-size: 14px;
        opacity: .24;
        font-weight: 700;
    }
</style>
