import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapter from '@sveltejs/adapter-netlify';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			precompress: true,
		}),
		alias: {
			$components: './src/components',
			$stores: './src/stores',
			$images: './src/images',
			$icons: './src/icons',
			$utils: './src/utils'
		}
	},
	preprocess: vitePreprocess()
};

export default config;
