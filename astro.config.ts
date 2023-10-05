import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'
import prefetch from '@astrojs/prefetch'

// https://astro.build/config
export default defineConfig({
  site: 'https://oucc.org',
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
  },
  integrations: [tailwind(), sitemap(), prefetch({ selector: 'a' })],
})
