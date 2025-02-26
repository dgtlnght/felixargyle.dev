import { writable, readable } from 'svelte/store';

// Language
export const language = writable('en');

// Theming
export const darkMode = writable(false);

// Theme color
// text-slate-700 bg-slate-200 dark:bg-slate-900 dark:text-slate-200
export const colors = readable({
	lightText: '#334155',
	lightBg: '#e2e8f0',
	darkText: '#e2e8f0',
	darkBg: '#0f172a'
});

export const sections = readable({
	about: { en: 'About', jp: '私について' },
	works: { en: 'Works', jp: '作品' },
	blog: { en: 'Blog', jp: 'ブログ' },
	contact: { en: 'Contact', jp: '問い合わせ' }
});
