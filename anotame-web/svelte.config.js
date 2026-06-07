import adapter from '@sveltejs/adapter-node';

function adapterWithCleanLogs(options) {
	const nodeAdapter = adapter(options);

	return {
		...nodeAdapter,
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
				await nodeAdapter.adapt(builder);
			} finally {
				console.warn = originalWarn;
			}
		}
	};
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapterWithCleanLogs(),
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
