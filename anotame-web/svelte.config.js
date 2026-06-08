import nodeAdapter from '@sveltejs/adapter-node';
import staticAdapter from '@sveltejs/adapter-static';

const isMobile = process.env.MOBILE === '1';

function adapterWithCleanLogs(options) {
	const adapter = nodeAdapter(options);

	return {
		...adapter,
		async adapt(builder) {
			const originalWarn = console.warn;

			console.warn = (...args) => {
				const [message] = args;

				if (
					typeof message === 'string' &&
					/^Circular dependency: node_modules[/\\]/.test(message)
				) {
					return;
				}

				originalWarn.apply(console, args);
			};

			try {
				await adapter.adapt(builder);
			} finally {
				console.warn = originalWarn;
			}
		}
	};
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: isMobile
			? staticAdapter({ pages: 'build', assets: 'build', fallback: 'index.html', strict: false })
			: adapterWithCleanLogs(),
		paths: {
			relative: false
		}
	},
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) =>
			filename.includes('node_modules') ? undefined : { runes: true }
	}
};

export default config;
