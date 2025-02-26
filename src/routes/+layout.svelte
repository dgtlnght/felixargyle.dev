<script>
	import '../app.css';
	import logo from '$images/logo.png?enhanced';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';

	import { language, colors, darkMode, sections } from '$stores/main';
	import { Hamburger } from 'svelte-hamburgers';

	import DarkModeToggle from '$components/layout/DarkModeToggle.svelte';
	import { onMount } from 'svelte';

	import English from '$icons/English.svelte';
	import Japanese from '$icons/Japanese.svelte';
	let open;

	onMount(async () => {
		document.addEventListener('click', (e) => {
			if (!document.getElementById('hamburger').contains(e.target) & open) {
				open = false;
			}
		});
	});
</script>

<div class={$darkMode ? 'dark' : ''}>
	<div
		class="flex flex-col items-center text-slate-700 bg-slate-200 dark:bg-slate-900 dark:text-slate-200 min-h-screen"
	>
		<div class="max-w-screen-lg w-full flex-1 flex flex-col">
			<div
				class="flex justify-between items-center p-4 md:px-0 relative max-w-screen-lg w-full z-10"
			>
				<div class="flex justify-between items-center w-full md:w-auto">
					<a
						class="text-lg font-light flex flex-col items-center"
						href="/{$language}/"
						on:click={() => (open = false)}
					>
						<enhanced:img src={logo} class="max-w-[90px]" alt="Adam Smith" />
					</a>
					<div id="hamburger" class="md:invisible">
						<Hamburger --color={$darkMode ? $colors.darkText : $colors.lightText} bind:open />
					</div>
				</div>
				<div
					id="menu"
					transition:fade={{ duration: 1000 }}
					class={`text-lg md:text-sm max-md:absolute max-md:top-full max-md:left-0 max-md:right-0 max-md:shadow-lg max-md:border-t-[0.5px] border-slate-700 dark:border-slate-200 bg-slate-200 dark:bg-slate-900 max-md:p-4 max-md:flex-col flex items-center gap-x-4 gap-y-2 ${
						open ? 'visible' : 'invisible md:visible'
					}`}
				>
					{#each Object.keys($sections) as section}
						<a
							class="font-extrabold tracking-tight"
							href="/{$language}/{section}"
							on:click={() => (open = false)}>{$sections[section][$language]}</a
						>
					{/each}

					<div class="flex font-extrabold tracking-tight">
						<button
							class={`px-1  ${$language == 'en' ? '' : 'text-slate-400 dark:text-slate-700'}`}
							on:click={() => {
								goto(window.location.href.replace('/jp', '/en').replace('/tr', '/en'));
								language.set('en');
								open = false;
							}}><English color={$darkMode ? $colors.darkText : $colors.lightText} /></button
						>
						<p class="text-slate-400 dark:text-slate-700">|</p>
						<button
							class={`px-1  ${$language == 'jp' ? '' : 'text-slate-400 dark:text-slate-700'}`}
							on:click={() => {
								goto(window.location.href.replace('/en', '/jp').replace('/tr', '/jp'));
								language.set('jp');
								open = false;
							}}><Japanese color={$darkMode ? $colors.darkText : $colors.lightText} /></button
						>
					</div>
					<DarkModeToggle bind:open />
				</div>
			</div>
			<div class="flex py-4 max-lg:px-4 lg:py-8 max-w-screen-lg w-full flex-1 flex-col z-0">
				<slot />
			</div>
		</div>
	</div>
</div>
