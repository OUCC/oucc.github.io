const { rgba } = require('polished')
const plugin = require('tailwindcss/plugin')

const colors = {
  primary: '#1a2872',
  secondary: '#f1f2f7',
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
        'black-light': dropShadowLight('black'),
        'black-heavy': dropShadowHeavy('black'),
        'discord-light': dropShadowLight(colors.discord),
        'discord-heavy': dropShadowHeavy(colors.discord),
        'peing-light': dropShadowLight(colors.peing),
        'peing-heavy': dropShadowHeavy(colors.peing),
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            a: {
              color: theme('colors.blue.500'),
              '&:hover': {
                color: theme('colors.blue.800'),
              },
              '&:visited': {
                color: theme('colors.purple.700'),
                '&:hover': {
                  color: theme('colors.purple.900'),
                },
              },
            },
          },
        },
      }),
    },
  },
  plugins: [
    plugin(function ({ addComponents, theme }) {
      addComponents({
        '.text-justify-ja': {
          textAlign: 'justify',
          wordBreak: 'break-all',
        },
        '.bg-dot': {
          '--bg-dot-color': '#00000010',
          '--bg-dot-pattern': '10px',
          '--bg-dot-size': '15%',
          'background-color': theme('colors.white'),
          'background-image':
            'radial-gradient(var(--bg-dot-color) var(--bg-dot-size), transparent var(--bg-dot-size)), radial-gradient(var(--bg-dot-color) var(--bg-dot-size), transparent var(--bg-dot-size))',
          'background-size': 'var(--bg-dot-pattern) var(--bg-dot-pattern)',
          'background-position':
            '0 0, calc(var(--bg-dot-pattern) / 2) calc(var(--bg-dot-pattern) / 2)',
        },
        '.bg-dot-white': {
          '--bg-dot-color': '#00000010',
          '--tw-bg-opacity': '1',
          'background-color': theme('colors.white'),
        },
        '.bg-dot-secondary': {
          '--bg-dot-color': '#00000010',
          '--tw-bg-opacity': '1',
          'background-color': theme('colors.secondary'),
        },
        '.bg-dot-primary': {
          '--bg-dot-color': '#ffffff10',
          '--tw-bg-opacity': '1',
          'background-color': theme('colors.primary'),
        },
      })
    }),
    require('@tailwindcss/typography'),
  ],
}
