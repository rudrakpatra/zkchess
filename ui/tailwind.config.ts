import { Config } from "tailwindcss";
import twExtend from "./src/lib/twExtend";
import twTextBalance from "tailwindcss-text-balance";

const config:Config = {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: twExtend,
	},

	plugins: [twTextBalance]
};

export  default config;
