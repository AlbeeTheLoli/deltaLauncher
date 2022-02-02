<script lang="ts">
	let loaded = false;

	import { global } from './global';

	import Nav from '../components/nav/Nav.svelte';
	import Footer from '../components/footer/Footer.svelte';
	import Settings from './sections/Settings.svelte';
	import Account from './sections/Account.svelte';
	import Home from './sections/Home.svelte';
	import { onDestroy, onMount } from "svelte";
	import Overlay from '../components/overlays/Overlay.svelte';
	import AskOverlay from '../components/overlays/AskOverlay.svelte';
	import SelectOverlay from '../components/overlays/SelectOverlay.svelte';
	import Checkbox from '../components/Checkbox.svelte';
	import TextField from '../components/TextField.svelte';

	enum SECTIONS {
		HOME,
		SETTINGS,
		ACCOUNT,
	}
	let section_names: string[] = [
		'Главная',
        'Настройки',
        'Аккаунт'
    ]

	let section = SECTIONS.SETTINGS;

	onMount(async () => {
		//@ts-expect-error
		$global.authInterface = window.authInterface;
		//@ts-expect-error
		$global.modpackManager = window.modpackManager;
		//@ts-expect-error
		$global.settingsManager = window.settingsInterface;
		//@ts-expect-error
		$global.ipcRenderer = window.ipcRenderer
		//@ts-expect-error
		global.dialog = window.dialog;
		//@ts-expect-error
		global.shell = window.shell;
		//@ts-expect-error
		global.path = window.path;

		global.app = {
			//@ts-expect-error
			version: window.version,
			//@ts-expect-error
			os: window.os,
		};

		console.log('hello from renderer :)');
		console.log('theme:', $global.authInterface.logged_user);

		loaded = true;
	})

	onDestroy(() => {
		$global.settingsManager.saveSync();
	})
</script>

<Overlay />
<AskOverlay />
<SelectOverlay />

{#if loaded}

<div id="bg" class="bg">
	<div id="bg-opacity" class="color" style="transition: none;"></div>
	<div id="bg-blur" class="filter"></div>
	<div class="img">
		<img id="bg-img" src="" alt=""/>
		<video autoplay muted loop id="bg-video" src="" alt="">
			<track kind="captions">
		</video>
	</div>
</div>

<div class="app-frame">
	<div class="flex-filler invisible"></div>
	<div id="app-minimize" class="minimize">
		<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
			<g id="Component_53_1" data-name="Component 53 – 1" transform="translate(1)">
			  <line id="Line_40" data-name="Line 40" x2="10" transform="translate(0 11)" fill="none" stroke="var(--app-icon-clr)" stroke-linecap="round" stroke-width="2"/>
			  <line id="Line_41" data-name="Line 41" x2="10" fill="none"/>
			</g>
		</svg>              
	</div>
	<div id="app-reload" class="reload">
		<svg xmlns="http://www.w3.org/2000/svg" width="11.99" height="11.713" viewBox="0 0 11.99 11.713">
			<path id="Path_232" data-name="Path 232" d="M2053.858,1818.992a5.84,5.84,0,0,1-8.28,0c-.009-.009-.018-.027-.027-.036l-.82.82a.674.674,0,0,1-1.153-.477v-2.9a.681.681,0,0,1,.676-.676h2.9a.676.676,0,0,1,.477,1.153l-.82.82c.009.009.027.018.036.027a4.05,4.05,0,1,0,0-5.739.9.9,0,0,1-1.271-1.27,5.862,5.862,0,0,1,8.28,0A5.868,5.868,0,0,1,2053.858,1818.992Z" transform="translate(-2043.578 -1809)" fill="var(--app-icon-clr)"/>
		</svg>
	</div>
	<div id="app-exit" class="exit">
		<svg xmlns="http://www.w3.org/2000/svg" width="10.996" height="10.997" viewBox="0 0 10.996 10.997">
			<g id="Component_51_10" data-name="Component 51 – 10" transform="translate(1.414 1.414)">
			  <line id="Line_38" data-name="Line 38" x2="8.168" y2="8.168" fill="none" stroke="var(--app-icon-clr)" stroke-linecap="round" stroke-width="2"/>
			  <line id="Line_39" data-name="Line 39" x1="8" y2="8" transform="translate(0.02 0.149)" fill="none" stroke="var(--app-icon-clr)" stroke-linecap="round" stroke-width="2"/>
			</g>
		</svg>
	</div>
</div>

<Nav {section_names} bind:section={section} userData={$global.authInterface.logged_user} />

<main>
	<div class="section-wrapper custom-scrollbar" class:left={section < SECTIONS.HOME} class:right={section > SECTIONS.HOME}>
		<Home />
	</div>
	<div class="section-wrapper custom-scrollbar" class:left={section < SECTIONS.SETTINGS} class:right={section > SECTIONS.SETTINGS}>
		<Settings />
	</div>
	<div class="section-wrapper custom-scrollbar" class:left={section < SECTIONS.ACCOUNT} class:right={section > SECTIONS.ACCOUNT}>
		<Account />
	</div>
</main>

<Footer />

{/if}

<style>
	main {
		display: flex;
		width: calc(100vw);
		height: calc(100vh - 152px);
		position: relative;
	}

	.section-wrapper {
		height: 100%;
		width: 100%;
		pointer-events: all;
		position: absolute;
		top: 0;
		left: 0;
		min-width: calc(100vw);
		min-height: calc(100vh - 152px);
		opacity: 1;

		transition: left .32s cubic-bezier(0.23, 1, 0.320, 1),
                	opacity .32s cubic-bezier(0.23, 1, 0.320, 1);

		overflow-x: hidden;
		overflow-y: auto;
	}

	.section-wrapper.left {
		pointer-events: none;
		left: -32px;
		opacity: 0;
	}

	.section-wrapper.right {
		pointer-events: none;
		left: 32px;
		opacity: 0;
	}
</style>