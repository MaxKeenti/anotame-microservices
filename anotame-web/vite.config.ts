import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

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
		}),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			// Online-only: install + app shell, but no offline navigation fallback.
			manifest: {
				name: 'Anotame',
				short_name: 'Anotame',
				description: 'Anotame',
				start_url: '/',
				scope: '/',
				display: 'standalone',
				background_color: '#ffffff',
				theme_color: '#FF4500',
				icons: [
					{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
					{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
					{
						src: '/icons/icon-maskable-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			workbox: {
				// Precache the build assets only; no navigateFallback means page
				// navigations always hit the network (strictly online).
				globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,woff,woff2}']
			},
			devOptions: {
				enabled: false
			}
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
