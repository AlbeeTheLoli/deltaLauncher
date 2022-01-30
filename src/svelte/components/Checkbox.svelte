<script lang='ts'>
    let left = false;

    export let label: string = '';
    export let checked = false;
    export let onchange = (checked?: boolean) => {};
</script>

<label class="checkbox" class:checkbox-left={left}>
    <input type="checkbox" {checked} on:change={(e) => {checked = !checked; onchange(checked)}}>
    <p class="checkbox-text noselect">{label}</p>
    <div class="checkmark">
        <div class="checkmark-fill"></div>
    </div>
</label>

<style>
    .checkbox{
        display: flex;
        align-items: center;
        justify-content: flex-end;
        flex-direction: row-reverse;
        cursor: pointer;

        font-size: 14px;
        font-weight: 600;
        margin: 2px 0;
    }

    .checkbox-left{
        justify-content: flex-start;
        width: max-content;
    }

    .checkbox input{
        position: absolute;
        opacity: 0;
        cursor: pointer;
        height: 0;
        width: 0;
    }

    .checkbox > p {
        color: var(--checkbox-text) !important;
    }

    .checkbox .checkmark{
        height: 12px;
        width: 12px;
        background: none;
        border: var(--checkbox-checkmark) 2px solid !important;
        margin-right: 8px;
        margin-top: 1px;
        
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .checkbox .checkbox-text {
        opacity: .48;
    }

    .checkbox .checkmark-fill{
        background: var(--checkbox-checkmark) !important;
        opacity: 0;
        height: 12px;
        width: 12px;

        transition: opacity .4s;
    }

    .checkbox input:checked ~ .checkmark .checkmark-fill {
        opacity: 1;
    }
</style>