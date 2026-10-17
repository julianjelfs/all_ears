import adapter from '@sveltejs/adapter-static'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

// Served from the root of its own domain, https://allears.julianjelfs.co.uk/, so it needs no
// base path. A separate origin also keeps its storage and its installed app apart from Askance,
// which used to share julianjelfs.github.io with it.
/** @type {'' | `/${string}`} */
const base = /** @type {'' | `/${string}`} */ (process.env.BASE_PATH ?? '')

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ fallback: '404.html' }),
    paths: { base, relative: false },
    alias: {
      $domain: 'src/domain',
      $audio: 'src/audio',
    },
  },
}
