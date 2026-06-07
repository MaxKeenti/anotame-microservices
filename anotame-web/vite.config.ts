import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
		})
	],
	build: {
		rollupOptions: {
			onLog(level, log, defaultHandler) {
				// Prevent third-party dependencies from cluttering our terminal logs.
				if (log.code === 'CIRCULAR_DEPENDENCY' || log.message?.includes('Circular dependency')) {
					return;
				}
				defaultHandler(level, log);
			}
		}
	}
});
