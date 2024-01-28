/** @type {import('tailwindcss').Config}*/
const config = {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			colors:{
				'primary': '#e87c17',
				'secondary': '#322f35',
				'background': '#f6f4fa',
				'chess-100': '#ece7df',
				'chess-200': '#f0d9b5',
				'chess-300': '#c0ae91',
				'chess-400': '#b59f7d',
				'chess-500': '#a48e6a',
				'chess-600': '#8f7d57',
			}
		}
	},

	plugins: [
		require("tailwindcss-text-balance")
	]
};

module.exports = config;
