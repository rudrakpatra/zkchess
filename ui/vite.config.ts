import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type ViteDevServer } from 'vite';

/** @type {import('vite').Plugin} */
const viteServerConfig = {
	name: 'add headers',
	configureServer: (server: ViteDevServer) => {
		server.middlewares.use((req, res, next) => {
			res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
			res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
			next();
		});
	}
};

export default defineConfig({
	plugins: [sveltekit(), viteServerConfig],
	build: {
		target: 'esnext'
	},
	optimizeDeps: { esbuildOptions: { target: 'esnext' } }
});
