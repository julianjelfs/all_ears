import adapter from '@sveltejs/adapter-static'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

// Served from https://julianjelfs.github.io/all_ears/, so every asset URL needs the repo prefix.
/** @type {'' | `/${string}`} */
const base = /** @type {'' | `/${string}`} */ (process.env.BASE_PATH ?? '/all_ears')

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
