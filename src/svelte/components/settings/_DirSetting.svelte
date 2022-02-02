<script lang='ts'>
    import { global } from "../../src/global";  

    import SelectFile from '../../components/settings/_SelectFile.svelte';
    import Scrollable from "../Scrollable.svelte";
    // import Button from '../../components/Button.svelte';

    export let display_name: string;
    export let path: string;
</script>

<div class="k-v-pair">
    <p class="k">{display_name}:</p> <p class="v"><Scrollable horizontal><SelectFile options={{ title: "Выберите папку", properties: ['openDirectory'] }} bind:pth={path}></SelectFile></Scrollable></p> <div class="flex-filler"></div> <p class="b">Сбросить</p>
</div>

<style>
    .k-v-pair {
        cursor: pointer;
        display: flex;
        padding: 5px 0;
        width: 416px;
    }

    .k {
        font-size: 14px;
        font-weight: 600;
        width: 106px;
        opacity: .64;

        transition: opacity .32s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .k-v-pair:hover .k {
        opacity: 1;
    }

    .v:hover {
        max-width: 278px;
    }

    .v:hover ~.b {
        width: 0;
        opacity: 0;
        left: -60px;
    }

    .v {
        font-size: 14px;
        font-weight: 600;
        opacity: .48;
        margin-right: 16px;
        max-width: 205.56px;

        transition: all .32s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .v:hover {
        opacity: 1;
    }

    .b {
        position: relative;
        width: 72.44px;
        left: 0;
        font-size: 12px;
        font-weight: 700;
        opacity: .32;

        transition: all .32s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .b:hover {
        opacity: 1;
    }
</style>