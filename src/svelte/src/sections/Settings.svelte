<script lang="ts">
    import { global } from '../global';

    import Setting from "../../components/settings/Setting.svelte";
    import SettingsContainer from "../../components/settings/SettingsContainer.svelte";
    import Slider from "../../components/Slider.svelte";
    import ControlSetting from '../../components/settings/_ControlSetting.svelte';
    import Checkbox from '../../components/Checkbox.svelte';
import app from '..';
</script>

<section>
    <SettingsContainer title='Игра'>
        <Setting 
            title='Выделено памяти: {$global.settingsManager.settings.modpack_settings.allocated_memory}Гб' delay={1} 
            tip={{h1: 'Внимание!', p: 'Значения ниже 6 Гб, могут повлиять на производительность игры.'}}>
            
            <Slider id='memory-slider' min={4} max={16} step={1} value_step={2} unit={'Гб'} bind:value={$global.settingsManager.settings.modpack_settings.allocated_memory}></Slider>
        </Setting>

        <Setting 
            title='Степень оптимизации' 
            delay={2}>
            
            <Slider id='memory-slider' min={1} max={5} step={1} value_step={1} step_values={['Производительность', '', 'Баланс', '', 'Красота']} bind:value={$global.settingsManager.settings.modpack_settings.optimization_level}></Slider>
        </Setting>

        <Setting title='Настройки управления' delay={3}>
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

        <Setting title='Параметры запуска Java' delay={4} 
            tip={{p: 'Неправильные параметры могут повлечь проблемы с запуском и нестабильность игры в целом. Не советуем писать сюда что либо просто так.'}}>
            
            <input class="java-params" type="text" placeholder="Не указаны">
        </Setting>

        <Setting title='Дополнительные моды' delay={5}>
            <Checkbox label="Optifine" bind:checked={$global.settingsManager.settings.modpack_settings.add_ons.optifine.enabled}></Checkbox>
            <div class="smoll-gap"></div>
            <Checkbox label="Inventory Tweaks" bind:checked={$global.settingsManager.settings.modpack_settings.add_ons.inventory_tweaks.enabled}></Checkbox>
        </Setting>

        <Setting title='Директории сборок' delay={6}>
            
            
        </Setting>

        <Setting title='Шейдеры по умолчанию' delay={2}>
        
        
        </Setting>
    </SettingsContainer>

    <SettingsContainer title='Лаунчер'>
        <Setting title='Внешний вид' delay={3}></Setting>
        <Setting title='Полезные функции' delay={1} bordered={false}></Setting>
        <Setting title='Производительность клиента' delay={6} bordered={false}>
            

        </Setting>
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

    .java-params {
        background: rgba(var(--main-text-rgb), .04);
        border: none;
        width: 100%;
        height: 48px;

        color: var(--main-text);
        font-size: 14px;
        font-weight: 700;
        border: rgba(var(--main-text-rgb), .16) 2px solid;
        padding: 0 16px;
        margin-bottom: 16px;
    }

    .java-params::placeholder {
        color: var(--main-text);
        font-size: 13px;
        opacity: .24;
        font-weight: 700;
    }
    
    .controls {
        display: flex;
        flex-wrap: wrap;
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
        margin-right: 16px;
    }
</style>