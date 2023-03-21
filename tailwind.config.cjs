const { rgba } = require('polished')
const plugin = require('tailwindcss/plugin')

const colors = {
  primary: '#1a2872',
  secondary: '#f1f2f7',
  twitter: '#1d9bf0',
  discord: '#5865f2',
  peing: '#5eb9ba',
}

const dropShadowLight = (color) => `0 4px 8px ${rgba(color, 0.6)}`
const dropShadowHeavy = (color) => `0 4px 8px ${rgba(color, 0.9)}`

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      maxWidth: {
        container: '768px',
        // 最大コンテナ幅にモバイルでの左右のパディングを足したもの
        'padded-container': 'calc(768px + 4rem)',
      },
      colors,
      dropShadow: {
        contrast: '0 2px 2px rgba(0, 0, 0, 0.25)',
        'primary-light': dropShadowLight(colors.primary),
        'primary-heavy': dropShadowHeavy(colors.primary),
        'white-light': dropShadowLight('white'),
        'white-heavy': dropShadowHeavy('white'),
        'twitter-light': dropShadowLight(colors.twitter),
        'twitter-heavy': dropShadowHeavy(colors.twitter),
        'discord-light': dropShadowLight(colors.discord),
        'discord-heavy': dropShadowHeavy(colors.discord),
        'peing-light': dropShadowLight(colors.peing),
        'peing-heavy': dropShadowHeavy(colors.peing),
      },
    },
  },
  plugins: [
    plugin(function ({ addComponents }) {
      addComponents({
        '.text-justify-ja': {
          textAlign: 'justify',
          wordBreak: 'break-all',
        },
      })
    }),
  ],
}
