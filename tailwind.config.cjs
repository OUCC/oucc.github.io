/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: '#1a2872',
        secondary: '#f1f2f7',
        discord: '#5865f2',
      },
      dropShadow: {
        contrast: '0 2px 2px rgba(0, 0, 0, 0.25)',
        'primary-light': '0 4px 8px #1a2872a0',
        'primary-heavy': '0 4px 8px #1a2872e0',
        'white-light': '0 4px 8px #ffffffa0',
        'white-heavy': '0 4px 8px #ffffffe0',
        'discord-light': '0 4px 8px #5865f2a0',
        'discord-heavy': '0 4px 8px #5865f2e0',
      },
    },
  },
}
