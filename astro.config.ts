import { defineConfig } from 'astro/config'
import { loadEnv } from 'vite'
import astroExpressiveCode, { definePlugin } from 'astro-expressive-code'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'
import mdx from '@astrojs/mdx'
import remarkLinkCard from 'remark-link-card'
import RemarkLinkRewrite, {
  type RemarkLinkRewriteOptions,
} from 'remark-link-rewrite'
import { getFormatUrl } from './src/utils/validateUrl'
import pagefind from './src/integrations/pagefind'

// lang:filename 記法をタイトルに変換
const colonFilenamePlugin = () =>
  definePlugin({
    name: 'support-colon-filename',
    hooks: {
      preprocessLanguage: ({ codeBlock }) => {
        if (codeBlock.language.includes(':')) {
          const colonIdx = codeBlock.language.indexOf(':')
          const lang = codeBlock.language.slice(0, colonIdx)
          const title = codeBlock.language.slice(colonIdx + 1)
          codeBlock.language = lang
          if (title) {
            codeBlock.props.title = title
          }
        }
      },
    },
  })

const { SITE_URL } = loadEnv(
  process.env.NODE_ENV ?? 'development',
  process.cwd(),
  '',
)

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
    '/blog/articles': '/blog/',
  },
  outDir: './dist/out',
  cacheDir: './dist/cache',
  prefetch: {
    prefetchAll: true,
  },
  trailingSlash: 'always',
  experimental: {
    responsiveImages: true,
    svg: {
      mode: 'sprite',
    },
  },
  markdown: {
    remarkPlugins: [
      remarkLinkCard,
      [
        RemarkLinkRewrite,
        { replacer: getFormatUrl(SITE_URL) } satisfies RemarkLinkRewriteOptions,
      ],
    ],
  },
  integrations: [
    astroExpressiveCode({
      plugins: [colonFilenamePlugin()],
      themes: ['material-theme-darker'],
    }),
    tailwind(),
    pagefind(),
    sitemap(),
    mdx(),
  ],
})
