import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';

type BuildLog = {
	code?: string;
	message?: string;
	plugin?: string;
};

function hasDependencyPath(message: string | undefined, dependency: string) {
	return (
		message?.includes(`node_modules/${dependency}/`) ||
		message?.includes(`node_modules\\${dependency}\\`)
	);
}

function isDependencyCircularWarning(log: BuildLog) {
	return (
		log.code === 'CIRCULAR_DEPENDENCY' &&
		(log.message?.includes('node_modules/') || log.message?.includes('node_modules\\'))
	);
}

function isUnusedOptionalAdapterWarning(log: BuildLog) {
	return (
		log.code === 'PLUGIN_WARNING' &&
		log.plugin === 'vite:resolve' &&
		log.message?.includes('Module "node:dns/promises" has been externalized') &&
		hasDependencyPath(log.message, '@vinejs/vine')
	);
}

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
				if (isDependencyCircularWarning(log) || isUnusedOptionalAdapterWarning(log)) {
					return;
				}
				defaultHandler(level, log);
			}
		}
	}
});
