import nodeAdapter from '@sveltejs/adapter-node';
import staticAdapter from '@sveltejs/adapter-static';

const isMobile = process.env.MOBILE === '1';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: isMobile
			? staticAdapter({ pages: 'build', assets: 'build', fallback: 'index.html', strict: false })
			: nodeAdapter(),
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
