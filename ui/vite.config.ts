import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type ViteDevServer, type PreviewServerForHook } from 'vite';

/** @type {import('vite').Plugin} */
const viteServerConfig = {
	name: 'cross-origin-isolation',
	configureServer: (server: ViteDevServer) => {
		server.middlewares.use((_, response, next) => {
			response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
			response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
			next();
		});
	},
	configurePreviewServer: (server: PreviewServerForHook) => {
		server.middlewares.use((_, response, next) => {
			response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
			response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
			next();
		});
	}
};

export default defineConfig({
	plugins: [sveltekit(), viteServerConfig],
	build: {
		target: 'esnext'
	},
	worker: {
		format: 'es',
		plugins: [viteServerConfig]
	},
	optimizeDeps: { esbuildOptions: { target: 'esnext' } }
});
