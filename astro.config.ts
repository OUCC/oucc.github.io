import { defineConfig } from 'astro/config'
import { loadEnv } from 'vite'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'
import mdx from '@astrojs/mdx'
import remarkLinkCard from 'remark-link-card'
import preact from '@astrojs/preact'

const { SITE_URL } = loadEnv(process.env.NODE_ENV!, process.cwd(), '')

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  // 旧ウェブサイトでよくアクセスされていたURLにリダイレクトを設定する
  redirects: {
    '/about.html': '/',
    '/access.html': '/',
    '/activity.html': '/activity/',
    '/contact.html': '/contact/',
    '/join.html': '/join/',
    '/link.html': '/',
    '/member.html': '/',
    '/part.html': '/',
    '/welcomeevent.html': '/',
    '/group/programming': '/',
    '/group/programming/about.html': '/',
    '/group/programming/activity.html': '/',
    '/group/programming/works.html': '/',
    '/group/handaitaisen/handai_taisen.html': '/',
    '/blog/articles': '/blog',
  },
  outDir: './dist/out',
  cacheDir: './dist/cache',
  prefetch: {
    prefetchAll: true,
  },
  markdown: {
    remarkPlugins: [remarkLinkCard],
  },
  integrations: [tailwind(), sitemap(), mdx(), preact()],
})
