import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	build: {
		rollupOptions: {
			onLog(level, log, defaultHandler) {
				// Prevent Third-Party NPM libraries from cluttering our terminal logs!
				if (log.code === 'CIRCULAR_DEPENDENCY' || log.message?.includes('Circular dependency')) {
					return;
				}
				defaultHandler(level, log);
			}
		}
	}
});
