<script lang="ts">
    import { fly } from "svelte/transition";
    import { global } from '../global';

    import Setting from "../../components/settings/Setting.svelte";
    import SettingsContainer from "../../components/settings/SettingsContainer.svelte";
    import Slider from "../../components/Slider.svelte";
    import ControlSetting from '../../components/settings/_ControlSetting.svelte';
    import Checkbox from '../../components/Checkbox.svelte';
    import DirSetting from '../../components/settings/_DirSetting.svelte';
    import SelectFile from '../../components/settings/_SelectFile.svelte';
    import Scrollable from '../../components/Scrollable.svelte';
    import TextField from '../../components/TextField.svelte'
    import { onMount } from "svelte";

    let modpack_info = $global.modpackManager.MODPACK_INFO;

    //@ts-expect-error
    let max_ram = window.max_setable_ram;
    $: modpack = $global.modpackManager.modpack;
    $: mem = $global.settingsManager.settings.modpack_settings.allocated_memory;
    $: min_ram = modpack_info[modpack].min_ram;
    $: can_play = $global.settingsManager.settings.bypass_ram_restricions || !((max_ram < min_ram) || ((max_ram - min_ram) < 0));
    $: ram_step = (max_ram > 16) ? 1 : (max_ram % 4 == 0 ? .2 : .5);
    $: ram_value_step = (max_ram > 16) ? (max_ram % 4 == 0 ? 4 : (max_ram % 2 == 0 ? 2 : 1)) : (max_ram % 4 == 0 ? 5 : 2);

    let bg_video_element = undefined;
    onMount(() => {
        bg_video_element = document.getElementById('bg-video');
    })
</script>

<section>
    <SettingsContainer title='Игра'>
        <Setting 
            title={(!can_play ? 'Свободно памяти: ' : 'Выделено памяти: ') + (Math.floor(mem) == mem ? `${mem}Гб` : `${mem * 1024}Мб`)}
            tip={can_play ? {} : (mem > 12 ? {} : {h1: 'Внимание!', p: 'Значения ниже 8 Гб, могут повлиять на производительность игры.'})}>
            {#if can_play}
                <Slider id='memory-slider' min={min_ram} max={max_ram} step={ram_step} value_step={ram_value_step} unit={'Гб'} bind:value={$global.settingsManager.settings.modpack_settings.allocated_memory}></Slider> 
            {:else}
                <p>К сожалению, {global.capitalizeFirstLetter(modpack)} требует минимум {min_ram} Гб для запуска.</p>
                <div class="big-gap"></div>
            {/if}
        </Setting>

        <Setting 
            title='Степень оптимизации'
            tip={$global.settingsManager.settings.modpack_settings.optimization_level < 2 ? {h1: 'Обратите внимание.', p: 'При выборе данных настроек графики игра может выглядеть отвратительно, а порой и не правильно.'} : undefined}>

            <Slider id='memory-slider' min={1} max={5} step={1} value_step={1} step_values={['Производительность', '', 'Баланс', '', 'Красота']} bind:value={$global.settingsManager.settings.modpack_settings.optimization_level}></Slider>
        </Setting>

        <Setting title='Настройки управления'>
            <div class="controls">
                <ControlSetting display_name="Присесть" bind:key={$global.settingsManager.settings.modpack_settings.controls.crouch}></ControlSetting>
                <ControlSetting display_name="Бег" bind:key={$global.settingsManager.settings.modpack_settings.controls.run}></ControlSetting>
                <ControlSetting display_name="Квесты" bind:key={$global.settingsManager.settings.modpack_settings.controls.shop}></ControlSetting>
                <ControlSetting display_name="Приблизить" bind:key={$global.settingsManager.settings.modpack_settings.controls.zoom}></ControlSetting>
                <ControlSetting display_name="Вправо" bind:key={$global.settingsManager.settings.modpack_settings.controls.right}></ControlSetting>
                <ControlSetting display_name="Влево" bind:key={$global.settingsManager.settings.modpack_settings.controls.left}></ControlSetting>
                <ControlSetting display_name="Вперед" bind:key={$global.settingsManager.settings.modpack_settings.controls.forward}></ControlSetting>
                <ControlSetting display_name="Назад" bind:key={$global.settingsManager.settings.modpack_settings.controls.back}></ControlSetting>
            </div>
        </Setting>

        <Setting title='Параметры запуска Java' 
            tip={{p: 'Неправильные параметры могут повлечь проблемы с запуском и нестабильность игры в целом. Не советуем писать сюда что либо просто так.'}}>
            
            <input class="java-params" bind:value={$global.settingsManager.settings.modpack_settings.java_parameters} type="text" placeholder="Не указаны">
        </Setting>

        <Setting title='Дополнительные моды'>
            {#each Object.keys($global.modpackManager.addons.preferences) as addn}
                <Checkbox label={$global.modpackManager.addons.mods[addn].display_name} bind:checked={$global.modpackManager.addons.preferences[addn].enabled}></Checkbox>
                <div class="smoll-gap"></div>
            {/each}
        </Setting>

        <Setting title='Директории сборок'>
            <DirSetting display_name='Библиотеки' mdpck='libs' bind:path={$global.modpackManager.libs.path}></DirSetting>
            {#each Object.keys($global.modpackManager.modpacks) as mdpck}
                <DirSetting display_name={global.capitalizeFirstLetter(mdpck)} {mdpck} bind:path={$global.modpackManager.modpacks[mdpck].path}></DirSetting>
            {/each}
        </Setting>

        <Setting title='Шейдеры по умолчанию'>
        
        
        </Setting>
    </SettingsContainer>

    <SettingsContainer title='Лаунчер'>
        <Setting title='Задний фон' tip={{
          h1: 'Поддерживаемые форматы: png, jpg, jpeg, gif, mp4, mov',
          p: 'При использовании видео-файлов на заднем плане лаунчер может потреблять дополнительные мощности видеокарты.' 
        }}>  
            <h1>Установленный:</h1>
            <div class="select-bg-container">
                <p class="select-bg-dir">
                    <Scrollable horizontal>
                        <SelectFile 
                            options={{ 
                                title: "Выберите задний фон", 
                                properties: ['openFile'], 
                                filters: [
                                    { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'ogg', 'mov'] },
                                ], 
                            }} 
                            bind:pth={$global.settingsManager.bg}
                            onchange={(to) => {
                                console.log(`bg changed to: ${to}!`);
                            }}>
                        </SelectFile>
                    </Scrollable>
                </p>

                {#if $global.settingsManager.bg != ''}
                    <p class="select-bg-reset" on:click={() => {
                        $global.settingsManager.bg = ''
                    }}>Сбросить</p>
                {/if}
            </div>
            <div class="big-gap"></div>
            <div class="gap"></div>
            <h1>Степень размытия</h1>
            <div class="smoll-gap"></div>
            <Slider id={'blur-slider'} min={0} max={100} unit='px' free step={1} bind:value={$global.settingsManager.blur_amount}></Slider>

            <h1>Прозрачность фона</h1>
            <div class="smoll-gap"></div>
            <Slider id={'blur-slider'} min={0} max={100} unit='%' free step={1} bind:value={$global.settingsManager.filter_opacity}></Slider>
            {#if $global.settingsManager.bg_video}
                <div class="big-gap"></div>
                <div class="gap"></div>
                <h1>Громкость</h1>
                <div class="smoll-gap"></div>
                <Slider id={'volume-slider'} min={0} max={100} unit='%' free step={1} bind:value={$global.settingsManager.bg_volume}></Slider>
            {/if}

            <div class="big-gap"></div>
        </Setting>
        <Setting title='Полезные функции' bordered={false}>
            <p class="just-button" on:click={() => {
                if ($global.settingsManager.root) global.shell.openPath($global.settingsManager.root);
            }}>Открыть корневую папку</p>
            <div class="gap"></div>
            <p class="just-button" on:click={() => {
                if ($global.settingsManager.settings_path) global.shell.showItemInFolder($global.settingsManager.settings_path);
            }}>Открыть файл настроек</p>
            <div class="gap"></div>
            <p class="just-button" on:click={() => {
                if ($global.settingsManager.logs_path) global.shell.openPath($global.settingsManager.logs_path);
            }}>Открыть папку с логами</p>
            <div class="gap"></div>
            <p class="just-button" on:click={() => {
                if ($global.settingsManager.themes_path) global.shell.openPath($global.settingsManager.themes_path);
            }}>Открыть папку с темами</p>
            <div class="big-gap"></div>
            <div class="big-gap"></div>
            <Checkbox label="Убрать анимации" bind:checked={$global.settingsManager.settings.appearance.reduced_motion}></Checkbox>
            <div class="smoll-gap"></div>
            <Checkbox label="Использовать встроенную JVM (Java)" bind:checked={$global.settingsManager.settings.modpack_settings.use_builtin_java}></Checkbox>
            <div class="smoll-gap"></div>

            {#if $global.settingsManager.settings.dev_mode}
                <div class="big-gap"></div>
                <div class="big-gap"></div>
                <h1>DEV</h1>
                <div class="smoll-gap"></div>
                <Checkbox label="Показать консоль клиента" bind:checked={$global.settingsManager.settings.modpack_settings.show_console_output}></Checkbox>
                <div class="smoll-gap"></div>
            {/if}
        </Setting>
        <Setting title='Тема' bordered={false}>
            <Checkbox label="Темная тема" bind:checked={$global.settingsManager.settings.appearance.default_dark_theme} onchange={() => {
                $global.settingsManager.theme = $global.settingsManager.settings.appearance.default_dark_theme ? ':dark:' : ''
            }}></Checkbox>
        </Setting>
        {#if $global.settingsManager.settings.dev_mode}
            <Setting title='Экспериментальная ветка'>
                <input bind:value={$global.modpackManager.sha} on:change={() => {
                    $global.modpackManager.updateModpackDirs();
                    $global.modpackManager.modpacks[$global.modpackManager.modpack].installed = $global.modpackManager.modpacks[$global.modpackManager.modpack].installed;
                }} class="java-params" type="text" placeholder="Не указаны">
            </Setting>
        {/if}
    </SettingsContainer>
    <div class="flex-filler"></div>
    <div class="general-info">
        <p>Версия: {global.app.version} | {global.app.os.version()} {`<${global.app.os.release()} ${global.app.os.arch()}>`}</p>
    </div>
</section>

<style>
    section {
        padding: 0 0;
        color: var(--app-text);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
    }

    h1 {
        font-size: 15px;
        font-weight: 700;
        margin-bottom: 4px;
    }

    p {
        font-size: 14px;
        font-weight: 600;
        opacity: .64;
    }

    .just-button {
        cursor: pointer;
        color: var(--main-text);
        font-size: 15px;
        opacity: .64;
        font-weight: 600;

        transition: opacity .32s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .just-button:hover {
        opacity: 1;
    }

    .select-bg-container {
        cursor: pointer;
        display: flex;
        padding: 5px 0;
        width: 416px;
    }

    .select-bg-dir {
        font-size: 14px;
        font-weight: 600;
        opacity: .48;
        margin-right: 16px;
        max-width: 341.56px;
        min-width: 341.56px;
        text-overflow: clip;
        white-space: nowrap;

        transition: all .32s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .select-bg-dir:hover {
        opacity: 1;
    }

    .select-bg-dir:hover {
        max-width: 416px;
        min-width: 416px;
    }

    .select-bg-dir:hover ~.select-bg-reset {
        width: 0;
        opacity: 0;
        left: -60px;
    }

    .select-bg-reset {
        position: relative;
        width: 72.44px;
        left: 0;
        font-size: 12px;
        font-weight: 700;
        opacity: .48;

        transition: all .32s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .select-bg-reset:hover {
        opacity: 1;
    }

    .java-params {
        background: rgba(var(--main-text-rgb), .04);
        border: none;
        width: 100%;
        height: 48px;

        color: var(--main-text);
        font-size: 14px;
        font-weight: 600;
        border: rgba(var(--main-text-rgb), .16) 2px solid;
        padding: 0 16px;
        margin-bottom: 16px;
    }

    .java-params::placeholder {
        color: var(--main-text);
        font-size: 13px;
        opacity: .24;
        font-weight: 600;
    }
    
    .controls {
        display: flex;
        flex-wrap: wrap;
    }

    .big-gap {
        height: 16px;
    }
    
    .gap {
        height: 8px;
    }

    .smoll-gap {
        height: 2px;
    }

    .general-info {
        display: flex;
        margin-top: 24px;
        padding-bottom: 24px;
        margin-left: 48px;
        font-size: 12px;
        font-weight: 700;
        opacity: 1;
    }
    .general-info > p {
        font-size: 12px;
        margin-right: 16px;
        opacity: 1;
    }
</style>