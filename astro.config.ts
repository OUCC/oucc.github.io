import { defineConfig } from 'astro/config'
import image from '@astrojs/image'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'
import prefetch from '@astrojs/prefetch'

// https://astro.build/config
export default defineConfig({
  site: 'https://oucc.org',
  compressHTML: true,
  integrations: [
    image({ serviceEntryPoint: '@astrojs/image/sharp' }),
    tailwind(),
    sitemap(),
    prefetch({ selector: 'a' }),
  ],
})
