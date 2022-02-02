<script lang='ts'>
    import { global } from '../../src/global';

    export let options: {
        title?: string,
        properties?: Array<string>,
        filters?: Array<Object>,
    } = { title: 'Выберите файл', properties: ['openFile'], }

    export let pth: string = '';
    $: normalized_path = global.path.normalize(pth.replace('%ROOT%', $global.settingsManager.root));
    export let onchange: (to?: string) => void = () => {};
    
    async function showSelect() {
        let file = await global.dialog.showOpenDialog(options)
        if (file.canceled) return;

        console.log(file.filePaths[0]);
        pth = global.path.normalize(file.filePaths[0]);

        onchange(pth);
    }

    async function showFile() {
        if (pth) global.shell.showItemInFolder(normalized_path);
    }   
</script>

{#if pth}
    <p on:click={(e) => {e.altKey || e.ctrlKey ? showFile() : showSelect()}} class="file">{normalized_path}</p>
{:else}
    <p on:click={showSelect} class="file a">По умолчанию</p>
{/if}

<style>
    p {
        cursor: pointer;
    }

    .a {
        width: 100%;
    }
</style>